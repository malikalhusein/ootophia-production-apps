import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Package, DollarSign, Activity } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Lineup, Product, Transaction } from "@/types";
import { formatCurrency, calculateCostPerGram, calculateWeightForSale } from "@/lib/calculations";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const [lineups] = useLocalStorage<Lineup[]>("lineups", []);
  const [products] = useLocalStorage<Product[]>("products", []);
  const [transactions] = useLocalStorage<Transaction[]>("transactions", []);

  // Calculate KPIs
  const totalRevenue = transactions
    .filter((t) => t.status === "sale")
    .reduce((sum, t) => sum + t.totalValue, 0);

  const unitsSold = transactions
    .filter((t) => t.status === "sale")
    .reduce((sum, t) => sum + t.quantity, 0);

  const activeLineups = lineups.length;
  const totalProducts = products.length;

  // Low stock products
  const lowStockProducts = products.filter((p) => p.stock <= p.stockThreshold);

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

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="shadow-sm border-warning">
          <CardHeader>
            <CardTitle className="text-warning">Low Stock Alert</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between">
                <span className="text-sm font-medium">{product.name}</span>
                <div className="flex items-center gap-3">
                  <Progress 
                    value={(product.stock / product.stockThreshold) * 100} 
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    {product.stock} / {product.stockThreshold}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
