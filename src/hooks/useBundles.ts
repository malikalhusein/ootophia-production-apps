import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Bundle } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useBundles() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: bundles = [], isLoading } = useQuery({
    queryKey: ['bundles'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: bundlesData, error: bundlesError } = await supabase
        .from('bundles')
        .select('*, bundle_products(product_id)')
        .order('name');

      if (bundlesError) throw bundlesError;

      return bundlesData.map((bundle): Bundle => ({
        id: bundle.id,
        name: bundle.name,
        customPrice: Number(bundle.custom_price),
        productIds: bundle.bundle_products?.map((bp: any) => bp.product_id) || [],
      }));
    },
    enabled: !!user,
  });

  const createBundle = useMutation({
    mutationFn: async (bundle: Bundle) => {
      const { data: bundleData, error: bundleError } = await supabase
        .from('bundles')
        .insert({
          user_id: user!.id,
          name: bundle.name,
          custom_price: bundle.customPrice,
        })
        .select()
        .single();

      if (bundleError) throw bundleError;

      // Insert bundle products
      if (bundle.productIds.length > 0) {
        const { error: productsError } = await supabase
          .from('bundle_products')
          .insert(
            bundle.productIds.map(productId => ({
              bundle_id: bundleData.id,
              product_id: productId,
            }))
          );

        if (productsError) throw productsError;
      }

      return bundleData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundles'] });
    },
  });

  const updateBundle = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Bundle> }) => {
      // Update bundle
      const { error: bundleError } = await supabase
        .from('bundles')
        .update({
          name: updates.name,
          custom_price: updates.customPrice,
        })
        .eq('id', id);

      if (bundleError) throw bundleError;

      // Update bundle products if provided
      if (updates.productIds) {
        // Delete existing products
        await supabase
          .from('bundle_products')
          .delete()
          .eq('bundle_id', id);

        // Insert new products
        if (updates.productIds.length > 0) {
          const { error: productsError } = await supabase
            .from('bundle_products')
            .insert(
              updates.productIds.map(productId => ({
                bundle_id: id,
                product_id: productId,
              }))
            );

          if (productsError) throw productsError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundles'] });
    },
  });

  const deleteBundle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bundles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundles'] });
    },
  });

  return {
    bundles,
    isLoading,
    createBundle: createBundle.mutate,
    updateBundle: updateBundle.mutate,
    deleteBundle: deleteBundle.mutate,
  };
}
