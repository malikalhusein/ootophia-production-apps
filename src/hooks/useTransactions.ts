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
        bundleId: transaction.bundle_id || undefined,
        lineupId: transaction.lineup_id || undefined,
        quantity: Number(transaction.quantity),
        totalValue: Number(transaction.total_value),
        description: transaction.description || '',
        customerName: transaction.customer_name || undefined,
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
          bundle_id: transaction.bundleId || null,
          lineup_id: transaction.lineupId || null,
          quantity: transaction.quantity,
          total_value: transaction.totalValue,
          description: transaction.description,
          customer_name: transaction.customerName || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['lineups'] });
    },
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Transaction> }) => {
      const dbUpdates: Record<string, unknown> = {};
      
      if (updates.date !== undefined) dbUpdates.date = updates.date;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.productId !== undefined) dbUpdates.product_id = updates.productId || null;
      if (updates.bundleId !== undefined) dbUpdates.bundle_id = updates.bundleId || null;
      if (updates.lineupId !== undefined) dbUpdates.lineup_id = updates.lineupId || null;
      if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
      if (updates.totalValue !== undefined) dbUpdates.total_value = updates.totalValue;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.customerName !== undefined) dbUpdates.customer_name = updates.customerName || null;

      const { error } = await supabase
        .from('transactions')
        .update(dbUpdates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['lineups'] });
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
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['lineups'] });
    },
  });

  return {
    transactions,
    isLoading,
    createTransaction: createTransaction.mutateAsync,
    updateTransaction: updateTransaction.mutateAsync,
    deleteTransaction: deleteTransaction.mutateAsync,
  };
}
