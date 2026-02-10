import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Save, Trash2, Filter, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export interface FilterPreset {
  id: string;
  name: string;
  filters: Record<string, any>;
  description?: string;
  createdAt: Date;
}

interface SavedFilterPresetsProps {
  presets: FilterPreset[];
  onApplyPreset: (filters: Record<string, any>) => void;
  onSavePreset: (name: string, filters: Record<string, any>, description?: string) => void;
  onDeletePreset: (id: string) => void;
  currentFilters: Record<string, any>;
}

export function SavedFilterPresets({
  presets,
  onApplyPreset,
  onSavePreset,
  onDeletePreset,
  currentFilters,
}: SavedFilterPresetsProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a preset name',
        variant: 'destructive',
      });
      return;
    }

    onSavePreset(presetName, currentFilters, presetDescription);
    setPresetName('');
    setPresetDescription('');
    setShowSaveDialog(false);

    toast({
      title: 'Success',
      description: `Filter preset "${presetName}" saved`,
    });
  };

  const handleApplyPreset = (preset: FilterPreset) => {
    onApplyPreset(preset.filters);
    setIsOpen(false);

    toast({
      title: 'Success',
      description: `Applied preset: ${preset.name}`,
    });
  };

  const handleDeletePreset = (id: string, name: string) => {
    onDeletePreset(id);
    toast({
      title: 'Success',
      description: `Preset "${name}" deleted`,
    });
  };

  const hasActiveFilters = Object.values(currentFilters).some((v) => v !== null && v !== undefined && v !== '');

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Save Current Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSaveDialog(true)}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Save Filter
          </Button>
        )}

        {/* Presets Dropdown */}
        {presets.length > 0 && (
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Presets ({presets.length})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter Presets</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center justify-between px-2 py-2 hover:bg-muted rounded-sm cursor-pointer group"
                >
                  <button
                    onClick={() => handleApplyPreset(preset)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{preset.name}</span>
                      {preset.description && (
                        <span className="text-xs text-muted-foreground">{preset.description}</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {Object.keys(preset.filters).length} filter(s)
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => handleDeletePreset(preset.id, preset.name)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Save Preset Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter Preset</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Preset Name *</label>
              <Input
                placeholder="e.g., High Priority Tasks"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Input
                placeholder="e.g., Shows all high priority tasks assigned to me"
                value={presetDescription}
                onChange={(e) => setPresetDescription(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">Active Filters:</p>
              <div className="space-y-1">
                {Object.entries(currentFilters).map(([key, value]) => {
                  if (value === null || value === undefined || value === '') return null;
                  return (
                    <div key={key} className="text-sm text-muted-foreground">
                      <Badge variant="secondary">
                        {key}: {String(value)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreset}>
              <Save className="h-4 w-4 mr-2" />
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
