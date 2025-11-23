import { useEffect, useState } from "react";
import { Product, Lineup } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  lineups: Lineup[];
  onSave: (product: Product) => void;
}

export function ProductDialog({
  open,
  onOpenChange,
  product,
  lineups,
  onSave,
}: ProductDialogProps) {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    lineupId: "",
    netWeight: 0,
    packagingCost: 0,
    labelCost: 0,
    marketingCost: 0,
    marginPercentage: 0,
    stock: 0,
    stockThreshold: 10,
  });

  useEffect(() => {
    if (product) {
      setFormData(product);
    } else {
      setFormData({
        name: "",
        lineupId: lineups[0]?.id || "",
        netWeight: 0,
        packagingCost: 0,
        labelCost: 0,
        marketingCost: 0,
        marginPercentage: 0,
        stock: 0,
        stockThreshold: 10,
      });
    }
  }, [product, lineups]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: product?.id || crypto.randomUUID(),
      name: formData.name!,
      lineupId: formData.lineupId!,
      netWeight: Number(formData.netWeight),
      packagingCost: Number(formData.packagingCost),
      labelCost: Number(formData.labelCost),
      marketingCost: Number(formData.marketingCost),
      marginPercentage: Number(formData.marginPercentage),
      stock: Number(formData.stock),
      stockThreshold: Number(formData.stockThreshold),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? "Edit Product" : "Tambah Produk Baru"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Produk</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Ethiopia Yirgacheffe - 100g"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lineup">Lineup</Label>
              <Select
                value={formData.lineupId}
                onValueChange={(value) => setFormData({ ...formData, lineupId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lineup" />
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
            <div className="space-y-2">
              <Label htmlFor="netWeight">Berat Neto (g)</Label>
              <Input
                id="netWeight"
                type="number"
                step="0.1"
                value={formData.netWeight}
                onChange={(e) => setFormData({ ...formData, netWeight: Number(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="packagingCost">Biaya Kemasan (IDR)</Label>
              <Input
                id="packagingCost"
                type="number"
                value={formData.packagingCost}
                onChange={(e) => setFormData({ ...formData, packagingCost: Number(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="labelCost">Biaya Label (IDR)</Label>
              <Input
                id="labelCost"
                type="number"
                value={formData.labelCost}
                onChange={(e) => setFormData({ ...formData, labelCost: Number(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marketingCost">Biaya Marketing (IDR)</Label>
              <Input
                id="marketingCost"
                type="number"
                value={formData.marketingCost}
                onChange={(e) => setFormData({ ...formData, marketingCost: Number(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marginPercentage">Margin (%)</Label>
              <Input
                id="marginPercentage"
                type="number"
                step="0.1"
                value={formData.marginPercentage}
                onChange={(e) => setFormData({ ...formData, marginPercentage: Number(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stok</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockThreshold">Threshold Stok</Label>
              <Input
                id="stockThreshold"
                type="number"
                value={formData.stockThreshold}
                onChange={(e) => setFormData({ ...formData, stockThreshold: Number(e.target.value) })}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit">
              {product ? "Update" : "Tambah"} Produk
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
