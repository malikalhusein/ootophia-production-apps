import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CoffeeIdentity } from "@/types";

interface CoffeeIdentityFormProps {
  identity: CoffeeIdentity;
  lineupCode?: string;
  lineupName: string;
  onNameChange: (name: string) => void;
  onIdentityChange: (field: keyof CoffeeIdentity, value: string) => void;
}

export function CoffeeIdentityForm({
  identity,
  lineupCode,
  lineupName,
  onNameChange,
  onIdentityChange,
}: CoffeeIdentityFormProps) {
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
            placeholder="e.g., Ethiopia Yirgacheffe"
            className="h-9 md:h-10 text-sm"
          />
        </div>
        <div className="space-y-1.5 md:space-y-2">
          <Label htmlFor="origin" className="text-xs md:text-sm">Origin</Label>
          <Input
            id="origin"
            value={identity.origin}
            onChange={(e) => onIdentityChange('origin', e.target.value)}
            placeholder="e.g., Ethiopia"
            className="h-9 md:h-10 text-sm"
          />
        </div>
        <div className="space-y-1.5 md:space-y-2">
          <Label htmlFor="process" className="text-xs md:text-sm">Process</Label>
          <Input
            id="process"
            value={identity.process}
            onChange={(e) => onIdentityChange('process', e.target.value)}
            placeholder="e.g., Washed"
            className="h-9 md:h-10 text-sm"
          />
        </div>
        <div className="space-y-1.5 md:space-y-2">
          <Label htmlFor="variety" className="text-xs md:text-sm">Variety</Label>
          <Input
            id="variety"
            value={identity.variety}
            onChange={(e) => onIdentityChange('variety', e.target.value)}
            placeholder="e.g., Heirloom"
            className="h-9 md:h-10 text-sm"
          />
        </div>
        <div className="space-y-1.5 md:space-y-2">
          <Label htmlFor="processor" className="text-xs md:text-sm">Processor</Label>
          <Input
            id="processor"
            value={identity.processor}
            onChange={(e) => onIdentityChange('processor', e.target.value)}
            placeholder="Processor name"
            className="h-9 md:h-10 text-sm"
          />
        </div>
        <div className="space-y-1.5 md:space-y-2">
          <Label htmlFor="roaster" className="text-xs md:text-sm">Roaster</Label>
          <Input
            id="roaster"
            value={identity.roaster}
            onChange={(e) => onIdentityChange('roaster', e.target.value)}
            placeholder="Roaster name"
            className="h-9 md:h-10 text-sm"
          />
        </div>
      </div>
      <div className="space-y-1.5 md:space-y-2">
        <Label htmlFor="tastingNotes" className="text-xs md:text-sm">Tasting Notes</Label>
        <Textarea
          id="tastingNotes"
          value={identity.tastingNotes}
          onChange={(e) => onIdentityChange('tastingNotes', e.target.value)}
          placeholder="Describe flavor profile..."
          rows={3}
          className="text-sm"
        />
      </div>
    </div>
  );
}
