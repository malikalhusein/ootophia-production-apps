import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Lineup } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useLineups() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: lineups = [], isLoading } = useQuery({
    queryKey: ['lineups'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: lineupsData, error: lineupsError } = await supabase
        .from('lineups')
        .select('*')
        .order('created_at', { ascending: false });

      if (lineupsError) throw lineupsError;

      const { data: roastLogsData, error: logsError } = await supabase
        .from('roast_logs')
        .select('*');

      if (logsError) throw logsError;

      return lineupsData.map((lineup): Lineup => {
        const logs = roastLogsData.filter((log) => log.lineup_id === lineup.id);
        
        return {
          id: lineup.id,
          name: lineup.name,
          identity: {
            origin: lineup.origin || '',
            process: lineup.process || '',
            variety: lineup.variety || '',
            processor: lineup.processor || '',
            roaster: lineup.roaster || '',
            tastingNotes: lineup.tasting_notes || '',
          },
          purchaseDate: lineup.purchase_date,
          initialWeight: Number(lineup.initial_weight),
          costs: {
            greenBeansPrice: Number(lineup.green_beans_price),
            greenBeansShipping: Number(lineup.green_beans_shipping),
            roastingService: Number(lineup.roasting_service),
            roastingServiceType: "perKg" as const,
            roastingTransport: Number(lineup.roasting_transport),
          },
          roastLogs: logs.map((log) => ({
            id: log.id,
            date: log.date,
            inputWeight: Number(log.input_weight),
            outputWeight: Number(log.output_weight),
          })),
          allocations: {
            rnd: Number(lineup.rnd_allocation),
            promo: Number(lineup.promo_allocation),
          },
          allocationsUsed: {
            rnd: Number(lineup.rnd_allocation_used),
            promo: Number(lineup.promo_allocation_used),
          },
        };
      });
    },
    enabled: !!user,
  });

  const createLineup = useMutation({
    mutationFn: async (lineup: Lineup) => {
      const { data, error } = await supabase
        .from('lineups')
        .insert({
          user_id: user!.id,
          name: lineup.name,
          origin: lineup.identity.origin,
          process: lineup.identity.process,
          variety: lineup.identity.variety,
          processor: lineup.identity.processor,
          roaster: lineup.identity.roaster,
          tasting_notes: lineup.identity.tastingNotes,
          purchase_date: lineup.purchaseDate,
          initial_weight: lineup.initialWeight,
          green_beans_price: lineup.costs.greenBeansPrice,
          green_beans_shipping: lineup.costs.greenBeansShipping,
          roasting_service: lineup.costs.roastingService,
          roasting_transport: lineup.costs.roastingTransport,
          rnd_allocation: lineup.allocations.rnd,
          promo_allocation: lineup.allocations.promo,
          rnd_allocation_used: lineup.allocationsUsed.rnd,
          promo_allocation_used: lineup.allocationsUsed.promo,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lineups'] });
    },
  });

  const updateLineup = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Lineup> }) => {
      const dbUpdates: any = {};
      
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.identity) {
        if (updates.identity.origin !== undefined) dbUpdates.origin = updates.identity.origin;
        if (updates.identity.process !== undefined) dbUpdates.process = updates.identity.process;
        if (updates.identity.variety !== undefined) dbUpdates.variety = updates.identity.variety;
        if (updates.identity.processor !== undefined) dbUpdates.processor = updates.identity.processor;
        if (updates.identity.roaster !== undefined) dbUpdates.roaster = updates.identity.roaster;
        if (updates.identity.tastingNotes !== undefined) dbUpdates.tasting_notes = updates.identity.tastingNotes;
      }
      if (updates.purchaseDate !== undefined) dbUpdates.purchase_date = updates.purchaseDate;
      if (updates.initialWeight !== undefined) dbUpdates.initial_weight = updates.initialWeight;
      if (updates.costs) {
        if (updates.costs.greenBeansPrice !== undefined) dbUpdates.green_beans_price = updates.costs.greenBeansPrice;
        if (updates.costs.greenBeansShipping !== undefined) dbUpdates.green_beans_shipping = updates.costs.greenBeansShipping;
        if (updates.costs.roastingService !== undefined) dbUpdates.roasting_service = updates.costs.roastingService;
        if (updates.costs.roastingTransport !== undefined) dbUpdates.roasting_transport = updates.costs.roastingTransport;
      }
      if (updates.allocations) {
        if (updates.allocations.rnd !== undefined) dbUpdates.rnd_allocation = updates.allocations.rnd;
        if (updates.allocations.promo !== undefined) dbUpdates.promo_allocation = updates.allocations.promo;
      }
      if (updates.allocationsUsed) {
        if (updates.allocationsUsed.rnd !== undefined) dbUpdates.rnd_allocation_used = updates.allocationsUsed.rnd;
        if (updates.allocationsUsed.promo !== undefined) dbUpdates.promo_allocation_used = updates.allocationsUsed.promo;
      }

      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await supabase
          .from('lineups')
          .update(dbUpdates)
          .eq('id', id);
        
        if (error) throw error;
      }

      // Handle roast logs updates
      if (updates.roastLogs) {
        const currentLogs = lineups.find(l => l.id === id)?.roastLogs || [];
        const newLogs = updates.roastLogs;

        // Delete removed logs
        const removedLogIds = currentLogs
          .filter(log => !newLogs.find(nl => nl.id === log.id))
          .map(log => log.id);
        
        if (removedLogIds.length > 0) {
          await supabase
            .from('roast_logs')
            .delete()
            .in('id', removedLogIds);
        }

        // Update or insert logs
        for (const log of newLogs) {
          if (currentLogs.find(cl => cl.id === log.id)) {
            await supabase
              .from('roast_logs')
              .update({
                date: log.date,
                input_weight: log.inputWeight,
                output_weight: log.outputWeight,
              })
              .eq('id', log.id);
          } else {
            await supabase
              .from('roast_logs')
              .insert({
                id: log.id,
                lineup_id: id,
                date: log.date,
                input_weight: log.inputWeight,
                output_weight: log.outputWeight,
              });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lineups'] });
    },
  });

  const deleteLineup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lineups')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lineups'] });
    },
  });

  return {
    lineups,
    isLoading,
    createLineup: createLineup.mutate,
    updateLineup: updateLineup.mutate,
    deleteLineup: deleteLineup.mutate,
  };
}
