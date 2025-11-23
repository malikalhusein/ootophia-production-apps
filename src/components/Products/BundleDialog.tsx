import { useEffect, useState } from "react";
import { Bundle, Product } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface BundleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bundle: Bundle | null;
  products: Product[];
  onSave: (bundle: Bundle) => void;
}

export function BundleDialog({
  open,
  onOpenChange,
  bundle,
  products,
  onSave,
}: BundleDialogProps) {
  const [formData, setFormData] = useState<Partial<Bundle>>({
    name: "",
    customPrice: 0,
    productIds: [],
  });

  useEffect(() => {
    if (bundle) {
      setFormData(bundle);
    } else {
      setFormData({
        name: "",
        customPrice: 0,
        productIds: [],
      });
    }
  }, [bundle]);

  const handleProductToggle = (productId: string, checked: boolean) => {
    setFormData({
      ...formData,
      productIds: checked
        ? [...(formData.productIds || []), productId]
        : (formData.productIds || []).filter(id => id !== productId),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: bundle?.id || crypto.randomUUID(),
      name: formData.name!,
      customPrice: Number(formData.customPrice),
      productIds: formData.productIds || [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {bundle ? "Edit Bundle" : "Tambah Bundel Baru"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bundleName">Nama Bundel</Label>
            <Input
              id="bundleName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Paket Kopi Spesial"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customPrice">Harga Bundel (IDR)</Label>
            <Input
              id="customPrice"
              type="number"
              value={formData.customPrice}
              onChange={(e) => setFormData({ ...formData, customPrice: Number(e.target.value) })}
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Pilih Produk</Label>
            <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-md p-4">
              {products.map((product) => (
                <div key={product.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`product-${product.id}`}
                    checked={formData.productIds?.includes(product.id)}
                    onCheckedChange={(checked) => 
                      handleProductToggle(product.id, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={`product-${product.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {product.name}
                  </label>
                </div>
              ))}
            </div>
            {products.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No products available. Create products first.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={!formData.productIds?.length}>
              {bundle ? "Update" : "Tambah"} Bundel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
