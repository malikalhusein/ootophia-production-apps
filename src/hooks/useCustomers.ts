import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Customer {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  notes?: string;
  isMember: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useCustomers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (error) throw error;

      return (data || []).map((row): Customer => ({
        id: row.id,
        name: row.name,
        address: row.address || undefined,
        phone: row.phone || undefined,
        email: row.email || undefined,
        notes: row.notes || undefined,
        isMember: row.is_member || false,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },
    enabled: !!user,
  });

  const createCustomer = useMutation({
    mutationFn: async (customer: Omit<Customer, "id" | "createdAt" | "updatedAt">) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("customers")
        .insert([{
          user_id: user.id,
          name: customer.name,
          address: customer.address,
          phone: customer.phone,
          email: customer.email,
          notes: customer.notes,
          is_member: customer.isMember,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  const updateCustomer = useMutation({
    mutationFn: async ({ id, ...customer }: Partial<Customer> & { id: string }) => {
      const { error } = await supabase
        .from("customers")
        .update({
          name: customer.name,
          address: customer.address,
          phone: customer.phone,
          email: customer.email,
          notes: customer.notes,
          is_member: customer.isMember,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  const deleteCustomer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  return {
    customers,
    isLoading,
    createCustomer: createCustomer.mutateAsync,
    updateCustomer: updateCustomer.mutateAsync,
    deleteCustomer: deleteCustomer.mutateAsync,
  };
}
