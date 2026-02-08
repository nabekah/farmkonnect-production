import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface RecurringExpenseManagerProps {
  farmId: string;
}

export const RecurringExpenseManager: React.FC<RecurringExpenseManagerProps> = ({ farmId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    category: "feed",
    description: "",
    amount: "",
    frequency: "monthly",
    notes: ""
  });

  // Fetch templates
  const { data: templates = [] } = trpc.recurringExpenses.getTemplates.useQuery(
    farmId ? { farmId } : undefined,
    { enabled: !!farmId }
  );

  // Create template mutation
  const createTemplateMutation = trpc.recurringExpenses.createTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template created successfully!");
      setTemplateForm({
        name: "",
        category: "feed",
        description: "",
        amount: "",
        frequency: "monthly",
        notes: ""
      });
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create template");
    }
  });

  // Apply template mutation
  const applyTemplateMutation = trpc.recurringExpenses.applyTemplate.useMutation({
    onSuccess: () => {
      toast.success("Expense created from template!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to apply template");
    }
  });

  const handleCreateTemplate = async () => {
    if (!templateForm.name || !templateForm.description || !templateForm.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    await createTemplateMutation.mutateAsync({
      farmId,
      name: templateForm.name,
      category: templateForm.category as any,
      description: templateForm.description,
      amount: parseFloat(templateForm.amount),
      frequency: templateForm.frequency as any,
      notes: templateForm.notes || undefined
    });
  };

  const handleApplyTemplate = async (templateId: string) => {
    await applyTemplateMutation.mutateAsync({
      farmId,
      templateId,
      expenseDate: new Date()
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Recurring Expense Templates</CardTitle>
            <CardDescription>Create and manage recurring expense templates</CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Expense Template</DialogTitle>
                <DialogDescription>Create a template for recurring expenses</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    placeholder="e.g., Monthly Feed Purchase"
                  />
                </div>
                <div>
                  <Label htmlFor="template-category">Category</Label>
                  <select
                    id="template-category"
                    value={templateForm.category}
                    onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="feed">Feed</option>
                    <option value="medication">Medication</option>
                    <option value="labor">Labor</option>
                    <option value="equipment">Equipment</option>
                    <option value="utilities">Utilities</option>
                    <option value="transport">Transport</option>
                    <option value="veterinary">Veterinary</option>
                    <option value="fertilizer">Fertilizer</option>
                    <option value="seeds">Seeds</option>
                    <option value="pesticides">Pesticides</option>
                    <option value="water">Water</option>
                    <option value="rent">Rent</option>
                    <option value="insurance">Insurance</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="template-description">Description</Label>
                  <Input
                    id="template-description"
                    value={templateForm.description}
                    onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                    placeholder="e.g., Chicken feed 50kg bag"
                  />
                </div>
                <div>
                  <Label htmlFor="template-amount">Amount (GHS)</Label>
                  <Input
                    id="template-amount"
                    type="number"
                    value={templateForm.amount}
                    onChange={(e) => setTemplateForm({ ...templateForm, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="template-frequency">Frequency</Label>
                  <select
                    id="template-frequency"
                    value={templateForm.frequency}
                    onChange={(e) => setTemplateForm({ ...templateForm, frequency: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="template-notes">Notes (Optional)</Label>
                  <Input
                    id="template-notes"
                    value={templateForm.notes}
                    onChange={(e) => setTemplateForm({ ...templateForm, notes: e.target.value })}
                    placeholder="Additional notes"
                  />
                </div>
                <Button onClick={handleCreateTemplate} className="w-full">
                  Create Template
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {templates.length > 0 ? (
            templates.map((template: any) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <h4 className="font-semibold">{template.name}</h4>
                  <p className="text-sm text-gray-600">
                    {template.description} • GHS {parseFloat(template.amount).toLocaleString("en-US", { maximumFractionDigits: 2 })} • {template.frequency}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApplyTemplate(template.id.toString())}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Apply
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">
              No templates created yet. Create one to get started!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecurringExpenseManager;
