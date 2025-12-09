import { useState } from "react";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, RotateCcw } from "lucide-react";

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSave: (productId: string, newStock: number, reason: string, adjustmentType: string) => void;
}

type AdjustmentMode = "set" | "add" | "subtract";

export function StockAdjustmentDialog({
  open,
  onOpenChange,
  product,
  onSave,
}: StockAdjustmentDialogProps) {
  const [mode, setMode] = useState<AdjustmentMode>("set");
  const [value, setValue] = useState(0);
  const [reason, setReason] = useState("");

  const currentStock = product?.stock || 0;

  const calculateNewStock = (): number => {
    switch (mode) {
      case "add":
        return currentStock + value;
      case "subtract":
        return Math.max(0, currentStock - value);
      case "set":
      default:
        return value;
    }
  };

  const newStock = calculateNewStock();
  const difference = newStock - currentStock;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const adjustmentType = mode === "set" ? "correction" : "manual";
    onSave(product.id, newStock, reason, adjustmentType);
    
    // Reset form
    setValue(0);
    setReason("");
    setMode("set");
    onOpenChange(false);
  };

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && product) {
      setValue(product.stock);
      setMode("set");
      setReason("");
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Penyesuaian Stok</DialogTitle>
          <DialogDescription>
            {product?.name}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Stok Saat Ini</span>
            <Badge variant="outline" className="text-lg font-bold">
              {currentStock} unit
            </Badge>
          </div>

          <div className="space-y-2">
            <Label>Tipe Penyesuaian</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={mode === "set" ? "default" : "outline"}
                onClick={() => setMode("set")}
                className="gap-1"
              >
                <RotateCcw className="h-4 w-4" />
                Set
              </Button>
              <Button
                type="button"
                variant={mode === "add" ? "default" : "outline"}
                onClick={() => setMode("add")}
                className="gap-1"
              >
                <ArrowUp className="h-4 w-4" />
                Tambah
              </Button>
              <Button
                type="button"
                variant={mode === "subtract" ? "default" : "outline"}
                onClick={() => setMode("subtract")}
                className="gap-1"
              >
                <ArrowDown className="h-4 w-4" />
                Kurang
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">
              {mode === "set" ? "Stok Baru" : mode === "add" ? "Jumlah Tambah" : "Jumlah Kurang"}
            </Label>
            <Input
              id="value"
              type="number"
              min="0"
              value={value || ""}
              onChange={(e) => setValue(Number(e.target.value))}
              required
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
            <span className="text-sm font-medium">Stok Setelah Penyesuaian</span>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-lg font-bold">
                {newStock} unit
              </Badge>
              {difference !== 0 && (
                <Badge variant={difference > 0 ? "secondary" : "destructive"} className="text-xs">
                  {difference > 0 ? `+${difference}` : difference}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Alasan Penyesuaian</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Stok opname bulanan, Produk rusak, dll."
              rows={2}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={difference === 0 || !reason.trim()}>
              Simpan Penyesuaian
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
