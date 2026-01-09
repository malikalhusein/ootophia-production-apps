import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PaymentMethod {
  type: string;
  details: string;
}

interface Profile {
  id: string;
  businessName: string;
  logo: string;
  themeHue: number;
  address: string;
  email: string;
  phone: string;
  paymentMethods: PaymentMethod[];
}

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        businessName: data.business_name || 'My Coffee Business',
        logo: data.logo || '',
        themeHue: Number(data.theme_hue) || 150,
        address: data.address || '',
        email: data.email || '',
        phone: data.phone || '',
        paymentMethods: (data.payment_methods as unknown as PaymentMethod[]) || [],
      } as Profile;
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user) throw new Error('No user');

      const dbUpdates: Record<string, unknown> = {};
      if (updates.businessName !== undefined) dbUpdates.business_name = updates.businessName;
      if (updates.logo !== undefined) dbUpdates.logo = updates.logo;
      if (updates.themeHue !== undefined) dbUpdates.theme_hue = updates.themeHue;
      if (updates.address !== undefined) dbUpdates.address = updates.address;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.paymentMethods !== undefined) dbUpdates.payment_methods = updates.paymentMethods;

      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return {
    profile,
    isLoading,
    updateProfile: updateProfile.mutateAsync,
  };
}
