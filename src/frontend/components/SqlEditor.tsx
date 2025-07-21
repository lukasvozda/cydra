import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Save, 
  Download, 
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle
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
  } | null) => void;
}

export function SqlEditor({ activeTable, onQueryResult }: SqlEditorProps) {
  const [query, setQuery] = useState(`SELECT * FROM ${activeTable?.name || 'person'} LIMIT 10;`);
  const [lastExecution, setLastExecution] = useState<{
    duration: number;
    rowsAffected: number;
    status: 'success' | 'error';
    timestamp: Date;
    result?: any;
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
  (5, 'Charlie Wilson', 'charlie.wilson@email.com', 52, '654 Maple Dr, Phoenix, AZ');`
  ]);

  const [isExecuting, setIsExecuting] = useState(false);
  
  // Update default query when active table changes
  useEffect(() => {
    if (activeTable) {
      setQuery(`SELECT * FROM ${activeTable.name} LIMIT 10;`);
    }
  }, [activeTable]);

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

    setIsExecuting(true);
    const startTime = performance.now();
    
    try {
      const trimmedQuery = query.trim();
      const upperQuery = trimmedQuery.toUpperCase();
      
      let result;
      let rowsAffected = 0;
      
      // Check if it's a SELECT query (read-only)
      if (upperQuery.startsWith('SELECT')) {
        // For SELECT queries, use the CanisterService.querySQL method directly
        const { CanisterService } = await import("@/lib/canister");
        const queryResult = await CanisterService.querySQL(trimmedQuery);
        
        if ('Ok' in queryResult) {
          result = queryResult.Ok;
          rowsAffected = result && result.data && Array.isArray(result.data) ? result.data.length : 0;
          console.log('SELECT result:', result);
        } else {
          throw new Error(queryResult.Err?.CanisterError?.message || 'Query failed');
        }
      } else {
        // For DDL/DML queries, use the execute method
        const { CanisterService } = await import("@/lib/canister");
        const executeResult = await CanisterService.executeSQL(trimmedQuery);
        
        if ('Ok' in executeResult) {
          result = executeResult.Ok;
          rowsAffected = 1; // We don't get exact row count from backend for non-SELECT
          console.log('Execute result:', result);
        } else {
          throw new Error(executeResult.Err?.CanisterError?.message || 'Execute failed');
        }
      }
      
      const duration = Math.round(performance.now() - startTime);
      const timestamp = new Date();
      
      setLastExecution({
        duration,
        rowsAffected,
        status: 'success',
        timestamp,
        result
      });
      
      // Pass result to parent component
      onQueryResult?.({
        data: result,
        query: trimmedQuery,
        duration,
        timestamp,
        status: 'success'
      });
      
      console.log(`Query executed successfully in ${duration}ms`);
      
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      const timestamp = new Date();
      
      setLastExecution({
        duration,
        rowsAffected: 0,
        status: 'error',
        timestamp
      });
      
      // Pass error to parent component
      onQueryResult?.({
        data: null,
        query: query.trim(),
        duration,
        timestamp,
        status: 'error'
      });
      
      console.error(`Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      alert(`Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
              <span>{lastExecution.rowsAffected} rows</span>
            </div>
          )}
          
          <Button variant="ghost" size="sm" disabled title="Coming soon">
            <Save className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="default" 
            size="sm"
            onClick={handleRunQuery}
            disabled={isExecuting}
            className="min-w-20"
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
          <div className="flex gap-1">
            {queryHistory.slice(0, 3).map((historyQuery, index) => (
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