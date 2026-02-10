import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Search,
  MessageSquare,
  MapPin,
  Star,
  Link2,
  Send,
  UserPlus,
  Mail,
  Phone,
  Briefcase,
  TrendingUp,
} from "lucide-react";

/**
 * Farmer Directory & Networking Component
 * Searchable farmer directory with messaging for networking and collaboration
 */
export const FarmerDirectoryNetworking: React.FC = () => {
  const [viewMode, setViewMode] = useState<
    "directory" | "profile" | "messages" | "connections" | "recommendations" | "stats"
  >("directory");
  const [selectedFarmer, setSelectedFarmer] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data
  const farmers = [
    {
      id: 1,
      name: "Kwame Osei",
      region: "Ashanti",
      specialty: "Maize Farming",
      farmSize: 10,
      experience: 20,
      rating: 4.8,
      bio: "Expert maize farmer with sustainable practices",
      verified: true,
    },
    {
      id: 2,
      name: "Ama Asante",
      region: "Greater Accra",
      specialty: "Vegetable Farming",
      farmSize: 5,
      experience: 15,
      rating: 4.9,
      bio: "Organic vegetable specialist",
      verified: true,
    },
    {
      id: 3,
      name: "Kofi Mensah",
      region: "Western",
      specialty: "Cocoa Farming",
      farmSize: 15,
      experience: 25,
      rating: 4.7,
      bio: "Sustainable cocoa production expert",
      verified: true,
    },
  ];

  const selectedFarmerProfile = {
    name: "Kwame Osei",
    region: "Ashanti",
    specialty: "Maize Farming",
    farmSize: 10,
    experience: 20,
    rating: 4.8,
    bio: "Expert maize farmer with sustainable practices",
    verified: true,
    joinedDate: "2020-01-15",
    certifications: ["Organic Farming", "Sustainable Agriculture"],
    crops: ["Maize", "Rice", "Beans"],
  };

  const conversations = [
    {
      id: 1,
      participantName: "Kwame Osei",
      lastMessage: "Hi, interested in your crop rotation methods",
      unreadCount: 0,
    },
    {
      id: 2,
      participantName: "Ama Asante",
      lastMessage: "Let's collaborate on the vegetable project",
      unreadCount: 1,
    },
  ];

  const connections = [
    {
      id: 1,
      farmerName: "Kwame Osei",
      specialty: "Maize Farming",
      status: "connected",
      connectedDate: "2025-12-01",
    },
    {
      id: 2,
      farmerName: "Ama Asante",
      specialty: "Vegetable Farming",
      status: "connected",
      connectedDate: "2025-11-15",
    },
  ];

  const recommendations = [
    {
      id: 1,
      farmerName: "Kofi Mensah",
      specialty: "Cocoa Farming",
      reason: "Similar farming practices",
      matchScore: 0.85,
    },
    {
      id: 2,
      farmerName: "Abena Boateng",
      specialty: "Crop Diversification",
      reason: "Complementary expertise",
      matchScore: 0.78,
    },
  ];

  const stats = {
    totalFarmers: 2450,
    activeUsers: 1850,
    totalConnections: 5200,
    averageRating: 4.6,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Farmer Directory & Networking</h1>
            <p className="text-gray-600 mt-1">Connect with farmers and build your network</p>
          </div>
          <Users className="w-12 h-12 text-blue-600 opacity-20" />
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            onClick={() => setViewMode("directory")}
            variant={viewMode === "directory" ? "default" : "outline"}
            className={viewMode === "directory" ? "bg-blue-600 text-white" : ""}
          >
            <Search className="w-4 h-4 mr-2" />
            Directory
          </Button>
          <Button
            onClick={() => setViewMode("messages")}
            variant={viewMode === "messages" ? "default" : "outline"}
            className={viewMode === "messages" ? "bg-blue-600 text-white" : ""}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Messages
          </Button>
          <Button
            onClick={() => setViewMode("connections")}
            variant={viewMode === "connections" ? "default" : "outline"}
            className={viewMode === "connections" ? "bg-blue-600 text-white" : ""}
          >
            <Link2 className="w-4 h-4 mr-2" />
            Connections
          </Button>
          <Button
            onClick={() => setViewMode("recommendations")}
            variant={viewMode === "recommendations" ? "default" : "outline"}
            className={viewMode === "recommendations" ? "bg-blue-600 text-white" : ""}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Recommendations
          </Button>
          <Button
            onClick={() => setViewMode("stats")}
            variant={viewMode === "stats" ? "default" : "outline"}
            className={viewMode === "stats" ? "bg-blue-600 text-white" : ""}
          >
            <Users className="w-4 h-4 mr-2" />
            Statistics
          </Button>
        </div>

        {/* Directory View */}
        {viewMode === "directory" && (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex gap-2">
                <Search className="w-5 h-5 text-gray-400 mt-3" />
                <input
                  type="text"
                  placeholder="Search farmers by name, specialty, or region..."
                  className="flex-1 outline-none bg-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {farmers.map((farmer) => (
                <Card key={farmer.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900">{farmer.name}</p>
                        {farmer.verified && (
                          <span className="text-blue-600 text-sm">✓</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{farmer.specialty}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="font-bold text-sm">{farmer.rating}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mb-3">{farmer.bio}</p>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{farmer.region}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{farmer.farmSize} hectares</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm"
                      onClick={() => {
                        setSelectedFarmer(farmer.id);
                        setViewMode("profile");
                      }}
                    >
                      View Profile
                    </Button>
                    <Button variant="outline" className="flex-1 text-sm">
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Profile View */}
        {viewMode === "profile" && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-2xl font-bold text-gray-900">{selectedFarmerProfile.name}</p>
                    {selectedFarmerProfile.verified && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">Verified</span>
                    )}
                  </div>
                  <p className="text-gray-600">{selectedFarmerProfile.specialty}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                  <span className="text-2xl font-bold">{selectedFarmerProfile.rating}</span>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{selectedFarmerProfile.bio}</p>

              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-gray-600 text-sm">Farm Size</p>
                  <p className="font-bold text-gray-900">{selectedFarmerProfile.farmSize} ha</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-gray-600 text-sm">Experience</p>
                  <p className="font-bold text-gray-900">{selectedFarmerProfile.experience} years</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-gray-600 text-sm">Joined</p>
                  <p className="font-bold text-gray-900">{selectedFarmerProfile.joinedDate}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-gray-600 text-sm">Region</p>
                  <p className="font-bold text-gray-900">Ashanti</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
                <Button variant="outline" className="flex-1">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Connect
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <p className="font-bold text-gray-900 mb-3">Certifications</p>
              <div className="flex flex-wrap gap-2">
                {selectedFarmerProfile.certifications.map((cert, idx) => (
                  <span key={idx} className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm">
                    {cert}
                  </span>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <p className="font-bold text-gray-900 mb-3">Crops</p>
              <div className="flex flex-wrap gap-2">
                {selectedFarmerProfile.crops.map((crop, idx) => (
                  <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm">
                    {crop}
                  </span>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Messages View */}
        {viewMode === "messages" && (
          <div className="space-y-4">
            {conversations.map((conv) => (
              <Card key={conv.id} className="p-6 cursor-pointer hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{conv.participantName}</p>
                    <p className="text-sm text-gray-600 mt-1">{conv.lastMessage}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {conv.unreadCount > 0 && (
                      <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                        {conv.unreadCount}
                      </span>
                    )}
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Connections View */}
        {viewMode === "connections" && (
          <div className="space-y-4">
            {connections.map((conn) => (
              <Card key={conn.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-gray-900">{conn.farmerName}</p>
                    <p className="text-sm text-gray-600">{conn.specialty}</p>
                    <p className="text-xs text-gray-500 mt-1">Connected since {conn.connectedDate}</p>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Recommendations View */}
        {viewMode === "recommendations" && (
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <Card key={rec.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{rec.farmerName}</p>
                    <p className="text-sm text-gray-600">{rec.specialty}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Match Score</p>
                    <p className="text-lg font-bold text-blue-600">{(rec.matchScore * 100).toFixed(0)}%</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-3">{rec.reason}</p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Connect
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* Statistics View */}
        {viewMode === "stats" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6 bg-blue-50 border-blue-200">
              <p className="text-gray-600 text-sm">Total Farmers</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalFarmers.toLocaleString()}</p>
            </Card>
            <Card className="p-6 bg-green-50 border-green-200">
              <p className="text-gray-600 text-sm">Active Users</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.activeUsers.toLocaleString()}</p>
            </Card>
            <Card className="p-6 bg-purple-50 border-purple-200">
              <p className="text-gray-600 text-sm">Total Connections</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalConnections.toLocaleString()}</p>
            </Card>
            <Card className="p-6 bg-yellow-50 border-yellow-200">
              <p className="text-gray-600 text-sm">Average Rating</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.averageRating}</p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerDirectoryNetworking;
