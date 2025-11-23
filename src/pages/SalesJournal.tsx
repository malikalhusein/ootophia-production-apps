import { useState, useMemo, useCallback } from "react";
import { useLineups } from "@/hooks/useLineups";
import { useProducts } from "@/hooks/useProducts";
import { useTransactions } from "@/hooks/useTransactions";
import { useProfile } from "@/hooks/useProfile";
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
import { Download, FileText, Plus, FileDown } from "lucide-react";
import { formatCurrency } from "@/lib/calculations";
import { generateInvoicePDF } from "@/lib/pdfGenerator";
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
  const { profile } = useProfile();
  
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

  const handleSubmit = useCallback((e: React.FormEvent) => {
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
  }, [formData, products, createTransaction]);

  const isRndOrPromo = formData.status === "rnd" || formData.status === "promo";

  // Memoize filtered transactions to prevent re-computation on every render
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
    if (filter.status !== "all" && t.status !== filter.status) return false;
    if (filter.dateFrom && t.date < filter.dateFrom) return false;
    if (filter.dateTo && t.date > filter.dateTo) return false;
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      return t.description?.toLowerCase().includes(searchLower);
      }
      return true;
    });
  }, [transactions, filter]);

  const handleGenerateInvoice = useCallback((transaction: Transaction) => {
    const product = transaction.productId 
      ? products.find(p => p.id === transaction.productId)
      : null;
    const lineup = transaction.lineupId
      ? lineups.find(l => l.id === transaction.lineupId)
      : null;
    
    const productName = product?.name || lineup?.name || "Unknown";
    const unitPrice = transaction.totalValue > 0 
      ? transaction.totalValue / transaction.quantity 
      : 0;
    
    generateInvoicePDF({
      transaction,
      businessName: profile?.businessName || "My Coffee Business",
      productName,
      unitPrice,
    });
    
    toast.success("Invoice generated successfully");
  }, [products, lineups, profile]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Journal</h1>
          <p className="text-muted-foreground mt-1">Catat dan kelola transaksi barang keluar</p>
        </div>
      </div>

      {/* Add Transaction Form */}
      <Card className="p-6 border-2">
        <div className="flex items-center gap-2 mb-6">
          <Plus className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-semibold">Tambah Transaksi Baru</h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium">Tanggal</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">Status Transaksi</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  status: value as TransactionStatus,
                  productId: "",
                  lineupId: "",
                }))}
              >
                <SelectTrigger className="h-11">
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
                  <Label htmlFor="lineup" className="text-sm font-medium">Lineup / Batch</Label>
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
                  <Label htmlFor="manualWeight" className="text-sm font-medium">Jumlah (gram)</Label>
                  <Input
                    id="manualWeight"
                    type="number"
                    step="0.1"
                    value={formData.manualWeight || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, manualWeight: Number(e.target.value) }))}
                    placeholder="Masukkan berat dalam gram"
                    required
                    className="h-11"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="product" className="text-sm font-medium">Produk / Bundel</Label>
                  <Select
                    value={formData.productId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, productId: value }))}
                  >
                    <SelectTrigger className="h-11">
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
                  <Label htmlFor="quantity" className="text-sm font-medium">Kuantitas (pcs)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                    min="1"
                    required
                    className="h-11"
                  />
                </div>
              </>
            )}

            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="description" className="text-sm font-medium">Keterangan</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Contoh: Pembelian Kiki"
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" size="lg" className="gap-2 px-8">
              <Plus className="h-4 w-4" />
              Tambah Transaksi
            </Button>
          </div>
        </form>
      </Card>

      {/* Filter Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Riwayat Transaksi</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="search" className="text-sm font-medium">Cari Transaksi</Label>
              <Input
                id="search"
                placeholder="Cari berdasarkan keterangan..."
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFrom" className="text-sm font-medium">Dari Tanggal</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filter.dateFrom}
                onChange={(e) => setFilter(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo" className="text-sm font-medium">Sampai Tanggal</Label>
              <Input
                id="dateTo"
                type="date"
                value={filter.dateTo}
                onChange={(e) => setFilter(prev => ({ ...prev, dateTo: e.target.value }))}
                className="h-11"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Filter Status</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={filter.status === "all" ? "default" : "outline"}
                onClick={() => setFilter(prev => ({ ...prev, status: "all" }))}
              >
                Semua
              </Button>
              <Button
                size="sm"
                variant={filter.status === "sale" ? "default" : "outline"}
                onClick={() => setFilter(prev => ({ ...prev, status: "sale" }))}
              >
                Penjualan
              </Button>
              <Button
                size="sm"
                variant={filter.status === "bonus" ? "default" : "outline"}
                onClick={() => setFilter(prev => ({ ...prev, status: "bonus" }))}
              >
                Bonus
              </Button>
              <Button
                size="sm"
                variant={filter.status === "promo" ? "default" : "outline"}
                onClick={() => setFilter(prev => ({ ...prev, status: "promo" }))}
              >
                Promosi
              </Button>
              <Button
                size="sm"
                variant={filter.status === "rnd" ? "default" : "outline"}
                onClick={() => setFilter(prev => ({ ...prev, status: "rnd" }))}
              >
                RnD
              </Button>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilter({ search: "", status: "all", dateFrom: "", dateTo: "" })}
            >
              Reset Semua Filter
            </Button>
            <p className="text-sm text-muted-foreground">
              Menampilkan {filteredTransactions.length} dari {transactions.length} transaksi
            </p>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider">
                <th className="p-4">Tanggal</th>
                <th className="p-4">Status</th>
                <th className="p-4">Keterangan</th>
                <th className="p-4">Produk / Batch</th>
                <th className="p-4 text-right">Qty</th>
                <th className="p-4 text-right">Harga</th>
                <th className="p-4 text-right">Total</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-12 w-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground">Tidak ada transaksi yang ditemukan</p>
                    </div>
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
                    <tr key={transaction.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <span className="text-sm font-medium">
                          {new Date(transaction.date).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            transaction.status === "sale"
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : transaction.status === "promo"
                              ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                              : transaction.status === "rnd"
                              ? "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                              : "bg-green-500/10 text-green-600 border border-green-500/20"
                          }`}
                        >
                          {statusMap[transaction.status]}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">
                          {transaction.description || "-"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-medium">
                          {product?.name || lineup?.name || "-"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-sm font-medium">
                          {transaction.status === "rnd" || transaction.status === "promo"
                            ? `${transaction.quantity}g`
                            : `${transaction.quantity} pcs`}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-sm">
                          {transaction.totalValue > 0 
                            ? formatCurrency(transaction.totalValue / transaction.quantity)
                            : "-"
                          }
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-sm font-semibold">
                          {transaction.totalValue > 0 
                            ? formatCurrency(transaction.totalValue)
                            : "-"
                          }
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleGenerateInvoice(transaction)}
                            className="gap-2 h-8"
                            disabled={transaction.totalValue === 0}
                          >
                            <FileDown className="h-4 w-4" />
                            Invoice
                          </Button>
                        </div>
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
