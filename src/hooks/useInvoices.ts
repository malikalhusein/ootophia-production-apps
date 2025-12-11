import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { InvoiceItem } from "@/lib/invoiceUtils";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  status: string;
  description?: string;
  customerName?: string;
  customerAddress?: string;
  customerPhone?: string;
  customerEmail?: string;
  items: InvoiceItem[];
  subtotal: number;
  total: number;
  transactionIds: string[];
  createdAt: string;
}

export function useInvoices() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((row): Invoice => ({
        id: row.id,
        invoiceNumber: row.invoice_number,
        date: row.date,
        status: row.status,
        description: row.description || undefined,
        customerName: row.customer_name || undefined,
        customerAddress: row.customer_address || undefined,
        customerPhone: row.customer_phone || undefined,
        customerEmail: row.customer_email || undefined,
        items: (row.items as unknown as InvoiceItem[]) || [],
        subtotal: Number(row.subtotal),
        total: Number(row.total),
        transactionIds: row.transaction_ids || [],
        createdAt: row.created_at,
      }));
    },
    enabled: !!user,
  });

  const createInvoice = useMutation({
    mutationFn: async (invoice: Omit<Invoice, "id" | "createdAt">) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("invoices")
        .insert([{
          user_id: user.id,
          invoice_number: invoice.invoiceNumber,
          date: invoice.date,
          status: invoice.status,
          description: invoice.description,
          customer_name: invoice.customerName,
          customer_address: invoice.customerAddress,
          customer_phone: invoice.customerPhone,
          customer_email: invoice.customerEmail,
          items: JSON.parse(JSON.stringify(invoice.items)),
          subtotal: invoice.subtotal,
          total: invoice.total,
          transaction_ids: invoice.transactionIds,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  const deleteInvoice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  return {
    invoices,
    isLoading,
    createInvoice: createInvoice.mutateAsync,
    deleteInvoice: deleteInvoice.mutateAsync,
  };
}
