import { useMemo } from "react";
import { useLineups } from "@/hooks/useLineups";
import { useProducts } from "@/hooks/useProducts";
import { useTransactions } from "@/hooks/useTransactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Package, 
  DollarSign, 
  Scale,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { formatCurrency, formatWeight } from "@/lib/calculations";
import {
  getCostPerGram,
  getTotalProductionCost,
  getWeightForSale,
  getTotalRoastedOutput,
  getProductHPP,
  getAvailableBeans,
} from "@/lib/calculationService";

export default function BatchProfitability() {
  const { lineups, isLoading: lineupsLoading } = useLineups();
  const { products, isLoading: productsLoading } = useProducts();
  const { transactions, isLoading: transactionsLoading } = useTransactions();

  const isLoading = lineupsLoading || productsLoading || transactionsLoading;

  const batchReports = useMemo(() => {
    return lineups.map((lineup) => {
      const costPerGram = getCostPerGram(lineup);
      const totalCost = getTotalProductionCost(lineup);
      const weightForSale = getWeightForSale(lineup);
      const totalOutput = getTotalRoastedOutput(lineup);
      const availableBeans = getAvailableBeans(lineup, products);

      // Get products for this lineup
      const lineupProducts = products.filter((p) => p.lineupId === lineup.id);

      // Calculate revenue from sales transactions
      const salesTransactions = transactions.filter(
        (t) => t.status === "sale" && lineupProducts.some((p) => p.id === t.productId)
      );

      let totalRevenue = 0;
      let totalUnitsSold = 0;
      let totalProfit = 0;
      let totalWeightSold = 0; // Track weight of beans sold

      salesTransactions.forEach((t) => {
        const product = lineupProducts.find((p) => p.id === t.productId);
        if (product) {
          const { sellingPrice, totalHPP } = getProductHPP(product, costPerGram);
          const revenue = sellingPrice * t.quantity;
          const cost = totalHPP * t.quantity;
          totalRevenue += revenue;
          totalUnitsSold += t.quantity;
          totalProfit += revenue - cost;
          totalWeightSold += product.netWeight * t.quantity; // Weight sold
        }
      });

      // Calculate potential revenue (all stock at current prices)
      let potentialRevenue = 0;
      lineupProducts.forEach((product) => {
        const { sellingPrice } = getProductHPP(product, costPerGram);
        potentialRevenue += sellingPrice * product.stock;
      });

      // Calculate weight assigned to products (current stock)
      const weightAssignedToProducts = lineupProducts.reduce(
        (sum, p) => sum + p.netWeight * p.stock, 0
      );

      // Calculate margins
      const grossMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;
      const utilizationRate = weightForSale > 0 
        ? ((weightForSale - availableBeans) / weightForSale) * 100 
        : 0;

      // Remaining beans = weightForSale - weightAssigned - weightSold (validated)
      const remainingBeans = weightForSale - weightAssignedToProducts - totalWeightSold;

      return {
        lineup,
        costPerGram,
        totalCost,
        weightForSale,
        totalOutput,
        availableBeans,
        lineupProducts,
        totalRevenue,
        totalUnitsSold,
        totalProfit,
        potentialRevenue,
        grossMargin,
        utilizationRate,
        totalWeightSold,
        weightAssignedToProducts,
        remainingBeans,
      };
    });
  }, [lineups, products, transactions]);

  // Calculate totals
  const totals = useMemo(() => {
    return batchReports.reduce(
      (acc, report) => ({
        totalCost: acc.totalCost + report.totalCost,
        totalRevenue: acc.totalRevenue + report.totalRevenue,
        totalProfit: acc.totalProfit + report.totalProfit,
        totalProducts: acc.totalProducts + report.lineupProducts.length,
        totalUnitsSold: acc.totalUnitsSold + report.totalUnitsSold,
      }),
      { totalCost: 0, totalRevenue: 0, totalProfit: 0, totalProducts: 0, totalUnitsSold: 0 }
    );
  }, [batchReports]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Laporan Profitabilitas Batch</h1>
        <p className="text-muted-foreground mt-1">
          Analisis margin dan pendapatan per lineup/batch
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Biaya Produksi
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.totalCost)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pendapatan
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(totals.totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Profit
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totals.totalProfit >= 0 ? 'text-green-500' : 'text-destructive'}`}>
              {formatCurrency(totals.totalProfit)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unit Terjual
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalUnitsSold}</div>
          </CardContent>
        </Card>
      </div>

      {/* Batch Reports */}
      <div className="space-y-4">
        {batchReports.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              Belum ada batch/lineup. Buat batch baru di Cost Calculator.
            </p>
          </Card>
        ) : (
          batchReports.map((report) => (
            <Card key={report.lineup.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{report.lineup.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {report.lineup.identity.origin} • {report.lineup.identity.variety} •{" "}
                      {report.lineup.identity.process}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {formatCurrency(report.costPerGram)}/g
                    </Badge>
                    <Badge 
                      variant={report.grossMargin >= 30 ? "default" : report.grossMargin >= 15 ? "secondary" : "destructive"}
                    >
                      Margin {report.grossMargin.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {/* Production Stats */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Scale className="h-4 w-4" />
                      Produksi
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Output</span>
                        <span className="font-medium">{formatWeight(report.totalOutput)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Untuk Dijual</span>
                        <span className="font-medium">{formatWeight(report.weightForSale)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dialokasi ke Produk</span>
                        <span className="font-medium">{formatWeight(report.weightAssignedToProducts)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Terjual</span>
                        <span className="font-medium text-primary">{formatWeight(report.totalWeightSold)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span className="text-muted-foreground">Sisa (Remaining)</span>
                        <span className={`font-medium ${report.remainingBeans < 0 ? 'text-destructive' : ''}`}>
                          {formatWeight(report.remainingBeans)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Revenue Stats */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Pendapatan
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Terealisasi</span>
                        <span className="font-medium text-primary">
                          {formatCurrency(report.totalRevenue)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Potensi (Stok)</span>
                        <span className="font-medium">{formatCurrency(report.potentialRevenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Unit Terjual</span>
                        <span className="font-medium">{report.totalUnitsSold}</span>
                      </div>
                    </div>
                  </div>

                  {/* Profit Stats */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Profit
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Biaya Produksi</span>
                        <span className="font-medium">{formatCurrency(report.totalCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gross Profit</span>
                        <span className={`font-medium flex items-center gap-1 ${
                          report.totalProfit >= 0 ? 'text-green-500' : 'text-destructive'
                        }`}>
                          {report.totalProfit >= 0 ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {formatCurrency(report.totalProfit)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Margin</span>
                        <span className="font-medium">{report.grossMargin.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Utilization */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Utilisasi
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Bean Utilization</span>
                        <span className="font-medium">{report.utilizationRate.toFixed(0)}%</span>
                      </div>
                      <Progress value={report.utilizationRate} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {report.lineupProducts.length} produk terdaftar
                      </p>
                    </div>
                  </div>
                </div>

                {/* Product Breakdown */}
                {report.lineupProducts.length > 0 && (
                  <div className="mt-6 pt-4 border-t">
                    <h4 className="text-sm font-medium mb-3">Produk dalam Batch</h4>
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {report.lineupProducts.map((product) => {
                        const { sellingPrice, totalHPP, marginAmount } = getProductHPP(
                          product,
                          report.costPerGram
                        );
                        const soldQty = transactions
                          .filter((t) => t.productId === product.id && t.status === "sale")
                          .reduce((sum, t) => sum + t.quantity, 0);

                        return (
                          <div
                            key={product.id}
                            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                          >
                            <div>
                              <p className="text-sm font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {product.netWeight}g • Stok: {product.stock} • Terjual: {soldQty}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">{formatCurrency(sellingPrice)}</p>
                              <p className="text-xs text-green-500">+{formatCurrency(marginAmount)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
