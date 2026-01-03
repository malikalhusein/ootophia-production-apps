import { useState, useMemo, useCallback } from "react";
import { useLineups } from "@/hooks/useLineups";
import { useProducts } from "@/hooks/useProducts";
import { useBundles } from "@/hooks/useBundles";
import { useTransactions } from "@/hooks/useTransactions";
import { useProfile } from "@/hooks/useProfile";
import { useStockAdjustments } from "@/hooks/useStockAdjustments";
import { useInvoices } from "@/hooks/useInvoices";
import { Transaction } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Download, FileText, FileDown, Files, FileSpreadsheet, MoreHorizontal, Pencil, Trash2, Filter, Layers, Eye, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { formatCurrency, calculateProductHPP, calculateCostPerGram } from "@/lib/calculations";
import { generateInvoicePDF } from "@/lib/pdfGenerator";
import { prepareInvoiceData, InvoiceData, CustomerInfo } from "@/lib/invoiceUtils";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { TransactionForm } from "@/components/SalesJournal/TransactionForm";
import { EditTransactionDialog } from "@/components/SalesJournal/EditTransactionDialog";
import { EditConfirmationDialog } from "@/components/SalesJournal/EditConfirmationDialog";
import { InvoicePreviewDialog } from "@/components/SalesJournal/InvoicePreviewDialog";
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
  const { products, updateProduct } = useProducts();
  const { bundles } = useBundles();
  const { transactions, createTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const { profile } = useProfile();
  const { createAdjustment } = useStockAdjustments();
  const { createInvoice } = useInvoices();

  // Edit/Delete state
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [pendingEditTransaction, setPendingEditTransaction] = useState<Transaction | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  
  // Invoice preview state
  const [previewInvoiceData, setPreviewInvoiceData] = useState<InvoiceData | null>(null);
  const [previewTransactions, setPreviewTransactions] = useState<Transaction[]>([]);
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);

  const [filter, setFilter] = useState({
    search: "",
    status: "all",
    dateFrom: "",
    dateTo: "",
  });

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: "date" | "status" | "description" | "product" | "quantity" | "price" | "total";
    direction: "asc" | "desc";
  } | null>(null);

  const handleSubmit = useCallback(async (data: {
    date: string;
    status: TransactionStatus;
    items: { id: string; type: "product" | "bundle"; itemId: string; quantity: number }[];
    lineupId?: string;
    manualWeight?: number;
    description: string;
  }) => {
    const isRndOrPromo = data.status === "rnd" || data.status === "promo";
    
    if (isRndOrPromo) {
      const transaction: Transaction = {
        id: crypto.randomUUID(),
        date: data.date,
        status: data.status,
        lineupId: data.lineupId,
        quantity: data.manualWeight || 0,
        totalValue: 0,
        description: data.description,
      };

      await createTransaction(transaction);
      toast.success("Transaksi berhasil ditambahkan");
    } else {
      for (const item of data.items) {
        if (item.type === "product") {
          const product = products.find(p => p.id === item.itemId);
          
          const transaction: Transaction = {
            id: crypto.randomUUID(),
            date: data.date,
            status: data.status,
            productId: item.itemId,
            quantity: item.quantity,
            totalValue: 0,
            description: data.description,
          };
          
          const result = await createTransaction(transaction);
          
          // Auto stock deduction for sales
          if (data.status === "sale" && product && result) {
            const newStock = Math.max(0, product.stock - item.quantity);
            await createAdjustment({
              productId: product.id,
              previousStock: product.stock,
              newStock,
              adjustmentType: 'sale',
              reason: `Penjualan: ${data.description || 'Transaksi'}`,
              transactionId: result.id,
            });
            updateProduct({ id: product.id, updates: { stock: newStock } });
          }
        } else if (item.type === "bundle") {
          const bundle = bundles.find(b => b.id === item.itemId);
          
          const transaction: Transaction = {
            id: crypto.randomUUID(),
            date: data.date,
            status: data.status,
            bundleId: item.itemId,
            quantity: item.quantity,
            totalValue: bundle ? bundle.customPrice * item.quantity : 0,
            description: data.description,
          };
          
          const result = await createTransaction(transaction);
          
          // Auto stock deduction for bundle products
          if (data.status === "sale" && bundle && result) {
            for (const productId of bundle.productIds) {
              const product = products.find(p => p.id === productId);
              if (product) {
                const newStock = Math.max(0, product.stock - item.quantity);
                await createAdjustment({
                  productId: product.id,
                  previousStock: product.stock,
                  newStock,
                  adjustmentType: 'sale',
                  reason: `Penjualan Bundle (${bundle.name}): ${data.description || 'Transaksi'}`,
                  transactionId: result.id,
                });
                updateProduct({ id: product.id, updates: { stock: newStock } });
              }
            }
          }
        }
      }

      toast.success(`${data.items.length} transaksi berhasil ditambahkan`);
    }
  }, [createTransaction, products, bundles, createAdjustment, updateProduct]);

  const handleEditSave = useCallback((transaction: Transaction) => {
    setPendingEditTransaction(transaction);
  }, []);

  const handleConfirmEdit = useCallback(async () => {
    if (!pendingEditTransaction) return;
    await updateTransaction({ id: pendingEditTransaction.id, updates: pendingEditTransaction });
    setPendingEditTransaction(null);
    setEditingTransaction(null);
    toast.success("Transaksi berhasil diperbarui");
  }, [pendingEditTransaction, updateTransaction]);

  const handleDeleteTransaction = useCallback(async () => {
    if (!deletingTransactionId) return;
    await deleteTransaction(deletingTransactionId);
    setDeletingTransactionId(null);
    toast.success("Transaksi berhasil dihapus");
  }, [deletingTransactionId, deleteTransaction]);

  const getProductPrice = useCallback((transaction: Transaction) => {
    if (transaction.bundleId) {
      const bundle = bundles.find(b => b.id === transaction.bundleId);
      return bundle?.customPrice || 0;
    }
    if (!transaction.productId) return 0;
    const product = products.find(p => p.id === transaction.productId);
    if (!product) return 0;
    const lineup = lineups.find(l => l.id === product.lineupId);
    if (!lineup) return 0;
    const costPerGram = calculateCostPerGram(lineup);
    const { sellingPrice } = calculateProductHPP(product, costPerGram);
    return sellingPrice;
  }, [products, lineups, bundles]);

  const getItemName = useCallback((transaction: Transaction) => {
    if (transaction.bundleId) {
      const bundle = bundles.find(b => b.id === transaction.bundleId);
      return bundle?.name || "-";
    }
    if (transaction.productId) {
      const product = products.find(p => p.id === transaction.productId);
      return product?.name || "-";
    }
    if (transaction.lineupId) {
      const lineup = lineups.find(l => l.id === transaction.lineupId);
      return lineup?.name || "-";
    }
    return "-";
  }, [products, lineups, bundles]);

  // Memoize filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(t => {
      if (filter.status !== "all" && t.status !== filter.status) return false;
      if (filter.dateFrom && t.date < filter.dateFrom) return false;
      if (filter.dateTo && t.date > filter.dateTo) return false;
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        return t.description?.toLowerCase().includes(searchLower);
      }
      return true;
    });

    // Apply sorting
    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case "date":
            aValue = a.date;
            bValue = b.date;
            break;
          case "status":
            aValue = a.status;
            bValue = b.status;
            break;
          case "description":
            aValue = a.description || "";
            bValue = b.description || "";
            break;
          case "product":
            aValue = getItemName(a);
            bValue = getItemName(b);
            break;
          case "quantity":
            aValue = a.quantity;
            bValue = b.quantity;
            break;
          case "price":
            aValue = getProductPrice(a);
            bValue = getProductPrice(b);
            break;
          case "total":
            aValue = a.totalValue > 0 ? a.totalValue : getProductPrice(a) * a.quantity;
            bValue = b.totalValue > 0 ? b.totalValue : getProductPrice(b) * b.quantity;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [transactions, filter, sortConfig, getItemName, getProductPrice]);

  const handleSort = (key: "date" | "status" | "description" | "product" | "quantity" | "price" | "total") => {
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: "asc" };
      }
      if (current.direction === "asc") {
        return { key, direction: "desc" };
      }
      return null;
    });
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    return sortConfig.direction === "asc" 
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());

  const toggleTransactionSelection = (id: string) => {
    setSelectedTransactions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllTransactions = () => {
    if (selectedTransactions.size === filteredTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(filteredTransactions.map(t => t.id)));
    }
  };

  const handleGenerateInvoice = useCallback((transaction: Transaction) => {
    const productName = getItemName(transaction);
    const unitPrice = getProductPrice(transaction);
    const totalValue = transaction.totalValue > 0 ? transaction.totalValue : unitPrice * transaction.quantity;
    
    // Show preview first
    const invoiceData = prepareInvoiceData(
      [{ ...transaction, totalValue }],
      getItemName,
      getProductPrice
    );
    setPreviewInvoiceData(invoiceData);
    setPreviewTransactions([{ ...transaction, totalValue }]);
  }, [getProductPrice, getItemName]);

  const handlePreviewPDFGenerate = useCallback((customer?: CustomerInfo) => {
    if (!previewInvoiceData) return;
    
    const invoiceWithCustomer = { ...previewInvoiceData, customer };
    generateInvoicePDF(invoiceWithCustomer);
    
    setPreviewInvoiceData(null);
    setPreviewTransactions([]);
    toast.success("Invoice PDF berhasil di-generate");
  }, [previewInvoiceData]);

  const handlePrintInvoice = useCallback((customer?: CustomerInfo) => {
    if (!previewInvoiceData) return;
    
    const invoiceWithCustomer = { ...previewInvoiceData, customer };
    generateInvoicePDF(invoiceWithCustomer, true);
    toast.success("Invoice siap dicetak");
  }, [previewInvoiceData]);

  const handleSaveInvoice = useCallback(async (customer?: CustomerInfo) => {
    if (!previewInvoiceData) return;
    
    setIsSavingInvoice(true);
    try {
      await createInvoice({
        invoiceNumber: previewInvoiceData.invoiceNumber,
        date: previewInvoiceData.date,
        status: previewInvoiceData.status,
        description: previewInvoiceData.description,
        customerName: customer?.name,
        customerAddress: customer?.address,
        customerPhone: customer?.phone,
        customerEmail: customer?.email,
        items: previewInvoiceData.items,
        subtotal: previewInvoiceData.subtotal,
        total: previewInvoiceData.total,
        transactionIds: previewInvoiceData.transactionIds,
      });
      toast.success("Invoice berhasil disimpan ke riwayat");
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("Gagal menyimpan invoice");
    } finally {
      setIsSavingInvoice(false);
    }
  }, [previewInvoiceData, createInvoice]);

  const handleBatchInvoice = useCallback(() => {
    const selectedTxns = filteredTransactions.filter(t => selectedTransactions.has(t.id));
    if (selectedTxns.length === 0) {
      toast.error("Pilih minimal satu transaksi");
      return;
    }
    
    // Prepare invoice data with calculated values
    const txnsWithValues = selectedTxns.map(t => ({
      ...t,
      totalValue: t.totalValue > 0 ? t.totalValue : getProductPrice(t) * t.quantity
    }));
    
    const invoiceData = prepareInvoiceData(txnsWithValues, getItemName, getProductPrice);
    setPreviewInvoiceData(invoiceData);
    setPreviewTransactions(txnsWithValues);
  }, [filteredTransactions, selectedTransactions, getProductPrice, getItemName]);

  const handleExportCSV = useCallback(() => {
    exportToCSV({
      transactions: filteredTransactions,
      products,
      lineups,
      businessName: profile?.businessName || 'My Coffee Business',
      dateFrom: filter.dateFrom || undefined,
      dateTo: filter.dateTo || undefined,
    });
    toast.success('Data berhasil diexport ke CSV');
  }, [filteredTransactions, products, lineups, profile, filter]);

  const handleExportPDF = useCallback(() => {
    exportToPDF({
      transactions: filteredTransactions,
      products,
      lineups,
      businessName: profile?.businessName || 'My Coffee Business',
      dateFrom: filter.dateFrom || undefined,
      dateTo: filter.dateTo || undefined,
    });
    toast.success('Laporan PDF berhasil dibuat');
  }, [filteredTransactions, products, lineups, profile, filter]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Sales Journal</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Catat dan kelola transaksi barang keluar
          </p>
        </div>
      </div>

      {/* Transaction Form */}
      <TransactionForm
        products={products}
        lineups={lineups}
        bundles={bundles}
        onSubmit={handleSubmit}
      />

      {/* Filter & History Section */}
      <Card className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Riwayat Transaksi</h3>
            <Badge variant="secondary">{filteredTransactions.length}</Badge>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {selectedTransactions.size > 0 && (
              <Button onClick={handleBatchInvoice} size="sm" className="gap-2 flex-1 sm:flex-none">
                <Files className="h-4 w-4" />
                Batch Invoice ({selectedTransactions.size})
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV} className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF} className="gap-2">
                  <FileText className="h-4 w-4" />
                  Export PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Filters */}
        <div className="space-y-4 mb-6">
          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-medium">Cari Transaksi</Label>
              <Input
                placeholder="Cari berdasarkan keterangan..."
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Dari Tanggal</Label>
              <Input
                type="date"
                value={filter.dateFrom}
                onChange={(e) => setFilter(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Sampai Tanggal</Label>
              <Input
                type="date"
                value={filter.dateTo}
                onChange={(e) => setFilter(prev => ({ ...prev, dateTo: e.target.value }))}
                className="h-10"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {["all", "sale", "bonus", "promo", "rnd"].map((status) => (
              <Button
                key={status}
                size="sm"
                variant={filter.status === status ? "default" : "outline"}
                onClick={() => setFilter(prev => ({ ...prev, status }))}
                className="h-8"
              >
                {status === "all" ? "Semua" : statusMap[status as TransactionStatus]}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilter({ search: "", status: "all", dateFrom: "", dateTo: "" })}
              className="text-muted-foreground h-8"
            >
              Reset Filter
            </Button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4 w-10">
                    <Checkbox 
                      checked={selectedTransactions.size === filteredTransactions.length && filteredTransactions.length > 0}
                      onCheckedChange={selectAllTransactions}
                    />
                  </th>
                  <th className="p-4">
                    <button 
                      onClick={() => handleSort("date")}
                      className="flex items-center hover:text-primary transition-colors"
                    >
                      Tanggal
                      <SortIcon columnKey="date" />
                    </button>
                  </th>
                  <th className="p-4">
                    <button 
                      onClick={() => handleSort("status")}
                      className="flex items-center hover:text-primary transition-colors"
                    >
                      Status
                      <SortIcon columnKey="status" />
                    </button>
                  </th>
                  <th className="p-4">
                    <button 
                      onClick={() => handleSort("description")}
                      className="flex items-center hover:text-primary transition-colors"
                    >
                      Keterangan
                      <SortIcon columnKey="description" />
                    </button>
                  </th>
                  <th className="p-4">
                    <button 
                      onClick={() => handleSort("product")}
                      className="flex items-center hover:text-primary transition-colors"
                    >
                      Produk / Batch
                      <SortIcon columnKey="product" />
                    </button>
                  </th>
                  <th className="p-4 text-right">
                    <button 
                      onClick={() => handleSort("quantity")}
                      className="flex items-center justify-end hover:text-primary transition-colors ml-auto"
                    >
                      Qty
                      <SortIcon columnKey="quantity" />
                    </button>
                  </th>
                  <th className="p-4 text-right">
                    <button 
                      onClick={() => handleSort("price")}
                      className="flex items-center justify-end hover:text-primary transition-colors ml-auto"
                    >
                      Harga
                      <SortIcon columnKey="price" />
                    </button>
                  </th>
                  <th className="p-4 text-right">
                    <button 
                      onClick={() => handleSort("total")}
                      className="flex items-center justify-end hover:text-primary transition-colors ml-auto"
                    >
                      Total
                      <SortIcon columnKey="total" />
                    </button>
                  </th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-12 w-12 text-muted-foreground/50" />
                        <p className="text-muted-foreground">Tidak ada transaksi yang ditemukan</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => {
                    const unitPrice = getProductPrice(transaction);
                    const displayTotal = transaction.totalValue > 0 
                      ? transaction.totalValue 
                      : unitPrice * transaction.quantity;
                    const itemName = getItemName(transaction);
                    const isBundle = !!transaction.bundleId;

                    return (
                      <tr key={transaction.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <Checkbox 
                            checked={selectedTransactions.has(transaction.id)}
                            onCheckedChange={() => toggleTransactionSelection(transaction.id)}
                          />
                        </td>
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
                          <div className="flex items-center gap-2">
                            {isBundle && (
                              <Layers className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="text-sm font-medium">{itemName}</span>
                          </div>
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
                            {unitPrice > 0 ? formatCurrency(unitPrice) : "-"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-sm font-semibold text-green-600">
                            {displayTotal > 0 ? formatCurrency(displayTotal) : "-"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleGenerateInvoice(transaction)} className="gap-2">
                                  <Eye className="h-4 w-4" />
                                  Preview Invoice
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setEditingTransaction(transaction)} className="gap-2">
                                  <Pencil className="h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => setDeletingTransactionId(transaction.id)} 
                                  className="gap-2 text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Edit Transaction Dialog */}
      <EditTransactionDialog
        open={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
        transaction={editingTransaction}
        products={products}
        lineups={lineups}
        onSave={handleEditSave}
      />

      {/* Edit Confirmation Dialog */}
      <EditConfirmationDialog
        open={!!pendingEditTransaction}
        onOpenChange={(open) => !open && setPendingEditTransaction(null)}
        originalTransaction={editingTransaction}
        editedTransaction={pendingEditTransaction}
        products={products}
        lineups={lineups}
        onConfirm={handleConfirmEdit}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTransactionId} onOpenChange={(open) => !open && setDeletingTransactionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Transaksi akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTransaction} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invoice Preview Dialog */}
      <InvoicePreviewDialog
        open={!!previewInvoiceData}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewInvoiceData(null);
            setPreviewTransactions([]);
          }
        }}
        invoiceData={previewInvoiceData}
        onGeneratePDF={handlePreviewPDFGenerate}
        onPrint={handlePrintInvoice}
        onSaveInvoice={handleSaveInvoice}
        isSaving={isSavingInvoice}
      />
    </div>
  );
}
