import { useState } from "react";
import { useTableData } from "@/hooks/useCanister";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Table as TableIcon, 
  Users, 
  Database, 
  Shield, 
  Plus,
  Edit3,
  Trash2,
  Eye,
  Copy,
  Settings,
  Info,
  BarChart3,
  AlertCircle
} from "lucide-react";

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey?: boolean;
}

interface DatabasePanelProps {
  activeTable?: {
    id: string;
    name: string;
    rowCount: number;
    lastModified: string;
  };
  queryResult?: {
    data: any;
    query: string;
    duration: number;
    timestamp: Date;
    status: 'success' | 'error';
  } | null;
}

export function DatabasePanel({ activeTable, queryResult }: DatabasePanelProps) {
  const [selectedTab, setSelectedTab] = useState("overview");
  
  // Get real table data from backend
  const { data: tableData, isLoading: isLoadingData, error: dataError } = useTableData(activeTable?.name);

  // Sample columns for now - in a real app, this would come from schema info
  const columns: Column[] = [
    { name: "id", type: "INTEGER", nullable: false, isPrimaryKey: true },
    { name: "name", type: "TEXT", nullable: false },
    { name: "age", type: "INTEGER", nullable: true },
    { name: "gender", type: "INTEGER", nullable: true },
  ];

  // Use real data from backend or empty array
  const displayData = tableData || [];

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
          ) : queryResult.data && Array.isArray(queryResult.data) && queryResult.data.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">Results ({queryResult.data.length} rows)</h3>
                <code className="text-xs bg-muted px-2 py-1 rounded">{queryResult.query}</code>
              </div>
              
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-background/30 border-b border-border">
                      <tr>
                        {queryResult.data[0] && queryResult.data[0].map((_: any, colIndex: number) => (
                          <th key={colIndex} className="px-4 py-3 text-left text-sm font-medium text-foreground">
                            Column {colIndex + 1}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.data.map((row: any[], rowIndex: number) => (
                        <tr key={rowIndex} className="border-b border-border hover:bg-background/20 transition-colors">
                          {row.map((cellValue: any, colIndex: number) => (
                            <td key={colIndex} className="px-4 py-3 text-sm text-foreground">
                              {cellValue !== null && cellValue !== undefined ? String(cellValue) : 'NULL'}
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
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">
                  Updated {activeTable.lastModified}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="elegant" size="sm">
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
                    <Users className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">2.4MB</p>
                    <p className="text-sm text-muted-foreground">Size</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-background/50 border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <Shield className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">RLS</p>
                    <p className="text-sm text-muted-foreground">Enabled</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-4 bg-background/30 border-border">
              <h3 className="font-medium text-foreground mb-3">Recent Activity</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">8 new rows inserted</span>
                  <span className="text-xs text-muted-foreground">2 hours ago</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Schema updated</span>
                  <span className="text-xs text-muted-foreground">1 day ago</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Permissions modified</span>
                  <span className="text-xs text-muted-foreground">3 days ago</span>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">Table Data</h3>
                <div className="flex gap-2">
                  <Input placeholder="Search..." className="w-64 bg-background/50" />
                  <Button variant="outline" size="sm">
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
                          <th key={column.name} className="px-4 py-3 text-left text-sm font-medium text-foreground">
                            <div className="flex items-center gap-2">
                              {column.name}
                              {column.isPrimaryKey && (
                                <Badge variant="secondary" className="text-xs">PK</Badge>
                              )}
                            </div>
                          </th>
                        ))}
                        <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Actions</th>
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
                        displayData.map((row, rowIndex) => (
                          <tr key={rowIndex} className="border-b border-border hover:bg-background/20 transition-colors">
                            {row.map((cellValue, colIndex) => (
                              <td key={colIndex} className="px-4 py-3 text-sm text-foreground">
                                {cellValue !== null ? String(cellValue) : 'NULL'}
                              </td>
                            ))}
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
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
                <Button variant="outline" size="sm">
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
                          {column.isPrimaryKey && (
                            <Badge variant="secondary" className="text-xs">Primary Key</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">{column.type}</Badge>
                          {!column.nullable && (
                            <Badge variant="outline" className="text-xs">NOT NULL</Badge>
                          )}
                          {column.defaultValue && (
                            <span className="text-xs">Default: {column.defaultValue}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
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
              <div>
                <h3 className="font-medium text-foreground mb-3">Row Level Security</h3>
                <Card className="p-4 bg-background/30 border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">RLS Enabled</p>
                      <p className="text-sm text-muted-foreground">All queries will be filtered by user policies</p>
                    </div>
                    <Badge variant="secondary" className="bg-success/10 text-success">Active</Badge>
                  </div>
                </Card>
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-3">Access Policies</h3>
                <div className="space-y-2">
                  <Card className="p-4 bg-background/30 border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Select Policy</p>
                        <p className="text-sm text-muted-foreground">Users can view their own records</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">authenticated</Badge>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 bg-background/30 border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Insert Policy</p>
                        <p className="text-sm text-muted-foreground">Users can create records</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">authenticated</Badge>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
}