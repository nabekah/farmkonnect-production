import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Plus,
  Edit2,
  Trash2,
  Star,
  TrendingUp,
  Package,
  AlertTriangle,
  Download,
  Filter,
  DollarSign,
  Users,
} from "lucide-react";

/**
 * Farm Products Marketplace Dashboard Component
 * Manage farm product listings, inventory, sales, and customer interactions
 */
export const FarmProductsMarketplace: React.FC = () => {
  const [viewMode, setViewMode] = useState<"products" | "sales" | "customers" | "analytics">("products");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);

  // Mock products
  const products = [
    {
      id: 1,
      name: "Organic Tomatoes",
      category: "Vegetables",
      price: 45.0,
      unit: "kg",
      stock: 150,
      minStock: 20,
      status: "active",
      rating: 4.8,
      reviews: 24,
      image: "/products/tomatoes.jpg",
    },
    {
      id: 2,
      name: "Free-Range Eggs",
      category: "Poultry",
      price: 35.0,
      unit: "dozen",
      stock: 80,
      minStock: 10,
      status: "active",
      rating: 4.9,
      reviews: 42,
      image: "/products/eggs.jpg",
    },
    {
      id: 3,
      name: "Honey",
      category: "Processed",
      price: 120.0,
      unit: "liter",
      stock: 25,
      minStock: 5,
      status: "active",
      rating: 4.7,
      reviews: 18,
      image: "/products/honey.jpg",
    },
    {
      id: 4,
      name: "Maize",
      category: "Grains",
      price: 25.0,
      unit: "kg",
      stock: 5,
      minStock: 50,
      status: "low_stock",
      rating: 4.5,
      reviews: 12,
      image: "/products/maize.jpg",
    },
  ];

  // Mock sales
  const sales = [
    {
      saleId: 1,
      productName: "Organic Tomatoes",
      quantity: 10,
      price: 450.0,
      buyerName: "John Doe",
      saleDate: new Date("2026-02-09"),
      paymentMethod: "cash",
      status: "completed",
    },
    {
      saleId: 2,
      productName: "Free-Range Eggs",
      quantity: 5,
      price: 175.0,
      buyerName: "Jane Smith",
      saleDate: new Date("2026-02-08"),
      paymentMethod: "mobile_money",
      status: "completed",
    },
    {
      saleId: 3,
      productName: "Honey",
      quantity: 2,
      price: 240.0,
      buyerName: "Robert Johnson",
      saleDate: new Date("2026-02-07"),
      paymentMethod: "bank_transfer",
      status: "completed",
    },
  ];

  // Mock customers
  const customers = [
    {
      customerId: 1,
      name: "John Doe",
      phone: "+233501234567",
      totalPurchases: 8,
      totalSpent: 1200.0,
      lastPurchase: new Date("2026-02-09"),
    },
    {
      customerId: 2,
      name: "Jane Smith",
      phone: "+233502345678",
      totalPurchases: 5,
      totalSpent: 650.0,
      lastPurchase: new Date("2026-02-08"),
    },
    {
      customerId: 3,
      name: "Robert Johnson",
      phone: "+233503456789",
      totalPurchases: 3,
      totalSpent: 380.0,
      lastPurchase: new Date("2026-02-07"),
    },
  ];

  // Mock analytics
  const analytics = {
    totalSales: 45,
    totalRevenue: 5230.0,
    averageOrderValue: 116.2,
    topProducts: [
      { name: "Organic Tomatoes", sales: 15, revenue: 675.0 },
      { name: "Free-Range Eggs", sales: 12, revenue: 420.0 },
      { name: "Honey", sales: 8, revenue: 960.0 },
      { name: "Maize", sales: 10, revenue: 250.0 },
    ],
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-300";
      case "low_stock":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "inactive":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock <= 0) return "out_of_stock";
    if (stock < minStock) return "low_stock";
    return "good";
  };

  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const stockValue = products.reduce((sum, p) => sum + p.stock * p.price, 0);
  const lowStockItems = products.filter((p) => getStockStatus(p.stock, p.minStock) === "low_stock").length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Farm Products Marketplace</h1>
            <p className="text-gray-600 mt-1">Manage products, inventory, and farm-to-consumer sales</p>
          </div>
          {viewMode === "products" && (
            <Button onClick={() => setShowAddProduct(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          )}
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setViewMode("products")}
            variant={viewMode === "products" ? "default" : "outline"}
            className={viewMode === "products" ? "bg-blue-600 text-white" : ""}
          >
            <Package className="w-4 h-4 mr-2" />
            Products
          </Button>
          <Button
            onClick={() => setViewMode("sales")}
            variant={viewMode === "sales" ? "default" : "outline"}
            className={viewMode === "sales" ? "bg-blue-600 text-white" : ""}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Sales
          </Button>
          <Button
            onClick={() => setViewMode("customers")}
            variant={viewMode === "customers" ? "default" : "outline"}
            className={viewMode === "customers" ? "bg-blue-600 text-white" : ""}
          >
            <Users className="w-4 h-4 mr-2" />
            Customers
          </Button>
          <Button
            onClick={() => setViewMode("analytics")}
            variant={viewMode === "analytics" ? "default" : "outline"}
            className={viewMode === "analytics" ? "bg-blue-600 text-white" : ""}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </Button>
        </div>

        {/* Products View */}
        {viewMode === "products" && (
          <>
            {/* Inventory Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Products</p>
                    <p className="text-3xl font-bold text-gray-900">{products.length}</p>
                  </div>
                  <Package className="w-10 h-10 text-blue-600 opacity-20" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Stock</p>
                    <p className="text-3xl font-bold text-gray-900">{totalStock}</p>
                  </div>
                  <ShoppingCart className="w-10 h-10 text-green-600 opacity-20" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Stock Value</p>
                    <p className="text-3xl font-bold text-gray-900">GH₵{stockValue.toFixed(0)}</p>
                  </div>
                  <DollarSign className="w-10 h-10 text-yellow-600 opacity-20" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Low Stock Items</p>
                    <p className="text-3xl font-bold text-red-600">{lowStockItems}</p>
                  </div>
                  <AlertTriangle className="w-10 h-10 text-red-600 opacity-20" />
                </div>
              </Card>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <Card key={product.id} className="p-4 hover:shadow-lg transition-shadow">
                  <div className="mb-3">
                    <div className="w-full h-32 bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                      <Package className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    <p className="text-xs text-gray-600">{product.category}</p>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Price</span>
                      <span className="font-bold text-gray-900">GH₵{product.price}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Stock</span>
                      <span className={`font-bold ${product.stock < product.minStock ? "text-red-600" : "text-green-600"}`}>
                        {product.stock} {product.unit}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-gray-900">{product.rating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setSelectedProduct(product.id)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => alert(`Delete ${product.name}`)}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <span className={`inline-block mt-3 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(product.status)}`}>
                    {product.status === "active" ? "Active" : "Low Stock"}
                  </span>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Sales View */}
        {viewMode === "sales" && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Sales</h2>
              <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Product</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Quantity</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Price</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Buyer</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.saleId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900 font-medium">{sale.productName}</td>
                      <td className="py-3 px-4 text-gray-600">{sale.quantity}</td>
                      <td className="py-3 px-4 font-bold text-gray-900">GH₵{sale.price}</td>
                      <td className="py-3 px-4 text-gray-600">{sale.buyerName}</td>
                      <td className="py-3 px-4 text-gray-600">{sale.saleDate.toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {sale.paymentMethod.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Customers View */}
        {viewMode === "customers" && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Customer List</h2>
            <div className="space-y-4">
              {customers.map((customer) => (
                <div key={customer.customerId} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{customer.name}</p>
                      <p className="text-sm text-gray-600">{customer.phone}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Last purchase: {customer.lastPurchase.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{customer.totalPurchases}</p>
                      <p className="text-xs text-gray-600">purchases</p>
                      <p className="text-lg font-bold text-gray-900 mt-2">GH₵{customer.totalSpent}</p>
                      <p className="text-xs text-gray-600">total spent</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Analytics View */}
        {viewMode === "analytics" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Sales</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.totalSales}</p>
                  </div>
                  <ShoppingCart className="w-10 h-10 text-blue-600 opacity-20" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Revenue</p>
                    <p className="text-3xl font-bold text-green-600">GH₵{analytics.totalRevenue.toFixed(0)}</p>
                  </div>
                  <DollarSign className="w-10 h-10 text-green-600 opacity-20" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Avg Order Value</p>
                    <p className="text-3xl font-bold text-gray-900">GH₵{analytics.averageOrderValue.toFixed(0)}</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-yellow-600 opacity-20" />
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Top Products</h2>
              <div className="space-y-4">
                {analytics.topProducts.map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.sales} sales</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">GH₵{product.revenue.toFixed(0)}</p>
                      <div className="w-32 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-blue-600"
                          style={{ width: `${(product.revenue / analytics.totalRevenue) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* Add Product Modal */}
        {showAddProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Product</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Product Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Select Category</option>
                    <option>Vegetables</option>
                    <option>Poultry</option>
                    <option>Processed</option>
                    <option>Grains</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Price (GH₵)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Unit (kg, dozen, liter)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Initial Stock"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => setShowAddProduct(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        setShowAddProduct(false);
                        alert("Product added successfully");
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Add Product
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmProductsMarketplace;
