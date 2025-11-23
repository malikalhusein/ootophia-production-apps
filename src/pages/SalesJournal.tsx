import { useState } from "react";
import { useLineups } from "@/hooks/useLineups";
import { useProducts } from "@/hooks/useProducts";
import { useTransactions } from "@/hooks/useTransactions";
import { Transaction } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/calculations";
import { toast } from "sonner";

type TransactionStatus = "sale" | "promo" | "rnd" | "bonus";

const statusMap: Record<TransactionStatus, string> = {
  sale: "Penjualan",
  promo: "Promosi",
  rnd: "RnD",
  bonus: "Bonus",
};

export default function SalesJournal() {
  const { lineups } = useLineups();
  const { products } = useProducts();
  const { transactions, createTransaction } = useTransactions();
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    status: "sale" as TransactionStatus,
    productId: "",
    lineupId: "",
    quantity: 1,
    description: "",
    manualWeight: 0,
  });

  const [filter, setFilter] = useState({
    search: "",
    status: "all",
    dateFrom: "",
    dateTo: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let totalValue = 0;
    let quantity = formData.quantity;

    // For sale/bonus, use product
    if (formData.status === "sale" || formData.status === "bonus") {
      const product = products.find(p => p.id === formData.productId);
      if (!product) {
        toast.error("Please select a product");
        return;
      }
      // TODO: Calculate product price properly
      totalValue = 0;
    } else {
      // For RnD/Promo, use manual weight
      quantity = formData.manualWeight;
      totalValue = 0;
    }

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      date: formData.date,
      status: formData.status,
      productId: (formData.status === "sale" || formData.status === "bonus") 
        ? formData.productId 
        : undefined,
      lineupId: (formData.status === "rnd" || formData.status === "promo")
        ? formData.lineupId
        : undefined,
      quantity,
      totalValue,
      description: formData.description,
    };

    createTransaction(transaction);
    toast.success("Transaction added successfully");
    
    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      status: "sale",
      productId: "",
      lineupId: "",
      quantity: 1,
      description: "",
      manualWeight: 0,
    });
  };

  const isRndOrPromo = formData.status === "rnd" || formData.status === "promo";

  const filteredTransactions = transactions.filter(t => {
    if (filter.status !== "all" && t.status !== filter.status) return false;
    if (filter.dateFrom && t.date < filter.dateFrom) return false;
    if (filter.dateTo && t.date > filter.dateTo) return false;
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      return t.description?.toLowerCase().includes(searchLower);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sales Journal</h2>
      </div>

      {/* Add Transaction Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Tambah Transaksi Baru</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Tanggal</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ 
                  ...formData, 
                  status: value as TransactionStatus,
                  productId: "",
                  lineupId: "",
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Penjualan</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                  <SelectItem value="promo">Promosi</SelectItem>
                  <SelectItem value="rnd">RnD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isRndOrPromo ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="lineup">Lineup / Batch</Label>
                  <Select
                    value={formData.lineupId}
                    onValueChange={(value) => setFormData({ ...formData, lineupId: value })}
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
                <div className="space-y-2">
                  <Label htmlFor="manualWeight">Jumlah (gram)</Label>
                  <Input
                    id="manualWeight"
                    type="number"
                    step="0.1"
                    value={formData.manualWeight}
                    onChange={(e) => setFormData({ ...formData, manualWeight: Number(e.target.value) })}
                    placeholder="Masukkan berat dalam gram"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="product">Produk / Bundel</Label>
                  <Select
                    value={formData.productId}
                    onValueChange={(value) => setFormData({ ...formData, productId: value })}
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
                <div className="space-y-2">
                  <Label htmlFor="quantity">Kuantitas (pcs)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    min="1"
                    required
                  />
                </div>
              </>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Keterangan</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Contoh: Pembelian Kiki"
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="gap-2">
              Tambah
            </Button>
          </div>
        </form>
      </Card>

      {/* Filter Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Jurnal Penjualan</h3>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Cari Produk / Keterangan</Label>
              <Input
                id="search"
                placeholder="Ketik untuk mencari..."
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Status Transaksi</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={filter.status === "all" ? "default" : "outline"}
                  onClick={() => setFilter({ ...filter, status: "all" })}
                >
                  Semua
                </Button>
                <Button
                  size="sm"
                  variant={filter.status === "sale" ? "default" : "outline"}
                  onClick={() => setFilter({ ...filter, status: "sale" })}
                >
                  Penjualan
                </Button>
                <Button
                  size="sm"
                  variant={filter.status === "promo" ? "default" : "outline"}
                  onClick={() => setFilter({ ...filter, status: "promo" })}
                >
                  Promosi
                </Button>
                <Button
                  size="sm"
                  variant={filter.status === "rnd" ? "default" : "outline"}
                  onClick={() => setFilter({ ...filter, status: "rnd" })}
                >
                  RnD
                </Button>
                <Button
                  size="sm"
                  variant={filter.status === "bonus" ? "default" : "outline"}
                  onClick={() => setFilter({ ...filter, status: "bonus" })}
                >
                  Bonus
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Dari Tanggal</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filter.dateFrom}
                onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">Sampai Tanggal</Label>
              <Input
                id="dateTo"
                type="date"
                value={filter.dateTo}
                onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setFilter({ search: "", status: "all", dateFrom: "", dateTo: "" })}
            >
              Reset Filter
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="text-left text-sm">
                <th className="p-3 font-semibold">TANGGAL</th>
                <th className="p-3 font-semibold">STATUS</th>
                <th className="p-3 font-semibold">KETERANGAN</th>
                <th className="p-3 font-semibold">PRODUK / BATCH</th>
                <th className="p-3 font-semibold">QTY</th>
                <th className="p-3 font-semibold">HARGA</th>
                <th className="p-3 font-semibold">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => {
                  const product = transaction.productId 
                    ? products.find(p => p.id === transaction.productId)
                    : null;
                  const lineup = transaction.lineupId
                    ? lineups.find(l => l.id === transaction.lineupId)
                    : null;

                  return (
                    <tr key={transaction.id} className="border-t hover:bg-muted/30">
                      <td className="p-3">
                        {new Date(transaction.date).toLocaleDateString('id-ID')}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                            transaction.status === "sale"
                              ? "bg-primary/20 text-primary"
                              : transaction.status === "promo"
                              ? "bg-blue-500/20 text-blue-600"
                              : transaction.status === "rnd"
                              ? "bg-purple-500/20 text-purple-600"
                              : "bg-green-500/20 text-green-600"
                          }`}
                        >
                          {statusMap[transaction.status]}
                        </span>
                      </td>
                      <td className="p-3">{transaction.description || "-"}</td>
                      <td className="p-3">
                        {product?.name || lineup?.name || "-"}
                      </td>
                      <td className="p-3">
                        {transaction.status === "rnd" || transaction.status === "promo"
                          ? `${transaction.quantity}g`
                          : transaction.quantity}
                      </td>
                      <td className="p-3">
                        {transaction.totalValue > 0 
                          ? formatCurrency(transaction.totalValue / transaction.quantity)
                          : formatCurrency(0)
                        }
                      </td>
                      <td className="p-3 font-semibold">
                        {transaction.totalValue > 0 
                          ? formatCurrency(transaction.totalValue)
                          : "-"
                        }
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
