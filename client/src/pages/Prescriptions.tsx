import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Download, Plus, RefreshCw, Pill } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';

/**
 * Prescriptions Management Page
 * Displays prescription tracking, renewals, and history
 */
export default function Prescriptions() {
  const { user } = useAuth();
  const [showRenewalDialog, setShowRenewalDialog] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<number | null>(null);
  const [selectedFarmId] = useState(1);

  // Fetch all prescriptions
  const { data: prescriptions = [], isLoading } = trpc.prescriptions.list.useQuery(
    { farmId: selectedFarmId },
    { enabled: !!selectedFarmId }
  );

  // Fetch expiring prescriptions
  const { data: expiringPrescriptions = [] } = trpc.prescriptions.getExpiring.useQuery(
    { farmId: selectedFarmId, daysUntilExpiry: 30 },
    { enabled: !!selectedFarmId }
  );

  // Fetch expired prescriptions
  const { data: expiredPrescriptions = [] } = trpc.prescriptions.getExpired.useQuery(
    { farmId: selectedFarmId },
    { enabled: !!selectedFarmId }
  );

  // Fetch statistics
  const { data: stats } = trpc.prescriptions.getStatistics.useQuery(
    { farmId: selectedFarmId },
    { enabled: !!selectedFarmId }
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const activePrescriptions = prescriptions.filter((p: any) => p.status === 'active');
  const expiredPrescriptionsCount = prescriptions.filter((p: any) => p.status === 'expired').length;

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-semibold">Please log in to view prescriptions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prescription Management</h1>
          <p className="text-gray-600 mt-2">Track medications, prescriptions, and renewals</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Prescription
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Prescription</DialogTitle>
              <DialogDescription>Add a new prescription for your animal</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Animal</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select animal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Bessie (Cattle)</SelectItem>
                    <SelectItem value="2">Daisy (Cattle)</SelectItem>
                    <SelectItem value="3">Goat-01 (Goat)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Veterinarian</label>
                <Input placeholder="Veterinarian name" />
              </div>

              <div>
                <label className="text-sm font-medium">Prescription Date</label>
                <Input type="date" />
              </div>

              <div>
                <label className="text-sm font-medium">Expiry Date</label>
                <Input type="date" />
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700">Create Prescription</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Prescriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPrescriptions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activePrescriptions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Expiring Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{expiringPrescriptions.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Average Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">GHS {stats.averageCostPerPrescription}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts */}
      {expiringPrescriptions.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900">Prescriptions Expiring Soon</h3>
            <p className="text-sm text-yellow-800 mt-1">
              {expiringPrescriptions.length} prescription(s) will expire within 30 days. Please renew them.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active ({activePrescriptions.length})</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Soon ({expiringPrescriptions.length})</TabsTrigger>
          <TabsTrigger value="expired">Expired ({expiredPrescriptionsCount})</TabsTrigger>
        </TabsList>

        {/* Active Prescriptions */}
        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Prescriptions</CardTitle>
              <CardDescription>Currently valid prescriptions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading prescriptions...</p>
                </div>
              ) : activePrescriptions.length > 0 ? (
                <div className="space-y-4">
                  {activePrescriptions.map((prescription: any) => (
                    <PrescriptionCard
                      key={prescription.id}
                      prescription={prescription}
                      onRenew={() => {
                        setSelectedPrescription(prescription.id);
                        setShowRenewalDialog(true);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No active prescriptions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expiring Prescriptions */}
        <TabsContent value="expiring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expiring Soon</CardTitle>
              <CardDescription>Prescriptions expiring within 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {expiringPrescriptions.length > 0 ? (
                <div className="space-y-4">
                  {expiringPrescriptions.map((prescription: any) => (
                    <PrescriptionCard
                      key={prescription.id}
                      prescription={prescription}
                      onRenew={() => {
                        setSelectedPrescription(prescription.id);
                        setShowRenewalDialog(true);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No prescriptions expiring soon</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expired Prescriptions */}
        <TabsContent value="expired" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expired Prescriptions</CardTitle>
              <CardDescription>Prescriptions that have expired</CardDescription>
            </CardHeader>
            <CardContent>
              {expiredPrescriptionsCount > 0 ? (
                <div className="space-y-4">
                  {prescriptions
                    .filter((p: any) => p.status === 'expired')
                    .map((prescription: any) => (
                      <PrescriptionCard key={prescription.id} prescription={prescription} />
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No expired prescriptions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Renewal Dialog */}
      <Dialog open={showRenewalDialog} onOpenChange={setShowRenewalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Prescription Renewal</DialogTitle>
            <DialogDescription>Request a renewal from the veterinarian</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Renewal Date</label>
              <Input type="date" />
            </div>
            <div>
              <label className="text-sm font-medium">Reason (Optional)</label>
              <Input placeholder="Why do you need a renewal?" />
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">Request Renewal</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Prescription Card Component
 */
function PrescriptionCard({
  prescription,
  onRenew,
}: {
  prescription: any;
  onRenew?: () => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg">{prescription.animalName}</h3>
          <p className="text-sm text-gray-600">{prescription.animalType}</p>
        </div>
        <Badge className={getStatusColor(prescription.status)}>
          {prescription.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
        <div>
          <p className="text-gray-600">Prescription Date</p>
          <p className="font-medium">{new Date(prescription.prescriptionDate).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-gray-600">Expiry Date</p>
          <p className="font-medium">{new Date(prescription.expiryDate).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-gray-600">Veterinarian</p>
          <p className="font-medium">{prescription.veterinarian}</p>
        </div>
      </div>

      {prescription.items && prescription.items.length > 0 && (
        <div className="mb-3 p-2 bg-gray-100 rounded text-sm">
          <p className="font-medium mb-2">Medications:</p>
          <ul className="space-y-1">
            {prescription.items.map((item: any, idx: number) => (
              <li key={idx} className="text-gray-700">
                • {item.drugName} - {item.dosage} ({item.frequency})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
        {prescription.status === 'active' && onRenew && (
          <Button variant="outline" size="sm" onClick={onRenew}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Renew
          </Button>
        )}
      </div>
    </div>
  );
}
