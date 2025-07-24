export const idlFactory = ({ IDL }) => {
  const Error = IDL.Variant({
    'CanisterError' : IDL.Record({ 'message' : IDL.Text }),
    'InvalidCanister' : IDL.Null,
  });
  const Result = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : Error });
  const ColumnInfo = IDL.Record({
    'primary_key' : IDL.Bool,
    'name' : IDL.Text,
    'data_type' : IDL.Text,
    'not_null' : IDL.Bool,
  });
  const TableInfo = IDL.Record({
    'schema' : IDL.Vec(ColumnInfo),
    'column_count' : IDL.Nat32,
    'row_count' : IDL.Nat64,
    'preview_data' : IDL.Vec(IDL.Vec(IDL.Text)),
    'table_name' : IDL.Text,
  });
  const DatabaseInfo = IDL.Record({
    'tables' : IDL.Vec(TableInfo),
    'total_tables' : IDL.Nat32,
    'database_size_mb' : IDL.Float64,
  });
  const DatabaseInfoResult = IDL.Variant({
    'Ok' : DatabaseInfo,
    'Err' : Error,
  });
  const QueryResultWithColumns = IDL.Record({
    'data' : IDL.Vec(IDL.Vec(IDL.Text)),
    'columns' : IDL.Vec(IDL.Text),
  });
  const QueryResult = IDL.Variant({
    'Ok' : QueryResultWithColumns,
    'Err' : Error,
  });
  const PaginatedQueryResult = IDL.Record({
    'page_size' : IDL.Nat32,
    'data' : IDL.Vec(IDL.Vec(IDL.Text)),
    'page' : IDL.Nat32,
    'total_count' : IDL.Nat64,
    'columns' : IDL.Vec(IDL.Text),
    'has_more' : IDL.Bool,
  });
  const PaginatedResult = IDL.Variant({
    'Ok' : PaginatedQueryResult,
    'Err' : Error,
  });
  return IDL.Service({
    'balance' : IDL.Func([], [IDL.Nat64], ['query']),
    'execute' : IDL.Func([IDL.Text], [Result], []),
    'get_database_info' : IDL.Func([], [DatabaseInfoResult], ['query']),
    'instruction_counter' : IDL.Func([], [IDL.Nat64], ['query']),
    'query' : IDL.Func([IDL.Text], [QueryResult], ['query']),
    'query_paginated' : IDL.Func(
        [IDL.Text, IDL.Nat32, IDL.Nat32],
        [PaginatedResult],
        ['query'],
      ),
    'query_paginated_update' : IDL.Func(
        [IDL.Text, IDL.Nat32, IDL.Nat32],
        [PaginatedResult],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
