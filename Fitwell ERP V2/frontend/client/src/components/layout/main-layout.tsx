import { Bell, Settings, LogOut, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import AppSidebar from "./app-sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { logout, isLoggingOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <main className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-4 sm:px-6 py-4" data-testid="header">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden"
                  data-testid="button-menu"
                >
                  <Menu className="w-5 h-5" />
                </Button>
                
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-2xl font-bold truncate" data-testid="page-title">
                    Manufacturing Dashboard
                  </h2>
                  <p className="text-muted-foreground text-sm hidden sm:block" data-testid="page-description">
                    Real-time overview of your production operations
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* <Button variant="ghost" size="icon" className="hidden sm:flex" data-testid="button-notifications">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="hidden sm:flex" data-testid="button-settings">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                </Button> */}
                
                {/* User Info */}
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="hidden sm:flex items-center space-x-2 px-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium truncate max-w-32" data-testid="user-name-display">
                      Admin
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => logout()}
                    disabled={isLoggingOut}
                    data-testid="button-logout"
                    title="Sign out"
                  >
                    <LogOut className="w-5 h-5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </div>
          </header>

        <div className="flex-1 p-4 sm:p-6 overflow-auto" data-testid="main-content">
          {children}
        </div>
      </main>
    </div>
  );
}
