import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from "lucide-react";
import { useState } from "react";

interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  isLoading?: boolean;
}

export function Pagination({
  currentPage,
  pageSize,
  totalCount,
  hasMore,
  onPageChange,
  onPageSizeChange,
  isLoading = false
}: PaginationProps) {
  const [jumpToPage, setJumpToPage] = useState<string>("");
  
  const totalPages = Math.ceil(Number(totalCount) / pageSize);
  const startRow = currentPage * pageSize + 1;
  const endRow = Math.min((currentPage + 1) * pageSize, Number(totalCount));
  
  const handleJumpToPage = () => {
    const pageNumber = parseInt(jumpToPage) - 1; // Convert to 0-based
    if (pageNumber >= 0 && pageNumber < totalPages) {
      onPageChange(pageNumber);
      setJumpToPage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJumpToPage();
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-background/10">
      {/* Left side - Row info and page size selector */}
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          Showing {startRow.toLocaleString()}-{endRow.toLocaleString()} of {Number(totalCount).toLocaleString()} rows
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select 
            value={pageSize.toString()} 
            onValueChange={(value) => onPageSizeChange(parseInt(value))}
            disabled={isLoading}
          >
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Right side - Navigation controls */}
      <div className="flex items-center gap-2">
        {/* Jump to page */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Page:</span>
          <Input
            type="number"
            min="1"
            max={totalPages}
            placeholder={(currentPage + 1).toString()}
            value={jumpToPage}
            onChange={(e) => setJumpToPage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-16 h-8 text-center"
            disabled={isLoading}
          />
          <span className="text-sm text-muted-foreground">of {totalPages}</span>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(0)}
            disabled={currentPage === 0 || isLoading}
            className="h-8 w-8 p-0"
            title="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0 || isLoading}
            className="h-8 w-8 p-0"
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasMore || isLoading}
            className="h-8 w-8 p-0"
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages - 1)}
            disabled={currentPage === totalPages - 1 || !hasMore || isLoading}
            className="h-8 w-8 p-0"
            title="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}