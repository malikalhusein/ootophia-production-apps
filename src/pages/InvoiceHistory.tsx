import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { FileText, Search, Download, Trash2, MoreHorizontal, Eye, Printer, User, FileSpreadsheet, CalendarIcon, Filter, X } from "lucide-react";
import { useInvoices, Invoice } from "@/hooks/useInvoices";
import { formatCurrency } from "@/lib/calculations";
import { generateInvoicePDF } from "@/lib/pdfGenerator";
import { BUSINESS_INFO } from "@/lib/invoiceUtils";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { InvoiceHistoryPreviewDialog } from "@/components/InvoiceHistory/InvoiceHistoryPreviewDialog";

export default function InvoiceHistory() {
  const { invoices, isLoading, deleteInvoice } = useInvoices();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  
  // Filter states
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Preview dialog state
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  // Get unique statuses from invoices
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(invoices.map(inv => inv.status));
    return Array.from(statuses);
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        invoice.invoiceNumber.toLowerCase().includes(query) ||
        invoice.customerName?.toLowerCase().includes(query) ||
        invoice.status.toLowerCase().includes(query);
      
      // Date filter
      const invoiceDate = new Date(invoice.date);
      const matchesDateFrom = !dateFrom || invoiceDate >= dateFrom;
      const matchesDateTo = !dateTo || invoiceDate <= dateTo;
      
      // Status filter
      const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
      
      return matchesSearch && matchesDateFrom && matchesDateTo && matchesStatus;
    });
  }, [invoices, searchQuery, dateFrom, dateTo, statusFilter]);

  const hasActiveFilters = dateFrom || dateTo || statusFilter !== "all";

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setStatusFilter("all");
  };

  const prepareInvoiceDataFromHistory = (invoice: Invoice) => {
    // Parse items from JSON if needed
    const items = Array.isArray(invoice.items) 
      ? invoice.items.map((item: any) => ({
          name: item.name || "",
          quantity: item.quantity || 0,
          unit: item.unit || "pcs",
          unitPrice: item.unitPrice || 0,
          total: item.total || 0,
        }))
      : [];

    return {
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.date,
      status: invoice.status,
      description: invoice.description || "",
      customer: invoice.customerName ? {
        name: invoice.customerName,
        address: invoice.customerAddress || undefined,
        phone: invoice.customerPhone || undefined,
        email: invoice.customerEmail || undefined,
      } : undefined,
      items,
      subtotal: invoice.subtotal,
      total: invoice.total,
      transactionIds: invoice.transactionIds || [],
      businessInfo: BUSINESS_INFO,
    };
  };

  const handleDownload = (invoice: Invoice) => {
    try {
      const invoiceData = prepareInvoiceDataFromHistory(invoice);
      generateInvoicePDF(invoiceData, false);
      toast.success("Invoice berhasil diunduh");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Gagal mengunduh invoice");
    }
  };

  const handlePrint = (invoice: Invoice) => {
    try {
      const invoiceData = prepareInvoiceDataFromHistory(invoice);
      generateInvoicePDF(invoiceData, true);
      toast.success("Membuka print dialog...");
    } catch (error) {
      console.error("Print error:", error);
      toast.error("Gagal mencetak invoice");
    }
  };

  const handleDeleteClick = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (invoiceToDelete) {
      try {
        await deleteInvoice(invoiceToDelete.id);
        toast.success("Invoice berhasil dihapus");
      } catch {
        toast.error("Gagal menghapus invoice");
      }
    }
    setDeleteDialogOpen(false);
    setInvoiceToDelete(null);
  };

  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) {
      toast.error("Tidak ada invoice untuk di-export");
      return;
    }

    const headers = ["No. Invoice", "Tanggal", "Pelanggan", "Email", "Telepon", "Status", "Subtotal", "Total"];
    const rows = filteredInvoices.map(invoice => [
      invoice.invoiceNumber,
      formatDate(invoice.date),
      invoice.customerName || "-",
      invoice.customerEmail || "-",
      invoice.customerPhone || "-",
      invoice.status,
      invoice.subtotal.toString(),
      invoice.total.toString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `daftar-invoice-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    toast.success("Daftar invoice berhasil di-export ke CSV");
  };

  const handleExportExcel = () => {
    if (filteredInvoices.length === 0) {
      toast.error("Tidak ada invoice untuk di-export");
      return;
    }

    // Create Excel-compatible XML
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Daftar Invoice">
    <Table>
      <Row>
        <Cell><Data ss:Type="String">No. Invoice</Data></Cell>
        <Cell><Data ss:Type="String">Tanggal</Data></Cell>
        <Cell><Data ss:Type="String">Pelanggan</Data></Cell>
        <Cell><Data ss:Type="String">Email</Data></Cell>
        <Cell><Data ss:Type="String">Telepon</Data></Cell>
        <Cell><Data ss:Type="String">Status</Data></Cell>
        <Cell><Data ss:Type="String">Subtotal</Data></Cell>
        <Cell><Data ss:Type="String">Total</Data></Cell>
      </Row>
      ${filteredInvoices.map(invoice => `
      <Row>
        <Cell><Data ss:Type="String">${invoice.invoiceNumber}</Data></Cell>
        <Cell><Data ss:Type="String">${formatDate(invoice.date)}</Data></Cell>
        <Cell><Data ss:Type="String">${invoice.customerName || "-"}</Data></Cell>
        <Cell><Data ss:Type="String">${invoice.customerEmail || "-"}</Data></Cell>
        <Cell><Data ss:Type="String">${invoice.customerPhone || "-"}</Data></Cell>
        <Cell><Data ss:Type="String">${invoice.status}</Data></Cell>
        <Cell><Data ss:Type="Number">${invoice.subtotal}</Data></Cell>
        <Cell><Data ss:Type="Number">${invoice.total}</Data></Cell>
      </Row>`).join("")}
    </Table>
  </Worksheet>
</Workbook>`;

    const blob = new Blob([xmlContent], { type: "application/vnd.ms-excel" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `daftar-invoice-${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    toast.success("Daftar invoice berhasil di-export ke Excel");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Riwayat Invoice</h1>
          <p className="text-muted-foreground">Kelola dan unduh invoice yang tersimpan</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Daftar Invoice ({filteredInvoices.length})
              </CardTitle>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari invoice..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExportCSV} className="gap-2">
                      <FileText className="h-4 w-4" />
                      Export CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportExcel} className="gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Export Excel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Filter Section */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                Filter:
              </div>
              
              {/* Date From */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd MMM yyyy", { locale: id }) : "Dari tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Date To */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {dateTo ? format(dateTo, "dd MMM yyyy", { locale: id }) : "Sampai tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  {uniqueStatuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                  Hapus Filter
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || hasActiveFilters ? "Tidak ada invoice yang cocok" : "Belum ada invoice tersimpan"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Invoice</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-sm">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>{formatDate(invoice.date)}</TableCell>
                      <TableCell>
                        {invoice.customerName ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{invoice.customerName}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{invoice.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(invoice.total)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setPreviewInvoice(invoice)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(invoice)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePrint(invoice)}>
                              <Printer className="h-4 w-4 mr-2" />
                              Print
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(invoice)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <InvoiceHistoryPreviewDialog
        open={!!previewInvoice}
        onOpenChange={(open) => !open && setPreviewInvoice(null)}
        invoice={previewInvoice}
        onDownload={() => previewInvoice && handleDownload(previewInvoice)}
        onPrint={() => previewInvoice && handlePrint(previewInvoice)}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus invoice {invoiceToDelete?.invoiceNumber}? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
