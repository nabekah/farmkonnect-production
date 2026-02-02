import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Copy, Trash2, Edit2, Star } from 'lucide-react';

export default function ReportTemplates() {
  const toast = ({ title, description }: { title: string; description: string }) => {
    console.log(`[Toast] ${title}: ${description}`);
  };

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    reportType: 'financial' as 'financial' | 'livestock' | 'complete',
    sections: [] as string[],
  });

  // Queries
  const { data: farms } = trpc.farms.list.useQuery();
  const { data: templates, refetch: refetchTemplates } = trpc.reportTemplates.getTemplatesForFarm.useQuery(
    { farmId: parseInt(selectedFarmId) },
    { enabled: !!selectedFarmId }
  );
  const { data: availableSections } = trpc.reportTemplates.getAvailableSections.useQuery(
    { reportType: newTemplate.reportType }
  );

  // Mutations
  const createTemplate = trpc.reportTemplates.createTemplate.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Template created successfully' });
      setIsCreateDialogOpen(false);
      setNewTemplate({ name: '', reportType: 'financial', sections: [] });
      refetchTemplates();
    },
  });

  const deleteTemplate = trpc.reportTemplates.deleteTemplate.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Template deleted successfully' });
      refetchTemplates();
    },
  });

  const cloneTemplate = trpc.reportTemplates.cloneTemplate.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Template cloned successfully' });
      refetchTemplates();
    },
  });

  const setDefault = trpc.reportTemplates.setDefaultTemplate.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Default template set successfully' });
      refetchTemplates();
    },
  });

  const handleCreateTemplate = () => {
    if (!newTemplate.name || newTemplate.sections.length === 0) {
      toast({ title: 'Error', description: 'Please fill all required fields' });
      return;
    }

    createTemplate.mutate({
      farmId: parseInt(selectedFarmId),
      name: newTemplate.name,
      reportType: newTemplate.reportType,
      sections: newTemplate.sections,
    });
  };

  const toggleSection = (sectionName: string) => {
    setNewTemplate((prev) => ({
      ...prev,
      sections: prev.sections.includes(sectionName)
        ? prev.sections.filter((s) => s !== sectionName)
        : [...prev.sections, sectionName],
    }));
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Report Templates</h1>
          <p className="text-muted-foreground">Customize report sections and branding</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Report Template</DialogTitle>
              <DialogDescription>
                Customize which sections to include in your reports
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Farm</Label>
                <Select value={selectedFarmId} onValueChange={setSelectedFarmId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select farm" />
                  </SelectTrigger>
                  <SelectContent>
                    {farms?.map((farm) => (
                      <SelectItem key={farm.id} value={farm.id.toString()}>
                        {farm.farmName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  placeholder="e.g., Monthly Financial Report"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select
                  value={newTemplate.reportType}
                  onValueChange={(value: any) => setNewTemplate({ ...newTemplate, reportType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="financial">Financial Report</SelectItem>
                    <SelectItem value="livestock">Livestock Report</SelectItem>
                    <SelectItem value="complete">Complete Farm Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Report Sections</Label>
                <div className="space-y-2 border rounded-lg p-3">
                  {availableSections?.map((section) => (
                    <div key={section.name} className="flex items-center space-x-2">
                      <Checkbox
                        id={section.name}
                        checked={newTemplate.sections.includes(section.name)}
                        onCheckedChange={() => toggleSection(section.name)}
                      />
                      <Label htmlFor={section.name} className="font-normal cursor-pointer">
                        {section.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate} disabled={createTemplate.isPending}>
                {createTemplate.isPending ? 'Creating...' : 'Create Template'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Farm Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Farm</CardTitle>
          <CardDescription>Choose a farm to view and manage its templates</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedFarmId} onValueChange={setSelectedFarmId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a farm to view templates" />
            </SelectTrigger>
            <SelectContent>
              {farms?.map((farm) => (
                <SelectItem key={farm.id} value={farm.id.toString()}>
                  {farm.farmName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Templates List */}
      {selectedFarmId && (
        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
            <CardDescription>Manage report templates for {farms?.find((f) => f.id.toString() === selectedFarmId)?.farmName}</CardDescription>
          </CardHeader>
          <CardContent>
            {!templates || templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No templates yet. Create one to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {templates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{template.name}</h3>
                        <Badge variant="outline" className="capitalize">
                          {template.reportType}
                        </Badge>
                        {template.isDefault && (
                          <Badge className="bg-amber-500">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>{template.includeSections?.length || 0} sections included</p>
                        {template.description && <p>{template.description}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!template.isDefault && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setDefault.mutate({
                              farmId: parseInt(selectedFarmId),
                              templateId: template.id,
                            })
                          }
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          cloneTemplate.mutate({
                            templateId: template.id,
                            newName: `${template.name} (Copy)`,
                          })
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteTemplate.mutate({ templateId: template.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
