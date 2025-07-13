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
    let mut rows = stmt.query([]).unwrap();
    let mut res: Vec<Vec<String>> = Vec::new();
    loop {
        match rows.next() {
            Ok(row) => {
                match row {
                    Some(row) => {
                        let mut vec: Vec<String> = Vec::new();
                        for idx in 0..cnt {
                            let v = row.get_ref_unwrap(idx);
                            match v.data_type() {
                                Type::Null => {  vec.push(String::from("")) }
                                Type::Integer => { vec.push(v.as_i64().unwrap().to_string()) }
                                Type::Real => { vec.push(v.as_f64().unwrap().to_string()) }
                                Type::Text => { vec.push(v.as_str().unwrap().parse().unwrap()) }
                                Type::Blob => { vec.push(hex::encode(v.as_blob().unwrap())) }
                            }
                        }
                        res.push(vec)
                    },
                    None => break
                }
            },
            Err(err) => return Err(Error::CanisterError {message: format!("{:?}", err) })
        }
    }
    Ok(res)
}

#[derive(CandidType, Deserialize)]
enum Error {
    InvalidCanister,
    CanisterError { message: String },
}

type Result<T = String, E = Error> = std::result::Result<T, E>;

type QueryResult<T = Vec<Vec<String>>, E = Error> = std::result::Result<T, E>;

impl From<(RejectionCode, String)> for Error {
    fn from((code, message): (RejectionCode, String)) -> Self {
        match code {
            RejectionCode::CanisterError => Self::CanisterError { message },
            _ => Self::InvalidCanister,
        }
    }
}

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
        
        tables.push(TableInfo {
            table_name: table_name.clone(),
            row_count,
            column_count,
            schema,
        });
    }
    
    Ok(DatabaseInfo {
        total_tables: table_names.len() as u32,
        database_size_mb,
        tables,
    })
}