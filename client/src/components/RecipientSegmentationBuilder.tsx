'use client';

import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Save, Plus, Trash2 } from 'lucide-react';

interface Condition {
  id: string;
  attribute: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than';
  value: string;
}

interface SegmentGroup {
  id: string;
  logic: 'AND' | 'OR';
  conditions: Condition[];
}

interface RecipientSegment {
  id: string;
  name: string;
  description: string;
  rootGroup: SegmentGroup;
  recipientCount: number;
  createdAt: number;
  updatedAt: number;
}

interface ConditionRowProps {
  condition: Condition;
  onUpdate: (updated: Condition) => void;
  onDelete: () => void;
}

const ConditionRow: React.FC<ConditionRowProps> = ({ condition, onUpdate, onDelete }) => {
  return (
    <div className="flex gap-2 items-end">
      <Input
        placeholder="Attribute"
        value={condition.attribute}
        onChange={(e) => onUpdate({ ...condition, attribute: e.target.value })}
        className="flex-1"
      />
      <select
        value={condition.operator}
        onChange={(e) => onUpdate({ ...condition, operator: e.target.value as any })}
        className="px-3 py-2 border border-gray-300 rounded text-sm"
      >
        <option value="equals">Equals</option>
        <option value="contains">Contains</option>
        <option value="starts_with">Starts With</option>
        <option value="ends_with">Ends With</option>
        <option value="greater_than">Greater Than</option>
        <option value="less_than">Less Than</option>
      </select>
      <Input
        placeholder="Value"
        value={condition.value}
        onChange={(e) => onUpdate({ ...condition, value: e.target.value })}
        className="flex-1"
      />
      <Button
        onClick={onDelete}
        variant="ghost"
        size="sm"
        className="text-red-600 hover:text-red-700"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
};

interface SegmentGroupEditorProps {
  group: SegmentGroup;
  onUpdate: (updated: SegmentGroup) => void;
  onDelete: () => void;
}

const SegmentGroupEditor: React.FC<SegmentGroupEditorProps> = ({ group, onUpdate, onDelete }) => {
  const updateCondition = (index: number, updated: Condition) => {
    const newConditions = [...group.conditions];
    newConditions[index] = updated;
    onUpdate({ ...group, conditions: newConditions });
  };

  const deleteCondition = (index: number) => {
    const newConditions = group.conditions.filter((_, i) => i !== index);
    onUpdate({ ...group, conditions: newConditions });
  };

  const addCondition = () => {
    const newCondition: Condition = {
      id: `cond-${Date.now()}`,
      attribute: '',
      operator: 'equals',
      value: '',
    };
    onUpdate({ ...group, conditions: [...group.conditions, newCondition] });
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <select
          value={group.logic}
          onChange={(e) => onUpdate({ ...group, logic: e.target.value as 'AND' | 'OR' })}
          className="px-3 py-2 border border-gray-300 rounded text-sm"
        >
          <option value="AND">AND</option>
          <option value="OR">OR</option>
        </select>
        <span className="text-sm text-gray-600">logic</span>
      </div>

      <div className="space-y-3 mb-4">
        {group.conditions.map((condition, index) => (
          <ConditionRow
            key={condition.id}
            condition={condition}
            onUpdate={(updated) => updateCondition(index, updated)}
            onDelete={() => deleteCondition(index)}
          />
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={addCondition}
        className="w-full mb-4"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Condition
      </Button>
    </Card>
  );
};

export interface RecipientSegmentationBuilderProps {
  onSave?: (segment: RecipientSegment) => void;
  onCancel?: () => void;
  initialSegment?: RecipientSegment;
}

export const RecipientSegmentationBuilder: React.FC<RecipientSegmentationBuilderProps> = ({
  onSave,
  onCancel,
  initialSegment,
}) => {
  const [name, setName] = useState(initialSegment?.name || '');
  const [description, setDescription] = useState(initialSegment?.description || '');
  const [rootGroup, setRootGroup] = useState<SegmentGroup>(
    initialSegment?.rootGroup || {
      id: `group-${Date.now()}`,
      logic: 'AND',
      conditions: [
        {
          id: `cond-${Date.now()}`,
          attribute: 'email',
          operator: 'equals',
          value: '',
        },
      ],
    }
  );
  const [recipientCount, setRecipientCount] = useState(initialSegment?.recipientCount || 0);

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      alert('Please enter a segment name');
      return;
    }

    const segment: RecipientSegment = {
      id: initialSegment?.id || `seg-${Date.now()}`,
      name,
      description,
      rootGroup,
      recipientCount,
      createdAt: initialSegment?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSave?.(segment);
  }, [name, description, rootGroup, recipientCount, initialSegment, onSave]);

  const handleDuplicate = useCallback(() => {
    const duplicated: RecipientSegment = {
      id: `seg-${Date.now()}`,
      name: `${name} (Copy)`,
      description,
      rootGroup: JSON.parse(JSON.stringify(rootGroup)),
      recipientCount,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onSave?.(duplicated);
  }, [name, description, rootGroup, recipientCount, onSave]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold mb-4">
          {initialSegment ? 'Edit Segment' : 'Create Segment'}
        </h2>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Segment Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., High Engagement Users"
              className="text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this segment..."
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              rows={3}
            />
          </div>
        </div>
      </Card>

      <div>
        <h3 className="text-lg font-semibold mb-4">Segment Rules</h3>
        <SegmentGroupEditor group={rootGroup} onUpdate={setRootGroup} onDelete={() => {}} />
      </div>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="text-sm">
          <p className="font-semibold text-blue-900 mb-2">Estimated Recipients</p>
          <p className="text-2xl font-bold text-blue-600">{recipientCount.toLocaleString()}</p>
          <p className="text-xs text-blue-700 mt-2">
            This count updates in real-time as you modify the rules
          </p>
        </div>
      </Card>

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        {initialSegment && (
          <Button variant="outline" onClick={handleDuplicate}>
            <Copy className="w-4 h-4 mr-2" />
            Duplicate
          </Button>
        )}
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4 mr-2" />
          {initialSegment ? 'Update' : 'Create'} Segment
        </Button>
      </div>
    </div>
  );
};

export default RecipientSegmentationBuilder;
