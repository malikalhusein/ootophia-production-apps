import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X } from "lucide-react";
import { Lineup, Product, Transaction } from "@/types";
import { LineupForm } from "./LineupForm";
import { Batch } from "@/hooks/useBatches";

interface LineupTabsProps {
  batch: Batch;
  lineups: Lineup[];
  products: Product[];
  transactions: Transaction[];
  activeLineupId: string;
  onSelectLineup: (lineupId: string) => void;
  onAddLineup: () => void;
  onRemoveLineup: (lineupId: string) => void;
  onUpdateLineup: (id: string, updates: Partial<Lineup>) => void;
  onSaveLineup: (lineup: Lineup) => void;
}

export function LineupTabs({
  batch,
  lineups,
  products,
  transactions,
  activeLineupId,
  onSelectLineup,
  onAddLineup,
  onRemoveLineup,
  onUpdateLineup,
  onSaveLineup,
}: LineupTabsProps) {
  // Filter lineups for this batch
  const batchLineups = lineups.filter(l => l.batchId === batch.id);

  if (batchLineups.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">No lineups in this batch yet</p>
          <Button onClick={onAddLineup} className="gap-2">
            <Plus className="h-4 w-4" />
            Add First Lineup
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="p-0">
        <Tabs value={activeLineupId} onValueChange={onSelectLineup}>
          <div className="border-b border-border px-4 md:px-6 pt-4 md:pt-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <TabsList className="h-auto flex-wrap justify-start bg-transparent p-0 gap-1">
                {batchLineups.map((lineup, index) => (
                  <div key={lineup.id} className="relative group">
                    <TabsTrigger 
                      value={lineup.id} 
                      className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary px-3 py-2"
                    >
                      <span className="font-mono text-xs text-muted-foreground">
                        {batch.code}-LU{String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="max-w-[120px] truncate">{lineup.name}</span>
                    </TabsTrigger>
                    {batchLineups.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveLineup(lineup.id);
                        }}
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </TabsList>
              
              <Button 
                onClick={onAddLineup} 
                size="sm" 
                variant="outline" 
                className="gap-1 shrink-0"
              >
                <Plus className="h-4 w-4" />
                Add Lineup
              </Button>
            </div>
          </div>

          {batchLineups.map((lineup, index) => {
            const lineupProducts = products.filter(p => p.lineupId === lineup.id);
            const lineupProductIds = new Set(lineupProducts.map(p => p.id));
            const lineupTransactions = transactions.filter(t => 
              t.productId && lineupProductIds.has(t.productId)
            );
            
            // Generate lineup code
            const lineupCode = `${batch.code}-LU${String(index + 1).padStart(2, "0")}`;
            
            return (
              <TabsContent key={lineup.id} value={lineup.id} className="p-4 md:p-6 mt-0">
                <LineupForm
                  lineup={lineup}
                  lineupCode={lineupCode}
                  products={lineupProducts}
                  transactions={lineupTransactions}
                  onUpdate={(updates) => onUpdateLineup(lineup.id, updates)}
                  onSave={onSaveLineup}
                />
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
