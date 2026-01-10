import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Edit2, Plus, Calendar, Tag } from "lucide-react";
import { Batch } from "@/hooks/useBatches";
import { format } from "date-fns";

interface BatchHeaderProps {
  batches: Batch[];
  selectedBatch: Batch | null;
  onSelectBatch: (batchId: string) => void;
  onCreateBatch: (batch: Omit<Batch, "id" | "userId" | "createdAt" | "updatedAt">) => void;
  onUpdateBatch: (id: string, updates: Partial<Batch>) => void;
  getNextBatchCode: () => string;
  onBackToAllBatches: () => void;
}

export function BatchHeader({
  batches,
  selectedBatch,
  onSelectBatch,
  onCreateBatch,
  onUpdateBatch,
  getNextBatchCode,
  onBackToAllBatches,
}: BatchHeaderProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    theme: "",
    description: "",
    code: "",
    startDate: new Date().toISOString().split("T")[0],
  });

  const openCreateDialog = () => {
    setFormData({
      name: "",
      theme: "",
      description: "",
      code: getNextBatchCode(),
      startDate: new Date().toISOString().split("T")[0],
    });
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = () => {
    if (selectedBatch) {
      setFormData({
        name: selectedBatch.name,
        theme: selectedBatch.theme || "",
        description: selectedBatch.description || "",
        code: selectedBatch.code,
        startDate: selectedBatch.startDate,
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleCreate = () => {
    onCreateBatch({
      name: formData.name || `Batch ${formData.code}`,
      theme: formData.theme || null,
      description: formData.description || null,
      code: formData.code,
      startDate: formData.startDate,
    });
    setIsCreateDialogOpen(false);
  };

  const handleUpdate = () => {
    if (selectedBatch) {
      onUpdateBatch(selectedBatch.id, {
        name: formData.name,
        theme: formData.theme || null,
        description: formData.description || null,
        code: formData.code,
        startDate: formData.startDate,
      });
      setIsEditDialogOpen(false);
    }
  };

  // No batch selected - show batch selector
  if (!selectedBatch) {
    return (
      <Card className="p-4 md:p-6 bg-card/50 border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Batch Management</h2>
            <p className="text-sm text-muted-foreground">
              Select or create a batch to manage its lineups
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select onValueChange={onSelectBatch}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select a batch..." />
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.code}: {batch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button onClick={openCreateDialog} className="gap-2 whitespace-nowrap">
              <Plus className="h-4 w-4" />
              New Batch
            </Button>
          </div>
        </div>

        {/* Create Dialog */}
        <BatchFormDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          title="Create New Batch"
          description="Create a new batch to organize your coffee lineups"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleCreate}
          submitLabel="Create Batch"
        />
      </Card>
    );
  }

  // Batch selected - show batch context header
  return (
    <>
      <Card className="p-4 md:p-6 bg-card/50 border-border">
        <div className="flex flex-col gap-4">
          {/* Top row: Back button and batch info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBackToAllBatches}
                className="gap-1 text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
                All Batches
              </Button>
              
              <div className="h-6 w-px bg-border hidden sm:block" />
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-sm">
                  {selectedBatch.code}
                </Badge>
                <h2 className="text-lg font-semibold text-foreground">
                  {selectedBatch.name}
                </h2>
              </div>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={openEditDialog}
              className="gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Edit Batch
            </Button>
          </div>

          {/* Bottom row: Batch metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {selectedBatch.theme && (
              <div className="flex items-center gap-1.5">
                <Tag className="h-4 w-4" />
                <span>{selectedBatch.theme}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(selectedBatch.startDate), "MMM d, yyyy")}</span>
            </div>
            {selectedBatch.description && (
              <p className="text-muted-foreground/80 italic hidden md:block">
                {selectedBatch.description}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Edit Dialog */}
      <BatchFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title="Edit Batch"
        description="Update batch details"
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleUpdate}
        submitLabel="Save Changes"
      />
    </>
  );
}

interface BatchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  formData: {
    name: string;
    theme: string;
    description: string;
    code: string;
    startDate: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    name: string;
    theme: string;
    description: string;
    code: string;
    startDate: string;
  }>>;
  onSubmit: () => void;
  submitLabel: string;
}

function BatchFormDialog({
  open,
  onOpenChange,
  title,
  description,
  formData,
  setFormData,
  onSubmit,
  submitLabel,
}: BatchFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="batch-code" className="text-right">
              Code
            </Label>
            <Input
              id="batch-code"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              className="col-span-3 font-mono"
              placeholder="B01"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="batch-name" className="text-right">
              Name
            </Label>
            <Input
              id="batch-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="col-span-3"
              placeholder="Summer Collection 2024"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="batch-theme" className="text-right">
              Theme
            </Label>
            <Input
              id="batch-theme"
              value={formData.theme}
              onChange={(e) => setFormData(prev => ({ ...prev, theme: e.target.value }))}
              className="col-span-3"
              placeholder="The Experimental Series"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="batch-date" className="text-right">
              Start Date
            </Label>
            <Input
              id="batch-date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="batch-description" className="text-right pt-2">
              Notes
            </Label>
            <Textarea
              id="batch-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="col-span-3"
              placeholder="Optional description or notes..."
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
