import { useState, useMemo } from "react";
import { useDatabaseInfo } from "@/hooks/useCanister";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Table as TableIcon, 
  Database, 
  Shield, 
  Plus,
  Edit3,
  Trash2,
  Copy,
  Info,
  BarChart3,
  AlertCircle,
  HardDrive,
  Key
} from "lucide-react";


interface DatabasePanelProps {
  activeTable?: {
    id: string;
    name: string;
    rowCount: number;
    lastModified: string;
  };
  queryResult?: {
    data: { columns: string[]; data: string[][] } | null;
    query: string;
    duration: number;
    timestamp: Date;
    status: 'success' | 'error';
  } | null;
}

export function DatabasePanel({ activeTable, queryResult }: DatabasePanelProps) {
  const [selectedTab, setSelectedTab] = useState("overview");
  
  // Get database info to access real schema and preview data
  const { data: dbInfo, isLoading: isLoadingData, error: dataError } = useDatabaseInfo();

  // Get real columns and preview data from database info for the active table
  const { columns, previewData } = useMemo(() => {
    if (!activeTable || !dbInfo) return { columns: [], previewData: [] };
    
    const tableInfo = dbInfo.tables.find(table => table.table_name === activeTable.name);
    return {
      columns: tableInfo?.schema || [],
      previewData: tableInfo?.preview_data || []
    };
  }, [activeTable, dbInfo]);

  // Use preview data for display
  const displayData = previewData;

  // Utility functions for table size calculation
  const estimateRowSizeBytes = (sampleRows: string[][]): number => {
    if (sampleRows.length === 0) return 0;
    
    const totalBytes = sampleRows.reduce((sum, row) => {
      const rowBytes = row.reduce((rowSum, cell) => {
        // Estimate bytes per cell (UTF-8 encoding)
        return rowSum + new TextEncoder().encode(cell || '').length;
      }, 0);
      return sum + rowBytes;
    }, 0);
    
    return totalBytes / sampleRows.length; // Average bytes per row
  };

  const formatTableSize = (totalBytes: number): string => {
    if (totalBytes < 1024) return `${Math.round(totalBytes)} B`;
    if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
    if (totalBytes < 1024 * 1024 * 1024) return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(totalBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  // Calculate estimated table size from sample data
  const estimatedTableSize = useMemo(() => {
    if (!activeTable || !previewData || previewData.length === 0) {
      return "0 B";
    }
    
    const avgRowSizeBytes = estimateRowSizeBytes(previewData);
    const totalBytes = activeTable.rowCount * avgRowSizeBytes;
    // Add ~20% overhead for SQLite metadata, indexes, etc.
    const totalBytesWithOverhead = totalBytes * 1.2;
    
    return formatTableSize(totalBytesWithOverhead);
  }, [activeTable, previewData]);

  // Show query results if available
  if (queryResult) {
    return (
      <Card className="flex-1 bg-gradient-card border-border overflow-hidden">
        {/* Query Results Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${queryResult.status === 'success' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                {queryResult.status === 'success' ? (
                  <Database className="h-6 w-6 text-success" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-destructive" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Query Results</h2>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-muted-foreground">
                    Executed in {queryResult.duration}ms
                  </span>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">
                    {queryResult.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
            <Badge variant={queryResult.status === 'success' ? 'default' : 'destructive'}>
              {queryResult.status}
            </Badge>
          </div>
        </div>

        {/* Query Results Content */}
        <div className="flex-1 overflow-auto p-6">
          {queryResult.status === 'error' ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-destructive/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground">Query Failed</h3>
                <p className="text-muted-foreground">There was an error executing your query</p>
              </div>
            </div>
          ) : queryResult.data && queryResult.data.data && Array.isArray(queryResult.data.data) && queryResult.data.data.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">Results ({queryResult.data.data.length} rows)</h3>
                <code className="text-xs bg-muted px-2 py-1 rounded">{queryResult.query}</code>
              </div>
              
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-background/30 border-b border-border">
                      <tr>
                        {queryResult.data.columns.map((columnName: string, colIndex: number) => (
                          <th key={colIndex} className="px-4 py-2 text-left text-sm font-medium text-foreground">
                            {columnName}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.data.data.map((row: string[], rowIndex: number) => (
                        <tr key={rowIndex} className="border-b border-border hover:bg-background/20 transition-colors">
                          {row.map((cellValue: string, colIndex: number) => (
                            <td key={colIndex} className="px-4 py-2 text-sm text-foreground">
                              {cellValue !== null && cellValue !== undefined && cellValue !== "" ? String(cellValue) : 'NULL'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="p-4 bg-muted/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                <Database className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground">Query Executed</h3>
                <p className="text-muted-foreground">No results returned</p>
                <code className="text-xs bg-muted px-2 py-1 rounded mt-2 inline-block">{queryResult.query}</code>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }

  if (!activeTable) {
    return (
      <Card className="flex-1 bg-gradient-card border-border flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="p-4 bg-muted/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
            <Database className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-foreground">No Table Selected</h3>
            <p className="text-muted-foreground">Choose a table from the sidebar to view details or run a query above</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex-1 bg-gradient-card border-border overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TableIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{activeTable.name}</h2>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm text-muted-foreground">
                  {activeTable.rowCount.toLocaleString()} rows
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="elegant" size="sm" disabled title="Coming soon">
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
        <div className="px-6 pt-4">
          <TabsList className="grid w-full grid-cols-4 bg-muted/20">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data
            </TabsTrigger>
            <TabsTrigger value="schema" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Schema
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Access
              <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground ml-1">Soon</Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="overview" className="p-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-background/50 border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{activeTable.rowCount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Rows</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-background/50 border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{columns.length}</p>
                    <p className="text-sm text-muted-foreground">Columns</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-background/50 border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-info/10 rounded-lg">
                    <HardDrive className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{estimatedTableSize}</p>
                    <p className="text-sm text-muted-foreground">Est. Size</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-background/50 border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <Shield className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">Public</p>
                    <p className="text-sm text-muted-foreground">Access</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-4 bg-background/30 border-border opacity-50">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-medium text-foreground">Recent Activity</h3>
                <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">Soon</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Table created</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">admin</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">5 days ago</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">8 new rows inserted</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">alice</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">2 hours ago</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Schema updated</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">bob</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">1 day ago</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Permissions modified</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">admin</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">3 days ago</span>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">Preview ({displayData.length} rows)</h3>
                <div className="flex gap-2">
                  <Input placeholder="Search..." className="w-64 bg-background/50" disabled title="Coming soon" />
                  <Button variant="outline" size="sm" disabled title="Coming soon">
                    <Plus className="h-4 w-4 mr-2" />
                    Insert Row
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-background/30 border-b border-border">
                      <tr>
                        {columns.map((column) => (
                          <th key={column.name} className="px-4 py-2 text-left text-sm font-medium text-foreground">
                            <div className="flex items-center gap-2">
                              {column.name}
                              {column.primary_key && (
                                <Badge variant="secondary" className="text-xs">PK</Badge>
                              )}
                            </div>
                          </th>
                        ))}
                        <th className="px-4 py-2 text-right text-sm font-medium text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingData ? (
                        <tr>
                          <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-muted-foreground">
                            Loading table data...
                          </td>
                        </tr>
                      ) : dataError ? (
                        <tr>
                          <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-destructive">
                            Error loading data: {dataError.message}
                          </td>
                        </tr>
                      ) : displayData.length === 0 ? (
                        <tr>
                          <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-muted-foreground">
                            No data available
                          </td>
                        </tr>
                      ) : (
                        displayData.map((row: string[], rowIndex: number) => (
                          <tr key={rowIndex} className="border-b border-border hover:bg-background/20 transition-colors">
                            {row.map((cellValue: string, colIndex: number) => (
                              <td key={colIndex} className="px-4 py-2 text-sm text-foreground">
                                {cellValue !== null ? String(cellValue) : 'NULL'}
                              </td>
                            ))}
                            <td className="px-4 py-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled title="Coming soon">
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled title="Coming soon">
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" disabled title="Coming soon">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schema" className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">Table Schema</h3>
                <Button variant="outline" size="sm" disabled title="Coming soon">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Column
                </Button>
              </div>

              <div className="space-y-2">
                {columns.map((column, index) => (
                  <Card key={index} className="p-4 bg-background/30 border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{column.name}</span>
                          {column.primary_key && (
                            <Badge variant="secondary" className="text-xs">Primary Key</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">{column.data_type}</Badge>
                          {column.not_null && (
                            <Badge variant="outline" className="text-xs">NOT NULL</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled title="Coming soon">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" disabled title="Coming soon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="p-6">
            <div className="space-y-6">
              <div className="opacity-50">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-medium text-foreground">Access Policies</h3>
                  <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">Soon</Badge>
                </div>
                <div className="space-y-2">
                  <Card className="p-4 bg-background/30 border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Read Policy</p>
                        <p className="text-sm text-muted-foreground">Control who can view table data</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Public</Badge>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 bg-background/30 border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Write Policy</p>
                        <p className="text-sm text-muted-foreground">Control who can modify table data</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Owner</Badge>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              <div className="opacity-50">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-medium text-foreground">Encryption</h3>
                  <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">Soon</Badge>
                </div>
                <Card className="p-4 bg-background/30 border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Key className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">VetKeys Encryption</p>
                        <p className="text-sm text-muted-foreground">Encrypt your data using vetKeys for enhanced security</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
}