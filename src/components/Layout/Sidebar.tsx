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
  BarChart3,
  FileText,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useUserRole, AppRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  onNavigate?: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: AppRole[]; // Which roles can access this menu
}

const navigation: NavItem[] = [
  { 
    name: "Dashboard", 
    href: "/", 
    icon: LayoutDashboard,
    roles: ["admin", "sales", "reseller"]
  },
  { 
    name: "Production Cost", 
    href: "/cost-calculator", 
    icon: Calculator,
    roles: ["admin"] // Only admin can access production costs
  },
  { 
    name: "Products", 
    href: "/products", 
    icon: Package,
    roles: ["admin", "sales"] // Admin and Sales can manage products
  },
  { 
    name: "Sales Journal", 
    href: "/sales-journal", 
    icon: Receipt,
    roles: ["admin", "sales", "reseller"] // All roles can access sales
  },
  { 
    name: "Profitability", 
    href: "/batch-profitability", 
    icon: BarChart3,
    roles: ["admin"] // Only admin can see profitability
  },
  { 
    name: "Riwayat Invoice", 
    href: "/invoice-history", 
    icon: FileText,
    roles: ["admin", "sales"]
  },
  { 
    name: "Pelanggan", 
    href: "/customers", 
    icon: Users,
    roles: ["admin", "sales", "reseller"]
  },
  { 
    name: "Settings", 
    href: "/settings", 
    icon: Settings,
    roles: ["admin", "sales", "reseller"]
  },
];

const roleLabels: Record<AppRole, { label: string; color: string }> = {
  admin: { label: "Admin", color: "bg-red-500/10 text-red-600" },
  sales: { label: "Sales", color: "bg-blue-500/10 text-blue-600" },
  reseller: { label: "Reseller", color: "bg-green-500/10 text-green-600" },
};

export function Sidebar({ onNavigate }: SidebarProps) {
  const { signOut } = useAuth();
  const { mode, toggleMode } = useTheme();
  const { role, isLoading } = useUserRole();

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(item => 
    role && item.roles.includes(role)
  );
  
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

      {/* Role Badge */}
      {role && !isLoading && (
        <div className="px-4 py-2 border-b border-sidebar-border">
          <Badge className={cn("w-full justify-center", roleLabels[role].color)}>
            {roleLabels[role].label}
          </Badge>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNavigation.map((item) => (
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
