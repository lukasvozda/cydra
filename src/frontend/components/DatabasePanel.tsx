import { useState, useMemo } from "react";
import { useDatabaseInfo, usePaginatedQuery } from "@/hooks/useCanister";
import { Pagination } from "@/components/Pagination";
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
  Key,
  Eye,
  Zap
} from "lucide-react";


interface DatabasePanelProps {
  activeTable?: {
    id: string;
    name: string;
    rowCount: number;
    lastModified: string;
  };
  queryResult?: {
    data: { columns: string[]; data: string[][] } | { columns: string[]; data: string[][]; total_count: number; page: number; page_size: number; has_more: boolean; } | null;
    query: string;
    duration: number;
    timestamp: Date;
    status: 'success' | 'error';
    isPaginated?: boolean;
    executionMode?: 'query' | 'update';
    cyclesCost?: bigint;
    usdCost?: number;
    errorMessage?: string;
  } | null;
}

export function DatabasePanel({ activeTable, queryResult }: DatabasePanelProps) {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // Pagination state for query results
  const [queryPageSize, setQueryPageSize] = useState(10);
  const [queryCurrentPage, setQueryCurrentPage] = useState(0);
  
  // Get database info to access real schema and preview data
  const { data: dbInfo } = useDatabaseInfo();
  
  // Paginated query for table data
  const tableQuery = activeTable ? `SELECT * FROM ${activeTable.name}` : "";
  const { 
    data: paginatedData, 
    isLoading: isPaginatedLoading, 
    error: paginatedError 
  } = usePaginatedQuery(tableQuery, currentPage, pageSize, !!activeTable && selectedTab === "data");
  
  // Paginated query for query results when needed
  const { 
    data: queryPaginatedData, 
    isLoading: isQueryPaginatedLoading 
  } = usePaginatedQuery(
    queryResult?.query || "", 
    queryCurrentPage, 
    queryPageSize, 
    !!(queryResult?.isPaginated && (queryCurrentPage > 0 || (queryResult.data && 'page_size' in queryResult.data && queryPageSize !== queryResult.data.page_size))) // Fetch when navigating pages or when page size differs from original
  );

  // Get real columns and preview data from database info for the active table
  const { columns, previewData } = useMemo(() => {
    if (!activeTable || !dbInfo) return { columns: [], previewData: [] };
    
    const tableInfo = dbInfo.tables.find(table => table.table_name === activeTable.name);
    return {
      columns: tableInfo?.schema || [],
      previewData: tableInfo?.preview_data || []
    };
  }, [activeTable, dbInfo]);

  // Use paginated data for display when available, fallback to preview data
  const displayData = (paginatedData?.data as string[][]) || previewData;
  const displayColumns = (paginatedData?.columns as string[]) || columns.map(col => col.name);


  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setCurrentPage(0); // Reset to first page when page size changes
    setPageSize(newPageSize);
  };

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
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-semibold text-foreground">Query Results</h2>
                  {queryResult.executionMode && (
                    <Badge variant="outline" className="text-xs">
                      {queryResult.executionMode === 'update' ? (
                        <><Zap className="h-3 w-3 mr-1" />Update Call</>
                      ) : (
                        <><Eye className="h-3 w-3 mr-1" />Query Call</>
                      )}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-muted-foreground">
                    Executed at {queryResult.timestamp.toLocaleTimeString()}
                  </span>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">
                    {queryResult.duration}ms
                  </span>
                  {queryResult.cyclesCost !== undefined && queryResult.usdCost !== undefined && (
                    <>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">
                        {queryResult.cyclesCost.toLocaleString()} cycles
                      </span>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">
                        ${queryResult.usdCost.toFixed(6)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Badge variant={queryResult.status === 'success' ? 'default' : 'destructive'}>
              {queryResult.status}
            </Badge>
          </div>
        </div>

        {/* Query Results Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            {queryResult.status === 'error' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground">Error Details</h3>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{queryResult.query}</code>
                </div>
                
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-destructive mb-2">Query Failed</h4>
                      <pre className="text-sm text-foreground whitespace-pre-wrap break-words font-mono bg-background/50 p-3 rounded border">
                        {queryResult.errorMessage || 'There was an error executing your query'}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            ) : queryResult.data && queryResult.data.data && Array.isArray(queryResult.data.data) && queryResult.data.data.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground">
                    Results ({(() => {
                      // Show the actual displayed data length
                      const displayData = queryCurrentPage === 0 && queryResult.data && 'page_size' in queryResult.data && queryPageSize === queryResult.data.page_size 
                        ? queryResult.data.data 
                        : queryPaginatedData?.data || [];
                      return displayData.length;
                    })()} rows
                    {queryResult.isPaginated && 'total_count' in queryResult.data && (
                      <span className="text-muted-foreground"> of {Number(queryResult.data.total_count).toLocaleString()} total</span>
                    )})
                  </h3>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{queryResult.query}</code>
                </div>
                
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-background/30 border-b border-border">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-foreground w-16">
                            #
                          </th>
                          {queryResult.data.columns.map((columnName: string, colIndex: number) => (
                            <th key={colIndex} className="px-4 py-2 text-left text-sm font-medium text-foreground">
                              {columnName}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Show current query result or paginated data */}
                        {(queryCurrentPage === 0 && queryResult.data && 'page_size' in queryResult.data && queryPageSize === queryResult.data.page_size ? queryResult.data.data : queryPaginatedData?.data || []).map((row: string[], rowIndex: number) => {
                          const actualRowNumber = queryCurrentPage * queryPageSize + rowIndex + 1;
                          return (
                            <tr key={rowIndex} className="border-b border-border hover:bg-background/20 transition-colors">
                              <td className="px-4 py-2 text-sm text-muted-foreground w-16">
                                {actualRowNumber}
                              </td>
                              {row.map((cellValue: string, colIndex: number) => (
                                <td key={colIndex} className="px-4 py-2 text-sm text-foreground">
                                  {cellValue !== null && cellValue !== undefined && cellValue !== "" ? String(cellValue) : 'NULL'}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
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
          
          {/* Pagination for query results */}
          {queryResult.isPaginated && queryResult.data && 'total_count' in queryResult.data && (
            <Pagination
              currentPage={queryCurrentPage}
              pageSize={queryPageSize}
              totalCount={Number(queryResult.data.total_count)}
              hasMore={queryResult.data.has_more || false}
              onPageChange={setQueryCurrentPage}
              onPageSizeChange={(newSize) => {
                setQueryPageSize(newSize);
                setQueryCurrentPage(0);
              }}
              isLoading={isQueryPaginatedLoading}
            />
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

          <TabsContent value="data" className="p-0 flex flex-col h-full">
            <div className="p-6 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-foreground">
                  Table Data
                  {paginatedData && (
                    <span className="text-sm text-muted-foreground ml-2">
                      ({Number(paginatedData.total_count || 0).toLocaleString()} total rows)
                    </span>
                  )}
                </h3>
                <div className="flex gap-2">
                  <Input placeholder="Search..." className="w-64 bg-background/50" disabled title="Coming soon" />
                  <Button variant="outline" size="sm" disabled title="Coming soon">
                    <Plus className="h-4 w-4 mr-2" />
                    Insert Row
                  </Button>
                </div>
              </div>

              <div className="flex-1 rounded-lg border border-border overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto">
                  <table className="w-full">
                    <thead className="bg-background/30 border-b border-border sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-foreground w-16">
                          #
                        </th>
                        {displayColumns.map((columnName: string, index: number) => {
                          const columnInfo = columns.find(col => col.name === columnName);
                          return (
                            <th key={index} className="px-4 py-2 text-left text-sm font-medium text-foreground">
                              <div className="flex items-center gap-2">
                                {columnName}
                                {columnInfo?.primary_key && (
                                  <Badge variant="secondary" className="text-xs">PK</Badge>
                                )}
                              </div>
                            </th>
                          );
                        })}
                        <th className="px-4 py-2 text-right text-sm font-medium text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isPaginatedLoading ? (
                        <tr>
                          <td colSpan={displayColumns.length + 2} className="px-4 py-8 text-center text-muted-foreground">
                            Loading table data...
                          </td>
                        </tr>
                      ) : paginatedError ? (
                        <tr>
                          <td colSpan={displayColumns.length + 2} className="px-4 py-8 text-center text-destructive">
                            Error loading data: {paginatedError.message}
                          </td>
                        </tr>
                      ) : displayData.length === 0 ? (
                        <tr>
                          <td colSpan={displayColumns.length + 2} className="px-4 py-8 text-center text-muted-foreground">
                            No data available
                          </td>
                        </tr>
                      ) : (
                        displayData.map((row: string[], rowIndex: number) => {
                          const actualRowNumber = currentPage * pageSize + rowIndex + 1;
                          return (
                            <tr key={rowIndex} className="border-b border-border hover:bg-background/20 transition-colors">
                              <td className="px-4 py-2 text-sm text-muted-foreground w-16">
                                {actualRowNumber}
                              </td>
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
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination Component */}
                {paginatedData && (
                  <Pagination
                    currentPage={currentPage}
                    pageSize={pageSize}
                    totalCount={Number(paginatedData.total_count || 0)}
                    hasMore={paginatedData.has_more || false}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    isLoading={isPaginatedLoading}
                  />
                )}
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