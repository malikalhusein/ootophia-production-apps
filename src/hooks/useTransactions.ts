import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useTransactions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      return data.map((transaction): Transaction => ({
        id: transaction.id,
        date: transaction.date,
        status: transaction.status as 'sale' | 'promo' | 'rnd' | 'bonus',
        productId: transaction.product_id || undefined,
        lineupId: transaction.lineup_id || undefined,
        quantity: Number(transaction.quantity),
        totalValue: Number(transaction.total_value),
        description: transaction.description || '',
      }));
    },
    enabled: !!user,
  });

  const createTransaction = useMutation({
    mutationFn: async (transaction: Transaction) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user!.id,
          date: transaction.date,
          status: transaction.status,
          product_id: transaction.productId || null,
          lineup_id: transaction.lineupId || null,
          quantity: transaction.quantity,
          total_value: transaction.totalValue,
          description: transaction.description,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  return {
    transactions,
    isLoading,
    createTransaction: createTransaction.mutate,
    deleteTransaction: deleteTransaction.mutate,
  };
}
