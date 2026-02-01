import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, DollarSign, TrendingUp, TrendingDown } from "lucide-react";

export function FarmFinance() {
  const [farmId] = useState<number>(0);
  const [showExpense, setShowExpense] = useState(false);
  const [showRevenue, setShowRevenue] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [revenues, setRevenues] = useState<any[]>([]);

  const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const totalRevenue = revenues.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0";

  const handleAddExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const expense = {
      id: Date.now(),
      category: formData.get("category"),
      amount: formData.get("amount"),
      date: formData.get("date"),
      description: formData.get("description"),
      paymentMethod: formData.get("paymentMethod"),
    };
    setExpenses([...expenses, expense]);
    // Toast notification would go here
    setShowExpense(false);
    (e.target as HTMLFormElement).reset();
  };

  const handleAddRevenue = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const revenue = {
      id: Date.now(),
      source: formData.get("source"),
      amount: formData.get("amount"),
      date: formData.get("date"),
      buyer: formData.get("buyer"),
      quantity: formData.get("quantity"),
      unit: formData.get("unit"),
      paymentMethod: formData.get("paymentMethod"),
    };
    setRevenues([...revenues, revenue]);
    // Toast notification would go here
    setShowRevenue(false);
    (e.target as HTMLFormElement).reset();
  };

  const expensesByCategory = expenses.reduce((acc: any, e) => {
    const cat = e.category || "Other";
    acc[cat] = (acc[cat] || 0) + (parseFloat(e.amount) || 0);
    return acc;
  }, {});

  const revenueBySource = revenues.reduce((acc: any, r) => {
    const src = r.source || "Other";
    acc[src] = (acc[src] || 0) + (parseFloat(r.amount) || 0);
    return acc;
  }, {});

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <DollarSign className="w-8 h-8" />
            Farm Finance
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">Track expenses and revenue</p>
        </div>
        <div className="flex flex-col gap-2 md:flex-row">
          <Dialog open={showExpense} onOpenChange={setShowExpense}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto"><Plus className="w-4 h-4 mr-2" />Add Expense</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Record Expense</DialogTitle>
                <DialogDescription>Add a farm expense</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" defaultValue="seeds">
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seeds">Seeds/Seedlings</SelectItem>
                      <SelectItem value="fertilizer">Fertilizer</SelectItem>
                      <SelectItem value="pesticides">Pesticides</SelectItem>
                      <SelectItem value="labor">Labor</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="water">Water/Irrigation</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (GHS)</Label>
                  <Input id="amount" name="amount" type="number" step="0.01" placeholder="0.00" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" name="date" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" placeholder="Details about the expense..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select name="paymentMethod" defaultValue="cash">
                    <SelectTrigger id="paymentMethod">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="momo">Mobile Money</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Record Expense</Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={showRevenue} onOpenChange={setShowRevenue}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto"><Plus className="w-4 h-4 mr-2" />Add Revenue</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Record Revenue</DialogTitle>
                <DialogDescription>Add farm income</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddRevenue} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Select name="source" defaultValue="crop_sale">
                    <SelectTrigger id="source">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crop_sale">Crop Sale</SelectItem>
                      <SelectItem value="livestock_sale">Livestock Sale</SelectItem>
                      <SelectItem value="produce_sale">Produce Sale</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (GHS)</Label>
                  <Input id="amount" name="amount" type="number" step="0.01" placeholder="0.00" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" name="date" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyer">Buyer</Label>
                  <Input id="buyer" name="buyer" placeholder="Buyer name" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input id="quantity" name="quantity" type="number" placeholder="100" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input id="unit" name="unit" placeholder="kg" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select name="paymentMethod" defaultValue="cash">
                    <SelectTrigger id="paymentMethod">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="momo">Mobile Money</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Record Revenue</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              ₵{totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              ₵{totalExpenses.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
              ₵{netProfit.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${parseFloat(profitMargin) >= 0 ? "text-green-600" : "text-red-600"}`}>
              {profitMargin}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses</CardTitle>
            <CardDescription>Farm expenses by category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(expensesByCategory).map(([category, amount]: [string, any]) => (
              <div key={category} className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm font-medium">{category}</span>
                <span className="font-semibold">₵{amount.toFixed(2)}</span>
              </div>
            ))}
            {expenses.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No expenses recorded yet</p>
            )}
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Farm income by source</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(revenueBySource).map(([source, amount]: [string, any]) => (
              <div key={source} className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm font-medium">{source}</span>
                <span className="font-semibold">₵{amount.toFixed(2)}</span>
              </div>
            ))}
            {revenues.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No revenue recorded yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {[...expenses, ...revenues].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10).map((transaction: any) => (
              <div key={transaction.id} className="flex justify-between items-start pb-3 border-b text-sm">
                <div className="flex-1">
                  <p className="font-medium">{transaction.category || transaction.source}</p>
                  <p className="text-xs text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</p>
                </div>
                <span className={`font-semibold ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                  {transaction.category ? "-" : "+"}₵{Math.abs(parseFloat(transaction.amount)).toFixed(2)}
                </span>
              </div>
            ))}
            {expenses.length === 0 && revenues.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No transactions yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
