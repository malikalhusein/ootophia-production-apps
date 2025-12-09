import { useState, useEffect } from "react";
import { Transaction, Product, Lineup } from "@/types";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Transaksi</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Tanggal</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
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
                <SelectTrigger>
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

          {isRndOrPromo ? (
            <div className="space-y-2">
              <Label>Lineup / Batch</Label>
              <Select
                value={formData.lineupId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, lineupId: value }))}
              >
                <SelectTrigger>
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
            <div className="space-y-2">
              <Label>Produk</Label>
              <Select
                value={formData.productId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, productId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih produk" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="quantity">
              {isRndOrPromo ? "Jumlah (gram)" : "Kuantitas"}
            </Label>
            <Input
              id="quantity"
              type="number"
              step={isRndOrPromo ? "0.1" : "1"}
              value={formData.quantity || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, quantity: Number(e.target.value) }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Keterangan</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit">Simpan Perubahan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
