import { Transaction } from "@/types";

// Generate systematic invoice number
export function generateInvoiceNumber(date: string, sequence?: number): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const seq = String(sequence || Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  
  return `INV/${year}${month}${day}/${seq}`;
}

// Generate invoice number from transaction ID
export function getInvoiceNumberFromTransaction(transaction: Transaction): string {
  const d = new Date(transaction.date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const seq = transaction.id.substring(0, 4).toUpperCase();
  
  return `INV/${year}${month}${day}/${seq}`;
}

// Business info for invoices
export const BUSINESS_INFO = {
  name: "Ootophia Brewing Labs",
  address: "Kulon Progo, Yogyakarta, Indonesia",
  email: "brewinglabs@ootophia.com",
  paymentMethods: [
    { type: "Bank Transfer", details: "BNI 0607359802 a/n Muhammad Malik Al-Husein" },
    { type: "GoPay", details: "+628112555434" },
  ],
  brandColors: {
    primary: "#420d1d",
    secondary: "#cca23a",
  },
};

export interface InvoiceItem {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface CustomerInfo {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  status: string;
  description: string;
  customer?: CustomerInfo;
  items: InvoiceItem[];
  subtotal: number;
  total: number;
  transactionIds: string[];
  businessInfo: typeof BUSINESS_INFO;
}

export function prepareInvoiceData(
  transactions: Transaction[],
  getItemName: (t: Transaction) => string,
  getUnitPrice: (t: Transaction) => number,
  customer?: CustomerInfo
): InvoiceData {
  const firstTransaction = transactions[0];
  const invoiceNumber = generateInvoiceNumber(firstTransaction.date, transactions.length);
  
  const items: InvoiceItem[] = transactions.map(t => {
    const unitPrice = getUnitPrice(t);
    const unit = t.status === "rnd" || t.status === "promo" ? "gram" : "pcs";
    return {
      name: getItemName(t),
      quantity: t.quantity,
      unit,
      unitPrice,
      total: t.totalValue > 0 ? t.totalValue : unitPrice * t.quantity,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  const statusMap: Record<string, string> = {
    sale: "Penjualan",
    promo: "Promosi",
    rnd: "RnD",
    bonus: "Bonus",
  };

  return {
    invoiceNumber,
    date: firstTransaction.date,
    status: statusMap[firstTransaction.status] || firstTransaction.status,
    description: firstTransaction.description || "",
    customer,
    items,
    subtotal,
    total: subtotal,
    transactionIds: transactions.map(t => t.id),
    businessInfo: BUSINESS_INFO,
  };
}
