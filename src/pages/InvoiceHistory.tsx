import { useState } from "react";
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
import { FileText, Search, Download, Trash2, MoreHorizontal, Eye, Printer, User } from "lucide-react";
import { useInvoices, Invoice } from "@/hooks/useInvoices";
import { formatCurrency } from "@/lib/calculations";
import { generateInvoicePDF } from "@/lib/pdfGenerator";
import { BUSINESS_INFO } from "@/lib/invoiceUtils";
import { toast } from "sonner";

export default function InvoiceHistory() {
  const { invoices, isLoading, deleteInvoice } = useInvoices();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  const filteredInvoices = invoices.filter((invoice) => {
    const query = searchQuery.toLowerCase();
    return (
      invoice.invoiceNumber.toLowerCase().includes(query) ||
      invoice.customerName?.toLowerCase().includes(query) ||
      invoice.status.toLowerCase().includes(query)
    );
  });

  const handleDownload = (invoice: Invoice) => {
    const invoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.date,
      status: invoice.status,
      description: invoice.description || "",
      customer: invoice.customerName ? {
        name: invoice.customerName,
        address: invoice.customerAddress,
        phone: invoice.customerPhone,
        email: invoice.customerEmail,
      } : undefined,
      items: invoice.items,
      subtotal: invoice.subtotal,
      total: invoice.total,
      transactionIds: invoice.transactionIds,
      businessInfo: BUSINESS_INFO,
    };

    generateInvoicePDF(invoiceData);
    toast.success("Invoice berhasil diunduh");
  };

  const handlePrint = (invoice: Invoice) => {
    const invoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.date,
      status: invoice.status,
      description: invoice.description || "",
      customer: invoice.customerName ? {
        name: invoice.customerName,
        address: invoice.customerAddress,
        phone: invoice.customerPhone,
        email: invoice.customerEmail,
      } : undefined,
      items: invoice.items,
      subtotal: invoice.subtotal,
      total: invoice.total,
      transactionIds: invoice.transactionIds,
      businessInfo: BUSINESS_INFO,
    };

    generateInvoicePDF(invoiceData, true);
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Daftar Invoice ({filteredInvoices.length})
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari invoice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "Tidak ada invoice yang cocok" : "Belum ada invoice tersimpan"}
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
