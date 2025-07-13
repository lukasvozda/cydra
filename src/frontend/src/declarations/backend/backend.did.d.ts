import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface ColumnInfo {
  'primary_key' : boolean,
  'name' : string,
  'data_type' : string,
  'not_null' : boolean,
}
export interface DatabaseInfo {
  'tables' : Array<TableInfo>,
  'total_tables' : number,
  'database_size_mb' : number,
}
export type DatabaseInfoResult = { 'Ok' : DatabaseInfo } |
  { 'Err' : Error };
export type Error = { 'CanisterError' : { 'message' : string } } |
  { 'InvalidCanister' : null };
export type QueryResult = { 'Ok' : Array<Array<string>> } |
  { 'Err' : Error };
export type Result = { 'Ok' : string } |
  { 'Err' : Error };
export interface TableInfo {
  'schema' : Array<ColumnInfo>,
  'column_count' : number,
  'row_count' : bigint,
  'table_name' : string,
}
export interface _SERVICE {
  'balance' : ActorMethod<[], bigint>,
  'execute' : ActorMethod<[string], Result>,
  'get_database_info' : ActorMethod<[], DatabaseInfoResult>,
  'instruction_counter' : ActorMethod<[], bigint>,
  'query' : ActorMethod<[string], QueryResult>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
