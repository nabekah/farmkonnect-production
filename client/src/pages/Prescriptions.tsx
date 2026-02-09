import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Download, Plus, RefreshCw, Pill } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * Prescriptions Management Page
 * Displays prescription tracking, renewals, and history
 */
export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([
    {
      id: 1,
      animalName: 'Bessie',
      animalType: 'Cattle',
      prescriptionDate: '2024-02-01',
      expiryDate: '2024-05-01',
      veterinarian: 'Dr. Kwame Asante',
      status: 'active',
      totalCost: 850,
      items: [
        { drugName: 'Amoxicillin', dosage: '500mg', frequency: 'Twice daily', duration: '7 days', quantity: 14, unit: 'tablets' },
        { drugName: 'Paracetamol', dosage: '250mg', frequency: 'Once daily', duration: '5 days', quantity: 5, unit: 'tablets' },
      ],
    },
    {
      id: 2,
      animalName: 'Daisy',
      animalType: 'Cattle',
      prescriptionDate: '2024-01-15',
      expiryDate: '2024-04-15',
      veterinarian: 'Dr. Ama Boateng',
      status: 'active',
      totalCost: 650,
      items: [
        { drugName: 'Tetracycline', dosage: '250mg', frequency: 'Twice daily', duration: '10 days', quantity: 20, unit: 'tablets' },
      ],
    },
    {
      id: 3,
      animalName: 'Goat-01',
      animalType: 'Goat',
      prescriptionDate: '2023-12-01',
      expiryDate: '2024-03-01',
      veterinarian: 'Dr. Kwame Asante',
      status: 'expired',
      totalCost: 450,
      items: [
        { drugName: 'Penicillin', dosage: '300mg', frequency: 'Once daily', duration: '5 days', quantity: 5, unit: 'injections' },
      ],
    },
  ]);

  const [showRenewalDialog, setShowRenewalDialog] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<number | null>(null);

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

  const activePrescriptions = prescriptions.filter((p) => p.status === 'active');
  const expiredPrescriptions = prescriptions.filter((p) => p.status === 'expired');
  const expiringPrescriptions = prescriptions.filter((p) => {
    const daysUntilExpiry = Math.floor((new Date(p.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return p.status === 'active' && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  });

  const totalCost = prescriptions.reduce((sum, p) => sum + p.totalCost, 0);
  const averageCost = totalCost / prescriptions.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Prescriptions</h1>
          <p className="text-gray-600 mt-1">Manage veterinary prescriptions and medication tracking</p>
        </div>
        <Dialog open={showRenewalDialog} onOpenChange={setShowRenewalDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Prescription
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Prescription</DialogTitle>
              <DialogDescription>Add a new prescription for your livestock</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Animal</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select animal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bessie">Bessie (Cattle)</SelectItem>
                    <SelectItem value="daisy">Daisy (Cattle)</SelectItem>
                    <SelectItem value="goat-01">Goat-01 (Goat)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Veterinarian</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select veterinarian" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kwame">Dr. Kwame Asante</SelectItem>
                    <SelectItem value="ama">Dr. Ama Boateng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expiry Date</label>
                <Input type="date" />
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Create Prescription</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{activePrescriptions.length}</div>
              <p className="text-sm text-gray-600 mt-1">Active Prescriptions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{expiringPrescriptions.length}</div>
              <p className="text-sm text-gray-600 mt-1">Expiring Soon</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{expiredPrescriptions.length}</div>
              <p className="text-sm text-gray-600 mt-1">Expired</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{totalCost.toLocaleString()}</div>
              <p className="text-sm text-gray-600 mt-1">Total Cost (GHS)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Soon Alert */}
      {expiringPrescriptions.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-orange-900">Prescriptions Expiring Soon</h3>
                <p className="text-sm text-orange-800 mt-1">
                  {expiringPrescriptions.length} prescription(s) will expire within 30 days. Consider requesting renewals.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Prescriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Active Prescriptions</CardTitle>
          <CardDescription>Currently valid prescriptions for your livestock</CardDescription>
        </CardHeader>
        <CardContent>
          {activePrescriptions.length === 0 ? (
            <div className="text-center py-8">
              <Pill className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No active prescriptions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activePrescriptions.map((prescription) => (
                <div key={prescription.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{prescription.animalName}</h3>
                      <p className="text-sm text-gray-600">{prescription.animalType}</p>
                    </div>
                    <Badge className={getStatusColor(prescription.status)}>{prescription.status}</Badge>
                  </div>

                  {/* Prescription Items */}
                  <div className="bg-gray-50 rounded p-3 mb-3">
                    <p className="text-sm font-semibold mb-2">Medications:</p>
                    <div className="space-y-2">
                      {prescription.items.map((item, idx) => (
                        <div key={idx} className="text-sm">
                          <p className="font-medium">{item.drugName}</p>
                          <p className="text-gray-600">
                            {item.dosage} • {item.frequency} • {item.duration} • {item.quantity} {item.unit}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-gray-600">Prescribed</p>
                      <p className="font-semibold">{new Date(prescription.prescriptionDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Expires</p>
                      <p className="font-semibold">{new Date(prescription.expiryDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Veterinarian</p>
                      <p className="font-semibold">{prescription.veterinarian}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Cost</p>
                      <p className="font-semibold text-green-600">GHS {prescription.totalCost}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-1" />
                      Download PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPrescription(prescription.id);
                        setShowRenewalDialog(true);
                      }}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Request Renewal
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expired Prescriptions */}
      {expiredPrescriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Expired Prescriptions</CardTitle>
            <CardDescription>Prescriptions that are no longer valid</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expiredPrescriptions.map((prescription) => (
                <div key={prescription.id} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{prescription.animalName}</p>
                      <p className="text-sm text-gray-600">
                        Expired on {new Date(prescription.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(prescription.status)}>{prescription.status}</Badge>
                      <p className="text-sm font-semibold mt-1">GHS {prescription.totalCost}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
