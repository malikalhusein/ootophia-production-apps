import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTransactions } from "@/hooks/useTransactions";
import { useProducts } from "@/hooks/useProducts";
import { useBundles } from "@/hooks/useBundles";
import { useLineups } from "@/hooks/useLineups";
import { formatCurrency, calculateCostPerGram, calculateProductHPP } from "@/lib/calculations";
import { TrendingUp, ShoppingCart, Users, Package, DollarSign } from "lucide-react";

interface SalesDashboardProps {
  className?: string;
}

export function SalesDashboard({ className }: SalesDashboardProps) {
  const { transactions } = useTransactions();
  const { products } = useProducts();
  const { bundles } = useBundles();
  const { lineups } = useLineups();

  // Calculate metrics for today
  const today = new Date().toISOString().split("T")[0];
  const todayTransactions = transactions.filter(t => t.date === today && t.status === "sale");
  
  // Calculate this month
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthTransactions = transactions.filter(t => t.date.startsWith(thisMonth) && t.status === "sale");

  const getProductPrice = (productId: string): number => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;
    const lineup = lineups.find(l => l.id === product.lineupId);
    if (!lineup) return 0;
    const costPerGram = calculateCostPerGram(lineup);
    const { sellingPrice } = calculateProductHPP(product, costPerGram);
    return sellingPrice;
  };

  const calculateTotal = (txns: typeof transactions) => {
    return txns.reduce((sum, t) => {
      if (t.totalValue > 0) return sum + t.totalValue;
      if (t.productId) return sum + getProductPrice(t.productId) * t.quantity;
      if (t.bundleId) {
        const bundle = bundles.find(b => b.id === t.bundleId);
        return sum + (bundle?.customPrice || 0) * t.quantity;
      }
      return sum;
    }, 0);
  };

  const todayRevenue = calculateTotal(todayTransactions);
  const todayUnits = todayTransactions.reduce((sum, t) => sum + t.quantity, 0);
  const monthRevenue = calculateTotal(monthTransactions);
  const monthUnits = monthTransactions.reduce((sum, t) => sum + t.quantity, 0);

  // Top selling products this month
  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
  monthTransactions.forEach(t => {
    if (t.productId) {
      const product = products.find(p => p.id === t.productId);
      if (product) {
        if (!productSales[t.productId]) {
          productSales[t.productId] = { name: product.name, quantity: 0, revenue: 0 };
        }
        productSales[t.productId].quantity += t.quantity;
        productSales[t.productId].revenue += t.totalValue > 0 ? t.totalValue : getProductPrice(t.productId) * t.quantity;
      }
    }
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-xl font-bold">Sales Overview</h2>
        <p className="text-sm text-muted-foreground">Monitor penjualan dan performa</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Penjualan Hari Ini
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(todayRevenue)}</div>
            <p className="text-xs text-muted-foreground">{todayUnits} unit terjual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Penjualan Bulan Ini
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthRevenue)}</div>
            <p className="text-xs text-muted-foreground">{monthUnits} unit terjual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Transaksi
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthTransactions.length}</div>
            <p className="text-xs text-muted-foreground">bulan ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Produk Aktif
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.filter(p => p.stock > 0).length}</div>
            <p className="text-xs text-muted-foreground">dengan stok tersedia</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Produk Terlaris Bulan Ini</CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Belum ada penjualan bulan ini
            </p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="w-6 h-6 rounded-full flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <span className="font-medium">{product.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{product.quantity} unit</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(product.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
