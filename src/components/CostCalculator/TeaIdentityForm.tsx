import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TeaIdentity } from "@/types";

interface TeaIdentityFormProps {
  teaIdentity: TeaIdentity;
  lineupCode?: string;
  lineupName: string;
  onNameChange: (name: string) => void;
  onTeaIdentityChange: (field: keyof TeaIdentity, value: string) => void;
}

const TEA_TYPES = [
  { value: "green", label: "Green Tea" },
  { value: "black", label: "Black Tea" },
  { value: "oolong", label: "Oolong Tea" },
  { value: "white", label: "White Tea" },
  { value: "herbal", label: "Herbal Tea" },
  { value: "pu-erh", label: "Pu-erh Tea" },
];

const TEA_GRADES = [
  { value: "premium", label: "Premium" },
  { value: "standard", label: "Standard" },
  { value: "economy", label: "Economy" },
];

const HARVEST_SEASONS = [
  { value: "spring", label: "Spring" },
  { value: "summer", label: "Summer" },
  { value: "autumn", label: "Autumn" },
  { value: "winter", label: "Winter" },
];

const PROCESSING_METHODS = [
  { value: "orthodox", label: "Orthodox" },
  { value: "ctc", label: "CTC (Cut, Tear, Curl)" },
  { value: "blending", label: "Blending" },
  { value: "aging", label: "Aging" },
  { value: "fermentation", label: "Fermentation" },
];

export function TeaIdentityForm({
  teaIdentity,
  lineupCode,
  lineupName,
  onNameChange,
  onTeaIdentityChange,
}: TeaIdentityFormProps) {
  return (
    <div className="space-y-3 md:space-y-4">
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
            value={lineupName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g., Jasmine Dragon Pearl"
            className="h-9 md:h-10 text-sm"
          />
        </div>
        <div className="space-y-1.5 md:space-y-2">
          <Label htmlFor="teaType" className="text-xs md:text-sm">Tea Type</Label>
          <Select
            value={teaIdentity.teaType}
            onValueChange={(value) => onTeaIdentityChange('teaType', value)}
          >
            <SelectTrigger className="h-9 md:h-10 text-sm">
              <SelectValue placeholder="Select tea type" />
            </SelectTrigger>
            <SelectContent>
              {TEA_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 md:space-y-2">
          <Label htmlFor="teaGrade" className="text-xs md:text-sm">Tea Grade</Label>
          <Select
            value={teaIdentity.teaGrade}
            onValueChange={(value) => onTeaIdentityChange('teaGrade', value)}
          >
            <SelectTrigger className="h-9 md:h-10 text-sm">
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              {TEA_GRADES.map((grade) => (
                <SelectItem key={grade.value} value={grade.value}>
                  {grade.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 md:space-y-2">
          <Label htmlFor="origin" className="text-xs md:text-sm">Origin</Label>
          <Input
            id="origin"
            value={teaIdentity.origin}
            onChange={(e) => onTeaIdentityChange('origin', e.target.value)}
            placeholder="e.g., Fujian, China"
            className="h-9 md:h-10 text-sm"
          />
        </div>
        <div className="space-y-1.5 md:space-y-2">
          <Label htmlFor="harvestSeason" className="text-xs md:text-sm">Harvest Season</Label>
          <Select
            value={teaIdentity.harvestSeason}
            onValueChange={(value) => onTeaIdentityChange('harvestSeason', value)}
          >
            <SelectTrigger className="h-9 md:h-10 text-sm">
              <SelectValue placeholder="Select season" />
            </SelectTrigger>
            <SelectContent>
              {HARVEST_SEASONS.map((season) => (
                <SelectItem key={season.value} value={season.value}>
                  {season.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 md:space-y-2">
          <Label htmlFor="processingMethod" className="text-xs md:text-sm">Processing Method</Label>
          <Select
            value={teaIdentity.processingMethod}
            onValueChange={(value) => onTeaIdentityChange('processingMethod', value)}
          >
            <SelectTrigger className="h-9 md:h-10 text-sm">
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              {PROCESSING_METHODS.map((method) => (
                <SelectItem key={method.value} value={method.value}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 md:space-y-2">
          <Label htmlFor="supplier" className="text-xs md:text-sm">Supplier</Label>
          <Input
            id="supplier"
            value={teaIdentity.supplier}
            onChange={(e) => onTeaIdentityChange('supplier', e.target.value)}
            placeholder="Supplier name"
            className="h-9 md:h-10 text-sm"
          />
        </div>
      </div>
      <div className="space-y-1.5 md:space-y-2">
        <Label htmlFor="tastingNotes" className="text-xs md:text-sm">Tasting Notes</Label>
        <Textarea
          id="tastingNotes"
          value={teaIdentity.tastingNotes}
          onChange={(e) => onTeaIdentityChange('tastingNotes', e.target.value)}
          placeholder="Describe flavor profile..."
          rows={3}
          className="text-sm"
        />
      </div>
    </div>
  );
}
