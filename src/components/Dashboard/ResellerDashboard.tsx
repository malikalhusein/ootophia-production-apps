import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTransactions } from "@/hooks/useTransactions";
import { useProducts } from "@/hooks/useProducts";
import { useBundles } from "@/hooks/useBundles";
import { useLineups } from "@/hooks/useLineups";
import { useCustomers } from "@/hooks/useCustomers";
import { formatCurrency, calculateCostPerGram, calculateProductHPP } from "@/lib/calculations";
import { TrendingUp, ShoppingCart, Package, Star } from "lucide-react";

interface ResellerDashboardProps {
  className?: string;
}

export function ResellerDashboard({ className }: ResellerDashboardProps) {
  const { transactions } = useTransactions();
  const { products } = useProducts();
  const { bundles } = useBundles();
  const { lineups } = useLineups();
  const { customers } = useCustomers();

  // Calculate this month metrics
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

  const monthRevenue = monthTransactions.reduce((sum, t) => {
    if (t.totalValue > 0) return sum + t.totalValue;
    if (t.productId) return sum + getProductPrice(t.productId) * t.quantity;
    if (t.bundleId) {
      const bundle = bundles.find(b => b.id === t.bundleId);
      return sum + (bundle?.customPrice || 0) * t.quantity;
    }
    return sum;
  }, 0);

  const monthUnits = monthTransactions.reduce((sum, t) => sum + t.quantity, 0);

  // Available products
  const availableProducts = products.filter(p => p.stock > 0);

  // Recent transactions
  const recentTransactions = transactions
    .filter(t => t.status === "sale")
    .slice(0, 5);

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-xl font-bold">Dashboard Reseller</h2>
        <p className="text-sm text-muted-foreground">Pantau penjualan dan produk tersedia</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Penjualan Bulan Ini
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthRevenue)}</div>
            <p className="text-xs text-muted-foreground">{monthUnits} unit</p>
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
              Produk Tersedia
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableProducts.length}</div>
            <p className="text-xs text-muted-foreground">siap jual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pelanggan
            </CardTitle>
            <Star className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">terdaftar</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Available Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Produk Tersedia</CardTitle>
          </CardHeader>
          <CardContent>
            {availableProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Tidak ada produk tersedia
              </p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-auto">
                {availableProducts.map((product) => {
                  const lineup = lineups.find(l => l.id === product.lineupId);
                  const costPerGram = lineup ? calculateCostPerGram(lineup) : 0;
                  const { sellingPrice } = calculateProductHPP(product, costPerGram);
                  
                  return (
                    <div key={product.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.netWeight}g</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(sellingPrice)}</p>
                        <Badge variant={product.stock <= product.stockThreshold ? "destructive" : "secondary"}>
                          Stok: {product.stock}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transaksi Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Belum ada transaksi
              </p>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((t) => {
                  const product = t.productId ? products.find(p => p.id === t.productId) : null;
                  const bundle = t.bundleId ? bundles.find(b => b.id === t.bundleId) : null;
                  const itemName = product?.name || bundle?.name || "-";
                  
                  return (
                    <div key={t.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{itemName}</p>
                        <p className="text-xs text-muted-foreground">{t.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{t.quantity} unit</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(t.totalValue > 0 ? t.totalValue : 0)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
