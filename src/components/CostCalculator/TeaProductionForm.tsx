import { useCallback, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { Lineup, RoastLog } from "@/types";
import { formatCurrency, formatWeight } from "@/lib/calculations";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface TeaProductionFormProps {
  lineup: Lineup;
  hasUnsavedLogs: boolean;
  onAddLog: () => void;
  onUpdateLog: (id: string, updates: Partial<RoastLog>) => void;
  onRemoveLog: (id: string) => void;
  onSaveLogs: () => void;
  onCostsChange: (field: string, value: number | string) => void;
  onDateChange: (date: string) => void;
  onWeightChange: (weight: number) => void;
}

export function TeaProductionForm({
  lineup,
  hasUnsavedLogs,
  onAddLog,
  onUpdateLog,
  onRemoveLog,
  onSaveLogs,
  onCostsChange,
  onDateChange,
  onWeightChange,
}: TeaProductionFormProps) {
  const chartData = useMemo(() => lineup.roastLogs.map((log, index) => ({
    name: `Batch ${index + 1}`,
    input: log.inputWeight,
    output: log.outputWeight,
  })), [lineup.roastLogs]);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5 md:space-y-2">
          <Label htmlFor="purchaseDate" className="text-xs md:text-sm">Purchase Date</Label>
          <Input
            id="purchaseDate"
            type="date"
            value={lineup.purchaseDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="h-9 md:h-10 text-sm"
          />
        </div>
        <div className="space-y-1.5 md:space-y-2">
          <Label htmlFor="initialWeight" className="text-xs md:text-sm">Initial Weight (g)</Label>
          <Input
            id="initialWeight"
            type="number"
            value={lineup.initialWeight || ""}
            onChange={(e) => onWeightChange(Number(e.target.value))}
            placeholder="1000"
            className="h-9 md:h-10 text-sm"
          />
        </div>
        <div className="space-y-1.5 md:space-y-2">
          <Label htmlFor="teaPrice" className="text-xs md:text-sm">Tea Leaf Price (IDR/kg)</Label>
          <Input
            id="teaPrice"
            type="number"
            value={lineup.costs.greenBeansPrice || ""}
            onChange={(e) => onCostsChange('greenBeansPrice', Number(e.target.value))}
            placeholder="150000"
            className="h-9 md:h-10 text-sm"
          />
        </div>
        <div className="space-y-1.5 md:space-y-2">
          <Label htmlFor="shippingCost" className="text-xs md:text-sm">Shipping Cost (IDR)</Label>
          <Input
            id="shippingCost"
            type="number"
            value={lineup.costs.greenBeansShipping || ""}
            onChange={(e) => onCostsChange('greenBeansShipping', Number(e.target.value))}
            placeholder="50000"
            className="h-9 md:h-10 text-sm"
          />
        </div>
        <div className="space-y-1.5 md:space-y-2">
          <Label htmlFor="processingService" className="text-xs md:text-sm">
            Processing Service ({lineup.costs.roastingServiceType === "perBatch" ? "IDR/Batch" : "IDR/Kg"})
          </Label>
          <div className="flex gap-2">
            <Input
              id="processingService"
              type="number"
              step="0.01"
              value={lineup.costs.roastingService || ""}
              onChange={(e) => onCostsChange('roastingService', Number(e.target.value))}
              placeholder="25000"
              className="h-9 md:h-10 text-sm flex-1"
            />
            <select
              value={lineup.costs.roastingServiceType || "perKg"}
              onChange={(e) => onCostsChange('roastingServiceType', e.target.value as "perKg" | "perBatch")}
              className="h-9 md:h-10 text-xs md:text-sm px-2 rounded-md border border-input bg-background"
            >
              <option value="perKg">Per Kg</option>
              <option value="perBatch">Per Batch</option>
            </select>
          </div>
        </div>
        <div className="space-y-1.5 md:space-y-2">
          <Label htmlFor="transportCost" className="text-xs md:text-sm">Transport Cost (IDR)</Label>
          <Input
            id="transportCost"
            type="number"
            value={lineup.costs.roastingTransport || ""}
            onChange={(e) => onCostsChange('roastingTransport', Number(e.target.value))}
            placeholder="20000"
            className="h-9 md:h-10 text-sm"
          />
        </div>
      </div>

      {/* Processing Logs (similar to Roast Logs but for tea) */}
      <div className="space-y-3 md:space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <Label className="text-sm md:text-base">Processing Logs</Label>
          <div className="flex gap-2 w-full sm:w-auto">
            {hasUnsavedLogs && (
              <Button onClick={onSaveLogs} size="sm" variant="default" className="flex-1 sm:flex-none">
                Save Processing Logs
              </Button>
            )}
            <Button onClick={onAddLog} size="sm" variant="outline" className="gap-2 flex-1 sm:flex-none">
              <Plus className="h-4 w-4" />
              Add Process
            </Button>
          </div>
        </div>

        {lineup.roastLogs.length > 0 ? (
          <div className="space-y-2 md:space-y-3">
            {lineup.roastLogs.map((log) => (
              <Card key={log.id} className="p-3 md:p-4">
                <div className="grid gap-2 md:gap-3 grid-cols-2 sm:grid-cols-4">
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <Label className="text-xs">Date</Label>
                    <Input
                      type="date"
                      value={log.date}
                      onChange={(e) => onUpdateLog(log.id, { date: e.target.value })}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Input (g)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={log.inputWeight || ""}
                      onChange={(e) => onUpdateLog(log.id, { inputWeight: Number(e.target.value) })}
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
                      onChange={(e) => onUpdateLog(log.id, { outputWeight: Number(e.target.value) })}
                      placeholder="950"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="flex items-end justify-end sm:justify-start">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveLog(log.id)}
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
            No processing logs yet. Click "Add Process" to start tracking.
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
    </div>
  );
}
