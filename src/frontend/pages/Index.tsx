import { useState } from "react";
import { TableSidebar } from "@/components/TableSidebar";
import { SqlEditor } from "@/components/SqlEditor";
import { DatabasePanel } from "@/components/DatabasePanel";

interface Table {
  id: string;
  name: string;
  rowCount: number;
  lastModified: string;
}

const Index = () => {
  const [activeTable, setActiveTable] = useState<Table | undefined>();
  const [queryResult, setQueryResult] = useState<{
    data: any;
    query: string;
    duration: number;
    timestamp: Date;
    status: 'success' | 'error';
  } | null>(null);

  const handleTableSelect = (table: Table) => {
    setActiveTable(table);
    // Clear query results when selecting a table
    setQueryResult(null);
  };

  const handleQueryResult = (result: typeof queryResult) => {
    setQueryResult(result);
    // Clear active table when showing query results
    if (result) {
      setActiveTable(undefined);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar */}
      <TableSidebar 
        onTableSelect={handleTableSelect}
        activeTable={activeTable}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col p-6 gap-6">
        {/* SQL Editor */}
        <SqlEditor 
          activeTable={activeTable} 
          onQueryResult={handleQueryResult}
        />
        
        {/* Database Details Panel */}
        <DatabasePanel 
          activeTable={activeTable} 
          queryResult={queryResult}
        />
      </div>
    </div>
  );
};

export default Index;
