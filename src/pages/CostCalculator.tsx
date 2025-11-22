import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Lineup } from "@/types";
import { LineupForm } from "@/components/CostCalculator/LineupForm";

function generateUUID() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export default function CostCalculator() {
  const [lineups, setLineups] = useLocalStorage<Lineup[]>("lineups", []);
  const [activeTab, setActiveTab] = useState<string>(
    lineups.length > 0 ? lineups[0].id : ""
  );

  const addLineup = () => {
    const newLineup: Lineup = {
      id: generateUUID(),
      name: `Batch ${lineups.length + 1}`,
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
    };
    setLineups([...lineups, newLineup]);
    setActiveTab(newLineup.id);
  };

  const removeLineup = (id: string) => {
    const updated = lineups.filter((l) => l.id !== id);
    setLineups(updated);
    if (activeTab === id && updated.length > 0) {
      setActiveTab(updated[0].id);
    }
  };

  const updateLineup = (id: string, updates: Partial<Lineup>) => {
    setLineups(lineups.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Batch Management</h2>
          <p className="text-sm text-muted-foreground">
            Track your coffee batches from green beans to roasted products
          </p>
        </div>
        <Button onClick={addLineup} className="gap-2">
          <Plus className="h-4 w-4" />
          New Batch
        </Button>
      </div>

      {lineups.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No batches yet</p>
            <Button onClick={addLineup} className="gap-2">
              <Plus className="h-4 w-4" />
              Create First Batch
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b border-border px-6 pt-6">
                <TabsList className="w-full justify-start h-auto flex-wrap">
                  {lineups.map((lineup) => (
                    <div key={lineup.id} className="relative group">
                      <TabsTrigger value={lineup.id} className="gap-2">
                        {lineup.name}
                      </TabsTrigger>
                      {lineups.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeLineup(lineup.id);
                          }}
                          className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </TabsList>
              </div>

              {lineups.map((lineup) => (
                <TabsContent key={lineup.id} value={lineup.id} className="p-6 mt-0">
                  <LineupForm
                    lineup={lineup}
                    onUpdate={(updates) => updateLineup(lineup.id, updates)}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
