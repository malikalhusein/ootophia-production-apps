import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { useTransactions } from "@/hooks/useTransactions";
import { useProducts } from "@/hooks/useProducts";
import { useLineups } from "@/hooks/useLineups";
import { calculateCostPerGram, calculateProductHPP } from "@/lib/calculations";
import { toast } from "sonner";
import { RefreshCw, Database } from "lucide-react";

const themes = [
  { value: "green", label: "Green", color: "hsl(145, 60%, 45%)" },
  { value: "blue", label: "Blue", color: "hsl(215, 65%, 50%)" },
  { value: "purple", label: "Purple", color: "hsl(270, 60%, 55%)" },
  { value: "orange", label: "Orange", color: "hsl(25, 75%, 50%)" },
] as const;

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { transactions, updateTransaction } = useTransactions();
  const { products } = useProducts();
  const { lineups } = useLineups();
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Count transactions with zero totalValue that have productId
  const zeroValueTransactions = transactions.filter(
    t => t.totalValue === 0 && t.productId && t.status === "sale"
  );

  const handleRecalculateTransactions = async () => {
    if (zeroValueTransactions.length === 0) {
      toast.info("Tidak ada transaksi yang perlu di-recalculate");
      return;
    }

    setIsRecalculating(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const transaction of zeroValueTransactions) {
        if (!transaction.productId) continue;

        const product = products.find(p => p.id === transaction.productId);
        if (!product) {
          errorCount++;
          continue;
        }

        const lineup = lineups.find(l => l.id === product.lineupId);
        if (!lineup) {
          errorCount++;
          continue;
        }

        const costPerGram = calculateCostPerGram(lineup);
        const { sellingPrice } = calculateProductHPP(product, costPerGram);
        const newTotalValue = sellingPrice * transaction.quantity;

        try {
          await updateTransaction({
            id: transaction.id,
            updates: { totalValue: newTotalValue }
          });
          successCount++;
        } catch (err) {
          console.error("Error updating transaction:", err);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} transaksi berhasil di-recalculate`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} transaksi gagal di-recalculate`);
      }
    } finally {
      setIsRecalculating(false);
    }
  };

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
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Backup and restore your data
            </p>
            <div className="flex gap-3">
              <Button variant="outline">Export Data</Button>
              <Button variant="outline">Import Data</Button>
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Recalculate Transaksi Lama</p>
                <p className="text-xs text-muted-foreground">
                  Update nilai transaksi produk yang memiliki total_value = 0 berdasarkan HPP saat ini
                </p>
              </div>
              {zeroValueTransactions.length > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  {zeroValueTransactions.length} transaksi
                </span>
              )}
            </div>
            <Button
              variant="outline"
              onClick={handleRecalculateTransactions}
              disabled={isRecalculating || zeroValueTransactions.length === 0}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isRecalculating && "animate-spin")} />
              {isRecalculating ? "Memproses..." : "Recalculate"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
