import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Download, Eye } from "lucide-react";

interface RegistrationResult {
  successful: number;
  failed: number;
  failedIds?: string[];
  totalProcessingTime: number;
  timestamp: Date;
}

interface RegistrationSuccessSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  result: RegistrationResult | null;
  breed: string;
  animalType: string;
}

export function RegistrationSuccessSummary({
  isOpen,
  onClose,
  result,
  breed,
  animalType,
}: RegistrationSuccessSummaryProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!result) return null;

  const successRate = Math.round(
    (result.successful / (result.successful + result.failed)) * 100
  );

  const handleDownloadReport = () => {
    const report = `
Registration Report
==================
Date: ${result.timestamp.toLocaleString()}
Animal Type: ${animalType}
Breed: ${breed}

Summary:
--------
Total Registered: ${result.successful}
Failed: ${result.failed}
Success Rate: ${successRate}%
Processing Time: ${result.totalProcessingTime}ms

${result.failedIds && result.failedIds.length > 0 ? `Failed Tag IDs:\n${result.failedIds.join("\n")}` : ""}
    `.trim();

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(report));
    element.setAttribute("download", `registration-report-${Date.now()}.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            Registration Complete
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Success Card */}
          <Card className="p-6 bg-green-50 border-green-200">
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Successfully Registered</p>
                <p className="text-4xl font-bold text-green-600">{result.successful}</p>
                <p className="text-sm text-gray-600 mt-2">animals</p>
              </div>

              {result.failed > 0 && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded border border-yellow-200">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-yellow-800">
                      {result.failed} registration(s) failed
                    </p>
                    <p className="text-xs text-yellow-700">
                      Success rate: {successRate}%
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-between text-sm text-gray-600 pt-2 border-t">
                <span>Processing Time:</span>
                <span className="font-semibold">{(result.totalProcessingTime / 1000).toFixed(2)}s</span>
              </div>
            </div>
          </Card>

          {/* Details Section */}
          {result.failed > 0 && (
            <div>
              <Button
                variant="outline"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full"
              >
                <Eye className="mr-2 h-4 w-4" />
                {showDetails ? "Hide" : "Show"} Failed Registrations
              </Button>

              {showDetails && result.failedIds && (
                <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
                  <p className="text-sm font-semibold text-red-800 mb-2">Failed Tag IDs:</p>
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                    {result.failedIds.map((id, idx) => (
                      <div
                        key={idx}
                        className="text-xs bg-white p-2 rounded border border-red-300 text-center text-red-700"
                      >
                        {id}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Summary Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
            <div>
              <p className="text-xs text-gray-600">Animal Type</p>
              <p className="font-semibold">{animalType}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Breed</p>
              <p className="font-semibold">{breed || "Not specified"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Registered At</p>
              <p className="font-semibold text-sm">{result.timestamp.toLocaleTimeString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Success Rate</p>
              <p className="font-semibold">{successRate}%</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleDownloadReport}>
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
