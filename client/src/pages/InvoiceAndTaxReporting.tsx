import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Download, FileText, Calendar } from "lucide-react";
import { toast } from "sonner";
import { generateInvoicePDF, generateTaxReportPDF } from "@/lib/invoicePdfGenerator";

export const InvoiceAndTaxReporting: React.FC = () => {
  const { user } = useAuth();
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [selectedFarmId, setSelectedFarmId] = useState<string>("");
  const [invoiceFormData, setInvoiceFormData] = useState({
    invoiceNumber: "",
    clientName: "",
    items: [{ description: "", quantity: 1, unitPrice: 0, amount: 0 }],
    totalAmount: 0,
    dueDate: new Date().toISOString().split('T')[0],
    notes: ""
  });

  // Fetch user's farms
  const { data: farms = [] } = trpc.farms.list.useQuery();

  // Set default farm on load
  React.useEffect(() => {
    if (farms.length > 0 && !selectedFarmId) {
      setSelectedFarmId(farms[0].id.toString());
    }
  }, [farms, selectedFarmId]);

  const farmId = selectedFarmId || (farms[0]?.id.toString() ?? "");

  // Fetch invoices
  const { data: invoices } = trpc.financialManagement.getInvoices.useQuery(
    farmId ? { farmId } : undefined,
    { enabled: !!farmId }
  );

  // Create invoice mutation
  const createInvoiceMutation = trpc.financialManagement.createInvoice.useMutation({
    onSuccess: () => {
      toast.success("Invoice created successfully!");
      setIsCreateInvoiceOpen(false);
      setInvoiceFormData({
        invoiceNumber: "",
        clientName: "",
        items: [{ description: "", quantity: 1, unitPrice: 0, amount: 0 }],
        totalAmount: 0,
        dueDate: new Date().toISOString().split('T')[0],
        notes: ""
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create invoice");
    }
  });

  // Update invoice status mutation
  const updateInvoiceStatusMutation = trpc.financialManagement.updateInvoiceStatus.useMutation({
    onSuccess: () => {
      toast.success("Invoice status updated!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update invoice status");
    }
  });

  const handleCreateInvoice = async () => {
    if (!invoiceFormData.invoiceNumber || !invoiceFormData.clientName) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createInvoiceMutation.mutateAsync({
        farmId,
        invoiceNumber: invoiceFormData.invoiceNumber,
        clientName: invoiceFormData.clientName,
        items: invoiceFormData.items,
        totalAmount: invoiceFormData.totalAmount,
        dueDate: new Date(invoiceFormData.dueDate),
        notes: invoiceFormData.notes
      });
    } catch (error) {
      console.error("Failed to create invoice:", error);
    }
  };

  const handleUpdateInvoiceStatus = async (invoiceId: string, newStatus: string) => {
    try {
      await updateInvoiceStatusMutation.mutateAsync({
        invoiceId,
        status: newStatus as "draft" | "sent" | "paid" | "overdue" | "cancelled"
      });
    } catch (error) {
      console.error("Failed to update invoice status:", error);
    }
  };

  const handleGeneratePDF = (invoice: any) => {
    try {
      generateInvoicePDF({
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        items: invoice.items,
        totalAmount: invoice.totalAmount,
        dueDate: invoice.dueDate,
        notes: invoice.notes,
        createdAt: invoice.createdAt
      });
      toast.success("Invoice PDF downloaded!");
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Please log in to view invoices</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Invoicing & Tax Reporting</h1>
          {farms.length > 0 && (
            <select
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              className="mt-2 border rounded px-3 py-2 text-sm"
            >
              {farms.map((farm: any) => (
                <option key={farm.id} value={farm.id.toString()}>
                  {farm.farmName}
                </option>
              ))}
            </select>
          )}
        </div>
        <Dialog open={isCreateInvoiceOpen} onOpenChange={setIsCreateInvoiceOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>Generate an invoice for your farm products or services</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input
                    id="invoiceNumber"
                    value={invoiceFormData.invoiceNumber}
                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, invoiceNumber: e.target.value })}
                    placeholder="INV-001"
                  />
                </div>
                <div>
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input
                    id="clientName"
                    value={invoiceFormData.clientName}
                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, clientName: e.target.value })}
                    placeholder="Client name"
                  />
                </div>
              </div>

              <div>
                <Label className="block text-sm font-medium mb-2">Invoice Items</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {invoiceFormData.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-4 gap-2">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => {
                          const newItems = [...invoiceFormData.items];
                          newItems[idx].description = e.target.value;
                          setInvoiceFormData({ ...invoiceFormData, items: newItems });
                        }}
                      />
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...invoiceFormData.items];
                          newItems[idx].quantity = parseInt(e.target.value) || 0;
                          newItems[idx].amount = newItems[idx].quantity * newItems[idx].unitPrice;
                          const total = newItems.reduce((sum, i) => sum + i.amount, 0);
                          setInvoiceFormData({ ...invoiceFormData, items: newItems, totalAmount: total });
                        }}
                      />
                      <Input
                        type="number"
                        placeholder="Price"
                        value={item.unitPrice}
                        onChange={(e) => {
                          const newItems = [...invoiceFormData.items];
                          newItems[idx].unitPrice = parseFloat(e.target.value) || 0;
                          newItems[idx].amount = newItems[idx].quantity * newItems[idx].unitPrice;
                          const total = newItems.reduce((sum, i) => sum + i.amount, 0);
                          setInvoiceFormData({ ...invoiceFormData, items: newItems, totalAmount: total });
                        }}
                      />
                      <div className="text-right pt-2">
                        GHS {item.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={invoiceFormData.dueDate}
                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, dueDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="totalAmount">Total Amount</Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    value={invoiceFormData.totalAmount}
                    readOnly
                    className="bg-gray-100"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  value={invoiceFormData.notes}
                  onChange={(e) => setInvoiceFormData({ ...invoiceFormData, notes: e.target.value })}
                  placeholder="Additional notes"
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                />
              </div>

              <Button onClick={handleCreateInvoice} className="w-full">
                Create Invoice
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="invoices" className="w-full">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="taxreport">Tax Report</TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <div className="space-y-4">
            {invoices && invoices.length > 0 ? (
              invoices.map((invoice: any) => (
                <Card key={invoice.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{invoice.invoiceNumber}</CardTitle>
                        <CardDescription>
                          Client: {invoice.clientName}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">GHS {invoice.totalAmount}</p>
                        <span className={`inline-block px-3 py-1 rounded text-sm font-medium mt-2 ${getStatusColor(invoice.status)}`}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Created Date</p>
                          <p className="font-medium">{new Date(invoice.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Due Date</p>
                          <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">Items</p>
                        <div className="space-y-1 text-sm">
                          {invoice.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between">
                              <span>{item.description} x {item.quantity}</span>
                              <span>GHS {item.amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {invoice.notes && (
                        <div>
                          <p className="text-sm font-medium">Notes</p>
                          <p className="text-sm text-gray-600">{invoice.notes}</p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGeneratePDF(invoice)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        {invoice.status === "draft" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateInvoiceStatus(invoice.id, "sent")}
                            >
                              Mark as Sent
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateInvoiceStatus(invoice.id, "cancelled")}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {invoice.status === "sent" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateInvoiceStatus(invoice.id, "paid")}
                          >
                            Mark as Paid
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500">No invoices created yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tax Report Tab */}
        <TabsContent value="taxreport">
          <Card>
            <CardHeader>
              <CardTitle>Tax Reporting</CardTitle>
              <CardDescription>Generate tax reports for accounting and compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="taxYear">Tax Year</Label>
                    <Input type="number" id="taxYear" placeholder="2026" defaultValue={new Date().getFullYear()} />
                  </div>
                  <div>
                    <Label htmlFor="reportFormat">Report Format</Label>
                    <select id="reportFormat" className="w-full border rounded px-3 py-2">
                      <option>PDF Report</option>
                      <option>Excel Spreadsheet</option>
                      <option>CSV Export</option>
                      <option>QuickBooks Format</option>
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Tax Report Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Income:</span>
                      <span className="font-medium">GHS 0.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Deductible Expenses:</span>
                      <span className="font-medium">GHS 0.00</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Taxable Income:</span>
                      <span className="font-medium">GHS 0.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Tax (15%):</span>
                      <span className="font-medium text-red-600">GHS 0.00</span>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full"
                  onClick={() => {
                    try {
                      generateTaxReportPDF({
                        taxYear: new Date().getFullYear(),
                        totalIncome: 0,
                        totalExpenses: 0,
                        taxableIncome: 0,
                        estimatedTax: 0,
                        farmName: farms[0]?.farmName
                      });
                      toast.success("Tax report PDF downloaded!");
                    } catch (error) {
                      console.error("Failed to generate tax report:", error);
                      toast.error("Failed to generate tax report");
                    }
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Tax Report
                </Button>

                <div className="bg-gray-50 border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Ghana Tax Information</h3>
                  <p className="text-sm text-gray-600">
                    This tool helps you prepare tax reports for Ghana's Internal Revenue Authority (IRA). 
                    Please consult with a tax professional to ensure compliance with current tax regulations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
