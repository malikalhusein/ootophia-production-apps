import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Package, DollarSign, Activity, AlertTriangle, Users, Shield } from "lucide-react";
import { useLineups } from "@/hooks/useLineups";
import { useProducts } from "@/hooks/useProducts";
import { useTransactions } from "@/hooks/useTransactions";
import { useBundles } from "@/hooks/useBundles";
import { useInventoryAlerts } from "@/hooks/useInventoryAlerts";
import { useUserRole } from "@/hooks/useUserRole";
import { useAllUsers } from "@/hooks/useUserRole";
import { formatCurrency, calculateCostPerGram, calculateWeightForSale, calculateProductHPP } from "@/lib/calculations";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { SalesSummary } from "@/components/Dashboard/SalesSummary";
import { AnalyticsCharts } from "@/components/Dashboard/AnalyticsCharts";
import { SalesDashboard } from "@/components/Dashboard/SalesDashboard";
import { ResellerDashboard } from "@/components/Dashboard/ResellerDashboard";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export default function Dashboard() {
  const { lineups, isLoading: lineupsLoading } = useLineups();
  const { products, isLoading: productsLoading } = useProducts();
  const { transactions, isLoading: transactionsLoading } = useTransactions();
  const { bundles, isLoading: bundlesLoading } = useBundles();
  const { role, isAdmin, isSales, isReseller, isLoading: roleLoading } = useUserRole();
  const { data: allUsers } = useAllUsers();
  const queryClient = useQueryClient();

  const isLoading = lineupsLoading || productsLoading || transactionsLoading || bundlesLoading || roleLoading;

  // Set up realtime subscription for transactions
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
          queryClient.invalidateQueries({ queryKey: ['products'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['products'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lineups'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['lineups'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Inventory alerts
  const { lowStockProducts, outOfStockProducts } = useInventoryAlerts(products, productsLoading);

  // Helper to calculate product selling price for fallback
  const getProductSellingPrice = (productId: string): number => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;
    const lineup = lineups.find(l => l.id === product.lineupId);
    if (!lineup) return 0;
    const costPerGram = calculateCostPerGram(lineup);
    const { sellingPrice } = calculateProductHPP(product, costPerGram);
    return sellingPrice;
  };

  // Calculate KPIs
  const totalRevenue = transactions
    .filter((t) => t.status === "sale")
    .reduce((sum, t) => {
      if (t.totalValue > 0) return sum + t.totalValue;
      if (t.productId) return sum + getProductSellingPrice(t.productId) * t.quantity;
      if (t.bundleId) {
        const bundle = bundles.find(b => b.id === t.bundleId);
        return sum + (bundle?.customPrice || 0) * t.quantity;
      }
      return sum;
    }, 0);

  const unitsSold = transactions
    .filter((t) => t.status === "sale")
    .reduce((sum, t) => sum + t.quantity, 0);

  const activeLineups = lineups.length;
  const totalProducts = products.length;

  // Admin-specific metrics
  const pendingUsers = allUsers?.filter(u => u.accountStatus === "pending").length || 0;
  const totalUsers = allUsers?.length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show role-specific dashboard
  if (isReseller) {
    return <ResellerDashboard />;
  }

  if (isSales) {
    return <SalesDashboard />;
  }

  // Admin Dashboard (full access)
  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Administrator Dashboard</h1>
          <p className="text-sm text-muted-foreground">Akses penuh ke semua fitur dan metrik</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="shadow-sm bg-card border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground transition-colors">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-card border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Units Sold
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground transition-colors">{unitsSold}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-card border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Batches
            </CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground transition-colors">{activeLineups}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-card border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground transition-colors">{totalProducts}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-card border-border transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground transition-colors">{totalUsers}</div>
            {pendingUsers > 0 && (
              <p className="text-xs text-amber-600">{pendingUsers} pending</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Users Alert */}
      {pendingUsers > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-yellow-600">Pendaftaran Menunggu Persetujuan</p>
              <p className="text-sm text-muted-foreground">
                {pendingUsers} pengguna menunggu persetujuan akun. Kelola di Settings → Manajemen Akun.
              </p>
            </div>
            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
              {pendingUsers} pending
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Analytics Charts */}
      <AnalyticsCharts 
        transactions={transactions} 
        products={products} 
        lineups={lineups} 
        bundles={bundles} 
      />

      {/* Sales Summary */}
      <SalesSummary transactions={transactions} products={products} bundles={bundles} lineups={lineups} />

      {/* Inventory Overview */}
      <Card className="shadow-sm bg-card border-border transition-colors">
        <CardHeader>
          <CardTitle className="text-foreground transition-colors">Inventory Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {lineups.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No batches created yet. Start by adding a batch in Production Cost.
            </p>
          ) : (
            lineups.map((lineup) => {
              const costPerGram = calculateCostPerGram(lineup);
              const weightForSale = calculateWeightForSale(lineup);
              const linkedProducts = products.filter((p) => p.lineupId === lineup.id);

              return (
                <div key={lineup.id} className="space-y-2 border-b border-border pb-4 last:border-0 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground transition-colors">{lineup.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {lineup.identity.origin} • {lineup.identity.variety}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground transition-colors">{formatCurrency(costPerGram)}/g</p>
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
                          <span className="font-medium text-foreground transition-colors">
                            {product.stock} units
                            {product.stock <= product.stockThreshold && (
                              <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">Low Stock</span>
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
        <Card className="shadow-sm border-amber-500/50 dark:border-amber-400/50 bg-amber-500/5 dark:bg-amber-400/5 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400 transition-colors">
              <AlertTriangle className="h-5 w-5" />
              Peringatan Stok ({lowStockProducts.length} produk)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {outOfStockProducts.length > 0 && (
              <div className="space-y-2">
                <Badge variant="destructive" className="mb-2">Stok Habis</Badge>
                {outOfStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-2 bg-destructive/10 rounded-lg transition-colors">
                    <span className="text-sm font-medium text-destructive">{product.name}</span>
                    <Badge variant="destructive">0 unit</Badge>
                  </div>
                ))}
              </div>
            )}
            {lowStockProducts.filter(p => p.stock > 0).length > 0 && (
              <div className="space-y-2">
                <Badge variant="secondary" className="mb-2 bg-amber-500/20 dark:bg-amber-400/20 text-amber-700 dark:text-amber-300 transition-colors">Stok Menipis</Badge>
                {lowStockProducts.filter(p => p.stock > 0).map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground transition-colors">{product.name}</span>
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
