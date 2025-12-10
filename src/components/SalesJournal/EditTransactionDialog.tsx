import { useState, useEffect } from "react";
import { Transaction, Product, Lineup } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Tag, Package, FileText, Hash } from "lucide-react";

interface EditTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  products: Product[];
  lineups: Lineup[];
  onSave: (transaction: Transaction) => void;
}

type TransactionStatus = "sale" | "promo" | "rnd" | "bonus";

const statusMap: Record<TransactionStatus, string> = {
  sale: "Penjualan",
  promo: "Promosi",
  rnd: "RnD",
  bonus: "Bonus",
};

export function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
  products,
  lineups,
  onSave,
}: EditTransactionDialogProps) {
  const [formData, setFormData] = useState({
    date: "",
    status: "sale" as TransactionStatus,
    productId: "",
    lineupId: "",
    quantity: 0,
    description: "",
  });

  useEffect(() => {
    if (transaction) {
      setFormData({
        date: transaction.date,
        status: transaction.status,
        productId: transaction.productId || "",
        lineupId: transaction.lineupId || "",
        quantity: transaction.quantity,
        description: transaction.description || "",
      });
    }
  }, [transaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;

    const isRndOrPromo = formData.status === "rnd" || formData.status === "promo";

    onSave({
      ...transaction,
      date: formData.date,
      status: formData.status,
      productId: isRndOrPromo ? undefined : formData.productId || undefined,
      lineupId: isRndOrPromo ? formData.lineupId || undefined : undefined,
      quantity: formData.quantity,
      description: formData.description,
    });
  };

  const isRndOrPromo = formData.status === "rnd" || formData.status === "promo";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Edit Transaksi
          </DialogTitle>
          <DialogDescription>
            Ubah detail transaksi. Perubahan akan dikonfirmasi sebelum disimpan.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Date and Status */}
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Tanggal
              </Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                required
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: value as TransactionStatus,
                    productId: "",
                    lineupId: "",
                  }))
                }
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusMap).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Product/Lineup Selection */}
          {isRndOrPromo ? (
            <div className="space-y-2 p-4 rounded-lg bg-muted/50 border">
              <Label className="text-sm font-medium">Lineup / Batch</Label>
              <Select
                value={formData.lineupId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, lineupId: value }))}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Pilih lineup" />
                </SelectTrigger>
                <SelectContent>
                  {lineups.map((lineup) => (
                    <SelectItem key={lineup.id} value={lineup.id}>
                      {lineup.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2 p-4 rounded-lg bg-muted/50 border">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                Produk
              </Label>
              <Select
                value={formData.productId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, productId: value }))}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Pilih produk" />
                </SelectTrigger>
                <SelectContent>
                  {lineups.map((lineup) => {
                    const lineupProducts = products.filter(p => p.lineupId === lineup.id);
                    if (lineupProducts.length === 0) return null;
                    return (
                      <SelectGroup key={lineup.id}>
                        <SelectLabel className="text-xs">{lineup.name}</SelectLabel>
                        {lineupProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            <div className="flex items-center justify-between gap-2">
                              <span>{product.name}</span>
                              <Badge variant="outline" className="text-[10px]">
                                Stok: {product.stock}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              {isRndOrPromo ? "Jumlah (gram)" : "Kuantitas"}
            </Label>
            <Input
              type="number"
              step={isRndOrPromo ? "0.1" : "1"}
              value={formData.quantity || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, quantity: Number(e.target.value) }))
              }
              required
              className="h-10"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Keterangan
            </Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={2}
              placeholder="Tambahkan keterangan..."
              className="resize-none"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit">Lanjutkan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
