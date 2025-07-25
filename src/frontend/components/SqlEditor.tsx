import { useState, useCallback, useEffect } from "react";
import { usePaginatedQuery } from "@/hooks/useCanister";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Play, 
  Save, 
  Download, 
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Eye
} from "lucide-react";
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { EditorView } from '@codemirror/view';
import { autocompletion } from '@codemirror/autocomplete';

interface SqlEditorProps {
  activeTable?: {
    id: string;
    name: string;
    rowCount: number;
    lastModified: string;
  };
  onQueryResult?: (result: {
    data: any;
    query: string;
    duration: number;
    timestamp: Date;
    status: 'success' | 'error';
    isPaginated?: boolean;
    executionMode?: 'query' | 'update';
    cyclesCost?: bigint;
    usdCost?: number;
    errorMessage?: string;
  } | null) => void;
}

export function SqlEditor({ activeTable, onQueryResult }: SqlEditorProps) {
  const [query, setQuery] = useState(`SELECT * FROM ${activeTable?.name || 'person'} LIMIT 10;`);
  const [, setUsePagination] = useState(false);
  const [pageSize] = useState(10);
  const [lastExecution, setLastExecution] = useState<{
    duration: number;
    rowsAffected: number;
    status: 'success' | 'error';
    timestamp: Date;
    result?: any;
    isPaginated?: boolean;
    executionMode?: 'query' | 'update';
    cyclesCost?: bigint;
    usdCost?: number;
  } | null>(null);

  const [queryHistory] = useState([
    `SELECT 
  o.*, 
  p.price, 
  o.quantity * p.price as revenue 
FROM orders as o
LEFT JOIN products as p
ON o.product_id = p.id`,
    `CREATE TABLE person (
  id      INTEGER,
  name    TEXT,
  email   TEXT,
  age     INTEGER,
  address TEXT
);`,
`INSERT INTO person (id, name, email, age, address) VALUES
  (1, 'John Doe',       'john.doe@email.com',       28, '123 Main St, New York, NY'),
  (2, 'Jane Smith',     'jane.smith@email.com',     34, '456 Oak Ave, Los Angeles, CA'),
  (3, 'Bob Johnson',    'bob.johnson@email.com',    45, '789 Pine Rd, Chicago, IL'),
  (4, 'Alice Brown',    'alice.brown@email.com',    29, '321 Elm St, Houston, TX'),
  (5, 'Charlie Wilson', 'charlie.wilson@email.com', 52, '654 Maple Dr, Phoenix, AZ');`,
  `SELECT 
  p.category,
  SUM(o.quantity) as items_sold,
  SUM(o.quantity * p.price) as revenue 
FROM orders as o
LEFT JOIN products as p
ON o.product_id = p.id
WHERE category is not null
GROUP BY 1`  
  ]);

  const [isExecuting, setIsExecuting] = useState(false);
  const [executionMode, setExecutionMode] = useState<'query' | 'update'>('query');
  
  // Detect if query should use pagination - always paginate SELECT queries
  const shouldUsePagination = (sql: string) => {
    const trimmedSql = sql.trim().toUpperCase();
    return trimmedSql.startsWith('SELECT');
  };

  // Store the executed query separately from the input query
  const [executedQuery, setExecutedQuery] = useState<string>("");
  
  // Use paginated query hook only for executed queries (keeping hook for consistency but not displaying pagination controls here)
  usePaginatedQuery(
    executedQuery, 
    0, 
    pageSize, 
    false // Disabled since we handle pagination in handleRunQuery directly
  );

  // Update default query when active table changes
  useEffect(() => {
    if (activeTable) {
      setQuery(`SELECT * FROM ${activeTable.name} LIMIT 10;`);
    }
  }, [activeTable]);

  // Auto-detect if pagination should be used only for executed queries
  useEffect(() => {
    if (executedQuery) {
      const shouldPaginate = shouldUsePagination(executedQuery);
      setUsePagination(shouldPaginate);
    }
  }, [executedQuery]);

  // SQL autocomplete suggestions
  const sqlCompletions = [
    { label: "SELECT", type: "keyword" },
    { label: "FROM", type: "keyword" },
    { label: "WHERE", type: "keyword" },
    { label: "ORDER BY", type: "keyword" },
    { label: "GROUP BY", type: "keyword" },
    { label: "HAVING", type: "keyword" },
    { label: "LIMIT", type: "keyword" },
    { label: "INSERT INTO", type: "keyword" },
    { label: "UPDATE", type: "keyword" },
    { label: "DELETE", type: "keyword" },
    { label: "CREATE TABLE", type: "keyword" },
    { label: "ALTER TABLE", type: "keyword" },
    { label: "DROP TABLE", type: "keyword" },
    { label: "users", type: "table" },
    { label: "products", type: "table" },
    { label: "orders", type: "table" },
    { label: "customers", type: "table" },
    { label: "id", type: "column" },
    { label: "name", type: "column" },
    { label: "email", type: "column" },
    { label: "created_at", type: "column" },
    { label: "updated_at", type: "column" },
  ];

  const handleRunQuery = async () => {
    if (!query.trim()) {
      alert("Please enter a SQL query");
      return;
    }

    const trimmedQuery = query.trim();
    const shouldPaginate = shouldUsePagination(trimmedQuery);
    
    // Set the executed query to trigger pagination hook if needed
    setExecutedQuery(trimmedQuery);
    
    setIsExecuting(true);
    const startTime = performance.now();
    
    // Get initial balance for update calls to calculate cycle cost
    let initialBalance: bigint | null = null;
    if (executionMode === 'update') {
      try {
        const { CanisterService } = await import("@/lib/canister");
        initialBalance = await CanisterService.getBalance();
        
        // Check if balance is sufficient for update calls (minimum 0.5 TC)
        if (initialBalance !== null && initialBalance < 500_000_000_000n) {
          const currentBalanceFormatted = Number(initialBalance).toLocaleString();
          const requiredBalance = "500,000,000,000";
          const currentUSD = (Number(initialBalance) / 1_000_000_000_000 * 1.44).toFixed(6);
          const requiredUSD = (0.5 * 1.44).toFixed(6);
          
          throw new Error(`Insufficient cycles for update call.\n\nCurrent balance: ${currentBalanceFormatted} cycles ($${currentUSD} USD)\nMinimum required: ${requiredBalance} cycles ($${requiredUSD} USD)\n\nUpdate calls consume significant cycles and could exhaust your canister's balance. Please top up your canister with at least 0.5 TC (trillion cycles) before running update calls.\n\nFor read-only operations, use "Query Call" mode instead.`);
        }
      } catch (error) {
        console.warn("Failed to get initial balance:", error);
        // Re-throw if it's our balance check error
        if (error instanceof Error && error.message.includes('Insufficient cycles')) {
          throw error;
        }
      }
    }
    
    try {
      const upperQuery = trimmedQuery.toUpperCase();
      
      let result;
      let rowsAffected = 0;
      let isPaginated = false;
      
      // Check if it's a SELECT query (read-only)
      if (upperQuery.startsWith('SELECT')) {
        if (shouldPaginate) {
          // Use paginated query for all SELECT queries
          const { CanisterService } = await import("@/lib/canister");
          
          // Choose between query call or update call based on execution mode
          const paginatedQueryResult = executionMode === 'query' 
            ? await CanisterService.queryPaginatedSQL(trimmedQuery, 0, pageSize)
            : await CanisterService.queryPaginatedUpdateSQL(trimmedQuery, 0, pageSize);
          
          if ('Ok' in paginatedQueryResult) {
            result = paginatedQueryResult.Ok;
            rowsAffected = result.data?.length || 0;
            isPaginated = true;
          } else {
            throw new Error(paginatedQueryResult.Err?.CanisterError?.message || 'Paginated query failed');
          }
        }
      } else {
        // For DDL/DML queries, always use the execute method (update call)
        const { CanisterService } = await import("@/lib/canister");
        const executeResult = await CanisterService.executeSQL(trimmedQuery);
        
        if ('Ok' in executeResult) {
          result = executeResult.Ok;
          rowsAffected = 1; // We don't get exact row count from backend for non-SELECT
        } else {
          throw new Error(executeResult.Err?.CanisterError?.message || 'Execute failed');
        }
      }
      
      const duration = Math.round(performance.now() - startTime);
      const timestamp = new Date();
      
      // Calculate cycle cost for update calls
      let cyclesCost: bigint | undefined;
      let usdCost: number | undefined;
      
      if (executionMode === 'update' && initialBalance !== null) {
        try {
          const { CanisterService } = await import("@/lib/canister");
          const finalBalance = await CanisterService.getBalance();
          cyclesCost = initialBalance - finalBalance;
          
          // Convert cycles to USD: 1 Trillion cycles = 1 XDR = 1.44 USD
          const cyclesAsNumber = Number(cyclesCost);
          const xdrCost = cyclesAsNumber / 1_000_000_000_000; // Convert to XDR
          usdCost = xdrCost * 1.44; // Convert XDR to USD
        } catch (error) {
          console.warn("Failed to calculate cycle cost:", error);
        }
      }
      
      setLastExecution({
        duration,
        rowsAffected,
        status: 'success',
        timestamp,
        result,
        isPaginated,
        executionMode,
        cyclesCost,
        usdCost
      });
      
      // Pass result to parent component
      onQueryResult?.({
        data: result,
        query: trimmedQuery,
        duration,
        timestamp,
        status: 'success',
        isPaginated,
        executionMode,
        cyclesCost,
        usdCost
      });
      
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      const timestamp = new Date();
      
      setLastExecution({
        duration,
        rowsAffected: 0,
        status: 'error',
        timestamp,
        executionMode
      });
      
      // Pass error to parent component with full error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onQueryResult?.({
        data: null,
        query: query.trim(),
        duration,
        timestamp,
        status: 'error',
        errorMessage
      });
      
      console.error(`Query failed: ${errorMessage}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const onChange = useCallback((value: string) => {
    setQuery(value);
  }, []);

  // Simple SQL syntax error detection
  const detectSqlErrors = (query: string) => {
    const errors = [];
    const upperQuery = query.toUpperCase();
    
    // Check for unmatched parentheses
    const openParens = (query.match(/\(/g) || []).length;
    const closeParens = (query.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push("Unmatched parentheses");
    }
    
    // Check for incomplete SELECT statements
    if (upperQuery.includes('SELECT') && !upperQuery.includes('FROM')) {
      errors.push("SELECT statement missing FROM clause");
    }
    
    return errors;
  };

  const sqlErrors = detectSqlErrors(query);

  // Custom dark theme for CodeMirror to match website colors
  const customDarkTheme = EditorView.theme({
    '&': {
      color: 'hsl(var(--foreground))',
      backgroundColor: 'hsl(220 13% 18%)', // Slightly lighter than pure background
    },
    '.cm-content': {
      padding: '16px',
      caretColor: 'hsl(var(--primary))',
      backgroundColor: 'hsl(220 13% 18%)', // Slightly lighter for better readability
    },
    '.cm-editor': {
      backgroundColor: 'hsl(220 13% 18%)',
    },
    '.cm-focused': {
      outline: 'none',
    },
    '.cm-editor.cm-focused': {
      outline: 'none',
    },
    '.cm-scroller': {
      backgroundColor: 'hsl(220 13% 18%)',
      overflowY: 'auto',
      maxHeight: '220px',
    },
    '.cm-gutters': {
      backgroundColor: 'hsl(var(--muted))',
      color: 'hsl(var(--muted-foreground))',
      border: 'none',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      color: 'hsl(var(--muted-foreground))',
    },
    '.cm-activeLine': {
      backgroundColor: 'hsl(var(--muted) / 0.3)',
    },
    '.cm-selectionBackground': {
      backgroundColor: 'hsl(var(--primary) / 0.2)',
    },
    '.cm-cursor': {
      borderLeftColor: 'hsl(var(--primary))',
    },
  }, { dark: true });

  return (
    <Card className="bg-gradient-card border-border overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-background/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">SQL Editor</h2>
          </div>
          {activeTable && (
            <Badge variant="secondary" className="text-xs">
              {activeTable.name}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* SQL Error Indicator */}
          {sqlErrors.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{sqlErrors.length} error{sqlErrors.length > 1 ? 's' : ''}</span>
            </div>
          )}
          
          {lastExecution && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {lastExecution.status === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
              <span>{lastExecution.duration}ms</span>
              <span>•</span>
              <span>
                {lastExecution.result && lastExecution.result.total_count 
                  ? Number(lastExecution.result.total_count).toLocaleString()
                  : lastExecution.rowsAffected
                } rows
              </span>
              {lastExecution.isPaginated && lastExecution.result && lastExecution.result.total_count && Number(lastExecution.result.total_count) > lastExecution.rowsAffected && (
                <>
                  <span>•</span>
                  <Badge variant="secondary" className="text-xs">Paginated</Badge>
                </>
              )}
            </div>
          )}

          
          <Button variant="ghost" size="sm" disabled title="Coming soon">
            <Save className="h-4 w-4" />
          </Button>
          
          {/* Split button for query execution */}
          <div className="flex">
            <Button 
              variant={executionMode === 'update' ? 'destructive' : 'default'}
              size="sm"
              onClick={() => handleRunQuery()}
              disabled={isExecuting}
              className="rounded-r-none min-w-20"
            >
              {isExecuting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Running
                </div>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Query
                </>
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant={executionMode === 'update' ? 'destructive' : 'default'}
                  size="sm" 
                  disabled={isExecuting}
                  className="rounded-l-none border-l border-white/20 px-2"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setExecutionMode('query')}>
                  <Eye className="h-4 w-4 mr-2" />
                  Query Call (Fast)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setExecutionMode('update')}>
                  <Zap className="h-4 w-4 mr-2" />
                  Update Call (Powerful)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* SQL Editor */}
      <div className="relative" style={{ height: '220px' }}>
        <CodeMirror
          value={query}
          onChange={onChange}
          height="220px"
          theme={customDarkTheme}
          extensions={[
            sql(),
            autocompletion({
              override: [
                (context) => {
                  const word = context.matchBefore(/\w*/);
                  if (!word) return null;
                  
                  return {
                    from: word.from,
                    options: sqlCompletions.map(item => ({
                      label: item.label,
                      type: item.type,
                      apply: item.label,
                    })),
                  };
                },
              ],
            }),
          ]}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            highlightSelectionMatches: true,
            searchKeymap: true,
          }}
          className="h-full"
        />
        
        {/* Status overlay */}
        {lastExecution && (
          <div className="absolute bottom-4 right-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-md">
              <Clock className="h-3 w-3" />
              Last run: {lastExecution.timestamp.toLocaleTimeString()}
            </div>
          </div>
        )}
        
        {/* Error tooltip */}
        {sqlErrors.length > 0 && (
          <div className="absolute top-4 right-4 bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 rounded-md text-sm">
            <div className="font-medium">SQL Errors:</div>
            <ul className="list-disc list-inside mt-1">
              {sqlErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>


      {/* Quick Actions */}
      <div className="p-3 border-t border-border bg-background/10 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Example queries:</span>
            <div className="flex gap-1">
              {queryHistory.slice(0, 4).map((historyQuery, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8 px-2"
                  onClick={() => setQuery(historyQuery)}
                >
                  {historyQuery.split(' ').slice(0, 3).join(' ')}...
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8" disabled title="Coming soon">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}