import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, Copy, Loader2 } from "lucide-react";

interface TagIdTemplatesPanelProps {
  onSelectTemplate?: (tagIds: string[]) => void;
}

export function TagIdTemplatesPanel({ onSelectTemplate }: TagIdTemplatesPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    prefix: "TAG",
    description: "",
    paddingLength: 3,
    startNumber: 1,
  });

  const { data: templates = [] } = trpc.tagIdTemplates.list.useQuery();
  const createMutation = trpc.tagIdTemplates.create.useMutation();
  const deleteMutation = trpc.tagIdTemplates.delete.useMutation();
  const generateMutation = trpc.tagIdTemplates.generateTagIds.useMutation();

  const handleCreateTemplate = async () => {
    try {
      await createMutation.mutateAsync(newTemplate);
      setNewTemplate({
        name: "",
        prefix: "TAG",
        description: "",
        paddingLength: 3,
        startNumber: 1,
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to create template:", error);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (confirm("Are you sure you want to delete this template?")) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  const handleUseTemplate = async (templateId: number, count: number = 10) => {
    try {
      const tagIds = await generateMutation.mutateAsync({ templateId, count });
      onSelectTemplate?.(tagIds);
    } catch (error) {
      console.error("Failed to generate tag IDs:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Tag ID Templates</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Tag ID Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Template Name</Label>
                <Input
                  value={newTemplate.name}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, name: e.target.value })
                  }
                  placeholder="e.g., Cattle 2024"
                />
              </div>
              <div>
                <Label>Prefix</Label>
                <Input
                  value={newTemplate.prefix}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, prefix: e.target.value })
                  }
                  placeholder="e.g., TAG"
                />
              </div>
              <div>
                <Label>Padding Length</Label>
                <Input
                  type="number"
                  value={newTemplate.paddingLength}
                  onChange={(e) =>
                    setNewTemplate({
                      ...newTemplate,
                      paddingLength: parseInt(e.target.value),
                    })
                  }
                  min="1"
                  max="10"
                />
              </div>
              <div>
                <Label>Start Number</Label>
                <Input
                  type="number"
                  value={newTemplate.startNumber}
                  onChange={(e) =>
                    setNewTemplate({
                      ...newTemplate,
                      startNumber: parseInt(e.target.value),
                    })
                  }
                  min="0"
                />
              </div>
              <div>
                <Label>Description (Optional)</Label>
                <Input
                  value={newTemplate.description}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, description: e.target.value })
                  }
                  placeholder="Add notes about this template"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateTemplate}
                disabled={createMutation.isPending || !newTemplate.name}
              >
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <p className="text-sm text-gray-500">No templates yet. Create one to get started.</p>
      ) : (
        <div className="space-y-2">
          {templates.map((template: any) => (
            <Card key={template.id} className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{template.name}</p>
                  <p className="text-xs text-gray-600">
                    Format: {template.prefix}-
                    {String(template.startNumber).padStart(template.paddingLength, "0")}
                  </p>
                  {template.description && (
                    <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUseTemplate(template.id, 10)}
                    disabled={generateMutation.isPending}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteTemplate(template.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
