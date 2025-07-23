import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LoginOverlay } from "@/components/LoginOverlay";
import { Loader2 } from "lucide-react";

interface ProtectedAppProps {
  children: ReactNode;
}

export function ProtectedApp({ children }: ProtectedAppProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner during initial authentication check
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // Always render the app content, but show overlay if not authenticated
  return (
    <>
      {children}
      {!isAuthenticated && <LoginOverlay />}
    </>
  );
}