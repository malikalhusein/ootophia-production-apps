import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Transaction } from "@/types";
import { formatCurrency } from "./calculations";

interface InvoiceData {
  transaction: Transaction;
  businessName: string;
  productName: string;
  unitPrice: number;
}

export function generateInvoicePDF(data: InvoiceData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(data.businessName, pageWidth / 2, 20, { align: "center" });
  
  doc.setFontSize(16);
  doc.text("INVOICE", pageWidth / 2, 30, { align: "center" });
  
  // Invoice details
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  const invoiceDate = new Date(data.transaction.date).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  
  doc.text(`Tanggal: ${invoiceDate}`, 14, 45);
  doc.text(`Invoice #: INV-${data.transaction.id.substring(0, 8).toUpperCase()}`, 14, 52);
  
  if (data.transaction.description) {
    doc.text(`Keterangan: ${data.transaction.description}`, 14, 59);
  }
  
  // Status badge
  const statusMap: Record<string, string> = {
    sale: "Penjualan",
    promo: "Promosi",
    rnd: "RnD",
    bonus: "Bonus",
  };
  
  doc.setFontSize(9);
  doc.text(`Status: ${statusMap[data.transaction.status] || data.transaction.status}`, 14, 66);
  
  // Product table
  const tableStartY = 75;
  
  autoTable(doc, {
    startY: tableStartY,
    head: [["Produk", "Kuantitas", "Harga Satuan", "Total"]],
    body: [
      [
        data.productName,
        data.transaction.status === "rnd" || data.transaction.status === "promo"
          ? `${data.transaction.quantity}g`
          : `${data.transaction.quantity} pcs`,
        data.transaction.totalValue > 0 ? formatCurrency(data.unitPrice) : "-",
        data.transaction.totalValue > 0 ? formatCurrency(data.transaction.totalValue) : "-",
      ],
    ],
    theme: "striped",
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 10,
    },
  });
  
  // Total
  const finalY = (doc as any).lastAutoTable.finalY || tableStartY + 30;
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  
  if (data.transaction.totalValue > 0) {
    doc.text(
      `TOTAL: ${formatCurrency(data.transaction.totalValue)}`,
      pageWidth - 14,
      finalY + 15,
      { align: "right" }
    );
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Terima kasih atas kepercayaan Anda",
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 20,
    { align: "center" }
  );
  
  // Save PDF
  const fileName = `Invoice-${data.transaction.id.substring(0, 8)}-${invoiceDate.replace(/\s/g, "-")}.pdf`;
  doc.save(fileName);
}

export function generateBatchInvoicesPDF(
  transactions: Transaction[],
  businessName: string,
  getProductName: (transaction: Transaction) => string,
  getUnitPrice: (transaction: Transaction) => number
) {
  transactions.forEach((transaction) => {
    generateInvoicePDF({
      transaction,
      businessName,
      productName: getProductName(transaction),
      unitPrice: getUnitPrice(transaction),
    });
  });
}
