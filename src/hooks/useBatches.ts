import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Batch {
  id: string;
  userId: string;
  name: string;
  theme: string | null;
  description: string | null;
  code: string;
  startDate: string;
  createdAt: string | null;
  updatedAt: string | null;
}

interface DbBatch {
  id: string;
  user_id: string;
  name: string;
  theme: string | null;
  description: string | null;
  code: string;
  start_date: string;
  created_at: string | null;
  updated_at: string | null;
}

function mapDbBatchToBatch(dbBatch: DbBatch): Batch {
  return {
    id: dbBatch.id,
    userId: dbBatch.user_id,
    name: dbBatch.name,
    theme: dbBatch.theme,
    description: dbBatch.description,
    code: dbBatch.code,
    startDate: dbBatch.start_date,
    createdAt: dbBatch.created_at,
    updatedAt: dbBatch.updated_at,
  };
}

export function useBatches() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ["batches", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("batches")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as DbBatch[]).map(mapDbBatchToBatch);
    },
    enabled: !!user,
  });

  const createBatch = useMutation({
    mutationFn: async (batch: Omit<Batch, "id" | "userId" | "createdAt" | "updatedAt">) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("batches")
        .insert({
          user_id: user.id,
          name: batch.name,
          theme: batch.theme,
          description: batch.description,
          code: batch.code,
          start_date: batch.startDate,
        })
        .select()
        .single();

      if (error) throw error;
      return mapDbBatchToBatch(data as DbBatch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
    },
  });

  const updateBatch = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Batch> }) => {
      const dbUpdates: Partial<DbBatch> = {};
      
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.theme !== undefined) dbUpdates.theme = updates.theme;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.code !== undefined) dbUpdates.code = updates.code;
      if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;

      const { error } = await supabase
        .from("batches")
        .update(dbUpdates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
    },
  });

  const deleteBatch = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("batches")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["lineups"] });
    },
  });

  // Generate next batch code (e.g., B01, B02, etc.)
  const getNextBatchCode = (): string => {
    if (batches.length === 0) return "B01";
    
    const existingCodes = batches
      .map(b => b.code)
      .filter(code => /^B\d+$/.test(code))
      .map(code => parseInt(code.substring(1), 10));
    
    const maxCode = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
    return `B${String(maxCode + 1).padStart(2, "0")}`;
  };

  return {
    batches,
    isLoading,
    createBatch: createBatch.mutate,
    updateBatch: updateBatch.mutate,
    deleteBatch: deleteBatch.mutate,
    getNextBatchCode,
  };
}
