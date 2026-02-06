import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

export interface ValidationRule {
  id?: string;
  entityType: string;
  fieldName: string;
  ruleType: 'required' | 'min' | 'max' | 'pattern' | 'enum' | 'custom';
  ruleValue?: Record<string, any>;
  errorMessage: string;
  isActive: boolean;
}

interface ValidationRuleBuilderProps {
  entityType: string;
  rules: ValidationRule[];
  onRulesChange: (rules: ValidationRule[]) => void;
  onSave?: (rule: ValidationRule) => Promise<void>;
}

export function ValidationRuleBuilder({
  entityType,
  rules,
  onRulesChange,
  onSave,
}: ValidationRuleBuilderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ValidationRule | null>(null);
  const [formData, setFormData] = useState<Partial<ValidationRule>>({
    entityType,
    ruleType: 'required',
    isActive: true,
  });

  const handleAddRule = async () => {
    if (!formData.fieldName || !formData.errorMessage) {
      alert('Please fill in all required fields');
      return;
    }

    const newRule: ValidationRule = {
      id: editingRule?.id || `rule_${Date.now()}`,
      entityType,
      fieldName: formData.fieldName,
      ruleType: formData.ruleType as any,
      ruleValue: formData.ruleValue,
      errorMessage: formData.errorMessage,
      isActive: formData.isActive ?? true,
    };

    if (onSave) {
      try {
        await onSave(newRule);
      } catch (error) {
        console.error('Failed to save rule:', error);
        alert('Failed to save rule');
        return;
      }
    }

    if (editingRule) {
      onRulesChange(rules.map(r => r.id === editingRule.id ? newRule : r));
    } else {
      onRulesChange([...rules, newRule]);
    }

    setFormData({ entityType, ruleType: 'required', isActive: true });
    setEditingRule(null);
    setIsOpen(false);
  };

  const handleEditRule = (rule: ValidationRule) => {
    setEditingRule(rule);
    setFormData(rule);
    setIsOpen(true);
  };

  const handleDeleteRule = (ruleId: string | undefined) => {
    if (!ruleId) return;
    onRulesChange(rules.filter(r => r.id !== ruleId));
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingRule(null);
    setFormData({ entityType, ruleType: 'required', isActive: true });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Validation Rules</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" onClick={() => setEditingRule(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRule ? 'Edit Rule' : 'Add Validation Rule'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Field Name</label>
                <Input
                  value={formData.fieldName || ''}
                  onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
                  placeholder="e.g., age, weight, email"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Rule Type</label>
                <Select value={formData.ruleType} onValueChange={(value) => setFormData({ ...formData, ruleType: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="required">Required</SelectItem>
                    <SelectItem value="min">Minimum Value</SelectItem>
                    <SelectItem value="max">Maximum Value</SelectItem>
                    <SelectItem value="pattern">Pattern (Regex)</SelectItem>
                    <SelectItem value="enum">Enum (List of Values)</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.ruleType === 'min' && (
                <div>
                  <label className="text-sm font-medium">Minimum Value</label>
                  <Input
                    type="number"
                    value={formData.ruleValue?.min || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      ruleValue: { ...formData.ruleValue, min: Number(e.target.value) }
                    })}
                    placeholder="e.g., 0"
                  />
                </div>
              )}

              {formData.ruleType === 'max' && (
                <div>
                  <label className="text-sm font-medium">Maximum Value</label>
                  <Input
                    type="number"
                    value={formData.ruleValue?.max || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      ruleValue: { ...formData.ruleValue, max: Number(e.target.value) }
                    })}
                    placeholder="e.g., 100"
                  />
                </div>
              )}

              {formData.ruleType === 'pattern' && (
                <div>
                  <label className="text-sm font-medium">Regex Pattern</label>
                  <Input
                    value={formData.ruleValue?.pattern || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      ruleValue: { ...formData.ruleValue, pattern: e.target.value }
                    })}
                    placeholder="e.g., ^[a-z0-9]+$"
                  />
                </div>
              )}

              {formData.ruleType === 'enum' && (
                <div>
                  <label className="text-sm font-medium">Values (comma-separated)</label>
                  <Input
                    value={formData.ruleValue?.values?.join(',') || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      ruleValue: { ...formData.ruleValue, values: e.target.value.split(',').map(v => v.trim()) }
                    })}
                    placeholder="e.g., active, inactive, pending"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Error Message</label>
                <Input
                  value={formData.errorMessage || ''}
                  onChange={(e) => setFormData({ ...formData, errorMessage: e.target.value })}
                  placeholder="e.g., Age must be between 1 and 120"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive ?? true}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <label htmlFor="isActive" className="text-sm font-medium">Active</label>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddRule} className="flex-1">
                  {editingRule ? 'Update Rule' : 'Add Rule'}
                </Button>
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {rules.length === 0 ? (
          <p className="text-sm text-gray-500">No validation rules defined</p>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
              <div className="flex-1">
                <p className="font-medium text-sm">{rule.fieldName}</p>
                <p className="text-xs text-gray-600">{rule.ruleType} - {rule.errorMessage}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {rule.isActive ? 'Active' : 'Inactive'}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEditRule(rule)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteRule(rule.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
