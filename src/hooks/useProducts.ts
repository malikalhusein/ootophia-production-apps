import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useProducts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((product): Product => ({
        id: product.id,
        lineupId: product.lineup_id,
        name: product.name,
        netWeight: Number(product.net_weight),
        packagingCost: Number(product.packaging_cost),
        labelCost: Number(product.label_cost),
        marketingCost: Number(product.marketing_cost),
        marginPercentage: Number(product.margin_percentage),
        stock: product.stock,
        stockThreshold: product.stock_threshold,
      }));
    },
    enabled: !!user,
  });

  const createProduct = useMutation({
    mutationFn: async (product: Product) => {
      const { data, error } = await supabase
        .from('products')
        .insert({
          user_id: user!.id,
          lineup_id: product.lineupId,
          name: product.name,
          net_weight: product.netWeight,
          packaging_cost: product.packagingCost,
          label_cost: product.labelCost,
          marketing_cost: product.marketingCost,
          margin_percentage: product.marginPercentage,
          stock: product.stock,
          stock_threshold: product.stockThreshold,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['lineups'] });
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Product> }) => {
      const dbUpdates: any = {};
      
      if (updates.lineupId !== undefined) dbUpdates.lineup_id = updates.lineupId;
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.netWeight !== undefined) dbUpdates.net_weight = updates.netWeight;
      if (updates.packagingCost !== undefined) dbUpdates.packaging_cost = updates.packagingCost;
      if (updates.labelCost !== undefined) dbUpdates.label_cost = updates.labelCost;
      if (updates.marketingCost !== undefined) dbUpdates.marketing_cost = updates.marketingCost;
      if (updates.marginPercentage !== undefined) dbUpdates.margin_percentage = updates.marginPercentage;
      if (updates.stock !== undefined) dbUpdates.stock = updates.stock;
      if (updates.stockThreshold !== undefined) dbUpdates.stock_threshold = updates.stockThreshold;

      const { error } = await supabase
        .from('products')
        .update(dbUpdates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['lineups'] });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return {
    products,
    isLoading,
    createProduct: createProduct.mutate,
    updateProduct: updateProduct.mutate,
    deleteProduct: deleteProduct.mutate,
  };
}
