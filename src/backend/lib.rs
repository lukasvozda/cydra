#[macro_use]
extern crate ic_cdk_macros;
#[macro_use]
extern crate serde;

use ic_cdk::api::call::RejectionCode;
use candid::CandidType;
use rusqlite::types::Type;

#[query]
fn balance() -> u64 {
    ic_cdk::api::canister_balance()
}

#[query]
fn instruction_counter() -> u64 {
    ic_cdk::api::instruction_counter()
}

#[update]
fn execute(sql: String) -> Result {
    let conn = ic_sqlite::CONN.lock().unwrap();
    return match conn.execute(
        &sql,
        []
    ) {
        Ok(e) => Ok(format!("{:?}", e)),
        Err(err) => Err(Error::CanisterError {message: format!("{:?}", err) })
    }
}

#[query]
fn query(sql: String) -> QueryResult {
    let conn = ic_sqlite::CONN.lock().unwrap();
    let mut stmt = conn.prepare(&sql).unwrap();
    let cnt = stmt.column_count();
    
    // Get column names once
    let mut columns = Vec::new();
    for idx in 0..cnt {
        columns.push(stmt.column_name(idx).unwrap().to_string());
    }
    
    let mut rows = stmt.query([]).unwrap();
    let mut data_rows: Vec<Vec<String>> = Vec::new();
    
    loop {
        match rows.next() {
            Ok(row) => {
                match row {
                    Some(row) => {
                        let mut row_values = Vec::new();
                        for idx in 0..cnt {
                            let v = row.get_ref_unwrap(idx);
                            let value = match v.data_type() {
                                Type::Null => String::from(""),
                                Type::Integer => v.as_i64().unwrap().to_string(),
                                Type::Real => v.as_f64().unwrap().to_string(),
                                Type::Text => v.as_str().unwrap().to_string(),
                                Type::Blob => hex::encode(v.as_blob().unwrap())
                            };
                            row_values.push(value);
                        }
                        data_rows.push(row_values);
                    },
                    None => break
                }
            },
            Err(err) => return Err(Error::CanisterError {message: format!("{:?}", err) })
        }
    }
    
    Ok(QueryResultWithColumns {
        columns,
        data: data_rows,
    })
}

// Shared pagination function for both query and update calls
fn execute_paginated_query(conn: &rusqlite::Connection, sql: String, page: u32, page_size: u32) -> PaginatedResult {
    // Validate page_size to prevent abuse
    let validated_page_size = if page_size == 0 { 100 } else { page_size.min(1000) };
    let offset = page * validated_page_size;
    
    // Clean the SQL by removing trailing semicolons and whitespace
    let cleaned_sql = sql.trim().trim_end_matches(';').trim();
    
    // Step 1: Get the total count using a subquery approach
    let count_sql = format!("SELECT COUNT(*) FROM ({}) AS count_subquery", cleaned_sql);
    let total_count: u64 = match conn.query_row(&count_sql, [], |row| row.get(0)) {
        Ok(count) => count,
        Err(err) => return Err(Error::CanisterError { message: format!("Failed to get count: {:?}", err) })
    };
    
    // Step 2: Get the paginated data
    // Check if the query already has LIMIT or ORDER BY clauses and handle accordingly
    let paginated_sql = if cleaned_sql.to_uppercase().contains("LIMIT") || cleaned_sql.to_uppercase().contains("ORDER BY") {
        // If query has LIMIT or ORDER BY, wrap it in a subquery
        format!("SELECT * FROM ({}) AS subquery LIMIT {} OFFSET {}", cleaned_sql, validated_page_size, offset)
    } else {
        // Simple case: just add LIMIT and OFFSET
        format!("{} LIMIT {} OFFSET {}", cleaned_sql, validated_page_size, offset)
    };
    let mut stmt = match conn.prepare(&paginated_sql) {
        Ok(stmt) => stmt,
        Err(err) => return Err(Error::CanisterError { message: format!("Failed to prepare paginated query: {:?}", err) })
    };
    
    let cnt = stmt.column_count();
    
    // Get column names once
    let mut columns = Vec::new();
    for idx in 0..cnt {
        columns.push(stmt.column_name(idx).unwrap().to_string());
    }
    
    let mut rows = match stmt.query([]) {
        Ok(rows) => rows,
        Err(err) => return Err(Error::CanisterError { message: format!("Failed to execute paginated query: {:?}", err) })
    };
    
    let mut data_rows: Vec<Vec<String>> = Vec::new();
    
    loop {
        match rows.next() {
            Ok(row) => {
                match row {
                    Some(row) => {
                        let mut row_values = Vec::new();
                        for idx in 0..cnt {
                            let v = row.get_ref_unwrap(idx);
                            let value = match v.data_type() {
                                Type::Null => String::from(""),
                                Type::Integer => v.as_i64().unwrap().to_string(),
                                Type::Real => v.as_f64().unwrap().to_string(),
                                Type::Text => v.as_str().unwrap().to_string(),
                                Type::Blob => hex::encode(v.as_blob().unwrap())
                            };
                            row_values.push(value);
                        }
                        data_rows.push(row_values);
                    },
                    None => break
                }
            },
            Err(err) => return Err(Error::CanisterError { message: format!("Row iteration error: {:?}", err) })
        }
    }
    
    // Calculate if there are more pages
    let has_more = (offset + validated_page_size) < total_count as u32;
    
    Ok(PaginatedQueryResult {
        columns,
        data: data_rows,
        total_count,
        page,
        page_size: validated_page_size,
        has_more,
    })
}

#[query]
fn query_paginated(sql: String, page: u32, page_size: u32) -> PaginatedResult {
    let conn = ic_sqlite::CONN.lock().unwrap();
    execute_paginated_query(&conn, sql, page, page_size)
}

#[update]
fn query_paginated_update(sql: String, page: u32, page_size: u32) -> PaginatedResult {
    let conn = ic_sqlite::CONN.lock().unwrap();
    execute_paginated_query(&conn, sql, page, page_size)
}

#[derive(CandidType, Deserialize)]
enum Error {
    InvalidCanister,
    CanisterError { message: String },
}

type Result<T = String, E = Error> = std::result::Result<T, E>;

type QueryResult<T = QueryResultWithColumns, E = Error> = std::result::Result<T, E>;

type PaginatedResult<T = PaginatedQueryResult, E = Error> = std::result::Result<T, E>;

impl From<(RejectionCode, String)> for Error {
    fn from((code, message): (RejectionCode, String)) -> Self {
        match code {
            RejectionCode::CanisterError => Self::CanisterError { message },
            _ => Self::InvalidCanister,
        }
    }
}

#[derive(CandidType, Deserialize)]
struct QueryResultWithColumns {
    columns: Vec<String>,
    data: Vec<Vec<String>>,
}

#[derive(CandidType, Deserialize)]
struct PaginatedQueryResult {
    columns: Vec<String>,
    data: Vec<Vec<String>>,
    total_count: u64,
    page: u32,
    page_size: u32,
    has_more: bool,
}

#[derive(CandidType, Deserialize)]
struct TableInfo {
    table_name: String,
    row_count: u64,
    column_count: u32,
    schema: Vec<ColumnInfo>,
    preview_data: Vec<Vec<String>>,
}

#[derive(CandidType, Deserialize)]
struct ColumnInfo {
    name: String,
    data_type: String,
    not_null: bool,
    primary_key: bool,
}

#[derive(CandidType, Deserialize)]
struct DatabaseInfo {
    total_tables: u32,
    database_size_mb: f64,
    tables: Vec<TableInfo>,
}

type DatabaseInfoResult<T = DatabaseInfo, E = Error> = std::result::Result<T, E>;

// Add this function to your code
#[query]
fn get_database_info() -> DatabaseInfoResult {
    let conn = ic_sqlite::CONN.lock().unwrap();
    
    // Get database size information using pragma queries
    let page_count: u64 = conn.pragma_query_value(None, "page_count", |row| row.get(0))
        .map_err(|e| Error::CanisterError { message: format!("Failed to get page count: {:?}", e) })?;
    let page_size: u64 = conn.pragma_query_value(None, "page_size", |row| row.get(0))
        .map_err(|e| Error::CanisterError { message: format!("Failed to get page size: {:?}", e) })?;
    let database_size_mb = (page_count * page_size) as f64 / (1024.0 * 1024.0);
    
    // Get list of all user tables (excluding sqlite system tables)
    let mut stmt = conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        .map_err(|e| Error::CanisterError { message: format!("Failed to prepare table list query: {:?}", e) })?;
    
    let table_names: std::result::Result<Vec<String>, _> = stmt.query_map([], |row| {
        Ok(row.get::<_, String>(0)?)
    }).map_err(|e| Error::CanisterError { message: format!("Failed to execute table list query: {:?}", e) })?
    .collect();
    
    let table_names = table_names.map_err(|e| Error::CanisterError { message: format!("Failed to collect table names: {:?}", e) })?;
    
    let mut tables = Vec::new();
    
    // For each table, get detailed information
    for table_name in &table_names {
        // Get row count for this table
        let count_query = format!("SELECT COUNT(*) FROM {}", table_name);
        let row_count: u64 = conn.query_row(&count_query, [], |row| row.get(0))
            .map_err(|e| Error::CanisterError { message: format!("Failed to get row count for {}: {:?}", table_name, e) })?;
        
        // Get schema information using PRAGMA table_info
        let pragma_query = format!("PRAGMA table_info({})", table_name);
        let mut schema_stmt = conn.prepare(&pragma_query)
            .map_err(|e| Error::CanisterError { message: format!("Failed to prepare schema query for {}: {:?}", table_name, e) })?;
        
        let schema_rows = schema_stmt.query_map([], |row| {
            Ok(ColumnInfo {
                name: row.get::<_, String>(1)?,          // column name
                data_type: row.get::<_, String>(2)?,     // data type  
                not_null: row.get::<_, i32>(3)? != 0,    // not null flag
                primary_key: row.get::<_, i32>(5)? != 0, // primary key flag
            })
        }).map_err(|e| Error::CanisterError { message: format!("Failed to execute schema query for {}: {:?}", table_name, e) })?;
        
        let schema: std::result::Result<Vec<ColumnInfo>, _> = schema_rows.collect();
        let schema = schema.map_err(|e| Error::CanisterError { message: format!("Failed to collect schema for {}: {:?}", table_name, e) })?;
        
        let column_count = schema.len() as u32;
        
        // Get preview data (first 10 rows) for this table
        let preview_query = format!("SELECT * FROM {} LIMIT 10", table_name);
        let mut preview_stmt = conn.prepare(&preview_query)
            .map_err(|e| Error::CanisterError { message: format!("Failed to prepare preview query for {}: {:?}", table_name, e) })?;
        
        let preview_column_count = preview_stmt.column_count();
        let mut preview_rows = preview_stmt.query([])
            .map_err(|e| Error::CanisterError { message: format!("Failed to execute preview query for {}: {:?}", table_name, e) })?;
        
        let mut preview_data: Vec<Vec<String>> = Vec::new();
        loop {
            match preview_rows.next() {
                Ok(row) => {
                    match row {
                        Some(row) => {
                            let mut vec: Vec<String> = Vec::new();
                            for idx in 0..preview_column_count {
                                let v = row.get_ref_unwrap(idx);
                                match v.data_type() {
                                    Type::Null => { vec.push(String::from("")) }
                                    Type::Integer => { vec.push(v.as_i64().unwrap().to_string()) }
                                    Type::Real => { vec.push(v.as_f64().unwrap().to_string()) }
                                    Type::Text => { vec.push(v.as_str().unwrap().parse().unwrap()) }
                                    Type::Blob => { vec.push(hex::encode(v.as_blob().unwrap())) }
                                }
                            }
                            preview_data.push(vec);
                        },
                        None => break
                    }
                },
                Err(e) => {
                    // If preview query fails, just use empty data instead of failing the whole request
                    eprintln!("Preview query failed for {}: {:?}", table_name, e);
                    break;
                }
            }
        }
        
        tables.push(TableInfo {
            table_name: table_name.clone(),
            row_count,
            column_count,
            schema,
            preview_data,
        });
    }
    
    Ok(DatabaseInfo {
        total_tables: table_names.len() as u32,
        database_size_mb,
        tables,
    })
}