import { useState, useRef } from "react";
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
import { RefreshCw, Database, Download, Upload, AlertTriangle, Trash2 } from "lucide-react";
import { exportAllData, downloadAsJson, importData, clearAllData, ArchiveData } from "@/lib/dataArchive";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportAllData();
      const date = new Date().toISOString().split("T")[0];
      downloadAsJson(data, `coffee-business-backup-${date}.json`);
      toast.success("Data berhasil di-export!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Gagal export data: " + (error as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data: ArchiveData = JSON.parse(text);
      
      const result = await importData(data);
      if (result.success) {
        toast.success(result.message);
        // Reload page to refresh all data
        window.location.reload();
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Gagal import data: " + (error as Error).message);
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClearData = async () => {
    setIsClearing(true);
    try {
      await clearAllData();
      toast.success("Semua data berhasil dihapus!");
      window.location.reload();
    } catch (error) {
      console.error("Clear data error:", error);
      toast.error("Gagal menghapus data: " + (error as Error).message);
    } finally {
      setIsClearing(false);
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
        <CardContent className="space-y-6">
          {/* Export/Import Section */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">Backup & Restore</p>
              <p className="text-xs text-muted-foreground">
                Export semua data untuk arsip atau import data dari backup sebelumnya
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="outline" 
                onClick={handleExport}
                disabled={isExporting}
                className="gap-2"
              >
                <Download className={cn("h-4 w-4", isExporting && "animate-pulse")} />
                {isExporting ? "Exporting..." : "Export Data"}
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="gap-2" disabled={isImporting}>
                    <Upload className={cn("h-4 w-4", isImporting && "animate-pulse")} />
                    {isImporting ? "Importing..." : "Import Data"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Import Data dari Backup
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p>
                        Import akan <strong>menghapus semua data yang ada</strong> dan menggantinya dengan data dari file backup.
                      </p>
                      <p className="text-amber-600 dark:text-amber-400">
                        Pastikan Anda sudah export data saat ini sebelum melanjutkan!
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleImportClick}>
                      Pilih File Backup
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg space-y-1">
              <p><strong>Export mencakup:</strong></p>
              <p>• {lineups.length} batch produksi</p>
              <p>• {products.length} produk</p>
              <p>• {transactions.length} transaksi</p>
            </div>
          </div>

          {/* Clear Data Section */}
          <div className="border-t pt-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-destructive">Reset Data</p>
              <p className="text-xs text-muted-foreground">
                Hapus semua data untuk memulai dari awal (batch baru, stock opname, dll)
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2" disabled={isClearing}>
                  <Trash2 className={cn("h-4 w-4", isClearing && "animate-spin")} />
                  {isClearing ? "Menghapus..." : "Hapus Semua Data"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Hapus Semua Data?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>
                      Tindakan ini akan <strong>menghapus semua data secara permanen</strong>:
                    </p>
                    <ul className="list-disc list-inside text-sm">
                      <li>Semua batch produksi dan roast logs</li>
                      <li>Semua produk dan stok</li>
                      <li>Semua transaksi dan invoice</li>
                      <li>Semua data pelanggan</li>
                    </ul>
                    <p className="text-destructive font-medium">
                      Data yang dihapus tidak dapat dikembalikan!
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearData}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Ya, Hapus Semua
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Recalculate Section */}
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
