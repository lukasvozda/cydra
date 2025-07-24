import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, LogIn, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function LoginOverlay() {
  const { login, isLoading } = useAuth();

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="p-8 bg-gradient-card border-border shadow-2xl">
          {/* Logo and Branding */}
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-2 bg-primary/10 rounded-2xl">
                <img 
                  src="/purple_cydra.png" 
                  alt="Cydra Logo" 
                  className="h-14"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                Welcome to Cydra
              </h1>
              <p className="text-muted-foreground">
                ICP cloud SQL platform
              </p>
              <p className="text-sm text-muted-foreground">
              The application allows users to create databases, manage tables, upload data (soon) and query data through a modern web interface.
              </p>
            </div>
          </div>

          {/* Authentication Section */}
          <div className="mt-8 space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Sign in to access your databases and manage your data
              </p>
            </div>

            <Button 
              onClick={login}
              disabled={isLoading}
              className="w-full h-12 text-base font-medium hover:scale-[1.02] transition-transform duration-200"
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Connecting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  Sign in with Internet Identity
                </div>
              )}
            </Button>

            {/* Info Section */}
            <div className="mt-6 p-4 bg-muted/20 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-info/10 rounded-md">
                  <Shield className="h-4 w-4 text-info" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Secure & Decentralized
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Your authentication is handled by Internet Identity on the Internet Computer Protocol. 
                    No passwords, just cryptographic security.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Powered by{" "}
              <span className="font-medium text-primary">Internet Computer Protocol</span>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}