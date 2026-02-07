import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Download, Plus } from "lucide-react";
import { toast } from "sonner";

interface HealthReportGeneratorProps {
  farmId?: number;
  animalId?: number;
}

export function HealthReportGenerator({ farmId, animalId }: HealthReportGeneratorProps) {
  const [reportType, setReportType] = useState<"animal" | "breed" | "farm">(
    animalId ? "animal" : "farm"
  );
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [breed, setBreed] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const generateAnimalReportQuery = trpc.healthReports.generateAnimalReport.useQuery(
    { animalId: animalId || 0, startDate, endDate },
    { enabled: false }
  );

  const generateBreedReportQuery = trpc.healthReports.generateBreedReport.useQuery(
    { farmId, breed, startDate, endDate },
    { enabled: false }
  );

  const generateFarmReportQuery = trpc.healthReports.generateFarmReport.useQuery(
    { farmId, startDate, endDate },
    { enabled: false }
  );

  const saveTemplateMutation = trpc.healthReports.saveReportTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template saved");
      setTemplateName("");
    },
  });

  const exportPDFMutation = trpc.healthReports.exportReportPDF.useMutation({
    onSuccess: (data) => {
      toast.success("Report exported");
      // Trigger download
      const link = document.createElement("a");
      link.href = data.url;
      link.download = data.filename;
      link.click();
    },
  });

  const handleGenerateReport = async () => {
    try {
      if (reportType === "animal" && animalId) {
        const data = await generateAnimalReportQuery.refetch();
        if (data.data) {
          exportPDFMutation.mutate({
            reportType: "animal",
            reportData: data.data,
            filename: `animal-report-${animalId}-${endDate}.pdf`,
          });
        }
      } else if (reportType === "breed") {
        if (!breed) {
          toast.error("Please select a breed");
          return;
        }
        const data = await generateBreedReportQuery.refetch();
        if (data.data) {
          exportPDFMutation.mutate({
            reportType: "breed",
            reportData: data.data,
            filename: `breed-report-${breed}-${endDate}.pdf`,
          });
        }
      } else if (reportType === "farm") {
        const data = await generateFarmReportQuery.refetch();
        if (data.data) {
          exportPDFMutation.mutate({
            reportType: "farm",
            reportData: data.data,
            filename: `farm-report-${endDate}.pdf`,
          });
        }
      }
    } catch (error) {
      toast.error("Failed to generate report");
    }
  };

  const handleSaveTemplate = () => {
    if (!templateName) {
      toast.error("Please enter template name");
      return;
    }

    saveTemplateMutation.mutate({
      name: templateName,
      reportType,
      filters: { startDate, endDate, breed },
      description: `${reportType} report template`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Health Reports</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Generate Health Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Report Type */}
              <div>
                <label className="text-sm font-semibold">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="w-full border rounded px-2 py-1"
                >
                  {animalId && <option value="animal">Animal Report</option>}
                  <option value="breed">Breed Report</option>
                  <option value="farm">Farm Report</option>
                </select>
              </div>

              {/* Breed Selection for Breed Report */}
              {reportType === "breed" && (
                <div>
                  <label className="text-sm font-semibold">Breed</label>
                  <input
                    type="text"
                    placeholder="Enter breed name"
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
              )}

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-semibold">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
              </div>

              {/* Template Name */}
              <div>
                <label className="text-sm font-semibold">Save as Template (Optional)</label>
                <input
                  type="text"
                  placeholder="Template name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full border rounded px-2 py-1"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={handleGenerateReport}
                  disabled={exportPDFMutation.isPending}
                  className="flex-1 gap-2"
                >
                  <Download className="h-4 w-4" />
                  Generate & Download
                </Button>
                {templateName && (
                  <Button
                    onClick={handleSaveTemplate}
                    variant="outline"
                    disabled={saveTemplateMutation.isPending}
                  >
                    Save Template
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Report Preview */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-blue-600" />
          <div>
            <p className="font-semibold">Health Report Generator</p>
            <p className="text-sm text-gray-600">
              Generate comprehensive health reports for animals, breeds, or farm
            </p>
          </div>
        </div>
      </Card>

      {/* Report Features */}
      <Card className="p-4 space-y-2">
        <p className="font-semibold text-sm">Report Includes:</p>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>✓ Health records summary</li>
          <li>✓ Vaccination history and coverage</li>
          <li>✓ Performance metrics and trends</li>
          <li>✓ Health alerts and issues</li>
          <li>✓ Breed comparisons</li>
          <li>✓ Downloadable PDF format</li>
        </ul>
      </Card>
    </div>
  );
}
