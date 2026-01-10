import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Package, ChevronRight } from "lucide-react";
import { Batch } from "@/hooks/useBatches";
import { Lineup } from "@/types";
import { format } from "date-fns";

interface BatchListViewProps {
  batches: Batch[];
  lineups: Lineup[];
  onSelectBatch: (batchId: string) => void;
  onCreateBatch: () => void;
}

export function BatchListView({ 
  batches, 
  lineups, 
  onSelectBatch, 
  onCreateBatch 
}: BatchListViewProps) {
  // Count lineups per batch
  const lineupCountByBatch = lineups.reduce((acc, lineup) => {
    if (lineup.batchId) {
      acc[lineup.batchId] = (acc[lineup.batchId] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Count unassigned lineups
  const unassignedCount = lineups.filter(l => !l.batchId).length;

  if (batches.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">No Batches Yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Create your first batch to organize your coffee lineups by season, release, or theme.
              </p>
            </div>
            <Button onClick={onCreateBatch} className="gap-2">
              <Plus className="h-4 w-4" />
              Create First Batch
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">All Batches</h2>
          <p className="text-sm text-muted-foreground">
            {batches.length} batch{batches.length !== 1 ? "es" : ""} • {lineups.length} lineup{lineups.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button onClick={onCreateBatch} className="gap-2">
          <Plus className="h-4 w-4" />
          New Batch
        </Button>
      </div>

      {/* Batch Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {batches.map((batch) => (
          <Card 
            key={batch.id} 
            className="cursor-pointer hover:border-primary/50 transition-colors group"
            onClick={() => onSelectBatch(batch.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {batch.code}
                    </Badge>
                    <CardTitle className="text-base">{batch.name}</CardTitle>
                  </div>
                  {batch.theme && (
                    <p className="text-sm text-muted-foreground italic">
                      {batch.theme}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(batch.startDate), "MMM d, yyyy")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {lineupCountByBatch[batch.id] || 0} lineup{(lineupCountByBatch[batch.id] || 0) !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Unassigned lineups notice */}
      {unassignedCount > 0 && (
        <Card className="border-dashed border-orange-500/50 bg-orange-500/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">Unassigned Lineups</p>
                  <p className="text-xs text-muted-foreground">
                    {unassignedCount} lineup{unassignedCount !== 1 ? "s" : ""} not assigned to any batch
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
