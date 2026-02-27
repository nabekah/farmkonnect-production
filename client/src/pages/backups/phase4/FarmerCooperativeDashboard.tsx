import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  ShoppingCart,
  TrendingUp,
  Handshake,
  Plus,
  Users2,
  DollarSign,
  Zap,
  BarChart3,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

/**
 * Farmer Cooperative Dashboard Component
 * Interface for forming cooperatives, sharing resources, bulk purchasing, and collective marketing
 */
export const FarmerCooperativeDashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<
    "overview" | "members" | "bulk" | "marketing" | "analytics" | "financial"
  >("overview");

  // Mock data
  const cooperatives = [
    {
      id: 1,
      name: "Ashanti Farmers Cooperative",
      region: "Ashanti Region",
      members: 45,
      totalArea: 250,
      crops: ["Maize", "Cocoa", "Cassava"],
      status: "active",
    },
    {
      id: 2,
      name: "Greater Accra Agricultural Alliance",
      region: "Greater Accra",
      members: 78,
      totalArea: 450,
      crops: ["Vegetables", "Fruits", "Grains"],
      status: "active",
    },
  ];

  const members = [
    {
      id: 1,
      name: "Kwame Mensah",
      farm: "Kwame Farms",
      area: 5,
      crops: ["Maize", "Cassava"],
      status: "active",
    },
    {
      id: 2,
      name: "Ama Owusu",
      farm: "Ama's Farm",
      area: 3,
      crops: ["Vegetables"],
      status: "active",
    },
  ];

  const bulkOpportunities = [
    {
      id: 1,
      item: "Fertilizer - NPK 15:15:15",
      quantity: 5000,
      unit: "kg",
      unitPrice: 2.5,
      bulkPrice: 2.0,
      savings: 2500,
      participants: 12,
      status: "open",
    },
    {
      id: 2,
      item: "Pesticide - Insecticide",
      quantity: 1000,
      unit: "liters",
      unitPrice: 15,
      bulkPrice: 12,
      savings: 3000,
      participants: 8,
      status: "open",
    },
  ];

  const campaigns = [
    {
      id: 1,
      name: "Maize Harvest 2025",
      crop: "Maize",
      production: 450,
      targetPrice: 500,
      participants: 12,
      status: "active",
    },
    {
      id: 2,
      name: "Vegetable Direct to Consumer",
      crop: "Mixed Vegetables",
      production: 200,
      targetPrice: 800,
      participants: 8,
      status: "active",
    },
  ];

  const analytics = {
    members: 45,
    totalArea: 250,
    production: 650,
    totalSavings: 15000,
    revenue: 325000,
    profitMargin: 0.25,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Farmer Cooperative Dashboard</h1>
            <p className="text-gray-600 mt-1">Collaborate, share resources, and grow together</p>
          </div>
          <Users className="w-12 h-12 text-blue-600 opacity-20" />
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            onClick={() => setViewMode("overview")}
            variant={viewMode === "overview" ? "default" : "outline"}
            className={viewMode === "overview" ? "bg-blue-600 text-white" : ""}
          >
            <Handshake className="w-4 h-4 mr-2" />
            Overview
          </Button>
          <Button
            onClick={() => setViewMode("members")}
            variant={viewMode === "members" ? "default" : "outline"}
            className={viewMode === "members" ? "bg-blue-600 text-white" : ""}
          >
            <Users2 className="w-4 h-4 mr-2" />
            Members
          </Button>
          <Button
            onClick={() => setViewMode("bulk")}
            variant={viewMode === "bulk" ? "default" : "outline"}
            className={viewMode === "bulk" ? "bg-blue-600 text-white" : ""}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Bulk Purchasing
          </Button>
          <Button
            onClick={() => setViewMode("marketing")}
            variant={viewMode === "marketing" ? "default" : "outline"}
            className={viewMode === "marketing" ? "bg-blue-600 text-white" : ""}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Marketing
          </Button>
          <Button
            onClick={() => setViewMode("analytics")}
            variant={viewMode === "analytics" ? "default" : "outline"}
            className={viewMode === "analytics" ? "bg-blue-600 text-white" : ""}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button
            onClick={() => setViewMode("financial")}
            variant={viewMode === "financial" ? "default" : "outline"}
            className={viewMode === "financial" ? "bg-blue-600 text-white" : ""}
          >
            <FileText className="w-4 h-4 mr-2" />
            Financial
          </Button>
        </div>

        {/* Overview View */}
        {viewMode === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-6">
                <p className="text-gray-600 text-sm">My Cooperatives</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{cooperatives.length}</p>
              </Card>
              <Card className="p-6">
                <p className="text-gray-600 text-sm">Total Members</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{analytics.members}</p>
              </Card>
              <Card className="p-6">
                <p className="text-gray-600 text-sm">Total Savings</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">GH₵{analytics.totalSavings.toLocaleString()}</p>
              </Card>
              <Card className="p-6">
                <p className="text-gray-600 text-sm">Revenue</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">GH₵{(analytics.revenue / 1000).toFixed(0)}K</p>
              </Card>
            </div>

            {/* Cooperatives List */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <p className="font-bold text-gray-900 text-lg">My Cooperatives</p>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New
                </Button>
              </div>
              <div className="space-y-3">
                {cooperatives.map((coop) => (
                  <div key={coop.id} className="p-4 bg-gray-50 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-gray-900">{coop.name}</p>
                        <p className="text-sm text-gray-600">{coop.region}</p>
                      </div>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-medium">
                        Active
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-gray-600">Members</p>
                        <p className="font-bold text-gray-900">{coop.members}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Area</p>
                        <p className="font-bold text-gray-900">{coop.totalArea}ha</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Crops</p>
                        <p className="font-bold text-gray-900">{coop.crops.join(", ")}</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Members View */}
        {viewMode === "members" && (
          <div className="space-y-4">
            <Card className="p-6">
              <p className="font-bold text-gray-900 mb-4">Cooperative Members</p>
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.farm}</p>
                      </div>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                        Active
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Farm Area</p>
                        <p className="font-bold text-gray-900">{member.area}ha</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Crops</p>
                        <p className="font-bold text-gray-900">{member.crops.join(", ")}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Bulk Purchasing View */}
        {viewMode === "bulk" && (
          <div className="space-y-4">
            <Card className="p-6 bg-blue-50 border-blue-200">
              <p className="font-bold text-gray-900 mb-2">Total Savings This Month</p>
              <p className="text-3xl font-bold text-blue-600">GH₵5,500</p>
            </Card>

            <div className="space-y-3">
              {bulkOpportunities.map((opp) => (
                <Card key={opp.id} className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-900">{opp.item}</p>
                      <p className="text-sm text-gray-600">
                        {opp.quantity} {opp.unit}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm font-medium ${opp.status === "open" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {opp.status === "open" ? "Open" : "Closed"}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600">Unit Price</p>
                      <p className="font-bold text-gray-900">GH₵{opp.unitPrice}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Bulk Price</p>
                      <p className="font-bold text-green-600">GH₵{opp.bulkPrice}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Savings</p>
                      <p className="font-bold text-green-600">GH₵{opp.savings}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Participants</p>
                      <p className="font-bold text-gray-900">{opp.participants}</p>
                    </div>
                  </div>

                  {opp.status === "open" && (
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">Participate</Button>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Marketing View */}
        {viewMode === "marketing" && (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{campaign.name}</p>
                    <p className="text-sm text-gray-600">{campaign.crop}</p>
                  </div>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-medium">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-600">Production</p>
                    <p className="font-bold text-gray-900">{campaign.production} tons</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Target Price</p>
                    <p className="font-bold text-gray-900">GH₵{campaign.targetPrice}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Participants</p>
                    <p className="font-bold text-gray-900">{campaign.participants}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Est. Revenue</p>
                    <p className="font-bold text-green-600">GH₵{(campaign.production * campaign.targetPrice).toLocaleString()}</p>
                  </div>
                </div>

                <Button className="w-full bg-blue-600 hover:bg-blue-700">View Campaign</Button>
              </Card>
            ))}
          </div>
        )}

        {/* Analytics View */}
        {viewMode === "analytics" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <p className="text-gray-600 text-sm">Members</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{analytics.members}</p>
              <p className="text-xs text-gray-600 mt-2">+5 this month</p>
            </Card>
            <Card className="p-6">
              <p className="text-gray-600 text-sm">Total Area</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{analytics.totalArea}ha</p>
              <p className="text-xs text-gray-600 mt-2">+15ha this month</p>
            </Card>
            <Card className="p-6">
              <p className="text-gray-600 text-sm">Production</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{analytics.production}T</p>
              <p className="text-xs text-gray-600 mt-2">+50T this month</p>
            </Card>
          </div>
        )}

        {/* Financial View */}
        {viewMode === "financial" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 bg-green-50 border-green-200">
                <p className="text-gray-600 text-sm">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600 mt-2">GH₵{(analytics.revenue / 1000).toFixed(0)}K</p>
              </Card>
              <Card className="p-6 bg-blue-50 border-blue-200">
                <p className="text-gray-600 text-sm">Total Savings</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">GH₵{analytics.totalSavings.toLocaleString()}</p>
              </Card>
              <Card className="p-6 bg-purple-50 border-purple-200">
                <p className="text-gray-600 text-sm">Profit Margin</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{(analytics.profitMargin * 100).toFixed(0)}%</p>
              </Card>
            </div>

            <Card className="p-6">
              <p className="font-bold text-gray-900 mb-4">Financial Report</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between p-3 bg-gray-50 rounded">
                  <span className="text-gray-600">Total Revenue</span>
                  <span className="font-bold text-gray-900">GH₵325,000</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded">
                  <span className="text-gray-600">Operating Costs</span>
                  <span className="font-bold text-gray-900">GH₵50,000</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded">
                  <span className="text-gray-600">Net Profit</span>
                  <span className="font-bold text-green-600">GH₵250,000</span>
                </div>
                <div className="flex justify-between p-3 bg-green-50 rounded border-t-2 border-green-200">
                  <span className="text-gray-600">Member Dividends</span>
                  <span className="font-bold text-green-600">GH₵150,000</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerCooperativeDashboard;
