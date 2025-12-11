import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Transaction } from "@/types";
import { formatCurrency } from "./calculations";
import { InvoiceData, BUSINESS_INFO, getInvoiceNumberFromTransaction } from "./invoiceUtils";

// Brand colors
const BRAND_PRIMARY = [66, 13, 29] as [number, number, number]; // #420d1d
const BRAND_SECONDARY = [204, 162, 58] as [number, number, number]; // #cca23a

interface SingleInvoiceData {
  transaction: Transaction;
  businessName: string;
  productName: string;
  unitPrice: number;
}

// Helper to convert hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

export function generateInvoicePDF(data: SingleInvoiceData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Header with gradient effect (using primary color)
  doc.setFillColor(...BRAND_PRIMARY);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Business name (white text on dark background)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(BUSINESS_INFO.name, 14, 20);
  
  // Business details
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(BUSINESS_INFO.address, 14, 28);
  doc.text(BUSINESS_INFO.email, 14, 34);
  
  // Invoice title on right
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageWidth - 14, 20, { align: "right" });
  
  // Invoice number
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const invoiceNumber = getInvoiceNumberFromTransaction(data.transaction);
  doc.text(invoiceNumber, pageWidth - 14, 30, { align: "right" });
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Invoice details section
  const invoiceDate = new Date(data.transaction.date).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Tanggal:", 14, 58);
  doc.setFont("helvetica", "normal");
  doc.text(invoiceDate, 50, 58);
  
  // Status
  const statusMap: Record<string, string> = {
    sale: "Penjualan",
    promo: "Promosi",
    rnd: "RnD",
    bonus: "Bonus",
  };
  
  doc.setFont("helvetica", "bold");
  doc.text("Status:", 14, 66);
  doc.setFont("helvetica", "normal");
  doc.text(statusMap[data.transaction.status] || data.transaction.status, 50, 66);
  
  if (data.transaction.description) {
    doc.setFont("helvetica", "bold");
    doc.text("Keterangan:", 14, 74);
    doc.setFont("helvetica", "normal");
    doc.text(data.transaction.description, 50, 74);
  }
  
  // Product table
  const tableStartY = data.transaction.description ? 85 : 78;
  
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
    theme: "plain",
    headStyles: {
      fillColor: BRAND_PRIMARY,
      textColor: 255,
      fontStyle: "bold",
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [250, 245, 235],
    },
    styles: {
      fontSize: 10,
      cellPadding: 8,
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { halign: 'center', cellWidth: 35 },
      2: { halign: 'right', cellWidth: 45 },
      3: { halign: 'right', cellWidth: 45 },
    },
  });
  
  // Total section
  const finalY = (doc as any).lastAutoTable.finalY || tableStartY + 30;
  
  if (data.transaction.totalValue > 0) {
    // Total box with brand color
    doc.setFillColor(...BRAND_SECONDARY);
    doc.roundedRect(pageWidth - 84, finalY + 8, 70, 20, 3, 3, 'F');
    
    doc.setTextColor(66, 13, 29);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", pageWidth - 80, finalY + 20);
    doc.text(formatCurrency(data.transaction.totalValue), pageWidth - 18, finalY + 20, { align: "right" });
  }
  
  // Payment information
  doc.setTextColor(0, 0, 0);
  const paymentY = finalY + 45;
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Pembayaran", 14, paymentY);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  
  BUSINESS_INFO.paymentMethods.forEach((method, index) => {
    const y = paymentY + 10 + (index * 14);
    doc.setFont("helvetica", "bold");
    doc.text(`${method.type}:`, 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(method.details, 45, y);
  });
  
  // Footer
  doc.setFillColor(...BRAND_PRIMARY);
  doc.rect(0, pageHeight - 25, pageWidth, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text("Terima kasih atas kepercayaan Anda", pageWidth / 2, pageHeight - 15, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.text(BUSINESS_INFO.name, pageWidth / 2, pageHeight - 8, { align: "center" });
  
  // Save PDF
  const fileName = `${invoiceNumber.replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
}

export function generateMultiItemInvoicePDF(invoiceData: InvoiceData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Header with gradient effect
  doc.setFillColor(...BRAND_PRIMARY);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Business name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(invoiceData.businessInfo.name, 14, 20);
  
  // Business details
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(invoiceData.businessInfo.address, 14, 28);
  doc.text(invoiceData.businessInfo.email, 14, 34);
  
  // Invoice title
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageWidth - 14, 20, { align: "right" });
  
  // Invoice number
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(invoiceData.invoiceNumber, pageWidth - 14, 30, { align: "right" });
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Invoice details
  const invoiceDate = new Date(invoiceData.date).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  
  let currentY = 58;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Tanggal:", 14, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(invoiceDate, 50, currentY);
  currentY += 8;
  
  doc.setFont("helvetica", "bold");
  doc.text("Status:", 14, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(invoiceData.status, 50, currentY);
  currentY += 8;
  
  // Customer info if provided
  if (invoiceData.customer?.name) {
    currentY += 4;
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(14, currentY - 4, pageWidth - 28, invoiceData.customer.address || invoiceData.customer.phone || invoiceData.customer.email ? 30 : 16, 2, 2, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.text("Kepada:", 18, currentY + 4);
    doc.setFont("helvetica", "normal");
    doc.text(invoiceData.customer.name, 45, currentY + 4);
    
    let customerY = currentY + 10;
    if (invoiceData.customer.address) {
      doc.setFontSize(9);
      doc.text(invoiceData.customer.address, 45, customerY);
      customerY += 6;
    }
    if (invoiceData.customer.phone) {
      doc.text(invoiceData.customer.phone, 45, customerY);
      customerY += 6;
    }
    if (invoiceData.customer.email) {
      doc.text(invoiceData.customer.email, 45, customerY);
    }
    
    currentY += invoiceData.customer.address || invoiceData.customer.phone || invoiceData.customer.email ? 34 : 20;
    doc.setFontSize(10);
  }
  
  if (invoiceData.description) {
    doc.setFont("helvetica", "bold");
    doc.text("Keterangan:", 14, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(invoiceData.description, 50, currentY);
    currentY += 10;
  }
  
  // Items table
  const tableStartY = currentY + 5;
  
  autoTable(doc, {
    startY: tableStartY,
    head: [["Produk", "Kuantitas", "Harga Satuan", "Total"]],
    body: invoiceData.items.map(item => [
      item.name,
      `${item.quantity} ${item.unit}`,
      item.unitPrice > 0 ? formatCurrency(item.unitPrice) : "-",
      item.total > 0 ? formatCurrency(item.total) : "-",
    ]),
    theme: "plain",
    headStyles: {
      fillColor: BRAND_PRIMARY,
      textColor: 255,
      fontStyle: "bold",
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [250, 245, 235],
    },
    styles: {
      fontSize: 10,
      cellPadding: 8,
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { halign: 'center', cellWidth: 35 },
      2: { halign: 'right', cellWidth: 45 },
      3: { halign: 'right', cellWidth: 45 },
    },
  });
  
  // Total section
  const finalY = (doc as any).lastAutoTable.finalY || tableStartY + 30;
  
  if (invoiceData.total > 0) {
    // Subtotal
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Subtotal:", pageWidth - 84, finalY + 15);
    doc.text(formatCurrency(invoiceData.subtotal), pageWidth - 14, finalY + 15, { align: "right" });
    
    // Total box
    doc.setFillColor(...BRAND_SECONDARY);
    doc.roundedRect(pageWidth - 84, finalY + 20, 70, 20, 3, 3, 'F');
    
    doc.setTextColor(66, 13, 29);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", pageWidth - 80, finalY + 32);
    doc.text(formatCurrency(invoiceData.total), pageWidth - 18, finalY + 32, { align: "right" });
  }
  
  // Payment information
  doc.setTextColor(0, 0, 0);
  const paymentY = finalY + 55;
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Pembayaran", 14, paymentY);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  
  invoiceData.businessInfo.paymentMethods.forEach((method, index) => {
    const y = paymentY + 10 + (index * 14);
    doc.setFont("helvetica", "bold");
    doc.text(`${method.type}:`, 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(method.details, 45, y);
  });
  
  // Footer
  doc.setFillColor(...BRAND_PRIMARY);
  doc.rect(0, pageHeight - 25, pageWidth, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text("Terima kasih atas kepercayaan Anda", pageWidth / 2, pageHeight - 15, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.text(invoiceData.businessInfo.name, pageWidth / 2, pageHeight - 8, { align: "center" });
  
  // Save PDF
  const fileName = `${invoiceData.invoiceNumber.replace(/\//g, '-')}.pdf`;
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
