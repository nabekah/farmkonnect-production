import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  FileText,
  Plus,
  Download,
  Calendar,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  Pill,
  Stethoscope,
  Shield,
  TrendingUpIcon,
} from "lucide-react";

/**
 * Financial Management & Accounting Component
 * Comprehensive farm financial management and reporting with veterinary integration
 */
export const FinancialManagement: React.FC = () => {
  const [viewMode, setViewMode] = useState<
    "dashboard" | "expenses" | "revenue" | "budget" | "forecast" | "reports" | "tax" | "veterinary" | "insurance"
  >("dashboard");
  const [timeRange, setTimeRange] = useState<"month" | "quarter" | "year">("month");
  const [selectedFarmId, setSelectedFarmId] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Mock farms data
  const farms = [
    { id: 1, name: "Main Farm - Accra" },
    { id: 2, name: "North Farm - Kumasi" },
    { id: 3, name: "East Farm - Koforidua" },
  ];

  // Expense categories
  const expenseCategories = [
    { value: "all", label: "All Categories" },
    { value: "equipment", label: "Equipment Maintenance" },
    { value: "inputs", label: "Inputs" },
    { value: "labor", label: "Labor" },
    { value: "utilities", label: "Utilities" },
    { value: "veterinary", label: "Veterinary" },
  ];}

  // Mock financial data
  const dashboard = {
    totalRevenue: 45000,
    totalExpenses: 28000,
    netProfit: 17000,
    profitMargin: 37.8,
    cashFlow: 12000,
    outstandingPayments: 3500,
    pendingInvoices: 5200,
    veterinaryExpenses: 3200,
    insuranceCosts: 1500,
    metrics: {
      revenueGrowth: 12.5,
      expenseGrowth: 8.3,
      profitGrowth: 18.7,
      veterinaryROI: 4.2, // Return on investment for veterinary care
    },
  };

  // Mock expenses
  const expenses = [
    {
      id: 1,
      date: "2026-02-08",
      category: "Equipment Maintenance",
      description: "Tractor oil change and filter replacement",
      amount: 500,
      vendor: "Ghana Equipment Services",
      status: "paid",
    },
    {
      id: 2,
      date: "2026-02-07",
      category: "Inputs",
      description: "NPK Fertilizer - 100 bags",
      amount: 4500,
      vendor: "Ghana Agricultural Supplies",
      status: "paid",
    },
    {
      id: 3,
      date: "2026-02-06",
      category: "Labor",
      description: "Worker wages - February",
      amount: 8000,
      vendor: "Internal",
      status: "pending",
    },
    {
      id: 4,
      date: "2026-02-05",
      category: "Utilities",
      description: "Water and electricity",
      amount: 1200,
      vendor: "Utility Provider",
      status: "paid",
    },
    {
      id: 5,
      date: "2026-02-04",
      category: "Veterinary",
      description: "Vaccination and health check for cattle",
      amount: 800,
      vendor: "Accra Veterinary Clinic",
      status: "paid",
    },
    {
      id: 6,
      date: "2026-02-03",
      category: "Insurance",
      description: "Monthly crop insurance premium",
      amount: 500,
      vendor: "Ghana Insurance Co",
      status: "paid",
    },
  ];

  // Mock revenue
  const revenue = [
    {
      id: 1,
      date: "2026-02-08",
      source: "Tomato Sales",
      product: "Organic Tomatoes (5kg)",
      quantity: 50,
      unitPrice: 45,
      total: 2250,
      buyer: "Accra Market",
      status: "paid",
    },
    {
      id: 2,
      date: "2026-02-07",
      source: "Milk Sales",
      product: "Fresh Cow Milk (1L)",
      quantity: 200,
      unitPrice: 15,
      total: 3000,
      buyer: "Local Dairy Cooperative",
      status: "paid",
    },
    {
      id: 3,
      date: "2026-02-06",
      source: "Egg Sales",
      product: "Chicken Eggs (Crate)",
      quantity: 30,
      unitPrice: 60,
      total: 1800,
      buyer: "Kumasi Supermarket",
      status: "pending",
    },
  ];

  // Mock veterinary expenses
  const veterinaryExpenses = [
    {
      id: 1,
      date: "2026-02-08",
      animal: "Bessie (Cow)",
      service: "Vaccination",
      clinic: "Accra Veterinary Clinic",
      cost: 800,
      status: "completed",
      impact: "Prevented disease outbreak - Estimated savings: $5000",
    },
    {
      id: 2,
      date: "2026-02-05",
      animal: "Daisy (Cow)",
      service: "Consultation",
      clinic: "Accra Veterinary Clinic",
      cost: 400,
      status: "completed",
      impact: "Early detection of mastitis - Treatment cost: $300",
    },
    {
      id: 3,
      date: "2026-02-01",
      animal: "Herd (20 chickens)",
      service: "Deworming",
      clinic: "Kumasi Animal Hospital",
      cost: 200,
      status: "completed",
      impact: "Improved egg production by 15%",
    },
  ];

  // Mock insurance data
  const insuranceData = {
    totalPremium: 1500,
    coverage: {
      cropInsurance: 500,
      livestockInsurance: 600,
      equipmentInsurance: 400,
    },
    claims: [
      {
        id: 1,
        type: "Crop Loss",
        date: "2026-01-15",
        amount: 5000,
        status: "approved",
        payoutDate: "2026-02-01",
      },
      {
        id: 2,
        type: "Animal Death",
        date: "2026-01-10",
        amount: 8000,
        status: "pending",
        payoutDate: null,
      },
    ],
  };

  // Mock budget data
  const budgetData = {
    categories: [
      { name: "Labor", budgeted: 10000, actual: 8000, variance: 2000 },
      { name: "Inputs", budgeted: 8000, actual: 7500, variance: 500 },
      { name: "Equipment", budgeted: 5000, actual: 4200, variance: 800 },
      { name: "Veterinary", budgeted: 2000, actual: 1600, variance: 400 },
      { name: "Insurance", budgeted: 1500, actual: 1500, variance: 0 },
    ],
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Financial Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Transaction
          </Button>
        </div>
      </div>

      {/* Farm and Category Selectors */}
      <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Farm:</label>
          <select
            value={selectedFarmId}
            onChange={(e) => setSelectedFarmId(Number(e.target.value))}
            className="px-3 py-2 border rounded-md text-sm bg-white"
          >
            {farms.map((farm) => (
              <option key={farm.id} value={farm.id}>
                {farm.name}
              </option>
            ))}
          </select>
        </div>
        {(viewMode === "expenses" || viewMode === "dashboard") && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm bg-white"
            >
              {expenseCategories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 border-b">
        {["dashboard", "expenses", "revenue", "budget", "forecast", "reports", "tax", "veterinary", "insurance"].map(
          (mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as typeof viewMode)}
              className={`px-4 py-2 font-medium ${
                viewMode === mode ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          )
        )}
      </div>

      {/* Dashboard View */}
      {viewMode === "dashboard" && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold">₵{dashboard.totalRevenue.toLocaleString()}</p>
                  <p className="text-green-600 text-sm flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {dashboard.metrics.revenueGrowth}% growth
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Expenses</p>
                  <p className="text-2xl font-bold">₵{dashboard.totalExpenses.toLocaleString()}</p>
                  <p className="text-red-600 text-sm flex items-center mt-2">
                    <TrendingDown className="w-4 h-4 mr-1" />
                    {dashboard.metrics.expenseGrowth}% increase
                  </p>
                </div>
                <ArrowDownLeft className="w-8 h-8 text-red-600" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Net Profit</p>
                  <p className="text-2xl font-bold">₵{dashboard.netProfit.toLocaleString()}</p>
                  <p className="text-blue-600 text-sm flex items-center mt-2">
                    <TrendingUpIcon className="w-4 h-4 mr-1" />
                    {dashboard.profitMargin}% margin
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Veterinary Expenses</p>
                  <p className="text-2xl font-bold">₵{dashboard.veterinaryExpenses.toLocaleString()}</p>
                  <p className="text-purple-600 text-sm flex items-center mt-2">
                    <Activity className="w-4 h-4 mr-1" />
                    ROI: {dashboard.metrics.veterinaryROI}x
                  </p>
                </div>
                <Stethoscope className="w-8 h-8 text-purple-600" />
              </div>
            </Card>
          </div>

          {/* Cash Flow & Outstanding Payments */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <p className="text-gray-600 text-sm mb-2">Cash Flow</p>
              <p className="text-2xl font-bold text-green-600">₵{dashboard.cashFlow.toLocaleString()}</p>
              <p className="text-gray-600 text-xs mt-2">Available for operations</p>
            </Card>

            <Card className="p-6">
              <p className="text-gray-600 text-sm mb-2">Outstanding Payments</p>
              <p className="text-2xl font-bold text-orange-600">₵{dashboard.outstandingPayments.toLocaleString()}</p>
              <p className="text-gray-600 text-xs mt-2">Due within 30 days</p>
            </Card>

            <Card className="p-6">
              <p className="text-gray-600 text-sm mb-2">Pending Invoices</p>
              <p className="text-2xl font-bold text-blue-600">₵{dashboard.pendingInvoices.toLocaleString()}</p>
              <p className="text-gray-600 text-xs mt-2">Awaiting payment</p>
            </Card>
          </div>
        </div>
      )}

      {/* Expenses View */}
      {viewMode === "expenses" && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Expense Tracking</h2>
          <div className="space-y-3">
            {expenses
              .filter(
                (expense) =>
                  selectedCategory === "all" ||
                  expense.category.toLowerCase().includes(selectedCategory)
              )
              .map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{expense.description}</p>
                  <p className="text-sm text-gray-600">{expense.category} • {expense.vendor}</p>
                  <p className="text-xs text-gray-500">{expense.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">₵{expense.amount.toLocaleString()}</p>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      expense.status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {expense.status}
                  </span>
                 </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      {/* Veterinary Expenses View */}
      {viewMode === "veterinary" && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Veterinary Expenses & ROI</h2>
          <div className="space-y-3">
            {veterinaryExpenses.map((expense) => (
              <div key={expense.id} className="p-4 border rounded-lg bg-purple-50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">{expense.animal}</p>
                    <p className="text-sm text-gray-600">{expense.service} • {expense.clinic}</p>
                  </div>
                  <p className="font-bold text-purple-600">₵{expense.cost}</p>
                </div>
                <div className="bg-white p-2 rounded mt-2 border-l-4 border-green-500">
                  <p className="text-sm text-green-700">
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    {expense.impact}
                  </p>
                </div>
              </div>
            ))}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900">
                Total Veterinary Investment: ₵{veterinaryExpenses.reduce((sum, e) => sum + e.cost, 0)}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Estimated ROI: {dashboard.metrics.veterinaryROI}x (Disease prevention & productivity gains)
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Insurance View */}
      {viewMode === "insurance" && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Insurance Coverage & Claims
            </h2>

            {/* Coverage Breakdown */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Monthly Premiums</h3>
              <div className="space-y-2">
                {Object.entries(insuranceData.coverage).map(([type, amount]) => (
                  <div key={type} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <p className="text-sm">{type}</p>
                    <p className="font-medium">₵{amount}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded mt-3 border border-blue-200">
                <p className="font-medium">Total Premium</p>
                <p className="font-bold text-blue-600">₵{insuranceData.totalPremium}</p>
              </div>
            </div>

            {/* Claims */}
            <div>
              <h3 className="font-medium mb-3">Claims Status</h3>
              <div className="space-y-3">
                {insuranceData.claims.map((claim) => (
                  <div key={claim.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{claim.type}</p>
                        <p className="text-sm text-gray-600">Filed: {claim.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">₵{claim.amount.toLocaleString()}</p>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            claim.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {claim.status}
                        </span>
                      </div>
                    </div>
                    {claim.payoutDate && (
                      <p className="text-xs text-gray-600 mt-2">Payout: {claim.payoutDate}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Budget View */}
      {viewMode === "budget" && (
        <div className="space-y-6">
          {/* Monthly Comparison Chart */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Monthly Budget Comparison</h2>
            <div className="space-y-4">
              {[
                { month: "January", budgeted: 25000, actual: 23500 },
                { month: "February", budgeted: 26000, actual: 24800 },
                { month: "March", budgeted: 27000, actual: 25200 },
                { month: "April", budgeted: 28000, actual: 26500 },
              ].map((monthData) => (
                <div key={monthData.month} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="font-medium">{monthData.month}</p>
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-600">Budgeted: ₵{monthData.budgeted.toLocaleString()}</span>
                      <span className="font-medium">Actual: ₵{monthData.actual.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 h-6">
                    <div className="flex-1 bg-blue-200 rounded" style={{ width: "100%" }}>
                      <div className="bg-blue-600 h-full rounded" style={{ width: `${(monthData.actual / monthData.budgeted) * 100}%` }}></div>
                    </div>
                    <span className="text-sm text-green-600 font-medium min-w-fit">-₵{(monthData.budgeted - monthData.actual).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Category Budget Details */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Budget by Category</h2>
            <div className="space-y-4">
              {budgetData.categories.map((category) => (
              <div key={category.name}>
                <div className="flex justify-between mb-2">
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-gray-600">
                    ₵{category.actual} / ₵{category.budgeted}
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(category.actual / category.budgeted) * 100}%` }}
                  ></div>
                </div>
                {category.variance > 0 && (
                  <p className="text-xs text-green-600 mt-1">Under budget by ₵{category.variance}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Revenue View */}
      {viewMode === "revenue" && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Revenue Tracking</h2>
          <div className="space-y-3">
            {revenue.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{item.product}</p>
                  <p className="text-sm text-gray-600">{item.source} • {item.buyer}</p>
                  <p className="text-xs text-gray-500">{item.quantity} units @ ₵{item.unitPrice}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">₵{item.total.toLocaleString()}</p>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      item.status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Forecast & Reports Views */}
      {(viewMode === "forecast" || viewMode === "reports" || viewMode === "tax") && (
        <Card className="p-6">
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} feature coming soon</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default FinancialManagement;
