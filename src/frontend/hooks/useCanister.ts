import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CanisterService } from "../lib/canister";

// Hook to get database info
export const useDatabaseInfo = () => {
  return useQuery({
    queryKey: ["databaseInfo"],
    queryFn: async () => {
      const result = await CanisterService.getDatabaseInfo();
      if ("Ok" in result) {
        return result.Ok;
      } else {
        throw new Error(result.Err?.CanisterError?.message || "Failed to get database info");
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

// Hook to execute SQL commands
export const useExecuteSQL = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sql: string) => {
      const result = await CanisterService.executeSQL(sql);
      if ("Ok" in result) {
        return result.Ok;
      } else {
        throw new Error(result.Err?.CanisterError?.message || "Failed to execute SQL");
      }
    },
    onSuccess: () => {
      // Invalidate database info to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["databaseInfo"] });
      queryClient.invalidateQueries({ queryKey: ["tableData"] });
    },
  });
};

// Hook to query SQL
export const useQuerySQL = (sql: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["sqlQuery", sql],
    queryFn: async () => {
      if (!sql.trim()) {
        return [];
      }
      
      const result = await CanisterService.querySQL(sql);
      if ("Ok" in result) {
        return result.Ok;
      } else {
        throw new Error(result.Err?.CanisterError?.message || "Failed to query SQL");
      }
    },
    enabled: enabled && !!sql.trim(),
  });
};

// Hook to get table data
export const useTableData = (tableName: string | undefined) => {
  return useQuery({
    queryKey: ["tableData", tableName],
    queryFn: async () => {
      if (!tableName) {
        return [];
      }
      
      const sql = `SELECT * FROM ${tableName} LIMIT 100`;
      const result = await CanisterService.querySQL(sql);
      if ("Ok" in result) {
        return result.Ok;
      } else {
        throw new Error(result.Err?.CanisterError?.message || "Failed to get table data");
      }
    },
    enabled: !!tableName,
  });
};

// Hook to get canister stats
export const useCanisterStats = () => {
  return useQuery({
    queryKey: ["canisterStats"],
    queryFn: async () => {
      const [balance, instructionCounter] = await Promise.all([
        CanisterService.getBalance(),
        CanisterService.getInstructionCounter(),
      ]);
      
      return {
        balance,
        instructionCounter,
      };
    },
    refetchInterval: 60000, // Refetch every minute
  });
};