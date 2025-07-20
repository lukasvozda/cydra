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
  const QueryResult = IDL.Variant({
    'Ok' : IDL.Vec(IDL.Vec(IDL.Text)),
    'Err' : Error,
  });
  return IDL.Service({
    'balance' : IDL.Func([], [IDL.Nat64], ['query']),
    'execute' : IDL.Func([IDL.Text], [Result], []),
    'get_database_info' : IDL.Func([], [DatabaseInfoResult], ['query']),
    'instruction_counter' : IDL.Func([], [IDL.Nat64], ['query']),
    'query' : IDL.Func([IDL.Text], [QueryResult], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
