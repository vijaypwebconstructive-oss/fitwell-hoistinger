import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Factory, LayoutDashboard, Package, Users, Hammer, ShoppingCart, Warehouse, Calendar, BarChart3, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Products", href: "/products", icon: Package },
  { name: "Parties", href: "/parties", icon: Users },
  { name: "Production", href: "/production", icon: Hammer },
  { name: "Sales Orders", href: "/sales", icon: ShoppingCart },
  { name: "Inventory", href: "/inventory", icon: Warehouse },
  { name: "Planning", href: "/planning", icon: Calendar },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

interface AppSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AppSidebar({ isOpen = true, onClose }: AppSidebarProps) {
  const [location] = useLocation();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border sidebar-transition",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Factory className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">Fitwell ERP</h1>
          </div>
          
          {/* Mobile Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden"
            data-testid="button-close-sidebar"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <nav className="px-4 space-y-1" data-testid="sidebar-navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href === "/dashboard" && location === "/");
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose} // Close mobile menu when navigating
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                data-testid={`nav-link-${item.name.toLowerCase().replace(' ', '-')}`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
