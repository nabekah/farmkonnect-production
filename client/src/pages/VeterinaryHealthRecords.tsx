import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Calendar, Pill, AlertCircle, Plus, Edit, Trash2, TrendingUp, Activity } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function VeterinaryHealthRecords() {
  const [selectedAnimal, setSelectedAnimal] = useState<number | null>(null);

  // Fetch health records
  const { data: healthRecords = [], isLoading } = trpc.veterinary.getHealthRecords.useQuery({
    farmId: 1,
  });

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800";
      case "at_risk":
        return "bg-yellow-100 text-yellow-800";
      case "sick":
        return "bg-red-100 text-red-800";
      case "recovering":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Health Records</h1>
          <p className="text-muted-foreground mt-2">Track health history, vaccinations, and medical treatments for your livestock</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Health Record
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Animals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthRecords.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Healthy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {healthRecords.filter(r => r.healthStatus === "healthy").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">At Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {healthRecords.filter(r => r.healthStatus === "at_risk").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sick</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {healthRecords.filter(r => r.healthStatus === "sick").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Records List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Loading health records...</p>
            </CardContent>
          </Card>
        ) : healthRecords.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center py-8">No health records found</p>
            </CardContent>
          </Card>
        ) : (
          healthRecords.map((record) => (
            <Card key={record.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{record.animalName || "Animal"}</h3>
                      <Badge className={getHealthStatusColor(record.healthStatus)}>
                        <Heart className="w-3 h-3 mr-1" />
                        {record.healthStatus.replace("_", " ").charAt(0).toUpperCase() + record.healthStatus.replace("_", " ").slice(1)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Species</p>
                        <p className="font-medium">{record.species || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Breed</p>
                        <p className="font-medium">{record.breed || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Age</p>
                        <p className="font-medium">{record.age || "Unknown"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Weight</p>
                        <p className="font-medium">{record.weight ? `${record.weight} kg` : "Not recorded"}</p>
                      </div>
                    </div>

                    {/* Vaccinations */}
                    {record.vaccinations && record.vaccinations.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold flex items-center gap-2">
                          <Pill className="w-4 h-4" />
                          Vaccinations ({record.vaccinations.length})
                        </p>
                        <div className="space-y-1">
                          {record.vaccinations.map((vac: any, idx: number) => (
                            <div key={idx} className="text-sm text-muted-foreground flex justify-between">
                              <span>{vac.name}</span>
                              <span>{new Date(vac.date).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Medical History */}
                    {record.medicalHistory && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Medical History:</strong> {record.medicalHistory}
                      </div>
                    )}

                    {/* Last Checkup */}
                    {record.lastCheckupDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>Last Checkup: {new Date(record.lastCheckupDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
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
