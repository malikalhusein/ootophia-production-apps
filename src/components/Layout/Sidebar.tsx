import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Calculator, 
  Package, 
  Receipt, 
  Settings,
  Coffee
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onNavigate?: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Cost Calculator", href: "/calculator", icon: Calculator },
  { name: "Products", href: "/products", icon: Package },
  { name: "Sales Journal", href: "/sales", icon: Receipt },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ onNavigate }: SidebarProps) {
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
      <div className="border-t border-sidebar-border px-6 py-4">
        <p className="text-xs text-muted-foreground">
          Production & Sales Management
        </p>
      </div>
    </div>
  );
}
