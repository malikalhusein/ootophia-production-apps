import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { mode, toggleMode } = useTheme();

  return (
    <header className="hidden lg:block border-b border-border bg-card">
      <div className="px-8 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMode}
          className="h-9 w-9"
        >
          {mode === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </header>
  );
}
