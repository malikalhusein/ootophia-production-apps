import { useCallback, useMemo, useState, useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { Lineup, RoastLog } from "@/types";
import { 
  calculateTotalInitialCost, 
  calculateTotalRoastedOutput,
  calculateShrinkagePercentage,
  calculateCostPerGram,
  calculateWeightForSale,
  formatCurrency,
  formatWeight
} from "@/lib/calculations";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";

interface LineupFormProps {
  lineup: Lineup;
  onUpdate: (updates: Partial<Lineup>) => void;
  onSave?: (lineup: Lineup) => void;
}

function generateID() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function LineupForm({ lineup, onUpdate, onSave }: LineupFormProps) {
  // Local state for inputs to prevent lag
  const [localLineup, setLocalLineup] = useState(lineup);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasUnsavedRoastLogs, setHasUnsavedRoastLogs] = useState(false);
  
  // Update local state when lineup prop changes from parent
  useEffect(() => {
    setLocalLineup(lineup);
  }, [lineup.id]); // Only update when switching between different lineups

  const totalCost = useMemo(() => calculateTotalInitialCost(localLineup), [localLineup]);
  const totalOutput = useMemo(() => calculateTotalRoastedOutput(localLineup), [localLineup]);
  const shrinkage = useMemo(() => calculateShrinkagePercentage(localLineup), [localLineup]);
  const costPerGram = useMemo(() => calculateCostPerGram(localLineup), [localLineup]);
  const weightForSale = useMemo(() => calculateWeightForSale(localLineup), [localLineup]);

  // Debounced update to parent
  useEffect(() => {
    const timer = setTimeout(() => {
      onUpdate(localLineup);
      setHasUnsavedChanges(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [localLineup, onUpdate]);

  const handleSave = () => {
    if (onSave) {
      onSave(localLineup);
      setHasUnsavedChanges(false);
    }
  };

  const addRoastLog = useCallback(() => {
    const newLog: RoastLog = {
      id: generateID(),
      date: new Date().toISOString().split("T")[0],
      inputWeight: 0,
      outputWeight: 0,
    };
    setLocalLineup(prev => ({ ...prev, roastLogs: [...prev.roastLogs, newLog] }));
    setHasUnsavedRoastLogs(true);
  }, []);

  const updateRoastLog = useCallback((id: string, updates: Partial<RoastLog>) => {
    setLocalLineup(prev => ({
      ...prev,
      roastLogs: prev.roastLogs.map((log) =>
        log.id === id ? { ...log, ...updates } : log
      ),
    }));
    setHasUnsavedRoastLogs(true);
  }, []);

  const removeRoastLog = useCallback((id: string) => {
    setLocalLineup(prev => ({
      ...prev,
      roastLogs: prev.roastLogs.filter((log) => log.id !== id),
    }));
    setHasUnsavedRoastLogs(true);
  }, []);

  const handleSaveRoastLogs = () => {
    if (onSave) {
      onSave(localLineup);
      setHasUnsavedRoastLogs(false);
      setHasUnsavedChanges(false);
    }
  };

  const handleIdentityChange = useCallback((field: string, value: string) => {
    setLocalLineup(prev => ({
      ...prev,
      identity: { ...prev.identity, [field]: value },
    }));
  }, []);

  const handleCostsChange = useCallback((field: string, value: number) => {
    setLocalLineup(prev => ({
      ...prev,
      costs: { ...prev.costs, [field]: value },
    }));
  }, []);

  const handleAllocationsChange = useCallback((field: string, value: number) => {
    setLocalLineup(prev => ({
      ...prev,
      allocations: { ...prev.allocations, [field]: value },
    }));
  }, []);

  const chartData = useMemo(() => localLineup.roastLogs.map((log, index) => ({
    name: `Roast ${index + 1}`,
    input: log.inputWeight,
    output: log.outputWeight,
  })), [localLineup.roastLogs]);

  return (
    <div className="space-y-6">
      {hasUnsavedChanges && (
        <div className="flex items-center justify-between p-4 bg-accent/10 border border-accent rounded-lg">
          <p className="text-sm text-muted-foreground">You have unsaved changes</p>
          <Button onClick={handleSave} size="sm">
            Save Changes
          </Button>
        </div>
      )}
      <Accordion type="single" collapsible defaultValue="identity" className="w-full">
        {/* Coffee Identity */}
        <AccordionItem value="identity">
          <AccordionTrigger className="text-base font-semibold">
            Coffee Identity
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Batch Name</Label>
                <Input
                  id="name"
                  value={localLineup.name}
                  onChange={(e) => setLocalLineup(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Ethiopia Yirgacheffe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="origin">Origin</Label>
                <Input
                  id="origin"
                  value={localLineup.identity.origin}
                  onChange={(e) => handleIdentityChange('origin', e.target.value)}
                  placeholder="e.g., Ethiopia"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="process">Process</Label>
                <Input
                  id="process"
                  value={localLineup.identity.process}
                  onChange={(e) => handleIdentityChange('process', e.target.value)}
                  placeholder="e.g., Washed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="variety">Variety</Label>
                <Input
                  id="variety"
                  value={localLineup.identity.variety}
                  onChange={(e) => handleIdentityChange('variety', e.target.value)}
                  placeholder="e.g., Heirloom"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="processor">Processor</Label>
                <Input
                  id="processor"
                  value={localLineup.identity.processor}
                  onChange={(e) => handleIdentityChange('processor', e.target.value)}
                  placeholder="Processor name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roaster">Roaster</Label>
                <Input
                  id="roaster"
                  value={localLineup.identity.roaster}
                  onChange={(e) => handleIdentityChange('roaster', e.target.value)}
                  placeholder="Roaster name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tastingNotes">Tasting Notes</Label>
              <Textarea
                id="tastingNotes"
                value={localLineup.identity.tastingNotes}
                onChange={(e) => handleIdentityChange('tastingNotes', e.target.value)}
                placeholder="Describe flavor profile..."
                rows={3}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Production Monitoring */}
        <AccordionItem value="production">
          <AccordionTrigger className="text-base font-semibold">
            Production Monitoring
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pt-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={localLineup.purchaseDate}
                  onChange={(e) => setLocalLineup(prev => ({ ...prev, purchaseDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="initialWeight">Initial Weight (g)</Label>
                <Input
                  id="initialWeight"
                  type="number"
                  value={localLineup.initialWeight || ""}
                  onChange={(e) => setLocalLineup(prev => ({ ...prev, initialWeight: Number(e.target.value) }))}
                  placeholder="1000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="greenBeansPrice">Green Beans Price (IDR/kg)</Label>
                <Input
                  id="greenBeansPrice"
                  type="number"
                  value={localLineup.costs.greenBeansPrice || ""}
                  onChange={(e) => handleCostsChange('greenBeansPrice', Number(e.target.value))}
                  placeholder="100000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="greenBeansShipping">Shipping Cost (IDR)</Label>
                <Input
                  id="greenBeansShipping"
                  type="number"
                  value={localLineup.costs.greenBeansShipping || ""}
                  onChange={(e) => handleCostsChange('greenBeansShipping', Number(e.target.value))}
                  placeholder="50000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roastingService">Roasting Service (IDR/kg)</Label>
                <Input
                  id="roastingService"
                  type="number"
                  step="0.01"
                  value={localLineup.costs.roastingService || ""}
                  onChange={(e) => handleCostsChange('roastingService', Number(e.target.value))}
                  placeholder="25000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roastingTransport">Roasting Transport (IDR)</Label>
                <Input
                  id="roastingTransport"
                  type="number"
                  value={localLineup.costs.roastingTransport || ""}
                  onChange={(e) => handleCostsChange('roastingTransport', Number(e.target.value))}
                  placeholder="20000"
                />
              </div>
            </div>

            {/* Roast Logs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Roast Logs</Label>
                <div className="flex gap-2">
                  {hasUnsavedRoastLogs && (
                    <Button onClick={handleSaveRoastLogs} size="sm" variant="default">
                      Save Roast Logs
                    </Button>
                  )}
                  <Button onClick={addRoastLog} size="sm" variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Roast
                  </Button>
                </div>
              </div>

              {localLineup.roastLogs.length > 0 ? (
                <div className="space-y-3">
                  {localLineup.roastLogs.map((log) => (
                    <Card key={log.id} className="p-4">
                      <div className="grid gap-3 md:grid-cols-4">
                        <div className="space-y-1">
                          <Label className="text-xs">Date</Label>
                          <Input
                            type="date"
                            value={log.date}
                            onChange={(e) =>
                              updateRoastLog(log.id, { date: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Input (g)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={log.inputWeight || ""}
                            onChange={(e) =>
                              updateRoastLog(log.id, { inputWeight: Number(e.target.value) })
                            }
                            placeholder="1000"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Output (g)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={log.outputWeight || ""}
                            onChange={(e) =>
                              updateRoastLog(log.id, { outputWeight: Number(e.target.value) })
                            }
                            placeholder="850"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRoastLog(log.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No roast logs yet. Click "Add Roast" to start tracking.
                </p>
              )}

              {/* Chart */}
              {chartData.length > 0 && (
                <Card className="p-4">
                  <h4 className="text-sm font-semibold mb-4">Input vs Output</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="input" fill="hsl(var(--primary))" name="Input (g)" />
                      <Bar dataKey="output" fill="hsl(var(--accent))" name="Output (g)" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Allocations */}
        <AccordionItem value="allocations">
          <AccordionTrigger className="text-base font-semibold">
            Bean Allocations
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rndQuota">R&D Quota (g)</Label>
                <Input
                  id="rndQuota"
                  type="number"
                  value={localLineup.allocations.rnd || ""}
                  onChange={(e) => handleAllocationsChange('rnd', Number(e.target.value))}
                  placeholder="100"
                />
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Used: {localLineup.allocationsUsed.rnd}g</span>
                    <span>Remaining: {localLineup.allocations.rnd - localLineup.allocationsUsed.rnd}g</span>
                  </div>
                  <Progress
                    value={(localLineup.allocationsUsed.rnd / localLineup.allocations.rnd) * 100 || 0}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="promoQuota">Promo Quota (g)</Label>
                <Input
                  id="promoQuota"
                  type="number"
                  value={localLineup.allocations.promo || ""}
                  onChange={(e) => handleAllocationsChange('promo', Number(e.target.value))}
                  placeholder="200"
                />
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Used: {localLineup.allocationsUsed.promo}g</span>
                    <span>Remaining: {localLineup.allocations.promo - localLineup.allocationsUsed.promo}g</span>
                  </div>
                  <Progress
                    value={(localLineup.allocationsUsed.promo / localLineup.allocations.promo) * 100 || 0}
                  />
                </div>
              </div>
            </div>

            <Card className="p-4 bg-accent/10 border-accent">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">Roasted Beans on Sales</span>
                  <span className="text-lg font-bold text-accent">{formatWeight(weightForSale)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Total roasted output minus R&D and Promo allocations
                </p>
              </div>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="cost-breakdown">
          <AccordionTrigger className="text-lg font-semibold">
            Cost Breakdown
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { 
                      name: 'Green Beans', 
                      value: (localLineup.costs.greenBeansPrice * localLineup.roastLogs.reduce((sum, log) => sum + log.inputWeight, 0)) / 1000 
                    },
                    { name: 'Shipping', value: localLineup.costs.greenBeansShipping },
                    { 
                      name: 'Roasting Service', 
                      value: (localLineup.costs.roastingService * localLineup.roastLogs.reduce((sum, log) => sum + log.inputWeight, 0)) / 1000 
                    },
                    { name: 'Transport', value: localLineup.costs.roastingTransport },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="hsl(var(--primary))" />
                  <Cell fill="hsl(var(--accent))" />
                  <Cell fill="hsl(var(--secondary))" />
                  <Cell fill="hsl(var(--muted))" />
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-3 bg-primary/10">
                <p className="text-xs text-muted-foreground">Green Beans Cost</p>
                <p className="text-lg font-bold">
                  {formatCurrency((localLineup.costs.greenBeansPrice * localLineup.roastLogs.reduce((sum, log) => sum + log.inputWeight, 0)) / 1000)}
                </p>
              </Card>
              <Card className="p-3 bg-accent/10">
                <p className="text-xs text-muted-foreground">Roasting Cost</p>
                <p className="text-lg font-bold">
                  {formatCurrency((localLineup.costs.roastingService * localLineup.roastLogs.reduce((sum, log) => sum + log.inputWeight, 0)) / 1000)}
                </p>
              </Card>
              <Card className="p-3 bg-secondary/10">
                <p className="text-xs text-muted-foreground">R&D Allocation</p>
                <p className="text-lg font-bold">{formatWeight(localLineup.allocations.rnd)}</p>
              </Card>
              <Card className="p-3 bg-muted/50">
                <p className="text-xs text-muted-foreground">Promo Allocation</p>
                <p className="text-lg font-bold">{formatWeight(localLineup.allocations.promo)}</p>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Financial Results */}
        <AccordionItem value="financial">
          <AccordionTrigger className="text-base font-semibold">
            Financial Results
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="p-4 bg-primary-lighter border-primary">
                <p className="text-xs font-medium text-muted-foreground mb-1">Total Cost</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(totalCost)}</p>
              </Card>
              <Card className="p-4 bg-primary-lighter border-primary">
                <p className="text-xs font-medium text-muted-foreground mb-1">Total Output</p>
                <p className="text-xl font-bold text-primary">{formatWeight(totalOutput)}</p>
              </Card>
              <Card className="p-4 bg-primary-lighter border-primary">
                <p className="text-xs font-medium text-muted-foreground mb-1">Shrinkage</p>
                <p className="text-xl font-bold text-primary">{shrinkage.toFixed(1)}%</p>
              </Card>
              <Card className="p-4 bg-primary-lighter border-primary">
                <p className="text-xs font-medium text-muted-foreground mb-1">Cost Per Gram</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(costPerGram)}</p>
              </Card>
            </div>
            
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Weight for Sale</span>
                  <span className="text-sm font-bold">{formatWeight(weightForSale)}</span>
                </div>
                <Progress value={50} />
                <p className="text-xs text-muted-foreground">
                  Track product assignments in the Products section
                </p>
              </div>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
