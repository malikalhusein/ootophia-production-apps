import { useState, useCallback, useMemo } from "react";
import { Product, Lineup, Bundle, Transaction } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, X, ShoppingCart, Package, Calendar, FileText, Layers, AlertTriangle, User, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { useCustomers, Customer } from "@/hooks/useCustomers";
import { cn } from "@/lib/utils";

type TransactionStatus = "sale" | "promo" | "rnd" | "bonus";

interface TransactionItem {
  id: string;
  type: "product" | "bundle";
  itemId: string;
  quantity: number;
}

interface TransactionFormProps {
  products: Product[];
  lineups: Lineup[];
  bundles: Bundle[];
  onSubmit: (data: {
    date: string;
    status: TransactionStatus;
    items: TransactionItem[];
    lineupId?: string;
    manualWeight?: number;
    description: string;
    customerName?: string;
  }) => Promise<void>;
}

const statusOptions: { value: TransactionStatus; label: string; description: string }[] = [
  { value: "sale", label: "Penjualan", description: "Transaksi penjualan produk" },
  { value: "bonus", label: "Bonus", description: "Produk bonus untuk customer" },
  { value: "promo", label: "Promosi", description: "Sampel promosi (gram)" },
  { value: "rnd", label: "RnD", description: "Research & Development (gram)" },
];

export function TransactionForm({ products, lineups, bundles, onSubmit }: TransactionFormProps) {
  const { customers, createCustomer } = useCustomers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionItems, setTransactionItems] = useState<TransactionItem[]>([
    { id: crypto.randomUUID(), type: "product", itemId: "", quantity: 1 }
  ]);
  
  // Customer selection state
  const [customerOpen, setCustomerOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerSearchValue, setCustomerSearchValue] = useState("");
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    status: "sale" as TransactionStatus,
    lineupId: "",
    description: "",
    manualWeight: 0,
  });

  const isRndOrPromo = formData.status === "rnd" || formData.status === "promo";
  const isSaleOrBonus = formData.status === "sale" || formData.status === "bonus";
  
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const customerDisplayName = selectedCustomer?.name || customerSearchValue;

  const addTransactionItem = useCallback(() => {
    setTransactionItems(prev => [...prev, { id: crypto.randomUUID(), type: "product", itemId: "", quantity: 1 }]);
  }, []);

  const removeTransactionItem = useCallback((id: string) => {
    setTransactionItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateTransactionItem = useCallback((id: string, updates: Partial<TransactionItem>) => {
    setTransactionItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (isRndOrPromo) {
        if (!formData.lineupId) {
          toast.error("Pilih lineup terlebih dahulu");
          return;
        }
        await onSubmit({
          date: formData.date,
          status: formData.status,
          items: [],
          lineupId: formData.lineupId,
          manualWeight: formData.manualWeight,
          description: formData.description,
        });
      } else {
        const validItems = transactionItems.filter(item => item.itemId && item.quantity > 0);
        if (validItems.length === 0) {
          toast.error("Tambahkan minimal satu produk atau bundle");
          return;
        }
        await onSubmit({
          date: formData.date,
          status: formData.status,
          items: validItems,
          description: formData.description,
          customerName: customerDisplayName || undefined,
        });
      }
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        status: "sale",
        lineupId: "",
        description: "",
        manualWeight: 0,
      });
      setTransactionItems([{ id: crypto.randomUUID(), type: "product", itemId: "", quantity: 1 }]);
      setSelectedCustomerId("");
      setCustomerSearchValue("");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddNewCustomer = async () => {
    if (!customerSearchValue.trim()) return;
    
    try {
      const newCustomer = await createCustomer({
        name: customerSearchValue.trim(),
        isMember: false,
      });
      if (newCustomer) {
        setSelectedCustomerId(newCustomer.id);
        setCustomerOpen(false);
        toast.success(`Customer "${customerSearchValue}" berhasil ditambahkan`);
      }
    } catch (error) {
      toast.error("Gagal menambahkan customer baru");
    }
  };

  const getItemName = (item: TransactionItem) => {
    if (item.type === "product") {
      return products.find(p => p.id === item.itemId)?.name || "";
    }
    return bundles.find(b => b.id === item.itemId)?.name || "";
  };

  const totalItems = transactionItems.filter(i => i.itemId).length;
  const totalQuantity = transactionItems.reduce((acc, i) => acc + (i.itemId ? i.quantity : 0), 0);

  // Stock validation - check for items with insufficient stock
  const stockWarnings = useMemo(() => {
    if (formData.status !== "sale" && formData.status !== "bonus") return [];
    
    const warnings: { itemName: string; requested: number; available: number }[] = [];
    
    transactionItems.forEach(item => {
      if (!item.itemId || item.quantity <= 0) return;
      
      if (item.type === "product") {
        const product = products.find(p => p.id === item.itemId);
        if (product && item.quantity > product.stock) {
          warnings.push({
            itemName: product.name,
            requested: item.quantity,
            available: product.stock,
          });
        }
      } else if (item.type === "bundle") {
        const bundle = bundles.find(b => b.id === item.itemId);
        if (bundle) {
          bundle.productIds.forEach(productId => {
            const product = products.find(p => p.id === productId);
            if (product && item.quantity > product.stock) {
              warnings.push({
                itemName: `${product.name} (dalam ${bundle.name})`,
                requested: item.quantity,
                available: product.stock,
              });
            }
          });
        }
      }
    });
    
    return warnings;
  }, [transactionItems, products, bundles, formData.status]);

  return (
    <Card className="overflow-hidden border-2 border-primary/20 shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 md:p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Plus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold">Tambah Transaksi Baru</h3>
            <p className="text-sm text-muted-foreground">Catat transaksi barang keluar</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6">
        {/* Basic Info Row */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Tanggal Transaksi
            </Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Jenis Transaksi</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                status: value as TransactionStatus,
                lineupId: "",
              }))}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Customer Selection - only for sale and bonus */}
        {isSaleOrBonus && (
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Nama Pembeli (Opsional)
            </Label>
            <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={customerOpen}
                  className="w-full justify-between h-11 font-normal"
                >
                  {customerDisplayName || "Pilih atau ketik nama pembeli..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Cari atau ketik nama baru..." 
                    value={customerSearchValue}
                    onValueChange={setCustomerSearchValue}
                  />
                  <CommandList>
                    <CommandEmpty>
                      <div className="p-2 text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                          Pelanggan tidak ditemukan
                        </p>
                        {customerSearchValue.trim() && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={handleAddNewCustomer}
                            className="gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            Tambah "{customerSearchValue}"
                          </Button>
                        )}
                      </div>
                    </CommandEmpty>
                    <CommandGroup heading="Pelanggan Tersimpan">
                      {customers.map((customer) => (
                        <CommandItem
                          key={customer.id}
                          value={customer.name}
                          onSelect={() => {
                            setSelectedCustomerId(customer.id);
                            setCustomerSearchValue(customer.name);
                            setCustomerOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCustomerId === customer.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{customer.name}</span>
                            {customer.phone && (
                              <span className="text-xs text-muted-foreground">{customer.phone}</span>
                            )}
                          </div>
                          {customer.isMember && (
                            <Badge variant="secondary" className="ml-auto text-[10px]">Member</Badge>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    {customerSearchValue.trim() && !customers.some(c => c.name.toLowerCase() === customerSearchValue.toLowerCase()) && (
                      <CommandGroup heading="Buat Baru">
                        <CommandItem
                          value={`new-${customerSearchValue}`}
                          onSelect={handleAddNewCustomer}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Tambah "{customerSearchValue}" sebagai pelanggan baru
                        </CommandItem>
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {customerSearchValue && !selectedCustomerId && (
              <p className="text-xs text-muted-foreground">
                Menggunakan nama manual: {customerSearchValue}
              </p>
            )}
          </div>
        )}

        {/* Conditional Content */}
        {isRndOrPromo ? (
          <div className="p-4 rounded-xl bg-muted/50 border space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Layers className="h-4 w-4" />
              Alokasi Beans ({formData.status === "rnd" ? "R&D" : "Promosi"})
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm">Lineup / Batch</Label>
                <Select
                  value={formData.lineupId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, lineupId: value }))}
                >
                  <SelectTrigger className="h-11">
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
              <div className="space-y-2">
                <Label className="text-sm">Jumlah (gram)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.manualWeight || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, manualWeight: Number(e.target.value) }))}
                  placeholder="Masukkan berat"
                  required
                  className="h-11"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                Item Transaksi
                {totalItems > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {totalItems} item, {totalQuantity} pcs
                  </Badge>
                )}
              </Label>
              <Button type="button" onClick={addTransactionItem} size="sm" variant="outline" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Tambah Item
              </Button>
            </div>
            
            <div className="space-y-3">
              {transactionItems.map((item, index) => (
                <div 
                  key={item.id} 
                  className="flex gap-2 items-end p-3 rounded-lg bg-muted/30 border"
                >
                  <div className="flex-1 space-y-1.5">
                    {index === 0 && <Label className="text-xs text-muted-foreground">Produk / Bundle</Label>}
                    <Tabs 
                      value={item.type} 
                      onValueChange={(value) => updateTransactionItem(item.id, { type: value as "product" | "bundle", itemId: "" })}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2 h-9 mb-2">
                        <TabsTrigger value="product" className="text-xs gap-1.5">
                          <Package className="h-3 w-3" />
                          Produk
                        </TabsTrigger>
                        <TabsTrigger value="bundle" className="text-xs gap-1.5">
                          <Layers className="h-3 w-3" />
                          Bundle
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="product" className="mt-0">
                        <Select
                          value={item.type === "product" ? item.itemId : ""}
                          onValueChange={(value) => updateTransactionItem(item.id, { itemId: value })}
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
                      </TabsContent>
                      
                      <TabsContent value="bundle" className="mt-0">
                        <Select
                          value={item.type === "bundle" ? item.itemId : ""}
                          onValueChange={(value) => updateTransactionItem(item.id, { itemId: value })}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Pilih bundle" />
                          </SelectTrigger>
                          <SelectContent>
                            {bundles.length === 0 ? (
                              <div className="p-2 text-center text-sm text-muted-foreground">
                                Belum ada bundle
                              </div>
                            ) : (
                              bundles.map((bundle) => (
                                <SelectItem key={bundle.id} value={bundle.id}>
                                  <div className="flex items-center gap-2">
                                    <span>{bundle.name}</span>
                                    <Badge variant="secondary" className="text-[10px]">
                                      {bundle.productIds.length} produk
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </TabsContent>
                    </Tabs>
                  </div>
                  
                  <div className="w-20 space-y-1.5">
                    {index === 0 && <Label className="text-xs text-muted-foreground">Qty</Label>}
                    <Input
                      type="number"
                      value={item.quantity || ""}
                      onChange={(e) => updateTransactionItem(item.id, { quantity: Number(e.target.value) })}
                      min="1"
                      className="h-10"
                    />
                  </div>
                  
                  {transactionItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTransactionItem(item.id)}
                      className="h-10 w-10 text-destructive hover:text-destructive shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stock Warning */}
        {stockWarnings.length > 0 && (
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  Stok Tidak Mencukupi
                </p>
                <ul className="text-sm text-amber-600 dark:text-amber-400 space-y-1">
                  {stockWarnings.map((warning, idx) => (
                    <li key={idx}>
                      • {warning.itemName}: diminta {warning.requested}, tersedia {warning.available}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Transaksi tetap bisa dilanjutkan, tapi stok akan menjadi negatif.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Keterangan
          </Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Contoh: Pembelian Kiki, pembayaran via transfer"
            rows={2}
            className="resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <Button 
            type="submit" 
            size="lg" 
            disabled={isSubmitting}
            className="gap-2 px-8 shadow-lg"
          >
            <Plus className="h-4 w-4" />
            {isSubmitting ? "Menyimpan..." : "Simpan Transaksi"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
