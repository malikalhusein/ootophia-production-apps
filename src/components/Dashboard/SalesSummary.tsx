import { useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Layers, TrendingUp, ShoppingBag } from "lucide-react";
import { Transaction, Product, Bundle, Lineup } from "@/types";
import { formatCurrency, calculateCostPerGram, calculateProductHPP } from "@/lib/calculations";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface SalesSummaryProps {
  transactions: Transaction[];
  products: Product[];
  bundles: Bundle[];
  lineups: Lineup[];
}

export function SalesSummary({ transactions, products, bundles, lineups }: SalesSummaryProps) {
  // Helper to calculate product selling price
  const getProductSellingPrice = useCallback((productId: string): number => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;
    const lineup = lineups.find(l => l.id === product.lineupId);
    if (!lineup) return 0;
    const costPerGram = calculateCostPerGram(lineup);
    const { sellingPrice } = calculateProductHPP(product, costPerGram);
    return sellingPrice;
  }, [products, lineups]);

  const salesData = useMemo(() => {
    const salesTransactions = transactions.filter(t => t.status === "sale");
    
    // Calculate individual product sales with fallback calculation
    const individualSales = salesTransactions
      .filter(t => t.productId && !t.bundleId)
      .reduce((acc, t) => {
        // Use totalValue if available, otherwise calculate from product price
        const revenue = t.totalValue > 0 
          ? t.totalValue 
          : (t.productId ? getProductSellingPrice(t.productId) * t.quantity : 0);
        return {
          count: acc.count + t.quantity,
          revenue: acc.revenue + revenue,
          transactions: acc.transactions + 1,
        };
      }, { count: 0, revenue: 0, transactions: 0 });

    // Calculate bundle sales
    const bundleSales = salesTransactions
      .filter(t => t.bundleId)
      .reduce((acc, t) => {
        const bundle = bundles.find(b => b.id === t.bundleId);
        return {
          count: acc.count + t.quantity,
          revenue: acc.revenue + (t.totalValue || (bundle?.customPrice || 0) * t.quantity),
          transactions: acc.transactions + 1,
        };
      }, { count: 0, revenue: 0, transactions: 0 });

    const totalRevenue = individualSales.revenue + bundleSales.revenue;
    const totalTransactions = individualSales.transactions + bundleSales.transactions;

    return {
      individual: individualSales,
      bundle: bundleSales,
      total: { revenue: totalRevenue, transactions: totalTransactions },
    };
  }, [transactions, products, bundles, getProductSellingPrice]);

  const pieData = [
    { name: "Produk Individual", value: salesData.individual.revenue, color: "hsl(38, 75%, 52%)" },
    { name: "Bundle Produk", value: salesData.bundle.revenue, color: "hsl(350, 65%, 25%)" },
  ].filter(d => d.value > 0);

  return (
    <Card className="shadow-sm bg-card border-border transition-colors">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <ShoppingBag className="h-5 w-5 text-primary" />
          Ringkasan Penjualan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Individual Products */}
          <Card className="bg-amber-500/10 dark:bg-amber-400/10 border-amber-500/30 dark:border-amber-400/20 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/20 dark:bg-amber-400/20 rounded-full transition-colors">
                  <Package className="h-5 w-5 text-amber-600 dark:text-amber-400 transition-colors" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Produk Individual</p>
                  <p className="text-xl font-bold text-foreground transition-colors">{formatCurrency(salesData.individual.revenue)}</p>
                  <p className="text-xs text-muted-foreground">
                    {salesData.individual.count} unit • {salesData.individual.transactions} transaksi
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bundle Products */}
          <Card className="bg-rose-500/10 dark:bg-rose-400/10 border-rose-500/30 dark:border-rose-400/20 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-500/20 dark:bg-rose-400/20 rounded-full transition-colors">
                  <Layers className="h-5 w-5 text-rose-700 dark:text-rose-400 transition-colors" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bundle Produk</p>
                  <p className="text-xl font-bold text-foreground transition-colors">{formatCurrency(salesData.bundle.revenue)}</p>
                  <p className="text-xs text-muted-foreground">
                    {salesData.bundle.count} bundle • {salesData.bundle.transactions} transaksi
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total */}
          <Card className="bg-primary/10 border-primary/30 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/20 rounded-full transition-colors">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Penjualan</p>
                  <p className="text-xl font-bold text-foreground transition-colors">{formatCurrency(salesData.total.revenue)}</p>
                  <p className="text-xs text-muted-foreground">
                    {salesData.total.transactions} transaksi
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pie Chart */}
        {pieData.length > 0 && (
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
