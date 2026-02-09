import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, Download, RefreshCw, Eye } from 'lucide-react';

export default function PrescriptionManagement() {
  const [selectedPrescription, setSelectedPrescription] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const prescriptions = [
    {
      id: 1,
      veterinarian: 'Dr. Kwame Osei',
      animal: 'Cow - Bessie',
      medication: 'Amoxicillin 500mg',
      dosage: '2 tablets twice daily',
      duration: '7 days',
      issuedDate: '2026-02-01',
      expiryDate: '2026-05-01',
      status: 'active',
      daysUntilExpiry: 81,
      fulfilled: true,
      pharmacy: 'Accra Pharmacy',
      reason: 'Bacterial infection treatment',
    },
    {
      id: 2,
      veterinarian: 'Dr. Ama Mensah',
      animal: 'Fish Tank - Tank A',
      medication: 'Methylene Blue',
      dosage: '5ml per 100L water',
      duration: '3 days',
      issuedDate: '2026-02-05',
      expiryDate: '2026-02-12',
      status: 'expiring_soon',
      daysUntilExpiry: 3,
      fulfilled: false,
      pharmacy: null,
      reason: 'Fish disease treatment',
    },
    {
      id: 3,
      veterinarian: 'Dr. Kofi Amponsah',
      animal: 'Chicken - Flock A',
      medication: 'Newcastle Disease Vaccine',
      dosage: '0.5ml per bird',
      duration: 'Single dose',
      issuedDate: '2026-01-15',
      expiryDate: '2026-01-30',
      status: 'expired',
      daysUntilExpiry: -10,
      fulfilled: true,
      pharmacy: 'Kumasi Veterinary Pharmacy',
      reason: 'Disease prevention',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'expiring_soon':
        return <Badge className="bg-yellow-100 text-yellow-800">Expiring Soon</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'expiring_soon':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'expired':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const selectedPrescriptionData = prescriptions.find(p => p.id === selectedPrescription);

  if (showDetails && selectedPrescriptionData) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Prescription Details</CardTitle>
              <CardDescription>Full prescription information and administration log</CardDescription>
            </div>
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Back to List
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Prescription Header */}
          <div className="border-b pb-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedPrescriptionData.medication}</h3>
                <p className="text-sm text-muted-foreground">{selectedPrescriptionData.animal}</p>
              </div>
              <div className="text-right">
                {getStatusBadge(selectedPrescriptionData.status)}
              </div>
            </div>
          </div>

          {/* Prescription Information */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Veterinarian</p>
              <p className="font-semibold">{selectedPrescriptionData.veterinarian}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dosage</p>
              <p className="font-semibold">{selectedPrescriptionData.dosage}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-semibold">{selectedPrescriptionData.duration}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Issued Date</p>
              <p className="font-semibold">{selectedPrescriptionData.issuedDate}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expiry Date</p>
              <p className="font-semibold">{selectedPrescriptionData.expiryDate}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reason</p>
              <p className="font-semibold">{selectedPrescriptionData.reason}</p>
            </div>
          </div>

          {/* Fulfillment Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">Fulfillment Status</p>
            {selectedPrescriptionData.fulfilled ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm">
                  Fulfilled at {selectedPrescriptionData.pharmacy}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <span className="text-sm">Not yet fulfilled</span>
              </div>
            )}
          </div>

          {/* Administration Log */}
          <div>
            <h4 className="font-semibold mb-3">Administration Log</h4>
            <div className="space-y-2">
              {[
                { date: '2026-02-01', time: '08:00', administered: true },
                { date: '2026-02-01', time: '20:00', administered: true },
                { date: '2026-02-02', time: '08:00', administered: true },
              ].map((log, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">{log.date} at {log.time}</span>
                  {log.administered ? (
                    <Badge className="bg-green-100 text-green-800">Administered</Badge>
                  ) : (
                    <Badge variant="outline">Pending</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            {selectedPrescriptionData.status === 'expired' && (
              <Button className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                Request Renewal
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold">My Prescriptions</h2>
        <p className="text-muted-foreground">Manage and track your veterinary prescriptions</p>
      </div>

      {/* Prescriptions List */}
      <div className="space-y-3">
        {prescriptions.map(prescription => (
          <Card key={prescription.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(prescription.status)}
                    <div>
                      <h3 className="font-semibold">{prescription.medication}</h3>
                      <p className="text-sm text-muted-foreground">{prescription.animal}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Veterinarian</p>
                      <p className="font-medium">{prescription.veterinarian}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Dosage</p>
                      <p className="font-medium">{prescription.dosage}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Expires In</p>
                      <p className={`font-medium ${
                        prescription.daysUntilExpiry < 0 ? 'text-red-600' :
                        prescription.daysUntilExpiry < 7 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {prescription.daysUntilExpiry < 0
                          ? `Expired ${Math.abs(prescription.daysUntilExpiry)} days ago`
                          : `${prescription.daysUntilExpiry} days`}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      {getStatusBadge(prescription.status)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPrescription(prescription.id);
                      setShowDetails(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  {prescription.status === 'expired' && (
                    <Button size="sm">
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Renew
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Compliance Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg">Compliance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Active Prescriptions</p>
              <p className="text-2xl font-bold">1</p>
            </div>
            <div>
              <p className="text-muted-foreground">Expiring Soon</p>
              <p className="text-2xl font-bold text-yellow-600">1</p>
            </div>
            <div>
              <p className="text-muted-foreground">Expired</p>
              <p className="text-2xl font-bold text-red-600">1</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
