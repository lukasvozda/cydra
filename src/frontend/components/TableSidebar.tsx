import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Database, Table as TableIcon, Search, MoreHorizontal, RefreshCw } from "lucide-react";
import { useDatabaseInfo, useCanisterStats } from "@/hooks/useCanister";
import { UserSection } from "./UserSection";
interface Table {
  id: string;
  name: string;
  rowCount: number;
  lastModified: string;
  isActive?: boolean;
}
interface TableSidebarProps {
  onTableSelect: (table: Table) => void;
  activeTable?: Table;
}
export function TableSidebar({
  onTableSelect,
  activeTable
}: TableSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewTableForm, setShowNewTableForm] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  
  const { data: dbInfo, isLoading, error, refetch } = useDatabaseInfo();
  const { data: canisterStats, isLoading: statsLoading } = useCanisterStats();

  // Convert backend table info to our Table format
  const tables = useMemo(() => {
    if (!dbInfo?.tables) return [];
    
    return dbInfo.tables.map((table, index) => ({
      id: index.toString(),
      name: table.table_name,
      rowCount: Number(table.row_count),
      lastModified: "" // Backend doesn't provide this info yet
    }));
  }, [dbInfo]);

  const filteredTables = tables.filter(table => 
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateTable = () => {
    if (newTableName.trim()) {
      // This would create a table via SQL execution
      alert("Use the SQL editor to create a new table");
      setNewTableName("");
      setShowNewTableForm(false);
    }
  };

  const handleRefresh = () => {
    refetch();
    console.log("Database info refreshed");
  };
  return <div className="w-80 h-screen bg-gradient-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">CYDRA</h1>
              <p className="text-sm text-muted-foreground">
                {dbInfo ? `${dbInfo.total_tables} tables` : "Database Manager"}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tables..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-background/50 border-border focus:border-primary/50" />
        </div>
      </div>

      {/* Tables List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {error && (
          <Card className="p-3 border-destructive/20 bg-destructive/5">
            <p className="text-sm text-destructive">
              Failed to load database info. {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </Card>
        )}
        
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground">
            Tables ({filteredTables.length})
          </span>
          <Button variant="outline" size="sm" className="h-8" disabled title="Coming soon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* New Table Form */}
        {showNewTableForm && <Card className="p-3 bg-gradient-card border-border animate-fade-in">
            <div className="space-y-3">
              <Input placeholder="Table name..." value={newTableName} onChange={e => setNewTableName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateTable()} className="bg-background/50 border-border" autoFocus />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreateTable}>Create</Button>
                <Button variant="ghost" size="sm" onClick={() => {
              setShowNewTableForm(false);
              setNewTableName("");
            }}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>}

        {/* Table Items */}
        <div className="space-y-1">
          {filteredTables.map(table => <div key={table.id} onClick={() => onTableSelect(table)} className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/50 animate-slide-in ${activeTable?.id === table.id ? 'bg-primary/10 border border-primary/20' : 'hover:scale-105'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-md ${activeTable?.id === table.id ? 'bg-primary/20' : 'bg-muted'}`}>
                  <TableIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground truncate">
                      {table.name}
                    </h3>
                    {activeTable?.id === table.id && <Badge variant="secondary" className="text-xs">Active</Badge>}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {table.rowCount.toLocaleString()} rows
                    </span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" 
                  title="Coming soon" 
                  onClick={e => {
                    e.stopPropagation();
                  }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>)}
        </div>
      </div>

      {/* Database Info */}
      <div className="p-4 border-t border-border space-y-3">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Database Info</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Size:</span>
            <span className="text-xs text-foreground">
              {isLoading ? "Loading..." : dbInfo ? `${dbInfo.database_size_mb.toFixed(2)} MB` : "0 MB"}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Cycles:</span>
            <span className="text-xs text-foreground">
              {statsLoading ? "Loading..." : canisterStats ? 
                `${(Number(canisterStats.balance) / 1_000_000_000_000).toFixed(2)}T` : "0T"}
            </span>
          </div>
        </div>
      </div>

      {/* User Section */}
      <UserSection />
    </div>;
}