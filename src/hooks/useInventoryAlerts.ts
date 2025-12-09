import { useEffect, useRef } from 'react';
import { Product } from '@/types';
import { toast } from 'sonner';

export function useInventoryAlerts(products: Product[], isLoading: boolean) {
  const hasShownAlerts = useRef(false);

  useEffect(() => {
    // Only show alerts once after initial load
    if (isLoading || hasShownAlerts.current || products.length === 0) return;

    const lowStockProducts = products.filter(p => p.stock <= p.stockThreshold);
    
    if (lowStockProducts.length > 0) {
      // Show individual alerts for critical items (stock = 0)
      const outOfStock = lowStockProducts.filter(p => p.stock === 0);
      const lowStock = lowStockProducts.filter(p => p.stock > 0);

      outOfStock.forEach(product => {
        toast.error(`${product.name} habis!`, {
          description: 'Stok produk ini sudah habis.',
          duration: 8000,
        });
      });

      if (lowStock.length > 0) {
        toast.warning(`${lowStock.length} produk stok menipis`, {
          description: lowStock.map(p => `${p.name}: ${p.stock} unit`).join(', '),
          duration: 6000,
        });
      }

      hasShownAlerts.current = true;
    }
  }, [products, isLoading]);

  // Reset alerts when products change significantly
  useEffect(() => {
    return () => {
      hasShownAlerts.current = false;
    };
  }, []);

  return {
    lowStockProducts: products.filter(p => p.stock <= p.stockThreshold),
    outOfStockProducts: products.filter(p => p.stock === 0),
  };
}
