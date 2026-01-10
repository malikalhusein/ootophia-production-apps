import { useState, useEffect } from "react";
import { useBatches, Batch } from "@/hooks/useBatches";
import { useLineups } from "@/hooks/useLineups";
import { useProducts } from "@/hooks/useProducts";
import { useTransactions } from "@/hooks/useTransactions";
import { Lineup } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { BatchHeader } from "@/components/CostCalculator/BatchHeader";
import { BatchListView } from "@/components/CostCalculator/BatchListView";
import { LineupTabs } from "@/components/CostCalculator/LineupTabs";

function generateUUID() {
  return crypto.randomUUID();
}

export default function CostCalculator() {
  const { batches, isLoading: batchesLoading, createBatch, updateBatch, deleteBatch, getNextBatchCode } = useBatches();
  const { lineups, isLoading: lineupsLoading, createLineup, updateLineup, deleteLineup } = useLineups();
  const { products } = useProducts();
  const { transactions } = useTransactions();
  const { toast } = useToast();
  
  // Selected batch ID (null means showing batch list view)
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  // Active lineup tab within the selected batch
  const [activeLineupId, setActiveLineupId] = useState<string>("");

  const selectedBatch = batches.find(b => b.id === selectedBatchId) || null;
  const batchLineups = lineups.filter(l => l.batchId === selectedBatchId);

  // When batch is selected, auto-select first lineup
  useEffect(() => {
    if (selectedBatchId && batchLineups.length > 0 && !activeLineupId) {
      setActiveLineupId(batchLineups[0].id);
    }
  }, [selectedBatchId, batchLineups, activeLineupId]);

  // Reset active lineup when batch changes
  useEffect(() => {
    if (selectedBatchId) {
      const firstLineup = lineups.find(l => l.batchId === selectedBatchId);
      setActiveLineupId(firstLineup?.id || "");
    }
  }, [selectedBatchId, lineups]);

  const handleSelectBatch = (batchId: string) => {
    setSelectedBatchId(batchId);
    setActiveLineupId("");
  };

  const handleBackToAllBatches = () => {
    setSelectedBatchId(null);
    setActiveLineupId("");
  };

  const handleCreateBatch = (batch: Omit<Batch, "id" | "userId" | "createdAt" | "updatedAt">) => {
    createBatch(batch, {
      onSuccess: () => {
        toast({
          title: "Batch Created",
          description: `${batch.name} has been created successfully.`,
        });
      },
    });
  };

  const handleUpdateBatch = (id: string, updates: Partial<Batch>) => {
    updateBatch({ id, updates }, {
      onSuccess: () => {
        toast({
          title: "Batch Updated",
          description: "Batch details have been updated.",
        });
      },
    });
  };

  const handleAddLineup = () => {
    if (!selectedBatch) return;
    
    const batchLineupsCount = batchLineups.length;
    const lineupCode = `${selectedBatch.code}-LU${String(batchLineupsCount + 1).padStart(2, "0")}`;
    
    const newLineup: Lineup = {
      id: generateUUID(),
      name: `New Lineup ${batchLineupsCount + 1}`,
      identity: {
        origin: "",
        process: "",
        variety: "",
        processor: "",
        roaster: "",
        tastingNotes: "",
      },
      purchaseDate: new Date().toISOString().split("T")[0],
      initialWeight: 0,
      costs: {
        greenBeansPrice: 0,
        greenBeansShipping: 0,
        roastingService: 0,
        roastingServiceType: "perKg" as const,
        roastingTransport: 0,
      },
      roastLogs: [],
      allocations: {
        rnd: 0,
        promo: 0,
      },
      allocationsUsed: {
        rnd: 0,
        promo: 0,
      },
      batchId: selectedBatch.id,
      lineupCode: lineupCode,
      category: "coffee",
    };
    
    createLineup(newLineup);
    setActiveLineupId(newLineup.id);
  };

  const handleRemoveLineup = (id: string) => {
    deleteLineup(id);
    if (activeLineupId === id && batchLineups.length > 1) {
      const remaining = batchLineups.filter((l) => l.id !== id);
      if (remaining.length > 0) {
        setActiveLineupId(remaining[0].id);
      }
    }
  };

  const handleUpdateLineup = (id: string, updates: Partial<Lineup>) => {
    updateLineup({ id, updates });
  };

  const handleSaveLineup = (lineup: Lineup) => {
    updateLineup({ id: lineup.id, updates: lineup });
    toast({
      title: "Saved",
      description: "Lineup data has been saved to database",
    });
  };

  const isLoading = batchesLoading || lineupsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // No batch selected - show batch list view
  if (!selectedBatchId) {
    return (
      <div className="space-y-6">
        <BatchHeader
          batches={batches}
          selectedBatch={null}
          onSelectBatch={handleSelectBatch}
          onCreateBatch={handleCreateBatch}
          onUpdateBatch={handleUpdateBatch}
          getNextBatchCode={getNextBatchCode}
          onBackToAllBatches={handleBackToAllBatches}
        />
        
        <BatchListView
          batches={batches}
          lineups={lineups}
          onSelectBatch={handleSelectBatch}
          onCreateBatch={() => {
            // Open create dialog via BatchHeader
            const code = getNextBatchCode();
            handleCreateBatch({
              name: `Batch ${code}`,
              theme: null,
              description: null,
              code: code,
              startDate: new Date().toISOString().split("T")[0],
            });
          }}
        />
      </div>
    );
  }

  // Batch selected - show batch header + lineup tabs
  return (
    <div className="space-y-6">
      <BatchHeader
        batches={batches}
        selectedBatch={selectedBatch}
        onSelectBatch={handleSelectBatch}
        onCreateBatch={handleCreateBatch}
        onUpdateBatch={handleUpdateBatch}
        getNextBatchCode={getNextBatchCode}
        onBackToAllBatches={handleBackToAllBatches}
      />
      
      {selectedBatch && (
        <LineupTabs
          batch={selectedBatch}
          lineups={lineups}
          products={products}
          transactions={transactions}
          activeLineupId={activeLineupId}
          onSelectLineup={setActiveLineupId}
          onAddLineup={handleAddLineup}
          onRemoveLineup={handleRemoveLineup}
          onUpdateLineup={handleUpdateLineup}
          onSaveLineup={handleSaveLineup}
        />
      )}
    </div>
  );
}
