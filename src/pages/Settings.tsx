import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const themes = [
  { value: "green", label: "Green", color: "hsl(145, 60%, 45%)" },
  { value: "blue", label: "Blue", color: "hsl(215, 65%, 50%)" },
  { value: "purple", label: "Purple", color: "hsl(270, 60%, 55%)" },
  { value: "orange", label: "Orange", color: "hsl(25, 75%, 50%)" },
] as const;

export default function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Theme Color</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label>Choose your primary color</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                  theme === t.value
                    ? "border-primary bg-primary-lighter"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div
                  className="w-12 h-12 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Backup and restore your data
          </p>
          <div className="flex gap-3">
            <Button variant="outline">Export Data</Button>
            <Button variant="outline">Import Data</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
