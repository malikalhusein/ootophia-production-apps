import { useEffect, useState, useMemo } from "react";
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
import { Card } from "@/components/ui/card";
import { calculateCostPerGram, calculateProductHPP, formatCurrency, calculateWeightForSale, calculateWeightAssignedToProducts } from "@/lib/calculations";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  lineups: Lineup[];
  products: Product[];
  onSave: (product: Product) => void;
}

export function ProductDialog({
  open,
  onOpenChange,
  product,
  lineups,
  products,
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
  const [customSellingPrice, setCustomSellingPrice] = useState<number | null>(null);

  useEffect(() => {
    if (product) {
      setFormData(product);
      setCustomSellingPrice(null);
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
      setCustomSellingPrice(null);
    }
  }, [product, lineups]);

  const selectedLineup = useMemo(
    () => lineups.find((l) => l.id === formData.lineupId),
    [lineups, formData.lineupId]
  );

  const costPerGram = useMemo(
    () => selectedLineup ? calculateCostPerGram(selectedLineup) : 0,
    [selectedLineup]
  );

  const beanCost = useMemo(
    () => (formData.netWeight || 0) * costPerGram,
    [formData.netWeight, costPerGram]
  );

  const totalHPP = useMemo(
    () => beanCost + (formData.packagingCost || 0) + (formData.labelCost || 0) + (formData.marketingCost || 0),
    [beanCost, formData.packagingCost, formData.labelCost, formData.marketingCost]
  );

  const calculatedSellingPrice = useMemo(
    () => totalHPP * (1 + (formData.marginPercentage || 0) / 100),
    [totalHPP, formData.marginPercentage]
  );

  const sellingPrice = customSellingPrice ?? calculatedSellingPrice;

  const actualMargin = useMemo(
    () => totalHPP > 0 ? ((sellingPrice - totalHPP) / totalHPP) * 100 : 0,
    [sellingPrice, totalHPP]
  );

  const availableBeans = useMemo(() => {
    if (!selectedLineup) return 0;
    const totalAvailable = calculateWeightForSale(selectedLineup);
    const assigned = calculateWeightAssignedToProducts(
      selectedLineup,
      products.filter(p => product ? p.id !== product.id : true)
    );
    return totalAvailable - assigned;
  }, [selectedLineup, products, product]);

  const requiredBeans = (formData.netWeight || 0) * (formData.stock || 0);
  const hasEnoughBeans = requiredBeans <= availableBeans;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate margin from custom selling price if set
    const finalMargin = customSellingPrice 
      ? ((customSellingPrice - totalHPP) / totalHPP) * 100
      : formData.marginPercentage || 0;
    
    onSave({
      id: product?.id || crypto.randomUUID(),
      name: formData.name!,
      lineupId: formData.lineupId!,
      netWeight: Number(formData.netWeight),
      packagingCost: Number(formData.packagingCost),
      labelCost: Number(formData.labelCost),
      marketingCost: Number(formData.marketingCost),
      marginPercentage: Number(finalMargin),
      stock: Number(formData.stock),
      stockThreshold: Number(formData.stockThreshold),
    });
  };

  const handleSellingPriceChange = (value: number) => {
    setCustomSellingPrice(value);
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
          {selectedLineup && (
            <Card className="p-4 bg-accent/10 border-accent space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Harga Biji per Gram</p>
                  <p className="text-lg font-bold text-accent">{formatCurrency(costPerGram)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Biaya Biji Produk Ini</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(beanCost)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total HPP</p>
                  <p className="text-lg font-bold">{formatCurrency(totalHPP)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Harga Jual</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(sellingPrice)}</p>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Beans Tersedia di Lineup</span>
                  <span className={`text-sm font-semibold ${hasEnoughBeans ? 'text-green-600' : 'text-destructive'}`}>
                    {availableBeans.toFixed(0)} g
                  </span>
                </div>
                {!hasEnoughBeans && requiredBeans > 0 && (
                  <Alert className="mt-2" variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Beans tidak cukup! Diperlukan: {requiredBeans.toFixed(0)} g
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </Card>
          )}
          
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
              <Label htmlFor="sellingPrice">Harga Jual (IDR)</Label>
              <Input
                id="sellingPrice"
                type="number"
                value={sellingPrice}
                onChange={(e) => handleSellingPriceChange(Number(e.target.value))}
                required
              />
              <p className="text-xs text-muted-foreground">
                Margin: {actualMargin.toFixed(1)}%
              </p>
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
