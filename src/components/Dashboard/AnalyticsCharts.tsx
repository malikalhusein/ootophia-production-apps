import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Transaction, Product, Lineup, Bundle } from "@/types";
import { formatCurrency, calculateCostPerGram, calculateProductHPP } from "@/lib/calculations";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { id } from "date-fns/locale";

interface AnalyticsChartsProps {
  transactions: Transaction[];
  products: Product[];
  lineups: Lineup[];
  bundles: Bundle[];
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function AnalyticsCharts({ transactions, products, lineups, bundles }: AnalyticsChartsProps) {
  // Calculate monthly revenue data (last 6 months)
  const monthlyData = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthTransactions = transactions.filter(t => {
        const transactionDate = parseISO(t.date);
        return t.status === "sale" && isWithinInterval(transactionDate, { start: monthStart, end: monthEnd });
      });
      
      const revenue = monthTransactions.reduce((sum, t) => {
        if (t.totalValue > 0) return sum + t.totalValue;
        if (t.productId) {
          const product = products.find(p => p.id === t.productId);
          if (product) {
            const lineup = lineups.find(l => l.id === product.lineupId);
            if (lineup) {
              const costPerGram = calculateCostPerGram(lineup);
              const { sellingPrice } = calculateProductHPP(product, costPerGram);
              return sum + sellingPrice * t.quantity;
            }
          }
        }
        if (t.bundleId) {
          const bundle = bundles.find(b => b.id === t.bundleId);
          return sum + (bundle?.customPrice || 0) * t.quantity;
        }
        return sum;
      }, 0);

      const units = monthTransactions.reduce((sum, t) => sum + t.quantity, 0);
      
      months.push({
        month: format(monthDate, "MMM", { locale: id }),
        fullMonth: format(monthDate, "MMMM yyyy", { locale: id }),
        revenue,
        units,
        transactions: monthTransactions.length,
      });
    }
    
    return months;
  }, [transactions, products, lineups, bundles]);

  // Calculate comparison with previous month
  const comparison = useMemo(() => {
    if (monthlyData.length < 2) return { change: 0, isPositive: true };
    
    const current = monthlyData[monthlyData.length - 1].revenue;
    const previous = monthlyData[monthlyData.length - 2].revenue;
    
    if (previous === 0) return { change: 100, isPositive: current > 0 };
    
    const change = ((current - previous) / previous) * 100;
    return { change: Math.abs(change), isPositive: change >= 0 };
  }, [monthlyData]);

  // Top selling products
  const topProducts = useMemo(() => {
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    
    transactions
      .filter(t => t.status === "sale" && t.productId)
      .forEach(t => {
        if (!t.productId) return;
        
        const product = products.find(p => p.id === t.productId);
        if (!product) return;
        
        if (!productSales[t.productId]) {
          productSales[t.productId] = { name: product.name, quantity: 0, revenue: 0 };
        }
        
        productSales[t.productId].quantity += t.quantity;
        
        if (t.totalValue > 0) {
          productSales[t.productId].revenue += t.totalValue;
        } else {
          const lineup = lineups.find(l => l.id === product.lineupId);
          if (lineup) {
            const costPerGram = calculateCostPerGram(lineup);
            const { sellingPrice } = calculateProductHPP(product, costPerGram);
            productSales[t.productId].revenue += sellingPrice * t.quantity;
          }
        }
      });
    
    return Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [transactions, products, lineups]);

  // Sales by status distribution
  const statusDistribution = useMemo(() => {
    const statusMap: Record<string, { name: string; value: number }> = {
      sale: { name: "Penjualan", value: 0 },
      promo: { name: "Promosi", value: 0 },
      rnd: { name: "R&D", value: 0 },
      bonus: { name: "Bonus", value: 0 },
    };
    
    transactions.forEach(t => {
      if (statusMap[t.status]) {
        statusMap[t.status].value += t.quantity;
      }
    });
    
    return Object.values(statusMap).filter(s => s.value > 0);
  }, [transactions]);

  const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0);
  const currentMonthRevenue = monthlyData[monthlyData.length - 1]?.revenue || 0;

  const formatTooltipValue = (value: number) => formatCurrency(value);
  const formatAxisValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}jt`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`;
    return value.toString();
  };

  return (
    <div className="space-y-6">
      {/* Revenue Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue (6 bulan)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue Bulan Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentMonthRevenue)}</div>
            <div className={`flex items-center text-sm mt-1 ${comparison.isPositive ? "text-green-600" : "text-red-600"}`}>
              {comparison.isPositive ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              <span>{comparison.change.toFixed(1)}% dari bulan lalu</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rata-rata Bulanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue / 6)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Trend Revenue (6 Bulan)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tickFormatter={formatAxisValue}
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatTooltipValue(value), "Revenue"]}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullMonth || label}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Sales Bar Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Unit Terjual per Bulan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month"
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [value, "Unit"]}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullMonth || label}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar 
                    dataKey="units" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Top Produk Terlaris</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Belum ada data penjualan produk
              </p>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={100}
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === "quantity") return [value, "Unit Terjual"];
                        return [formatCurrency(value), "Revenue"];
                      }}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar 
                      dataKey="quantity" 
                      fill="hsl(var(--primary))" 
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution Pie Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Distribusi Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            {statusDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Belum ada data transaksi
              </p>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip 
                      formatter={(value: number) => [value, "Unit"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
