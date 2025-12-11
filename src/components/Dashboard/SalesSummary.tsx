import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Layers, TrendingUp, ShoppingBag } from "lucide-react";
import { Transaction, Product, Bundle } from "@/types";
import { formatCurrency } from "@/lib/calculations";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface SalesSummaryProps {
  transactions: Transaction[];
  products: Product[];
  bundles: Bundle[];
}

export function SalesSummary({ transactions, products, bundles }: SalesSummaryProps) {
  const salesData = useMemo(() => {
    const salesTransactions = transactions.filter(t => t.status === "sale");
    
    // Calculate individual product sales
    const individualSales = salesTransactions
      .filter(t => t.productId && !t.bundleId)
      .reduce((acc, t) => {
        const product = products.find(p => p.id === t.productId);
        return {
          count: acc.count + t.quantity,
          revenue: acc.revenue + t.totalValue,
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
  }, [transactions, products, bundles]);

  const pieData = [
    { name: "Produk Individual", value: salesData.individual.revenue, color: "#cca23a" },
    { name: "Bundle Produk", value: salesData.bundle.revenue, color: "#420d1d" },
  ].filter(d => d.value > 0);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-primary" />
          Ringkasan Penjualan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Individual Products */}
          <Card className="bg-[#cca23a]/10 border-[#cca23a]/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#cca23a]/20 rounded-full">
                  <Package className="h-5 w-5 text-[#cca23a]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Produk Individual</p>
                  <p className="text-xl font-bold">{formatCurrency(salesData.individual.revenue)}</p>
                  <p className="text-xs text-muted-foreground">
                    {salesData.individual.count} unit • {salesData.individual.transactions} transaksi
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bundle Products */}
          <Card className="bg-[#420d1d]/10 border-[#420d1d]/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#420d1d]/20 rounded-full">
                  <Layers className="h-5 w-5 text-[#420d1d]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bundle Produk</p>
                  <p className="text-xl font-bold">{formatCurrency(salesData.bundle.revenue)}</p>
                  <p className="text-xs text-muted-foreground">
                    {salesData.bundle.count} bundle • {salesData.bundle.transactions} transaksi
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total */}
          <Card className="bg-primary/10 border-primary/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/20 rounded-full">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Penjualan</p>
                  <p className="text-xl font-bold">{formatCurrency(salesData.total.revenue)}</p>
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
