import { HttpAgent } from "@dfinity/agent";
import { createActor, canisterId } from "../../declarations/backend";

// Create the agent pointing to the correct host based on network
const agent = new HttpAgent({
  host: process.env.DFX_NETWORK === "ic" ? "https://ic0.app" : "http://127.0.0.1:8000",
});

// Fetch root key for local development
if (process.env.DFX_NETWORK !== "ic") {
  agent.fetchRootKey().catch(err => {
    console.warn("Unable to fetch root key. Check if local replica is running.");
    console.error(err);
  });
}

// Create the backend actor with the correct agent
const backend = createActor(canisterId, { agent });

// Define the types based on the Candid interface
export interface ColumnInfo {
  name: string;
  data_type: string;
  not_null: boolean;
  primary_key: boolean;
}

export interface TableInfo {
  table_name: string;
  row_count: bigint;
  column_count: number;
  schema: ColumnInfo[];
  preview_data: string[][];
}

export interface DatabaseInfo {
  total_tables: number;
  database_size_mb: number;
  tables: TableInfo[];
}

export interface QueryResultWithColumns {
  columns: string[];
  data: string[][];
}

export interface PaginatedQueryResult {
  columns: string[];
  data: string[][];
  total_count: bigint;
  page: number;
  page_size: number;
  has_more: boolean;
}

export type QueryResult = { Ok: QueryResultWithColumns } | { Err: any };
export type PaginatedResult = { Ok: PaginatedQueryResult } | { Err: any };
export type ExecuteResult = { Ok: string } | { Err: any };
export type DatabaseInfoResult = { Ok: DatabaseInfo } | { Err: any };

// Export the backend actor
export { backend };

// Service functions to interact with the backend
export class CanisterService {
  static async executeSQL(sql: string): Promise<ExecuteResult> {
    try {
      const result = await backend.execute(sql);
      return result as ExecuteResult;
    } catch (error) {
      console.error("Error executing SQL:", error);
      return { Err: { CanisterError: { message: String(error) } } };
    }
  }

  static async querySQL(sql: string): Promise<QueryResult> {
    try {
      const result = await backend.query(sql);
      return result as QueryResult;
    } catch (error) {
      console.error("Error querying SQL:", error);
      return { Err: { CanisterError: { message: String(error) } } };
    }
  }

  static async queryPaginatedSQL(sql: string, page: number, pageSize: number): Promise<PaginatedResult> {
    try {
      const result = await backend.query_paginated(sql, page, pageSize);
      return result as PaginatedResult;
    } catch (error) {
      console.error("Error querying paginated SQL:", error);
      return { Err: { CanisterError: { message: String(error) } } };
    }
  }

  static async getDatabaseInfo(): Promise<DatabaseInfoResult> {
    try {
      const result = await backend.get_database_info();
      return result as DatabaseInfoResult;
    } catch (error) {
      console.error("Error getting database info:", error);
      return { Err: { CanisterError: { message: String(error) } } };
    }
  }

  static async getBalance(): Promise<bigint> {
    try {
      return await backend.balance();
    } catch (error) {
      console.error("Error getting balance:", error);
      return BigInt(0);
    }
  }

  static async getInstructionCounter(): Promise<bigint> {
    try {
      return await backend.instruction_counter();
    } catch (error) {
      console.error("Error getting instruction counter:", error);
      return BigInt(0);
    }
  }
}