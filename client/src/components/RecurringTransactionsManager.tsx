import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface RecurringTransactionsManagerProps {
  farmId: string;
}

export function RecurringTransactionsManager({
  farmId,
}: RecurringTransactionsManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    transactionType: 'expense' as const,
    expenseType: 'feed',
    revenueType: 'crop_sale',
    description: '',
    amount: '',
    frequency: 'monthly' as const,
    dayOfMonth: '1',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  // Fetch recurring transactions
  const { data: recurringTransactions } = trpc.financialAnalysis.getRecurringTransactions?.useQuery?.(
    { farmId },
    { enabled: !!farmId }
  ) || { data: [] };

  // Create recurring transaction mutation
  const createMutation = trpc.financialAnalysis.createRecurringTransaction?.useMutation?.() || {
    mutate: () => toast.error('Feature not yet available'),
  };

  // Delete recurring transaction mutation
  const deleteMutation = trpc.financialAnalysis.deleteRecurringTransaction?.useMutation?.() || {
    mutate: () => toast.error('Feature not yet available'),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    createMutation.mutate(
      {
        farmId,
        transactionType: formData.transactionType,
        expenseType: formData.transactionType === 'expense' ? formData.expenseType : undefined,
        revenueType: formData.transactionType === 'revenue' ? formData.revenueType : undefined,
        description: formData.description,
        amount: parseFloat(formData.amount),
        frequency: formData.frequency,
        dayOfMonth: parseInt(formData.dayOfMonth),
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Recurring transaction created');
          setIsOpen(false);
          setFormData({
            transactionType: 'expense',
            expenseType: 'feed',
            revenueType: 'crop_sale',
            description: '',
            amount: '',
            frequency: 'monthly',
            dayOfMonth: '1',
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
          });
        },
        onError: (error: any) => {
          toast.error(error.message || 'Failed to create recurring transaction');
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this recurring transaction?')) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => {
            toast.success('Recurring transaction deleted');
          },
          onError: (error: any) => {
            toast.error(error.message || 'Failed to delete recurring transaction');
          },
        }
      );
    }
  };

  const frequencyLabels = {
    daily: 'Daily',
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
  };

  const expenseTypes = [
    'feed',
    'medication',
    'labor',
    'equipment',
    'utilities',
    'transport',
    'veterinary',
    'fertilizer',
    'seeds',
    'pesticides',
    'water',
    'rent',
    'insurance',
    'maintenance',
    'other',
  ];

  const revenueTypes = [
    'animal_sale',
    'milk_production',
    'egg_production',
    'wool_production',
    'meat_sale',
    'crop_sale',
    'produce_sale',
    'breeding_service',
    'other',
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recurring Transactions</CardTitle>
            <CardDescription>
              Automate regular expenses and revenue entries
            </CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Recurring
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Recurring Transaction</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.transactionType}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, transactionType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="revenue">Revenue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.transactionType === 'expense' && (
                  <div className="space-y-2">
                    <Label>Expense Type</Label>
                    <Select
                      value={formData.expenseType}
                      onValueChange={(value) =>
                        setFormData({ ...formData, expenseType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.transactionType === 'revenue' && (
                  <div className="space-y-2">
                    <Label>Revenue Type</Label>
                    <Select
                      value={formData.revenueType}
                      onValueChange={(value) =>
                        setFormData({ ...formData, revenueType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {revenueTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="e.g., Monthly feed purchase"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Amount (GHS)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, frequency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(frequencyLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>End Date (Optional)</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </div>

                <Button type="submit" className="w-full">
                  Create Recurring Transaction
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {recurringTransactions && recurringTransactions.length > 0 ? (
          <div className="space-y-3">
            {recurringTransactions.map((transaction: any) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{transaction.description}</span>
                    <Badge variant="outline" className="capitalize">
                      {frequencyLabels[transaction.frequency as keyof typeof frequencyLabels]}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {transaction.amount.toLocaleString()} GHS
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(transaction.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No recurring transactions set up yet</p>
            <p className="text-sm">Create one to automate regular entries</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
