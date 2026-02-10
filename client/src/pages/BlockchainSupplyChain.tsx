import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle2, AlertCircle, Clock, MapPin, Zap, Shield, Plus, Search } from "lucide-react";

interface SupplyChainRecord {
  id: number;
  productName: string;
  batchNumber: string;
  productType: string;
  quantity: number;
  unit: string;
  harvestDate: string;
  status: "pending" | "verified" | "certified" | "archived";
  blockchainHash: string;
  certifications?: number[];
}

interface Transaction {
  id: number;
  eventType: string;
  actor: string;
  location: string;
  temperature?: number;
  humidity?: number;
  timestamp: string;
  notes?: string;
}

interface Certification {
  id: number;
  certificationType: string;
  certifyingBody: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate: string;
  status: "valid" | "expired" | "revoked" | "pending";
}

export function BlockchainSupplyChain() {
  const [searchBatch, setSearchBatch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<SupplyChainRecord | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demonstration
  const mockRecords: SupplyChainRecord[] = [
    {
      id: 1,
      productName: "Organic Tomatoes",
      batchNumber: "BATCH-2024-001",
      productType: "crop",
      quantity: 500,
      unit: "kg",
      harvestDate: "2024-02-01",
      status: "certified",
      blockchainHash: "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p",
      certifications: [1, 2],
    },
    {
      id: 2,
      productName: "Free-Range Chicken",
      batchNumber: "BATCH-2024-002",
      productType: "livestock",
      quantity: 100,
      unit: "units",
      harvestDate: "2024-02-05",
      status: "verified",
      blockchainHash: "0x2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q",
    },
  ];

  const mockTransactions: Transaction[] = [
    {
      id: 1,
      eventType: "production",
      actor: "farmer",
      location: "Farm A",
      temperature: 22,
      humidity: 65,
      timestamp: "2024-02-01T08:00:00Z",
      notes: "Harvest completed",
    },
    {
      id: 2,
      eventType: "processing",
      actor: "processor",
      location: "Processing Plant B",
      temperature: 4,
      humidity: 70,
      timestamp: "2024-02-02T10:30:00Z",
      notes: "Washing and sorting",
    },
    {
      id: 3,
      eventType: "transport",
      actor: "transporter",
      location: "In Transit",
      temperature: 8,
      humidity: 60,
      timestamp: "2024-02-03T14:15:00Z",
      notes: "Cold chain maintained",
    },
  ];

  const mockCertifications: Certification[] = [
    {
      id: 1,
      certificationType: "Organic",
      certifyingBody: "USDA",
      certificateNumber: "ORG-2024-001",
      issueDate: "2024-01-15",
      expiryDate: "2025-01-15",
      status: "valid",
    },
    {
      id: 2,
      certificationType: "Fair Trade",
      certifyingBody: "Fair Trade International",
      certificateNumber: "FT-2024-001",
      issueDate: "2024-01-20",
      expiryDate: "2025-01-20",
      status: "valid",
    },
  ];

  const handleSearch = () => {
    if (!searchBatch) return;
    setIsLoading(true);
    setTimeout(() => {
      const record = mockRecords.find((r) => r.batchNumber === searchBatch);
      if (record) {
        setSelectedRecord(record);
        setTransactions(mockTransactions);
        setCertifications(mockCertifications);
      }
      setIsLoading(false);
    }, 500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "certified":
        return "bg-green-100 text-green-800";
      case "verified":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "certified":
        return <CheckCircle2 className="w-4 h-4" />;
      case "verified":
        return <Shield className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Blockchain Supply Chain</h1>
        <p className="text-gray-600 mt-2">Track product origin, certifications, and supply chain transparency</p>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search Product</CardTitle>
          <CardDescription>Enter batch number to view supply chain history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter batch number (e.g., BATCH-2024-001)"
              value={searchBatch}
              onChange={(e) => setSearchBatch(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Records List */}
      <Card>
        <CardHeader>
          <CardTitle>Supply Chain Records</CardTitle>
          <CardDescription>All registered products and batches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockRecords.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setSelectedRecord(record);
                  setTransactions(mockTransactions);
                  setCertifications(mockCertifications);
                }}
              >
                <div className="flex-1">
                  <h3 className="font-semibold">{record.productName}</h3>
                  <p className="text-sm text-gray-600">{record.batchNumber}</p>
                </div>
                <Badge className={getStatusColor(record.status)}>
                  <span className="mr-1">{getStatusIcon(record.status)}</span>
                  {record.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Supply Chain Details */}
      {selectedRecord && (
        <div className="space-y-6">
          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle>{selectedRecord.productName}</CardTitle>
              <CardDescription>{selectedRecord.batchNumber}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Product Type</p>
                  <p className="font-semibold capitalize">{selectedRecord.productType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Quantity</p>
                  <p className="font-semibold">
                    {selectedRecord.quantity} {selectedRecord.unit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Harvest Date</p>
                  <p className="font-semibold">{new Date(selectedRecord.harvestDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className={getStatusColor(selectedRecord.status)}>
                    <span className="mr-1">{getStatusIcon(selectedRecord.status)}</span>
                    {selectedRecord.status}
                  </Badge>
                </div>
              </div>
              <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                <p className="text-xs text-gray-600">Blockchain Hash</p>
                <p className="font-mono text-sm break-all">{selectedRecord.blockchainHash}</p>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Transactions and Certifications */}
          <Tabs defaultValue="transactions" className="w-full">
            <TabsList>
              <TabsTrigger value="transactions">Transaction History</TabsTrigger>
              <TabsTrigger value="certifications">Certifications</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            {/* Transactions Tab */}
            <TabsContent value="transactions">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>All supply chain events and movements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {transactions.map((tx, index) => (
                      <div key={tx.id} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold capitalize">{tx.eventType}</h4>
                            <p className="text-sm text-gray-600">{tx.actor}</p>
                          </div>
                          <span className="text-sm text-gray-500">{new Date(tx.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            {tx.location}
                          </div>
                          {tx.temperature && (
                            <div className="flex items-center gap-1">
                              <Zap className="w-4 h-4 text-gray-400" />
                              {tx.temperature}°C
                            </div>
                          )}
                        </div>
                        {tx.notes && <p className="text-sm text-gray-600 mt-2">{tx.notes}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Certifications Tab */}
            <TabsContent value="certifications">
              <Card>
                <CardHeader>
                  <CardTitle>Product Certifications</CardTitle>
                  <CardDescription>All certifications and compliance documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {certifications.map((cert) => (
                      <div key={cert.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{cert.certificationType}</h4>
                            <p className="text-sm text-gray-600">{cert.certifyingBody}</p>
                            <p className="text-sm text-gray-600 mt-1">Certificate: {cert.certificateNumber}</p>
                          </div>
                          <Badge
                            className={
                              cert.status === "valid"
                                ? "bg-green-100 text-green-800"
                                : cert.status === "expired"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {cert.status}
                          </Badge>
                        </div>
                        <div className="mt-3 flex gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Issue Date</p>
                            <p className="font-semibold">{new Date(cert.issueDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Expiry Date</p>
                            <p className="font-semibold">{new Date(cert.expiryDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline">
              <Card>
                <CardHeader>
                  <CardTitle>Supply Chain Timeline</CardTitle>
                  <CardDescription>Visual representation of product journey</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {transactions.map((tx, index) => (
                      <div key={tx.id} className="flex gap-4 mb-8">
                        <div className="flex flex-col items-center">
                          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                          {index < transactions.length - 1 && <div className="w-1 h-16 bg-blue-200 mt-2"></div>}
                        </div>
                        <div className="flex-1 pt-1">
                          <h4 className="font-semibold capitalize">{tx.eventType}</h4>
                          <p className="text-sm text-gray-600">{tx.location}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(tx.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
