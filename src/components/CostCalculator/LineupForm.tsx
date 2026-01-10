import { useCallback, useMemo, useState, useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { Lineup, RoastLog, Product, Transaction } from "@/types";
import { 
  calculateTotalInitialCost, 
  calculateTotalRoastedOutput,
  calculateShrinkagePercentage,
  calculateCostPerGram,
  calculateWeightForSale,
  calculateWeightAssignedToProducts,
  formatCurrency,
  formatWeight
} from "@/lib/calculations";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";

interface LineupFormProps {
  lineup: Lineup;
  lineupCode?: string;
  products?: Product[];
  transactions?: Transaction[];
  onUpdate: (updates: Partial<Lineup>) => void;
  onSave?: (lineup: Lineup) => void;
}

function generateUUID() {
  return crypto.randomUUID();
}

export function LineupForm({ lineup, lineupCode, products = [], transactions = [], onUpdate, onSave }: LineupFormProps) {
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
  const weightAssignedToProducts = useMemo(() => calculateWeightAssignedToProducts(localLineup, products), [localLineup, products]);
  
  // Calculate weight sold from transactions (sale + bonus)
  const weightSold = useMemo(() => {
    return transactions
      .filter(t => t.status === 'sale' || t.status === 'bonus')
      .reduce((sum, t) => {
        const product = products.find(p => p.id === t.productId);
        if (product) {
          return sum + (product.netWeight * t.quantity);
        }
        return sum;
      }, 0);
  }, [transactions, products]);
  
  // Remaining = weightForSale - weightAssignedToProducts - weightSold
  const remainingBeansToSale = useMemo(() => weightForSale - weightAssignedToProducts - weightSold, [weightForSale, weightAssignedToProducts, weightSold]);

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
      id: generateUUID(),
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

  const handleCostsChange = useCallback((field: string, value: number | string) => {
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
    <div className="space-y-4 md:space-y-6">
      {hasUnsavedChanges && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 md:p-4 bg-accent/10 border border-accent rounded-lg">
          <p className="text-xs sm:text-sm text-muted-foreground">You have unsaved changes</p>
          <Button onClick={handleSave} size="sm" className="w-full sm:w-auto">
            Save Changes
          </Button>
        </div>
      )}
      <Accordion type="single" collapsible defaultValue="identity" className="w-full">
        {/* Coffee Identity */}
        <AccordionItem value="identity">
          <AccordionTrigger className="text-sm md:text-base font-semibold">
            Coffee Identity
          </AccordionTrigger>
          <AccordionContent className="space-y-3 md:space-y-4 pt-3 md:pt-4">
            <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2">
              {lineupCode && (
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="lineupCode" className="text-xs md:text-sm">Product Code</Label>
                  <Input
                    id="lineupCode"
                    value={lineupCode}
                    readOnly
                    disabled
                    className="h-9 md:h-10 text-sm font-mono bg-muted"
                  />
                </div>
              )}
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="name" className="text-xs md:text-sm">Lineup Name</Label>
                <Input
                  id="name"
                  value={localLineup.name}
                  onChange={(e) => setLocalLineup(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Ethiopia Yirgacheffe"
                  className="h-9 md:h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="origin" className="text-xs md:text-sm">Origin</Label>
                <Input
                  id="origin"
                  value={localLineup.identity.origin}
                  onChange={(e) => handleIdentityChange('origin', e.target.value)}
                  placeholder="e.g., Ethiopia"
                  className="h-9 md:h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="process" className="text-xs md:text-sm">Process</Label>
                <Input
                  id="process"
                  value={localLineup.identity.process}
                  onChange={(e) => handleIdentityChange('process', e.target.value)}
                  placeholder="e.g., Washed"
                  className="h-9 md:h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="variety" className="text-xs md:text-sm">Variety</Label>
                <Input
                  id="variety"
                  value={localLineup.identity.variety}
                  onChange={(e) => handleIdentityChange('variety', e.target.value)}
                  placeholder="e.g., Heirloom"
                  className="h-9 md:h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="processor" className="text-xs md:text-sm">Processor</Label>
                <Input
                  id="processor"
                  value={localLineup.identity.processor}
                  onChange={(e) => handleIdentityChange('processor', e.target.value)}
                  placeholder="Processor name"
                  className="h-9 md:h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="roaster" className="text-xs md:text-sm">Roaster</Label>
                <Input
                  id="roaster"
                  value={localLineup.identity.roaster}
                  onChange={(e) => handleIdentityChange('roaster', e.target.value)}
                  placeholder="Roaster name"
                  className="h-9 md:h-10 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="tastingNotes" className="text-xs md:text-sm">Tasting Notes</Label>
              <Textarea
                id="tastingNotes"
                value={localLineup.identity.tastingNotes}
                onChange={(e) => handleIdentityChange('tastingNotes', e.target.value)}
                placeholder="Describe flavor profile..."
                rows={3}
                className="text-sm"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Production Monitoring */}
        <AccordionItem value="production">
          <AccordionTrigger className="text-sm md:text-base font-semibold">
            Production Monitoring
          </AccordionTrigger>
          <AccordionContent className="space-y-4 md:space-y-6 pt-3 md:pt-4">
            <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="purchaseDate" className="text-xs md:text-sm">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={localLineup.purchaseDate}
                  onChange={(e) => setLocalLineup(prev => ({ ...prev, purchaseDate: e.target.value }))}
                  className="h-9 md:h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="initialWeight" className="text-xs md:text-sm">Initial Weight (g)</Label>
                <Input
                  id="initialWeight"
                  type="number"
                  value={localLineup.initialWeight || ""}
                  onChange={(e) => setLocalLineup(prev => ({ ...prev, initialWeight: Number(e.target.value) }))}
                  placeholder="1000"
                  className="h-9 md:h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="greenBeansPrice" className="text-xs md:text-sm">Green Beans Price (IDR/kg)</Label>
                <Input
                  id="greenBeansPrice"
                  type="number"
                  value={localLineup.costs.greenBeansPrice || ""}
                  onChange={(e) => handleCostsChange('greenBeansPrice', Number(e.target.value))}
                  placeholder="100000"
                  className="h-9 md:h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="greenBeansShipping" className="text-xs md:text-sm">Shipping Cost (IDR)</Label>
                <Input
                  id="greenBeansShipping"
                  type="number"
                  value={localLineup.costs.greenBeansShipping || ""}
                  onChange={(e) => handleCostsChange('greenBeansShipping', Number(e.target.value))}
                  placeholder="50000"
                  className="h-9 md:h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="roastingService" className="text-xs md:text-sm">
                  Roasting Service ({localLineup.costs.roastingServiceType === "perBatch" ? "IDR/Batch" : "IDR/Kg"})
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="roastingService"
                    type="number"
                    step="0.01"
                    value={localLineup.costs.roastingService || ""}
                    onChange={(e) => handleCostsChange('roastingService', Number(e.target.value))}
                    placeholder="25000"
                    className="h-9 md:h-10 text-sm flex-1"
                  />
                  <select
                    value={localLineup.costs.roastingServiceType || "perKg"}
                    onChange={(e) => handleCostsChange('roastingServiceType', e.target.value as "perKg" | "perBatch")}
                    className="h-9 md:h-10 text-xs md:text-sm px-2 rounded-md border border-input bg-background"
                  >
                    <option value="perKg">Per Kg</option>
                    <option value="perBatch">Per Batch</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="roastingTransport" className="text-xs md:text-sm">Roasting Transport (IDR)</Label>
                <Input
                  id="roastingTransport"
                  type="number"
                  value={localLineup.costs.roastingTransport || ""}
                  onChange={(e) => handleCostsChange('roastingTransport', Number(e.target.value))}
                  placeholder="20000"
                  className="h-9 md:h-10 text-sm"
                />
              </div>
            </div>

            {/* Roast Logs */}
            <div className="space-y-3 md:space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <Label className="text-sm md:text-base">Roast Logs</Label>
                <div className="flex gap-2 w-full sm:w-auto">
                  {hasUnsavedRoastLogs && (
                    <Button onClick={handleSaveRoastLogs} size="sm" variant="default" className="flex-1 sm:flex-none">
                      Save Roast Logs
                    </Button>
                  )}
                  <Button onClick={addRoastLog} size="sm" variant="outline" className="gap-2 flex-1 sm:flex-none">
                    <Plus className="h-4 w-4" />
                    Add Roast
                  </Button>
                </div>
              </div>

              {localLineup.roastLogs.length > 0 ? (
                <div className="space-y-2 md:space-y-3">
                  {localLineup.roastLogs.map((log) => (
                    <Card key={log.id} className="p-3 md:p-4">
                      <div className="grid gap-2 md:gap-3 grid-cols-2 sm:grid-cols-4">
                        <div className="space-y-1 col-span-2 sm:col-span-1">
                          <Label className="text-xs">Date</Label>
                          <Input
                            type="date"
                            value={log.date}
                            onChange={(e) =>
                              updateRoastLog(log.id, { date: e.target.value })
                            }
                            className="h-9 text-sm"
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
                            className="h-9 text-sm"
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
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="flex items-end justify-end sm:justify-start">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRoastLog(log.id)}
                            className="text-destructive hover:text-destructive h-9 w-9 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-xs md:text-sm text-muted-foreground">
                  No roast logs yet. Click "Add Roast" to start tracking.
                </p>
              )}

              {/* Chart */}
              {chartData.length > 0 && (
                <Card className="p-3 md:p-4">
                  <h4 className="text-xs md:text-sm font-semibold mb-3 md:mb-4">Input vs Output</h4>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
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
          <AccordionTrigger className="text-sm md:text-base font-semibold">
            Bean Allocations
          </AccordionTrigger>
          <AccordionContent className="space-y-3 md:space-y-4 pt-3 md:pt-4">
            <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="rndQuota" className="text-xs md:text-sm">R&D Quota (g)</Label>
                <Input
                  id="rndQuota"
                  type="number"
                  value={localLineup.allocations.rnd || ""}
                  onChange={(e) => handleAllocationsChange('rnd', Number(e.target.value))}
                  placeholder="100"
                  className="h-9 md:h-10 text-sm"
                />
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] md:text-xs text-muted-foreground">
                    <span>Used: {localLineup.allocationsUsed.rnd}g</span>
                    <span>Remaining: {localLineup.allocations.rnd - localLineup.allocationsUsed.rnd}g</span>
                  </div>
                  <Progress
                    value={(localLineup.allocationsUsed.rnd / localLineup.allocations.rnd) * 100 || 0}
                  />
                </div>
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="promoQuota" className="text-xs md:text-sm">Promo Quota (g)</Label>
                <Input
                  id="promoQuota"
                  type="number"
                  value={localLineup.allocations.promo || ""}
                  onChange={(e) => handleAllocationsChange('promo', Number(e.target.value))}
                  placeholder="200"
                  className="h-9 md:h-10 text-sm"
                />
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] md:text-xs text-muted-foreground">
                    <span>Used: {localLineup.allocationsUsed.promo}g</span>
                    <span>Remaining: {localLineup.allocations.promo - localLineup.allocationsUsed.promo}g</span>
                  </div>
                  <Progress
                    value={(localLineup.allocationsUsed.promo / localLineup.allocations.promo) * 100 || 0}
                  />
                </div>
              </div>
            </div>

            <Card className="p-3 md:p-4 bg-accent/10 border-accent">
              <div className="space-y-1 md:space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-sm font-semibold">Roasted Beans for Sale</span>
                  <span className="text-base md:text-lg font-bold text-accent">{formatWeight(weightForSale)}</span>
                </div>
                <p className="text-[10px] md:text-xs text-muted-foreground">
                  Total roasted output minus R&D and Promo allocations
                </p>
              </div>
            </Card>

            <Card className={`p-3 md:p-4 ${remainingBeansToSale < 0 ? 'bg-destructive/10 border-destructive' : 'bg-primary/10 border-primary'}`}>
              <div className="space-y-2 md:space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-sm font-semibold">Remaining Roasted Beans to Sale</span>
                  <span className={`text-base md:text-lg font-bold ${remainingBeansToSale < 0 ? 'text-destructive' : 'text-primary'}`}>
                    {formatWeight(remainingBeansToSale)}
                  </span>
                </div>
                
                {/* Breakdown per product */}
                {products.length > 0 && (
                  <div className="border-t border-border/50 pt-2 space-y-1">
                    <p className="text-[10px] md:text-xs font-medium text-muted-foreground mb-1">Breakdown per produk:</p>
                    {products.map((product) => {
                      const stockWeight = product.netWeight * product.stock;
                      const soldTransactions = transactions.filter(
                        t => t.productId === product.id && (t.status === 'sale' || t.status === 'bonus')
                      );
                      const soldWeight = soldTransactions.reduce((sum, t) => sum + (product.netWeight * t.quantity), 0);
                      const totalUsed = stockWeight + soldWeight;
                      
                      return (
                        <div key={product.id} className="flex items-center justify-between text-[10px] md:text-xs">
                          <span className="truncate max-w-[120px] md:max-w-[180px]" title={product.name}>
                            {product.name} ({product.netWeight}g)
                          </span>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span>Stok: {product.stock}</span>
                            <span className="text-primary">Jual: {soldTransactions.reduce((sum, t) => sum + t.quantity, 0)}</span>
                            <span className="font-medium text-foreground">{formatWeight(totalUsed)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Summary totals */}
                <div className="border-t border-border/50 pt-2 space-y-0.5 text-[10px] md:text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Total dialokasi (stok)</span>
                    <span>{formatWeight(weightAssignedToProducts)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total terjual</span>
                    <span className="text-primary">{formatWeight(weightSold)}</span>
                  </div>
                </div>
                
                {remainingBeansToSale < 0 && (
                  <div className="flex items-center gap-1 text-destructive text-[10px] md:text-xs mt-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Stock exceeds available beans!</span>
                  </div>
                )}
              </div>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="cost-breakdown">
          <AccordionTrigger className="text-sm md:text-lg font-semibold">
            Cost Breakdown
          </AccordionTrigger>
          <AccordionContent className="space-y-3 md:space-y-4 pt-3 md:pt-4">
            <ResponsiveContainer width="100%" height={220}>
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
                      value: localLineup.costs.roastingServiceType === "perBatch" 
                        ? localLineup.costs.roastingService * localLineup.roastLogs.length
                        : (localLineup.costs.roastingService * localLineup.roastLogs.reduce((sum, log) => sum + log.inputWeight, 0)) / 1000 
                    },
                    { name: 'Transport', value: localLineup.costs.roastingTransport },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#22c55e" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#3b82f6" />
                  <Cell fill="#8b5cf6" />
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)} 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Legend 
                  wrapperStyle={{ 
                    color: 'hsl(var(--foreground))',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-2 gap-2 md:gap-4">
              <Card className="p-2 md:p-3 border-l-4 border-l-green-500">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <p className="text-[10px] md:text-xs text-muted-foreground">Green Beans Cost</p>
                </div>
                <p className="text-sm md:text-lg font-bold">
                  {formatCurrency((localLineup.costs.greenBeansPrice * localLineup.roastLogs.reduce((sum, log) => sum + log.inputWeight, 0)) / 1000)}
                </p>
              </Card>
              <Card className="p-2 md:p-3 border-l-4 border-l-amber-500">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <p className="text-[10px] md:text-xs text-muted-foreground">Shipping Cost</p>
                </div>
                <p className="text-sm md:text-lg font-bold">
                  {formatCurrency(localLineup.costs.greenBeansShipping)}
                </p>
              </Card>
              <Card className="p-2 md:p-3 border-l-4 border-l-blue-500">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <p className="text-[10px] md:text-xs text-muted-foreground">Roasting Cost</p>
                </div>
                <p className="text-sm md:text-lg font-bold">
                  {formatCurrency(
                    localLineup.costs.roastingServiceType === "perBatch" 
                      ? localLineup.costs.roastingService * localLineup.roastLogs.length
                      : (localLineup.costs.roastingService * localLineup.roastLogs.reduce((sum, log) => sum + log.inputWeight, 0)) / 1000
                  )}
                </p>
              </Card>
              <Card className="p-2 md:p-3 border-l-4 border-l-purple-500">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <p className="text-[10px] md:text-xs text-muted-foreground">Transport Cost</p>
                </div>
                <p className="text-sm md:text-lg font-bold">{formatCurrency(localLineup.costs.roastingTransport)}</p>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Financial Results */}
        <AccordionItem value="financial">
          <AccordionTrigger className="text-sm md:text-base font-semibold">
            Financial Results
          </AccordionTrigger>
          <AccordionContent className="space-y-3 md:space-y-4 pt-3 md:pt-4">
            <div className="grid gap-2 md:gap-4 grid-cols-2 lg:grid-cols-4">
              <Card className="p-2 md:p-4 bg-primary/10 border-primary/20">
                <p className="text-[10px] md:text-xs font-medium text-muted-foreground mb-0.5 md:mb-1">Total Cost</p>
                <p className="text-base md:text-xl font-bold text-primary">{formatCurrency(totalCost > 0 ? totalCost : 0)}</p>
              </Card>
              <Card className="p-2 md:p-4 bg-accent/10 border-accent/20">
                <p className="text-[10px] md:text-xs font-medium text-muted-foreground mb-0.5 md:mb-1">Total Output</p>
                <p className="text-base md:text-xl font-bold">{formatWeight(totalOutput)}</p>
              </Card>
              <Card className="p-2 md:p-4 bg-secondary/10 border-secondary/20">
                <p className="text-[10px] md:text-xs font-medium text-muted-foreground mb-0.5 md:mb-1">Shrinkage</p>
                <p className="text-base md:text-xl font-bold">{shrinkage > 0 ? shrinkage.toFixed(1) : 0}%</p>
              </Card>
              <Card className="p-2 md:p-4 bg-green-500/10 border-green-500/20">
                <p className="text-[10px] md:text-xs font-medium text-muted-foreground mb-0.5 md:mb-1">Cost Per Gram</p>
                <p className="text-base md:text-xl font-bold text-green-600">{formatCurrency(costPerGram > 0 ? costPerGram : 0)}</p>
              </Card>
            </div>
            
            <Card className="p-3 md:p-4">
              <div className="space-y-1.5 md:space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-sm font-medium">Weight for Sale</span>
                  <span className="text-xs md:text-sm font-bold">{formatWeight(weightForSale > 0 ? weightForSale : 0)}</span>
                </div>
                <Progress value={totalOutput > 0 ? (weightForSale / totalOutput) * 100 : 0} />
                <p className="text-[10px] md:text-xs text-muted-foreground">
                  Track product assignments in the Products section
                </p>
              </div>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Batch Profitability Analysis */}
        <AccordionItem value="profitability">
          <AccordionTrigger className="text-sm md:text-base font-semibold">
            Batch Profitability Analysis
          </AccordionTrigger>
          <AccordionContent className="space-y-3 md:space-y-4 pt-3 md:pt-4">
            {localLineup.roastLogs.length === 0 ? (
              <p className="text-xs md:text-sm text-muted-foreground text-center py-6 md:py-8">
                Add roast logs to see profitability analysis
              </p>
            ) : (
              <>
                {/* Mobile Cards View */}
                <div className="block md:hidden space-y-2">
                  {localLineup.roastLogs.map((log, index) => {
                    const roastingCostPerBatch = localLineup.costs.roastingServiceType === "perBatch"
                      ? localLineup.costs.roastingService
                      : (localLineup.costs.roastingService * log.inputWeight / 1000);
                    const batchCost = 
                      (localLineup.costs.greenBeansPrice * log.inputWeight / 1000) +
                      (localLineup.costs.greenBeansShipping / localLineup.roastLogs.length) +
                      roastingCostPerBatch +
                      (localLineup.costs.roastingTransport / localLineup.roastLogs.length);
                    const loss = log.inputWeight > 0 ? ((log.inputWeight - log.outputWeight) / log.inputWeight) * 100 : 0;
                    const costPerG = log.outputWeight > 0 ? batchCost / log.outputWeight : 0;

                    return (
                      <Card key={log.id} className="p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-sm">Batch {index + 1}</span>
                          <span className="text-xs text-muted-foreground">{new Date(log.date).toLocaleDateString('id-ID')}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Input:</span>
                            <span className="ml-1 font-medium">{formatWeight(log.inputWeight)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Output:</span>
                            <span className="ml-1 font-medium">{formatWeight(log.outputWeight)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Loss:</span>
                            <span className={`ml-1 font-medium ${loss > 20 ? 'text-destructive' : loss > 15 ? 'text-orange-500' : 'text-green-600'}`}>
                              {loss.toFixed(1)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Cost/g:</span>
                            <span className="ml-1 font-semibold">{formatCurrency(costPerG)}</span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr className="text-left text-sm">
                        <th className="p-3 font-semibold">Batch</th>
                        <th className="p-3 font-semibold">Date</th>
                        <th className="p-3 font-semibold text-right">Input</th>
                        <th className="p-3 font-semibold text-right">Output</th>
                        <th className="p-3 font-semibold text-right">Loss %</th>
                        <th className="p-3 font-semibold text-right">Cost</th>
                        <th className="p-3 font-semibold text-right">Cost/g</th>
                      </tr>
                    </thead>
                    <tbody>
                      {localLineup.roastLogs.map((log, index) => {
                        const roastingCostPerBatch = localLineup.costs.roastingServiceType === "perBatch"
                          ? localLineup.costs.roastingService
                          : (localLineup.costs.roastingService * log.inputWeight / 1000);
                        const batchCost = 
                          (localLineup.costs.greenBeansPrice * log.inputWeight / 1000) +
                          (localLineup.costs.greenBeansShipping / localLineup.roastLogs.length) +
                          roastingCostPerBatch +
                          (localLineup.costs.roastingTransport / localLineup.roastLogs.length);
                        const loss = log.inputWeight > 0 ? ((log.inputWeight - log.outputWeight) / log.inputWeight) * 100 : 0;
                        const costPerG = log.outputWeight > 0 ? batchCost / log.outputWeight : 0;

                        return (
                          <tr key={log.id} className="border-t hover:bg-muted/30">
                            <td className="p-3 font-medium">Batch {index + 1}</td>
                            <td className="p-3">{new Date(log.date).toLocaleDateString('id-ID')}</td>
                            <td className="p-3 text-right">{formatWeight(log.inputWeight)}</td>
                            <td className="p-3 text-right">{formatWeight(log.outputWeight)}</td>
                            <td className="p-3 text-right">
                              <span className={loss > 20 ? 'text-destructive' : loss > 15 ? 'text-orange-500' : 'text-green-600'}>
                                {loss.toFixed(1)}%
                              </span>
                            </td>
                            <td className="p-3 text-right">{formatCurrency(batchCost)}</td>
                            <td className="p-3 text-right font-semibold">{formatCurrency(costPerG)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-2 md:gap-4 grid-cols-1 sm:grid-cols-3">
                  <Card className="p-3 md:p-4 bg-blue-500/10 border-blue-500/20">
                    <p className="text-[10px] md:text-xs text-muted-foreground">Total Investment</p>
                    <p className="text-base md:text-xl font-bold text-blue-600">{formatCurrency(totalCost)}</p>
                  </Card>
                  <Card className="p-3 md:p-4 bg-green-500/10 border-green-500/20">
                    <p className="text-[10px] md:text-xs text-muted-foreground">Potential Revenue</p>
                    <p className="text-base md:text-xl font-bold text-green-600">{formatCurrency(weightForSale * costPerGram * 1.5)}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">Based on 50% markup</p>
                  </Card>
                  <Card className="p-3 md:p-4 bg-purple-500/10 border-purple-500/20">
                    <p className="text-[10px] md:text-xs text-muted-foreground">Potential Profit</p>
                    <p className="text-base md:text-xl font-bold text-purple-600">{formatCurrency((weightForSale * costPerGram * 1.5) - totalCost)}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">At 50% margin</p>
                  </Card>
                </div>
              </>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
