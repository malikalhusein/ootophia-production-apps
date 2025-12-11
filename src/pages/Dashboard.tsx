import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Package, DollarSign, Activity, AlertTriangle } from "lucide-react";
import { useLineups } from "@/hooks/useLineups";
import { useProducts } from "@/hooks/useProducts";
import { useTransactions } from "@/hooks/useTransactions";
import { useBundles } from "@/hooks/useBundles";
import { useInventoryAlerts } from "@/hooks/useInventoryAlerts";
import { formatCurrency, calculateCostPerGram, calculateWeightForSale } from "@/lib/calculations";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { SalesSummary } from "@/components/Dashboard/SalesSummary";

export default function Dashboard() {
  const { lineups, isLoading: lineupsLoading } = useLineups();
  const { products, isLoading: productsLoading } = useProducts();
  const { transactions, isLoading: transactionsLoading } = useTransactions();
  const { bundles, isLoading: bundlesLoading } = useBundles();

  const isLoading = lineupsLoading || productsLoading || transactionsLoading || bundlesLoading;

  // Inventory alerts
  const { lowStockProducts, outOfStockProducts } = useInventoryAlerts(products, productsLoading);

  // Calculate KPIs
  const totalRevenue = transactions
    .filter((t) => t.status === "sale")
    .reduce((sum, t) => sum + t.totalValue, 0);

  const unitsSold = transactions
    .filter((t) => t.status === "sale")
    .reduce((sum, t) => sum + t.quantity, 0);

  const activeLineups = lineups.length;
  const totalProducts = products.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Units Sold
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unitsSold}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Batches
            </CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLineups}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Overview */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Inventory Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {lineups.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No batches created yet. Start by adding a batch in the Cost Calculator.
            </p>
          ) : (
            lineups.map((lineup) => {
              const costPerGram = calculateCostPerGram(lineup);
              const weightForSale = calculateWeightForSale(lineup);
              const linkedProducts = products.filter((p) => p.lineupId === lineup.id);

              return (
                <div key={lineup.id} className="space-y-2 border-b border-border pb-4 last:border-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">{lineup.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {lineup.identity.origin} • {lineup.identity.variety}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(costPerGram)}/g</p>
                      <p className="text-xs text-muted-foreground">
                        {weightForSale.toFixed(0)}g available
                      </p>
                    </div>
                  </div>
                  
                  {linkedProducts.length > 0 && (
                    <div className="ml-4 space-y-1">
                      {linkedProducts.map((product) => (
                        <div key={product.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{product.name}</span>
                          <span className="font-medium">
                            {product.stock} units
                            {product.stock <= product.stockThreshold && (
                              <span className="ml-2 text-xs text-warning">Low Stock</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Sales Summary */}
      <SalesSummary transactions={transactions} products={products} bundles={bundles} />

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="shadow-sm border-warning/50 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Peringatan Stok ({lowStockProducts.length} produk)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {outOfStockProducts.length > 0 && (
              <div className="space-y-2">
                <Badge variant="destructive" className="mb-2">Stok Habis</Badge>
                {outOfStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-2 bg-destructive/10 rounded-lg">
                    <span className="text-sm font-medium text-destructive">{product.name}</span>
                    <Badge variant="destructive">0 unit</Badge>
                  </div>
                ))}
              </div>
            )}
            {lowStockProducts.filter(p => p.stock > 0).length > 0 && (
              <div className="space-y-2">
                <Badge variant="secondary" className="mb-2 bg-warning/20 text-warning-foreground">Stok Menipis</Badge>
                {lowStockProducts.filter(p => p.stock > 0).map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{product.name}</span>
                    <div className="flex items-center gap-3">
                      <Progress 
                        value={Math.min((product.stock / product.stockThreshold) * 100, 100)} 
                        className="w-24 h-2"
                      />
                      <span className="text-sm text-muted-foreground min-w-[60px] text-right">
                        {product.stock} / {product.stockThreshold}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
