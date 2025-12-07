import { useState, useMemo } from "react";
import { useLineups } from "@/hooks/useLineups";
import { useProducts } from "@/hooks/useProducts";
import { useBundles } from "@/hooks/useBundles";
import { useTransactions } from "@/hooks/useTransactions";
import { Product, Bundle } from "@/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, TrendingUp, Package } from "lucide-react";
import { ProductDialog } from "@/components/Products/ProductDialog";
import { BundleDialog } from "@/components/Products/BundleDialog";
import { 
  calculateProductHPP, 
  calculateCostPerGram, 
  formatCurrency, 
  formatWeight,
  calculateWeightForSale,
  calculateWeightAssignedToProducts,
  calculateTotalRoastedOutput
} from "@/lib/calculations";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export default function Products() {
  const { lineups, isLoading: lineupsLoading } = useLineups();
  const { products, isLoading: productsLoading, createProduct, updateProduct, deleteProduct } = useProducts();
  const { bundles, isLoading: bundlesLoading, createBundle, updateBundle, deleteBundle } = useBundles();
  const { transactions } = useTransactions();
  
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [bundleDialogOpen, setBundleDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);

  const handleCreateProduct = (product: Product) => {
    createProduct(product);
    toast.success("Product created successfully");
    setProductDialogOpen(false);
  };

  const handleUpdateProduct = (product: Product) => {
    updateProduct({ id: product.id, updates: product });
    toast.success("Product updated successfully");
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProduct(id);
      toast.success("Product deleted successfully");
    }
  };

  const handleCreateBundle = (bundle: Bundle) => {
    createBundle(bundle);
    toast.success("Bundle created successfully");
    setBundleDialogOpen(false);
  };

  const handleUpdateBundle = (bundle: Bundle) => {
    updateBundle({ id: bundle.id, updates: bundle });
    toast.success("Bundle updated successfully");
    setEditingBundle(null);
  };

  const handleDeleteBundle = (id: string) => {
    if (confirm("Are you sure you want to delete this bundle?")) {
      deleteBundle(id);
      toast.success("Bundle deleted successfully");
    }
  };

  if (lineupsLoading || productsLoading || bundlesLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  // Group products by lineup with quota tracking
  const productsByLineup = useMemo(() => lineups.map(lineup => {
    const lineupProducts = products.filter(p => p.lineupId === lineup.id);
    const costPerGram = calculateCostPerGram(lineup);
    const totalRoastedOutput = calculateTotalRoastedOutput(lineup);
    const weightForSale = calculateWeightForSale(lineup);
    const weightAssigned = calculateWeightAssignedToProducts(lineup, lineupProducts);
    const availableBeans = Math.max(0, weightForSale - weightAssigned);
    
    // Calculate sold quantity from transactions
    const soldByProduct: Record<string, number> = {};
    transactions.filter(t => t.status === 'sale' || t.status === 'bonus').forEach(t => {
      if (t.productId) {
        soldByProduct[t.productId] = (soldByProduct[t.productId] || 0) + t.quantity;
      }
    });

    return {
      lineup,
      products: lineupProducts,
      costPerGram: costPerGram > 0 ? costPerGram : 0,
      totalRoastedOutput,
      weightForSale,
      weightAssigned,
      availableBeans,
      soldByProduct,
    };
  }), [lineups, products, transactions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Daftar Produk & Bundel</h2>
      </div>

      <Tabs defaultValue="individual" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="individual">Produk Individual</TabsTrigger>
          <TabsTrigger value="bundles">Bundel Produk</TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setProductDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah Produk Baru
            </Button>
          </div>

          {lineups.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                No lineups available. Create a lineup in Cost Calculator first.
              </p>
            </Card>
          ) : (
            productsByLineup.map(({ lineup, products: lineupProducts, costPerGram, totalRoastedOutput, weightForSale, weightAssigned, availableBeans, soldByProduct }) => (
              <Card key={lineup.id} className="p-6 border-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">{lineup.name}</h3>
                  <span className="text-sm text-muted-foreground">
                    {lineupProducts.length} Varian
                  </span>
                </div>

                {/* Quota Tracking Section */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card className="p-3 bg-primary/10 border-primary/20">
                    <p className="text-xs text-muted-foreground">Total Roasted</p>
                    <p className="text-lg font-bold">{formatWeight(totalRoastedOutput)}</p>
                  </Card>
                  <Card className="p-3 bg-accent/10 border-accent/20">
                    <p className="text-xs text-muted-foreground">Beans for Sale</p>
                    <p className="text-lg font-bold">{formatWeight(weightForSale)}</p>
                  </Card>
                  <Card className="p-3 bg-secondary/10 border-secondary/20">
                    <p className="text-xs text-muted-foreground">Assigned to Products</p>
                    <p className="text-lg font-bold">{formatWeight(weightAssigned)}</p>
                  </Card>
                  <Card className={`p-3 ${availableBeans > 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-destructive/10 border-destructive/20'}`}>
                    <p className="text-xs text-muted-foreground">Available Beans</p>
                    <p className={`text-lg font-bold ${availableBeans > 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {formatWeight(availableBeans)}
                    </p>
                  </Card>
                </div>

                {weightForSale > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Beans Utilization</span>
                      <span>{((weightAssigned / weightForSale) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={Math.min((weightAssigned / weightForSale) * 100, 100)} />
                  </div>
                )}

                {lineupProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    No products for this lineup yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr className="text-left text-sm">
                          <th className="p-3 font-semibold">VARIAN</th>
                          <th className="p-3 font-semibold">NETO</th>
                          <th className="p-3 font-semibold">HPP</th>
                          <th className="p-3 font-semibold">HARGA JUAL</th>
                          <th className="p-3 font-semibold">MARGIN</th>
                          <th className="p-3 font-semibold">TERJUAL</th>
                          <th className="p-3 font-semibold">REVENUE</th>
                          <th className="p-3 font-semibold">STOK</th>
                          <th className="p-3 font-semibold">AKSI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineupProducts.map((product) => {
                          const { totalHPP, sellingPrice } = calculateProductHPP(product, costPerGram);
                          const sold = soldByProduct[product.id] || 0;
                          const revenue = sold * sellingPrice;
                          
                          return (
                            <tr key={product.id} className="border-t hover:bg-muted/30">
                              <td className="p-3 font-medium">{product.name}</td>
                              <td className="p-3">{product.netWeight} gr</td>
                              <td className="p-3">{formatCurrency(totalHPP > 0 ? totalHPP : 0)}</td>
                              <td className="p-3 font-semibold text-primary">
                                {formatCurrency(sellingPrice > 0 ? sellingPrice : 0)}
                              </td>
                              <td className="p-3">{product.marginPercentage.toFixed(1)}%</td>
                              <td className="p-3">{sold}</td>
                              <td className="p-3 text-green-600 font-medium">{formatCurrency(revenue)}</td>
                              <td className="p-3">
                                <span className={`font-semibold ${product.stock <= product.stockThreshold ? 'text-destructive' : ''}`}>
                                  {product.stock}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingProduct(product)}
                                  >
                                    <Pencil className="h-4 w-4 text-primary" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteProduct(product.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="bundles" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setBundleDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah Bundel Baru
            </Button>
          </div>

          {bundles.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                No bundles yet. Create your first bundle!
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {bundles.map((bundle) => {
                const bundleProducts = products.filter(p => 
                  bundle.productIds.includes(p.id)
                );
                const totalItems = bundleProducts.length;

                return (
                  <Card key={bundle.id} className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{bundle.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {totalItems} item{totalItems !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingBundle(bundle)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteBundle(bundle.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Products:</span>
                          <ul className="mt-1 space-y-1">
                            {bundleProducts.map(p => (
                              <li key={p.id} className="text-xs">• {p.name}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">Bundle Price</p>
                          <p className="text-xl font-bold text-primary">
                            {formatCurrency(bundle.customPrice)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ProductDialog
        open={productDialogOpen || !!editingProduct}
        onOpenChange={(open) => {
          if (!open) {
            setProductDialogOpen(false);
            setEditingProduct(null);
          }
        }}
        product={editingProduct}
        lineups={lineups}
        products={products}
        onSave={editingProduct ? handleUpdateProduct : handleCreateProduct}
      />

      <BundleDialog
        open={bundleDialogOpen || !!editingBundle}
        onOpenChange={(open) => {
          if (!open) {
            setBundleDialogOpen(false);
            setEditingBundle(null);
          }
        }}
        bundle={editingBundle}
        products={products}
        onSave={editingBundle ? handleUpdateBundle : handleCreateBundle}
      />
    </div>
  );
}
