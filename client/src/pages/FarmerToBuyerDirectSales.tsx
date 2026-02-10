import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Package,
  TrendingUp,
  Users,
  Star,
  Truck,
  CreditCard,
  Plus,
} from "lucide-react";

/**
 * Farmer-to-Buyer Direct Sales Platform Component
 * Enable farmers to list products, manage orders, handle payments, and track deliveries
 */
export const FarmerToBuyerDirectSales: React.FC = () => {
  const [viewMode, setViewMode] = useState<
    "products" | "orders" | "analytics" | "customers" | "reviews" | "tracking"
  >("products");

  // Mock data
  const products = [
    {
      id: 1,
      name: "Organic Maize",
      category: "Grains",
      price: 2500,
      unit: "50kg bag",
      quantity: 100,
      description: "Fresh organic maize harvested this week",
      rating: 4.8,
      reviews: 45,
      inStock: true,
      certification: "Organic",
    },
    {
      id: 2,
      name: "Fresh Tomatoes",
      category: "Vegetables",
      price: 150,
      unit: "kg",
      quantity: 500,
      description: "Ripe, fresh tomatoes from our farm",
      rating: 4.6,
      reviews: 32,
      inStock: true,
      certification: "None",
    },
    {
      id: 3,
      name: "Honey",
      category: "Specialty",
      price: 80,
      unit: "500ml jar",
      quantity: 50,
      description: "Pure, unfiltered honey from our beehives",
      rating: 4.9,
      reviews: 28,
      inStock: true,
      certification: "Pure",
    },
  ];

  const orders = [
    {
      id: 1001,
      buyerName: "John Mensah",
      product: "Organic Maize",
      quantity: 2,
      unit: "50kg bag",
      totalPrice: 5000,
      status: "Pending",
      orderDate: "2026-02-10",
      deliveryDate: "2026-02-12",
      paymentStatus: "Paid",
      address: "Accra, Ghana",
    },
    {
      id: 1002,
      buyerName: "Mary Osei",
      product: "Fresh Tomatoes",
      quantity: 10,
      unit: "kg",
      totalPrice: 1500,
      status: "Shipped",
      orderDate: "2026-02-09",
      deliveryDate: "2026-02-11",
      paymentStatus: "Paid",
      address: "Kumasi, Ghana",
    },
    {
      id: 1003,
      buyerName: "Ahmed Hassan",
      product: "Honey",
      quantity: 5,
      unit: "500ml jar",
      totalPrice: 400,
      status: "Delivered",
      orderDate: "2026-02-08",
      deliveryDate: "2026-02-10",
      paymentStatus: "Paid",
      address: "Takoradi, Ghana",
    },
  ];

  const analytics = {
    totalSales: 6900,
    totalOrders: 3,
    averageOrderValue: 2300,
    topProduct: "Organic Maize",
    revenue: 6900,
    growth: "+15%",
    conversionRate: "12%",
  };

  const customers = [
    {
      id: 1,
      name: "John Mensah",
      email: "john@example.com",
      phone: "+233 24 123 4567",
      location: "Accra",
      totalOrders: 5,
      totalSpent: 12500,
      lastOrder: "2026-02-10",
      status: "Active",
    },
    {
      id: 2,
      name: "Mary Osei",
      email: "mary@example.com",
      phone: "+233 24 234 5678",
      location: "Kumasi",
      totalOrders: 3,
      totalSpent: 4500,
      lastOrder: "2026-02-09",
      status: "Active",
    },
    {
      id: 3,
      name: "Ahmed Hassan",
      email: "ahmed@example.com",
      phone: "+233 24 345 6789",
      location: "Takoradi",
      totalOrders: 2,
      totalSpent: 1200,
      lastOrder: "2026-02-08",
      status: "Active",
    },
  ];

  const reviews = [
    {
      id: 1,
      customerName: "John Mensah",
      rating: 5,
      comment: "Excellent quality maize! Will order again.",
      date: "2026-02-10",
      verified: true,
    },
    {
      id: 2,
      customerName: "Mary Osei",
      rating: 5,
      comment: "Fresh and delivered on time. Highly recommended!",
      date: "2026-02-09",
      verified: true,
    },
    {
      id: 3,
      customerName: "Ahmed Hassan",
      rating: 4,
      comment: "Good quality but packaging could be better.",
      date: "2026-02-08",
      verified: true,
    },
  ];

  const tracking = {
    orderId: 1002,
    status: "In Transit",
    currentLocation: "Kumasi",
    estimatedDelivery: "2026-02-11",
    driver: "Kwame Asante",
    driverPhone: "+233 24 123 4567",
    timeline: [
      { status: "Order Confirmed", timestamp: "2026-02-09 10:00", location: "Farm" },
      { status: "Packed", timestamp: "2026-02-09 14:00", location: "Farm" },
      { status: "In Transit", timestamp: "2026-02-10 08:00", location: "Kumasi" },
      { status: "Out for Delivery", timestamp: "2026-02-11 09:00", location: "Destination" },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Farmer-to-Buyer Direct Sales Platform
            </h1>
            <p className="text-gray-600 mt-1">Sell your products directly to customers</p>
          </div>
          <ShoppingCart className="w-12 h-12 text-blue-600 opacity-20" />
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            onClick={() => setViewMode("products")}
            variant={viewMode === "products" ? "default" : "outline"}
            className={viewMode === "products" ? "bg-blue-600 text-white" : ""}
          >
            <Package className="w-4 h-4 mr-2" />
            Products
          </Button>
          <Button
            onClick={() => setViewMode("orders")}
            variant={viewMode === "orders" ? "default" : "outline"}
            className={viewMode === "orders" ? "bg-blue-600 text-white" : ""}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Orders
          </Button>
          <Button
            onClick={() => setViewMode("analytics")}
            variant={viewMode === "analytics" ? "default" : "outline"}
            className={viewMode === "analytics" ? "bg-blue-600 text-white" : ""}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
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
            onClick={() => setViewMode("reviews")}
            variant={viewMode === "reviews" ? "default" : "outline"}
            className={viewMode === "reviews" ? "bg-blue-600 text-white" : ""}
          >
            <Star className="w-4 h-4 mr-2" />
            Reviews
          </Button>
          <Button
            onClick={() => setViewMode("tracking")}
            variant={viewMode === "tracking" ? "default" : "outline"}
            className={viewMode === "tracking" ? "bg-blue-600 text-white" : ""}
          >
            <Truck className="w-4 h-4 mr-2" />
            Tracking
          </Button>
        </div>

        {/* Products View */}
        {viewMode === "products" && (
          <div className="space-y-4">
            <div className="flex justify-end mb-4">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>

            {products.map((product) => (
              <Card key={product.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.category}</p>
                    <p className="text-sm text-gray-700 mt-2">{product.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">GH₵{product.price}</p>
                    <p className="text-xs text-gray-600">per {product.unit}</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-4 text-sm">
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-gray-600">In Stock</p>
                    <p className="font-bold text-gray-900">{product.quantity}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-gray-600">Rating</p>
                    <p className="font-bold text-yellow-600">⭐ {product.rating}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-gray-600">Reviews</p>
                    <p className="font-bold text-gray-900">{product.reviews}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-gray-600">Certification</p>
                    <p className="font-bold text-gray-900">{product.certification}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700">Edit</Button>
                  <Button className="flex-1 bg-gray-600 hover:bg-gray-700">Delete</Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Orders View */}
        {viewMode === "orders" && (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">Order #{order.id}</p>
                    <p className="text-sm text-gray-600">{order.buyerName}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded font-bold text-sm ${
                      order.status === "Delivered"
                        ? "bg-green-200 text-green-800"
                        : order.status === "Shipped"
                        ? "bg-blue-200 text-blue-800"
                        : "bg-yellow-200 text-yellow-800"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-4 text-sm">
                  <div>
                    <p className="text-gray-600">Product</p>
                    <p className="font-bold text-gray-900">{order.product}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Quantity</p>
                    <p className="font-bold text-gray-900">{order.quantity} {order.unit}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Price</p>
                    <p className="font-bold text-blue-600">GH₵{order.totalPrice}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Delivery</p>
                    <p className="font-bold text-gray-900">{order.deliveryDate}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700">Update Status</Button>
                  <Button className="flex-1 bg-gray-600 hover:bg-gray-700">View Details</Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Analytics View */}
        {viewMode === "analytics" && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <Card className="p-6">
                <p className="text-gray-600 text-sm">Total Sales</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">GH₵{analytics.totalSales}</p>
              </Card>
              <Card className="p-6">
                <p className="text-gray-600 text-sm">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.totalOrders}</p>
              </Card>
              <Card className="p-6">
                <p className="text-gray-600 text-sm">Avg Order Value</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">GH₵{analytics.averageOrderValue}</p>
              </Card>
              <Card className="p-6">
                <p className="text-gray-600 text-sm">Growth</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{analytics.growth}</p>
              </Card>
            </div>

            <Card className="p-6">
              <p className="font-bold text-gray-900 mb-4">Performance Metrics</p>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <p className="text-sm text-gray-700">Top Product</p>
                    <p className="text-sm font-bold text-gray-900">{analytics.topProduct}</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <p className="text-sm text-gray-700">Conversion Rate</p>
                    <p className="text-sm font-bold text-gray-900">{analytics.conversionRate}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Customers View */}
        {viewMode === "customers" && (
          <div className="space-y-4">
            {customers.map((customer) => (
              <Card key={customer.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{customer.name}</p>
                    <p className="text-sm text-gray-600">{customer.email}</p>
                    <p className="text-sm text-gray-600">{customer.phone}</p>
                  </div>
                  <span className="px-3 py-1 rounded font-bold text-sm bg-green-200 text-green-800">
                    {customer.status}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-3 text-sm">
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-gray-600">Location</p>
                    <p className="font-bold text-gray-900">{customer.location}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-gray-600">Total Orders</p>
                    <p className="font-bold text-gray-900">{customer.totalOrders}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-gray-600">Total Spent</p>
                    <p className="font-bold text-blue-600">GH₵{customer.totalSpent}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-gray-600">Last Order</p>
                    <p className="font-bold text-gray-900">{customer.lastOrder}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Reviews View */}
        {viewMode === "reviews" && (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{review.customerName}</p>
                    <p className="text-sm text-gray-600">{review.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-yellow-600">⭐ {review.rating}/5</p>
                    {review.verified && (
                      <p className="text-xs text-green-600 font-bold">✓ Verified</p>
                    )}
                  </div>
                </div>

                <p className="text-gray-700">{review.comment}</p>
              </Card>
            ))}
          </div>
        )}

        {/* Tracking View */}
        {viewMode === "tracking" && (
          <Card className="p-6">
            <p className="font-bold text-gray-900 text-lg mb-4">Order Tracking - #{tracking.orderId}</p>

            <div className="grid grid-cols-4 gap-3 mb-6 text-sm">
              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-gray-600">Status</p>
                <p className="font-bold text-blue-600">{tracking.status}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-gray-600">Current Location</p>
                <p className="font-bold text-gray-900">{tracking.currentLocation}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-gray-600">Est. Delivery</p>
                <p className="font-bold text-gray-900">{tracking.estimatedDelivery}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-gray-600">Driver</p>
                <p className="font-bold text-gray-900">{tracking.driver}</p>
              </div>
            </div>

            <p className="font-bold text-gray-900 mb-4">Delivery Timeline</p>
            <div className="space-y-3">
              {tracking.timeline.map((event, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-4 h-4 rounded-full ${
                        idx <= 2 ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    ></div>
                    {idx < tracking.timeline.length - 1 && (
                      <div className="w-1 h-12 bg-gray-300 mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-bold text-gray-900">{event.status}</p>
                    <p className="text-sm text-gray-600">{event.timestamp}</p>
                    <p className="text-sm text-gray-600">{event.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FarmerToBuyerDirectSales;
