import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Calculator, 
  Package, 
  Receipt, 
  Settings,
  Coffee,
  LogOut,
  Moon,
  Sun,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  onNavigate?: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Cost Calculator", href: "/cost-calculator", icon: Calculator },
  { name: "Products", href: "/products", icon: Package },
  { name: "Sales Journal", href: "/sales-journal", icon: Receipt },
  { name: "Profitability", href: "/batch-profitability", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ onNavigate }: SidebarProps) {
  const { signOut } = useAuth();
  const { mode, toggleMode } = useTheme();
  
  return (
    <div className="flex h-full flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <Coffee className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-sidebar-foreground">
            Ootophia
          </span>
          <span className="text-xs text-muted-foreground">Brewing Labs</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-3 py-4 space-y-2">
        <Button
          variant="ghost"
          onClick={toggleMode}
          className="w-full justify-start gap-3 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          {mode === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
          {mode === "dark" ? "Light Mode" : "Dark Mode"}
        </Button>
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start gap-3 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </Button>
        <p className="text-xs text-muted-foreground px-3">
          Production & Sales Management
        </p>
      </div>
    </div>
  );
}
