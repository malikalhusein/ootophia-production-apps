import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StockAdjustment {
  id: string;
  productId: string;
  previousStock: number;
  newStock: number;
  adjustmentType: 'manual' | 'sale' | 'return' | 'correction' | 'initial';
  reason?: string;
  transactionId?: string;
  createdAt: string;
}

export function useStockAdjustments(productId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: adjustments = [], isLoading } = useQuery({
    queryKey: ['stock_adjustments', productId],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('stock_adjustments')
        .select('*')
        .order('created_at', { ascending: false });

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;

      return data.map((adj): StockAdjustment => ({
        id: adj.id,
        productId: adj.product_id,
        previousStock: adj.previous_stock,
        newStock: adj.new_stock,
        adjustmentType: adj.adjustment_type as StockAdjustment['adjustmentType'],
        reason: adj.reason || undefined,
        transactionId: adj.transaction_id || undefined,
        createdAt: adj.created_at,
      }));
    },
    enabled: !!user,
  });

  const createAdjustment = useMutation({
    mutationFn: async (adjustment: Omit<StockAdjustment, 'id' | 'createdAt'>) => {
      const { data, error } = await supabase
        .from('stock_adjustments')
        .insert({
          user_id: user!.id,
          product_id: adjustment.productId,
          previous_stock: adjustment.previousStock,
          new_stock: adjustment.newStock,
          adjustment_type: adjustment.adjustmentType,
          reason: adjustment.reason || null,
          transaction_id: adjustment.transactionId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_adjustments'] });
    },
  });

  return {
    adjustments,
    isLoading,
    createAdjustment: createAdjustment.mutateAsync,
  };
}
