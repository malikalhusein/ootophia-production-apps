import { Transaction, Product, Lineup } from '@/types';
import { calculateProductHPP, calculateCostPerGram, formatCurrency } from './calculations';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportData {
  transactions: Transaction[];
  products: Product[];
  lineups: Lineup[];
  businessName: string;
  dateFrom?: string;
  dateTo?: string;
}

const statusLabels: Record<string, string> = {
  sale: 'Penjualan',
  promo: 'Promosi',
  rnd: 'RnD',
  bonus: 'Bonus',
};

function getProductInfo(transaction: Transaction, products: Product[], lineups: Lineup[]) {
  if (transaction.productId) {
    const product = products.find(p => p.id === transaction.productId);
    if (product) {
      const lineup = lineups.find(l => l.id === product.lineupId);
      const costPerGram = lineup ? calculateCostPerGram(lineup) : 0;
      const { sellingPrice } = calculateProductHPP(product, costPerGram);
      return {
        name: product.name,
        unitPrice: sellingPrice,
        totalValue: sellingPrice * transaction.quantity,
      };
    }
  }
  if (transaction.lineupId) {
    const lineup = lineups.find(l => l.id === transaction.lineupId);
    return {
      name: lineup?.name || 'Unknown',
      unitPrice: 0,
      totalValue: 0,
    };
  }
  return { name: 'Unknown', unitPrice: 0, totalValue: 0 };
}

export function exportToCSV(data: ExportData): void {
  const { transactions, products, lineups, businessName, dateFrom, dateTo } = data;

  const headers = ['Tanggal', 'Status', 'Produk/Lineup', 'Kuantitas', 'Harga Satuan', 'Total', 'Keterangan'];
  
  const rows = transactions.map(t => {
    const info = getProductInfo(t, products, lineups);
    return [
      t.date,
      statusLabels[t.status] || t.status,
      info.name,
      t.quantity.toString(),
      info.unitPrice.toString(),
      info.totalValue.toString(),
      t.description || '',
    ];
  });

  // Calculate totals
  const totalValue = transactions.reduce((sum, t) => {
    const info = getProductInfo(t, products, lineups);
    return sum + info.totalValue;
  }, 0);

  rows.push(['', '', '', '', 'TOTAL', totalValue.toString(), '']);

  const csvContent = [
    `${businessName} - Laporan Transaksi`,
    dateFrom && dateTo ? `Periode: ${dateFrom} s/d ${dateTo}` : `Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`,
    '',
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `transaksi_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(data: ExportData): void {
  const { transactions, products, lineups, businessName, dateFrom, dateTo } = data;

  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(businessName, 14, 20);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Laporan Transaksi', 14, 30);
  
  doc.setFontSize(10);
  if (dateFrom && dateTo) {
    doc.text(`Periode: ${dateFrom} s/d ${dateTo}`, 14, 38);
  } else {
    doc.text(`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`, 14, 38);
  }

  // Table data
  const tableData = transactions.map(t => {
    const info = getProductInfo(t, products, lineups);
    return [
      t.date,
      statusLabels[t.status] || t.status,
      info.name,
      t.quantity.toString(),
      formatCurrency(info.unitPrice),
      formatCurrency(info.totalValue),
      (t.description || '').substring(0, 30),
    ];
  });

  // Calculate totals by status
  const salesTotal = transactions
    .filter(t => t.status === 'sale')
    .reduce((sum, t) => {
      const info = getProductInfo(t, products, lineups);
      return sum + info.totalValue;
    }, 0);

  const bonusTotal = transactions
    .filter(t => t.status === 'bonus')
    .reduce((sum, t) => {
      const info = getProductInfo(t, products, lineups);
      return sum + info.totalValue;
    }, 0);

  autoTable(doc, {
    startY: 45,
    head: [['Tanggal', 'Status', 'Produk', 'Qty', 'Harga', 'Total', 'Keterangan']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [34, 139, 34] },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 22 },
      2: { cellWidth: 35 },
      3: { cellWidth: 15 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 },
      6: { cellWidth: 35 },
    },
  });

  // Summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Ringkasan:', 14, finalY);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Penjualan: ${formatCurrency(salesTotal)}`, 14, finalY + 7);
  doc.text(`Total Bonus: ${formatCurrency(bonusTotal)}`, 14, finalY + 14);
  doc.text(`Total Transaksi: ${transactions.length}`, 14, finalY + 21);

  // Footer
  doc.setFontSize(8);
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 285);

  doc.save(`laporan_transaksi_${new Date().toISOString().split('T')[0]}.pdf`);
}
