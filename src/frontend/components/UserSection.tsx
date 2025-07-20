import { Button } from "@/components/ui/button";
import { User, LogOut, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function UserSection() {
  const { isAuthenticated, principal, login, logout, isLoading } = useAuth();

  const formatPrincipal = (principal: string) => {
    if (principal.length <= 12) return principal;
    return `${principal.slice(0, 6)}...${principal.slice(-6)}`;
  };

  if (isLoading) {
    return (
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-border">
      <div className="space-y-2">
        {isAuthenticated ? (
          <>
            <div className="flex items-center gap-3 p-2 bg-primary/5 rounded-lg">
              <div className="p-1.5 bg-primary/20 rounded-md">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground">
                  Authenticated
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {principal ? formatPrincipal(principal) : 'Unknown'}
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={logout}
              disabled={isLoading}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={login}
            disabled={isLoading}
          >
            <LogIn className="h-4 w-4 mr-2" />
            Sign In with Internet Identity
          </Button>
        )}
      </div>
    </div>
  );
}