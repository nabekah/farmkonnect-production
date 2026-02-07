import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Heart, Syringe, TrendingUp, Calendar, User, FileText } from "lucide-react";

interface AnimalDetailPanelProps {
  animalId: number;
  onClose?: () => void;
}

export function AnimalDetailPanel({ animalId, onClose }: AnimalDetailPanelProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch animal details
  const { data: animal, isLoading: animalLoading } = trpc.livestock.getAnimalById.useQuery(
    { id: animalId },
    { enabled: !!animalId }
  );

  // Fetch health records
  const { data: healthRecords = [] } = trpc.livestock.getAnimalHealthRecords.useQuery(
    { animalId },
    { enabled: !!animalId }
  );

  // Fetch vaccinations
  const { data: vaccinations = [] } = trpc.livestock.getAnimalVaccinations.useQuery(
    { animalId },
    { enabled: !!animalId }
  );

  // Fetch performance metrics
  const { data: performanceMetrics = [] } = trpc.livestock.getAnimalPerformanceMetrics.useQuery(
    { animalId },
    { enabled: !!animalId }
  );

  if (animalLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </Card>
    );
  }

  if (!animal) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500">Animal not found</p>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <div className="p-6 border-b">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">{animal.tagId}</h2>
            <p className="text-gray-600">{animal.breed}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">{animal.animalType}</Badge>
              <Badge variant="outline">{animal.gender}</Badge>
              <Badge variant={animal.status === "active" ? "default" : "secondary"}>
                {animal.status}
              </Badge>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              ✕
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0">
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600">
            Overview
          </TabsTrigger>
          <TabsTrigger value="health" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600">
            <Heart className="mr-2 h-4 w-4" />
            Health ({healthRecords.length})
          </TabsTrigger>
          <TabsTrigger value="vaccinations" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600">
            <Syringe className="mr-2 h-4 w-4" />
            Vaccinations ({vaccinations.length})
          </TabsTrigger>
          <TabsTrigger value="performance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600">
            <TrendingUp className="mr-2 h-4 w-4" />
            Performance ({performanceMetrics.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Tag ID</p>
              <p className="font-semibold">{animal.tagId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Breed</p>
              <p className="font-semibold">{animal.breed}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Birth Date</p>
              <p className="font-semibold">
                {animal.birthDate ? new Date(animal.birthDate).toLocaleDateString() : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Gender</p>
              <p className="font-semibold">{animal.gender}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-semibold capitalize">{animal.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Animal Type</p>
              <p className="font-semibold">{animal.animalType}</p>
            </div>
          </div>
          {animal.notes && (
            <div>
              <p className="text-sm text-gray-600">Notes</p>
              <p className="text-sm">{animal.notes}</p>
            </div>
          )}
        </TabsContent>

        {/* Health Records Tab */}
        <TabsContent value="health" className="p-6">
          {healthRecords.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No health records</p>
          ) : (
            <div className="space-y-3">
              {healthRecords.map((record: any, idx: number) => (
                <Card key={idx} className="p-4 border">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold capitalize">{record.recordType}</p>
                      <p className="text-sm text-gray-600">{record.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(record.recordDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={record.severity === "high" ? "destructive" : "secondary"}>
                      {record.severity}
                    </Badge>
                  </div>
                  {record.notes && (
                    <p className="text-sm text-gray-600 mt-2">{record.notes}</p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Vaccinations Tab */}
        <TabsContent value="vaccinations" className="p-6">
          {vaccinations.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No vaccinations</p>
          ) : (
            <div className="space-y-3">
              {vaccinations.map((vac: any, idx: number) => (
                <Card key={idx} className="p-4 border">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{vac.vaccineName}</p>
                      <div className="text-xs text-gray-600 space-y-1 mt-2">
                        <p>
                          <Calendar className="inline mr-1 h-3 w-3" />
                          Vaccinated: {new Date(vac.vaccinationDate).toLocaleDateString()}
                        </p>
                        {vac.nextDueDate && (
                          <p>
                            <Calendar className="inline mr-1 h-3 w-3" />
                            Next Due: {new Date(vac.nextDueDate).toLocaleDateString()}
                          </p>
                        )}
                        {vac.veterinarian && (
                          <p>
                            <User className="inline mr-1 h-3 w-3" />
                            Vet: {vac.veterinarian}
                          </p>
                        )}
                        {vac.batchNumber && (
                          <p>
                            <FileText className="inline mr-1 h-3 w-3" />
                            Batch: {vac.batchNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={vac.nextDueDate && new Date(vac.nextDueDate) < new Date() ? "destructive" : "default"}>
                      {vac.nextDueDate && new Date(vac.nextDueDate) < new Date() ? "Overdue" : "Current"}
                    </Badge>
                  </div>
                  {vac.notes && (
                    <p className="text-sm text-gray-600 mt-2">{vac.notes}</p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="p-6">
          {performanceMetrics.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No performance metrics</p>
          ) : (
            <div className="space-y-3">
              {performanceMetrics.map((metric: any, idx: number) => (
                <Card key={idx} className="p-4 border">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold capitalize">{metric.metricType.replace("_", " ")}</p>
                      <p className="text-2xl font-bold mt-1">
                        {metric.value} <span className="text-sm text-gray-600">{metric.unit}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(metric.recordDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {metric.notes && (
                    <p className="text-sm text-gray-600 mt-2">{metric.notes}</p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
