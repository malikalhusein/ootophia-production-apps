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
import { Download, Mail, Building2, CreditCard, Smartphone } from "lucide-react";
import { InvoiceData } from "@/lib/invoiceUtils";
import { formatCurrency } from "@/lib/calculations";

interface InvoicePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceData: InvoiceData | null;
  onGeneratePDF: () => void;
}

export function InvoicePreviewDialog({
  open,
  onOpenChange,
  invoiceData,
  onGeneratePDF,
}: InvoicePreviewDialogProps) {
  if (!invoiceData) return null;

  const invoiceDate = new Date(invoiceData.date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview Invoice</DialogTitle>
        </DialogHeader>

        {/* Invoice Preview */}
        <div className="bg-white rounded-lg border shadow-sm">
          {/* Header with brand colors */}
          <div 
            className="p-6 text-white rounded-t-lg"
            style={{ background: `linear-gradient(135deg, ${invoiceData.businessInfo.brandColors.primary}, ${invoiceData.businessInfo.brandColors.secondary})` }}
          >
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold">{invoiceData.businessInfo.name}</h1>
                <p className="text-white/80 text-sm mt-1">{invoiceData.businessInfo.address}</p>
                <p className="text-white/80 text-sm flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {invoiceData.businessInfo.email}
                </p>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold">INVOICE</h2>
                <p className="text-white/90 text-sm font-mono mt-1">{invoiceData.invoiceNumber}</p>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="p-6 space-y-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tanggal</p>
                <p className="font-medium">{invoiceDate}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge 
                  variant="secondary"
                  style={{ 
                    backgroundColor: `${invoiceData.businessInfo.brandColors.secondary}20`,
                    color: invoiceData.businessInfo.brandColors.primary 
                  }}
                >
                  {invoiceData.status}
                </Badge>
              </div>
            </div>

            {invoiceData.description && (
              <div>
                <p className="text-sm text-muted-foreground">Keterangan</p>
                <p className="font-medium">{invoiceData.description}</p>
              </div>
            )}

            <Separator />

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr 
                    className="text-left"
                    style={{ backgroundColor: `${invoiceData.businessInfo.brandColors.primary}10` }}
                  >
                    <th className="p-3 font-semibold">Produk</th>
                    <th className="p-3 font-semibold text-center">Qty</th>
                    <th className="p-3 font-semibold text-right">Harga</th>
                    <th className="p-3 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoiceData.items.map((item, index) => (
                    <tr key={index}>
                      <td className="p-3">{item.name}</td>
                      <td className="p-3 text-center">{item.quantity} {item.unit}</td>
                      <td className="p-3 text-right">{item.unitPrice > 0 ? formatCurrency(item.unitPrice) : "-"}</td>
                      <td className="p-3 text-right font-medium">{item.total > 0 ? formatCurrency(item.total) : "-"}</td>
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
                  <span>{formatCurrency(invoiceData.subtotal)}</span>
                </div>
                <div 
                  className="flex justify-between text-lg font-bold p-2 rounded"
                  style={{ 
                    backgroundColor: `${invoiceData.businessInfo.brandColors.secondary}20`,
                    color: invoiceData.businessInfo.brandColors.primary 
                  }}
                >
                  <span>TOTAL</span>
                  <span>{formatCurrency(invoiceData.total)}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Payment Info */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Pembayaran
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {invoiceData.businessInfo.paymentMethods.map((method, index) => (
                  <div 
                    key={index}
                    className="p-3 rounded-lg border"
                    style={{ borderColor: `${invoiceData.businessInfo.brandColors.secondary}50` }}
                  >
                    <div className="flex items-center gap-2">
                      {method.type === "Bank Transfer" ? (
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium">{method.type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{method.details}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div 
              className="text-center text-sm p-4 rounded-lg"
              style={{ backgroundColor: `${invoiceData.businessInfo.brandColors.primary}05` }}
            >
              <p className="text-muted-foreground">Terima kasih atas kepercayaan Anda</p>
              <p 
                className="font-semibold mt-1"
                style={{ color: invoiceData.businessInfo.brandColors.primary }}
              >
                {invoiceData.businessInfo.name}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
          <Button 
            onClick={onGeneratePDF}
            className="gap-2"
            style={{ 
              backgroundColor: invoiceData.businessInfo.brandColors.primary,
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
