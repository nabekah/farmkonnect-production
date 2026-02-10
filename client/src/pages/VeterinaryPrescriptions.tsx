import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Pill, AlertCircle, Download, Plus, Edit, Trash2, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function VeterinaryPrescriptions() {
  const [selectedPrescription, setSelectedPrescription] = useState<number | null>(null);

  // Fetch prescriptions
  const { data: prescriptions = [], isLoading } = trpc.veterinary.getPrescriptions.useQuery({
    farmId: 1,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "expired":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isExpiringSoon = (expiryDate: string) => {
    const days = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 && days <= 7;
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prescriptions</h1>
          <p className="text-muted-foreground mt-2">Manage veterinary prescriptions and medications for your livestock</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Prescription
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prescriptions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {prescriptions.filter(p => p.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {prescriptions.filter(p => isExpiringSoon(p.expiryDate)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {prescriptions.filter(p => isExpired(p.expiryDate)).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prescriptions List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Loading prescriptions...</p>
            </CardContent>
          </Card>
        ) : prescriptions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center py-8">No prescriptions found</p>
            </CardContent>
          </Card>
        ) : (
          prescriptions.map((prescription) => (
            <Card key={prescription.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{prescription.medicationName}</h3>
                      <Badge className={getStatusColor(prescription.status)}>
                        {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                      </Badge>
                      {isExpiringSoon(prescription.expiryDate) && !isExpired(prescription.expiryDate) && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Expiring Soon
                        </Badge>
                      )}
                      {isExpired(prescription.expiryDate) && (
                        <Badge variant="outline" className="text-red-600 border-red-600">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Expired
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Animal</p>
                        <p className="font-medium">{prescription.animalName || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Dosage</p>
                        <p className="font-medium">{prescription.dosage}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Frequency</p>
                        <p className="font-medium">{prescription.frequency}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Duration</p>
                        <p className="font-medium">{prescription.duration}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground text-xs">Issued</p>
                          <p className="font-medium">{new Date(prescription.issuedDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground text-xs">Expires</p>
                          <p className="font-medium">{new Date(prescription.expiryDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Veterinarian</p>
                        <p className="font-medium">{prescription.veterinarianName || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Cost</p>
                        <p className="font-medium">GHS {prescription.cost?.toFixed(2) || "0.00"}</p>
                      </div>
                    </div>

                    {prescription.notes && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Notes:</strong> {prescription.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm" className="gap-1">
                      <Download className="w-4 h-4" />
                      PDF
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1 text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
