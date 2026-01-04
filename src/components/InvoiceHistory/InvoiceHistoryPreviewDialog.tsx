import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Download, Mail, Building2, CreditCard, Smartphone, User, Printer } from "lucide-react";
import { InvoiceItem, BUSINESS_INFO } from "@/lib/invoiceUtils";
import { formatCurrency } from "@/lib/calculations";
import { Invoice } from "@/hooks/useInvoices";

interface InvoiceHistoryPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  onDownload: () => void;
  onPrint: () => void;
}

export function InvoiceHistoryPreviewDialog({
  open,
  onOpenChange,
  invoice,
  onDownload,
  onPrint,
}: InvoiceHistoryPreviewDialogProps) {
  if (!invoice) return null;

  const invoiceDate = new Date(invoice.date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Parse items from JSON if needed
  const items: InvoiceItem[] = Array.isArray(invoice.items) 
    ? invoice.items.map((item: any) => ({
        name: item.name || "",
        quantity: item.quantity || 0,
        unit: item.unit || "pcs",
        unitPrice: item.unitPrice || 0,
        total: item.total || 0,
      }))
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Preview Invoice
          </DialogTitle>
        </DialogHeader>

        {/* Invoice Preview */}
        <div className="bg-card rounded-lg border border-border shadow-sm transition-colors">
          {/* Header with brand colors */}
          <div 
            className="p-6 text-white rounded-t-lg"
            style={{ background: `linear-gradient(135deg, ${BUSINESS_INFO.brandColors.primary}, ${BUSINESS_INFO.brandColors.secondary})` }}
          >
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold">{BUSINESS_INFO.name}</h1>
                <p className="text-white/80 text-sm mt-1">{BUSINESS_INFO.address}</p>
                <p className="text-white/80 text-sm flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {BUSINESS_INFO.email}
                </p>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold">INVOICE</h2>
                <p className="text-white/90 text-sm font-mono mt-1">{invoice.invoiceNumber}</p>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="p-6 space-y-6">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tanggal</p>
                <p className="font-medium text-foreground">{invoiceDate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge 
                  variant="secondary"
                  style={{ 
                    backgroundColor: `${BUSINESS_INFO.brandColors.secondary}20`,
                    color: BUSINESS_INFO.brandColors.primary 
                  }}
                >
                  {invoice.status}
                </Badge>
              </div>
            </div>

            {/* Customer Info if provided */}
            {invoice.customerName && (
              <div className="p-4 rounded-lg bg-muted/50 space-y-2 transition-colors">
                <p className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <User className="h-4 w-4" />
                  Kepada:
                </p>
                <div className="pl-6 space-y-1">
                  <p className="font-medium text-foreground">{invoice.customerName}</p>
                  {invoice.customerAddress && (
                    <p className="text-sm text-muted-foreground">{invoice.customerAddress}</p>
                  )}
                  {invoice.customerPhone && (
                    <p className="text-sm text-muted-foreground">{invoice.customerPhone}</p>
                  )}
                  {invoice.customerEmail && (
                    <p className="text-sm text-muted-foreground">{invoice.customerEmail}</p>
                  )}
                </div>
              </div>
            )}

            {invoice.description && (
              <div>
                <p className="text-sm text-muted-foreground">Keterangan</p>
                <p className="font-medium text-foreground">{invoice.description}</p>
              </div>
            )}

            <Separator />

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr 
                    className="text-left"
                    style={{ backgroundColor: `${BUSINESS_INFO.brandColors.primary}10` }}
                  >
                    <th className="p-3 font-semibold text-foreground">Produk</th>
                    <th className="p-3 font-semibold text-foreground text-center">Qty</th>
                    <th className="p-3 font-semibold text-foreground text-right">Harga</th>
                    <th className="p-3 font-semibold text-foreground text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="p-3 text-foreground">{item.name}</td>
                      <td className="p-3 text-center text-foreground">{item.quantity} {item.unit}</td>
                      <td className="p-3 text-right text-foreground">{item.unitPrice > 0 ? formatCurrency(item.unitPrice) : "-"}</td>
                      <td className="p-3 text-right font-medium text-foreground">{item.total > 0 ? formatCurrency(item.total) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Separator />

            {/* Total */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div 
                  className="flex justify-between text-lg font-bold p-2 rounded"
                  style={{ 
                    backgroundColor: `${BUSINESS_INFO.brandColors.secondary}20`,
                    color: BUSINESS_INFO.brandColors.primary 
                  }}
                >
                  <span>TOTAL</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Payment Info */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2 text-foreground">
                <CreditCard className="h-4 w-4" />
                Pembayaran
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {BUSINESS_INFO.paymentMethods.map((method, index) => (
                  <div 
                    key={index}
                    className="p-3 rounded-lg border border-border bg-card transition-colors"
                    style={{ borderColor: `${BUSINESS_INFO.brandColors.secondary}50` }}
                  >
                    <div className="flex items-center gap-2">
                      {method.type === "Bank Transfer" ? (
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium text-foreground">{method.type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{method.details}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div 
              className="text-center text-sm p-4 rounded-lg transition-colors"
              style={{ backgroundColor: `${BUSINESS_INFO.brandColors.primary}05` }}
            >
              <p className="text-muted-foreground">Terima kasih atas kepercayaan Anda</p>
              <p 
                className="font-semibold mt-1"
                style={{ color: BUSINESS_INFO.brandColors.primary }}
              >
                {BUSINESS_INFO.name}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
          <Button 
            variant="outline"
            onClick={onPrint}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button 
            onClick={onDownload}
            className="gap-2"
            style={{ 
              backgroundColor: BUSINESS_INFO.brandColors.primary,
            }}
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
