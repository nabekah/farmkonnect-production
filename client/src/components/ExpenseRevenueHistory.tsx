import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";

interface ExpenseRevenueHistoryProps {
  farmId: string;
  type: "expense" | "revenue";
  startDate?: Date;
  endDate?: Date;
}

export const ExpenseRevenueHistory: React.FC<ExpenseRevenueHistoryProps> = ({
  farmId,
  type,
  startDate,
  endDate
}) => {
  const [sortBy, setSortBy] = useState<"date" | "amount" | "category">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterText, setFilterText] = useState("");

  // Fetch data based on type
  const { data: expenses } = trpc.financialManagement.getExpenses.useQuery(
    farmId && type === "expense"
      ? { farmId, startDate, endDate, limit: 100 }
      : undefined,
    { enabled: type === "expense" && !!farmId }
  );

  const { data: revenues } = trpc.financialManagement.getRevenue.useQuery(
    farmId && type === "revenue"
      ? { farmId, startDate, endDate, limit: 100 }
      : undefined,
    { enabled: type === "revenue" && !!farmId }
  );

  const records = type === "expense" ? expenses || [] : revenues || [];

  // Filter records
  const filteredRecords = records.filter(record => {
    const searchText = filterText.toLowerCase();
    const description = (record as any).description?.toLowerCase() || "";
    const vendor = (record as any).vendor?.toLowerCase() || "";
    const buyer = (record as any).buyer?.toLowerCase() || "";
    
    return (
      description.includes(searchText) ||
      vendor.includes(searchText) ||
      buyer.includes(searchText)
    );
  });

  // Sort records
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    if (sortBy === "date") {
      aValue = new Date((a as any).expenseDate || (a as any).revenueDate);
      bValue = new Date((b as any).expenseDate || (b as any).revenueDate);
    } else if (sortBy === "amount") {
      aValue = parseFloat((a as any).amount);
      bValue = parseFloat((b as any).amount);
    } else {
      aValue = ((a as any).category || (a as any).revenueType)?.toLowerCase();
      bValue = ((b as any).category || (b as any).revenueType)?.toLowerCase();
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleExportCSV = () => {
    if (sortedRecords.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = type === "expense"
      ? ["Date", "Category", "Description", "Vendor", "Amount (GHS)", "Payment Status"]
      : ["Date", "Type", "Description", "Buyer", "Amount (GHS)", "Payment Status"];

    const rows = sortedRecords.map(record => {
      const date = new Date((record as any).expenseDate || (record as any).revenueDate);
      const dateStr = date.toLocaleDateString("en-US");
      const category = (record as any).category || (record as any).revenueType;
      const description = (record as any).description;
      const vendor = (record as any).vendor || (record as any).buyer || "";
      const amount = (record as any).amount;
      const status = (record as any).paymentStatus || "pending";

      return [dateStr, category, description, vendor, amount, status].map(cell =>
        `"${String(cell).replace(/"/g, '""')}"`
      ).join(",");
    });

    const csvContent = [
      headers.join(","),
      ...rows
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${type}-history-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`${type} data exported to CSV`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{type === "expense" ? "Expense" : "Revenue"} History</CardTitle>
            <CardDescription>View and manage {type} records</CardDescription>
          </div>
          <Button onClick={handleExportCSV} size="sm" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by description, vendor, or buyer..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="sortBy">Sort By</Label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border rounded px-3 py-2"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="category">Category</option>
              </select>
            </div>
            <div>
              <Label htmlFor="sortOrder">Order</Label>
              <select
                id="sortOrder"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="border rounded px-3 py-2"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">{type === "expense" ? "Category" : "Type"}</th>
                  <th className="text-left p-2">Description</th>
                  <th className="text-left p-2">{type === "expense" ? "Vendor" : "Buyer"}</th>
                  <th className="text-right p-2">Amount (GHS)</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-center p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedRecords.length > 0 ? (
                  sortedRecords.map((record, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        {new Date((record as any).expenseDate || (record as any).revenueDate).toLocaleDateString("en-US")}
                      </td>
                      <td className="p-2 capitalize">
                        {((record as any).category || (record as any).revenueType)?.replace(/_/g, " ")}
                      </td>
                      <td className="p-2">{(record as any).description}</td>
                      <td className="p-2">{(record as any).vendor || (record as any).buyer || "-"}</td>
                      <td className="p-2 text-right font-semibold">
                        {parseFloat((record as any).amount).toLocaleString("en-US", { maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          (record as any).paymentStatus === "paid"
                            ? "bg-green-100 text-green-800"
                            : (record as any).paymentStatus === "partial"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {(record as any).paymentStatus || "pending"}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-gray-500">
                      No {type} records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          {sortedRecords.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Total {type}s: <strong>{sortedRecords.length}</strong> | 
                Total Amount: <strong>GHS {sortedRecords.reduce((sum, r) => sum + parseFloat((r as any).amount), 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}</strong>
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseRevenueHistory;
