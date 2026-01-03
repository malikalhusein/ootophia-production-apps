import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { InvoiceData, BUSINESS_INFO } from "./invoiceUtils";
import { formatCurrency } from "./calculations";

function formatIDR(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Main PDF generation function with print support
export function generateInvoicePDF(invoiceData: InvoiceData, printMode = false) {
  const doc = new jsPDF();
  const { businessInfo, customer, items, total } = invoiceData;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Header with brand color
  doc.setFillColor(66, 13, 29); // #420d1d
  doc.rect(0, 0, pageWidth, 45, "F");
  
  // Business name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(businessInfo.name, 14, 20);
  
  // Business details
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(businessInfo.address, 14, 28);
  doc.text(businessInfo.email, 14, 34);
  
  // Invoice title
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageWidth - 14, 20, { align: "right" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(invoiceData.invoiceNumber, pageWidth - 14, 30, { align: "right" });
  
  // Invoice details section
  doc.setTextColor(0, 0, 0);
  let yPos = 55;
  
  // Date and Status
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Tanggal:", 14, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(new Date(invoiceData.date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }), 50, yPos);
  
  doc.setFont("helvetica", "bold");
  doc.text("Status:", 120, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(invoiceData.status, 145, yPos);
  
  yPos += 10;
  
  // Customer info if available
  if (customer?.name) {
    const hasExtraInfo = customer.address || customer.phone || customer.email;
    const boxHeight = hasExtraInfo ? 28 : 16;
    
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(14, yPos, pageWidth - 28, boxHeight, 2, 2, "F");
    
    yPos += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Kepada:", 18, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(customer.name, 50, yPos);
    
    if (customer.address) {
      yPos += 6;
      doc.setFontSize(9);
      doc.text(customer.address, 50, yPos);
    }
    if (customer.phone) {
      yPos += 5;
      doc.text(customer.phone, 50, yPos);
    }
    if (customer.email) {
      yPos += 5;
      doc.text(customer.email, 50, yPos);
    }
    yPos += hasExtraInfo ? 12 : 8;
    doc.setFontSize(10);
  }
  
  if (invoiceData.description) {
    yPos += 4;
    doc.setFont("helvetica", "bold");
    doc.text("Keterangan:", 14, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(invoiceData.description, 50, yPos);
    yPos += 8;
  }
  
  yPos += 5;
  
  // Items table
  const tableData = items.map((item) => [
    item.name,
    `${item.quantity} ${item.unit}`,
    item.unitPrice > 0 ? formatIDR(item.unitPrice) : "-",
    item.total > 0 ? formatIDR(item.total) : "-",
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [["Produk", "Qty", "Harga Satuan", "Total"]],
    body: tableData,
    theme: "plain",
    headStyles: {
      fillColor: [66, 13, 29],
      textColor: [255, 255, 255],
      fontStyle: "bold",
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
      1: { cellWidth: 30, halign: "center" },
      2: { cellWidth: 45, halign: "right" },
      3: { cellWidth: 45, halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });
  
  yPos = (doc as any).lastAutoTable?.finalY + 10 || yPos + 50;
  
  // Totals
  doc.setFillColor(204, 162, 58); // #cca23a
  doc.roundedRect(pageWidth - 84, yPos, 70, 20, 3, 3, "F");
  
  doc.setTextColor(66, 13, 29);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL", pageWidth - 80, yPos + 8);
  doc.text(formatIDR(total), pageWidth - 18, yPos + 8, { align: "right" });
  
  yPos += 30;
  
  // Payment info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Pembayaran:", 14, yPos);
  
  yPos += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  
  businessInfo.paymentMethods.forEach((method) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${method.type}:`, 14, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(method.details, 45, yPos);
    yPos += 7;
  });
  
  // Footer
  doc.setFillColor(66, 13, 29);
  doc.rect(0, pageHeight - 25, pageWidth, 25, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text("Terima kasih atas kepercayaan Anda", pageWidth / 2, pageHeight - 15, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.text(businessInfo.name, pageWidth / 2, pageHeight - 8, { align: "center" });
  
  if (printMode) {
    // Open in new window for printing
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(pdfUrl, "_blank");
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  } else {
    doc.save(`${invoiceData.invoiceNumber.replace(/\//g, "-")}.pdf`);
  }
}
