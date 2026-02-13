import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface AddRevenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmId: number;
  onRevenueAdded?: () => void;
}

export function AddRevenueModal({ isOpen, onClose, farmId, onRevenueAdded }: AddRevenueModalProps) {
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    quantity: '',
    buyer: '',
    invoiceNumber: '',
    paymentStatus: 'pending',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  const { data: revenueTypes } = trpc.expenseRevenueEntry.getRevenueTypes.useQuery();
  const addRevenueMutation = trpc.expenseRevenueEntry.addRevenue.useMutation();

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.type) newErrors.type = 'Revenue type is required';
    if (!formData.description || formData.description.length < 3) {
      newErrors.description = 'Description must be at least 3 characters';
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.date) newErrors.date = 'Date is required';

    // Check if date is in future
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      newErrors.date = 'Date cannot be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await addRevenueMutation.mutateAsync({
        farmId,
        type: formData.type,
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date),
        quantity: formData.quantity ? parseFloat(formData.quantity) : undefined,
        buyer: formData.buyer || undefined,
        invoiceNumber: formData.invoiceNumber || undefined,
        paymentStatus: formData.paymentStatus as 'pending' | 'paid' | 'partial',
      });

      setSuccessMessage('Revenue added successfully!');
      setTimeout(() => {
        setFormData({
          type: '',
          description: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          quantity: '',
          buyer: '',
          invoiceNumber: '',
          paymentStatus: 'pending',
        });
        setSuccessMessage('');
        onRevenueAdded?.();
        onClose();
      }, 1500);
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to add revenue' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Revenue</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Revenue Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Revenue Type *</Label>
            <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select revenue type" />
              </SelectTrigger>
              <SelectContent>
                {revenueTypes?.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              placeholder="e.g., Sold 5 cattle"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
            {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (GHS) *</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
            />
            {errors.amount && <p className="text-sm text-red-600">{errors.amount}</p>}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
            />
            {errors.date && <p className="text-sm text-red-600">{errors.date}</p>}
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity (optional)</Label>
            <Input
              id="quantity"
              type="number"
              placeholder="e.g., 5"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => handleChange('quantity', e.target.value)}
            />
          </div>

          {/* Buyer */}
          <div className="space-y-2">
            <Label htmlFor="buyer">Buyer (optional)</Label>
            <Input
              id="buyer"
              placeholder="e.g., Mr. John Smith"
              value={formData.buyer}
              onChange={(e) => handleChange('buyer', e.target.value)}
            />
          </div>

          {/* Invoice Number */}
          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">Invoice Number (optional)</Label>
            <Input
              id="invoiceNumber"
              placeholder="e.g., INV-001"
              value={formData.invoiceNumber}
              onChange={(e) => handleChange('invoiceNumber', e.target.value)}
            />
          </div>

          {/* Payment Status */}
          <div className="space-y-2">
            <Label htmlFor="paymentStatus">Payment Status</Label>
            <Select value={formData.paymentStatus} onValueChange={(value) => handleChange('paymentStatus', value)}>
              <SelectTrigger id="paymentStatus">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={addRevenueMutation.isPending}>
              {addRevenueMutation.isPending ? 'Saving...' : 'Save Revenue'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
