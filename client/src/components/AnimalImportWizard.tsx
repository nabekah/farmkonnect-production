import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, Upload, Eye, Download, Loader2, FileText } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface AnimalImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmId: number;
}

export function AnimalImportWizard({ open, onOpenChange, farmId }: AnimalImportWizardProps) {
  const [step, setStep] = useState<"upload" | "validate" | "preview" | "confirm" | "complete">("upload");
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [fileType, setFileType] = useState<"csv" | "xlsx">("csv");
  const [validationResult, setValidationResult] = useState<any>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);

  // Mutations
  const validateFile = trpc.animalImportWizard.validateImportFile.useMutation({
    onSuccess: (data) => {
      setValidationResult(data);
      setStep("validate");
    },
  });

  const checkDuplicates = trpc.animalImportWizard.checkForDuplicates.useMutation({
    onSuccess: (data) => {
      // Continue to preview
    },
  });

  const getPreview = trpc.animalImportWizard.getImportPreview.useMutation({
    onSuccess: (data) => {
      setPreviewData(data);
      setStep("preview");
    },
  });

  const executeImport = trpc.animalImportWizard.executeImport.useMutation({
    onSuccess: (data) => {
      setImportResult(data);
      setStep("complete");
    },
  });

  const getTemplate = trpc.animalImportWizard.getImportTemplate.useQuery({ format: "csv" });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const content = await file.text();
    setFileContent(content);
  };

  const handleValidate = async () => {
    if (!fileContent) {
      alert("Please select a file");
      return;
    }

    await validateFile.mutateAsync({
      fileName,
      fileContent,
      fileType,
      farmId,
    });
  };

  const handleGetPreview = async () => {
    if (!validationResult) return;

    // Parse records from validation result
    const records = validationResult.preview.map((p: any) => ({
      tagId: p["tag id"] || "",
      breed: p.breed || "",
      gender: p.gender || "",
      birthDate: p["birth date"],
      notes: p.notes,
    }));

    await getPreview.mutateAsync({
      farmId,
      records,
    });
  };

  const handleConfirmImport = async () => {
    if (!previewData) return;

    const records = previewData.validationResults
      .filter((r: any) => r.isValid)
      .map((r: any) => r.record);

    await executeImport.mutateAsync({
      farmId,
      records,
      skipDuplicates: true,
    });
  };

  const handleDownloadTemplate = () => {
    if (!getTemplate.data) return;

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(getTemplate.data.content));
    element.setAttribute("download", getTemplate.data.fileName);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Animal Import Wizard</DialogTitle>
          <DialogDescription>Import animals from CSV or Excel file</DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">
              Step {["upload", "validate", "preview", "confirm", "complete"].indexOf(step) + 1} of 5
            </span>
            <span className="text-muted-foreground">{step}</span>
          </div>
          <Progress value={(["upload", "validate", "preview", "confirm", "complete"].indexOf(step) + 1) * 20} />
        </div>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="file-input">Select File</Label>
                    <div className="flex gap-2">
                      <Input
                        id="file-input"
                        type="file"
                        accept=".csv,.xlsx"
                        onChange={handleFileUpload}
                        className="flex-1"
                      />
                      <Button variant="outline" onClick={handleDownloadTemplate}>
                        <Download className="w-4 h-4 mr-2" />
                        Template
                      </Button>
                    </div>
                  </div>

                  {fileName && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">{fileName}</span>
                      <Badge variant="secondary" className="ml-auto">
                        Ready
                      </Badge>
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground">
                    <p>Supported formats: CSV, XLSX</p>
                    <p>Required columns: Tag ID, Breed, Gender</p>
                    <p>Optional columns: Birth Date, Notes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleValidate}
              disabled={!fileContent || validateFile.isPending}
              className="w-full"
            >
              {validateFile.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Validate File
                </>
              )}
            </Button>
          </div>
        )}

        {/* Step 2: Validate */}
        {step === "validate" && validationResult && (
          <div className="space-y-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-base">File Validation Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Records</p>
                    <p className="text-2xl font-bold">{validationResult.totalRecords}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className="mt-1">
                      {validationResult.validation.isValid ? "Valid" : "Invalid"}
                    </Badge>
                  </div>
                </div>

                {validationResult.validation.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {validationResult.validation.errors.length} errors found
                    </AlertDescription>
                  </Alert>
                )}

                {validationResult.validation.warnings.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {validationResult.validation.warnings.length} warnings
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label>Preview (First 5 Records)</Label>
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      {validationResult.headers.map((h: string) => (
                        <th key={h} className="px-3 py-2 text-left font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {validationResult.preview.map((row: any, i: number) => (
                      <tr key={i} className="border-t hover:bg-muted/50">
                        {validationResult.headers.map((h: string) => (
                          <td key={h} className="px-3 py-2">
                            {row[h]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("upload")} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleGetPreview}
                disabled={!validationResult.validation.isValid || getPreview.isPending}
                className="flex-1"
              >
                {getPreview.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Continue
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === "preview" && previewData && (
          <div className="space-y-4">
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-base">Import Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Valid Records</p>
                    <p className="text-2xl font-bold text-green-600">{previewData.validRecords}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Invalid Records</p>
                    <p className="text-2xl font-bold text-red-600">{previewData.invalidRecords}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duplicates</p>
                    <p className="text-2xl font-bold text-yellow-600">{previewData.duplicateCount}</p>
                  </div>
                </div>

                {previewData.invalidRecords > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {previewData.invalidRecords} records have validation errors
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {previewData.validationResults.filter((r: any) => !r.isValid).length > 0 && (
              <div className="space-y-2">
                <Label>Invalid Records</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {previewData.validationResults
                    .filter((r: any) => !r.isValid)
                    .map((result: any, i: number) => (
                      <Card key={i} className="border-red-200 bg-red-50">
                        <CardContent className="pt-4">
                          <p className="text-sm font-medium">Row {result.rowNumber}</p>
                          <ul className="text-sm text-red-700 mt-1">
                            {result.errors.map((e: string, j: number) => (
                              <li key={j}>• {e}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("validate")} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setStep("confirm")}
                disabled={previewData.invalidRecords > 0}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === "confirm" && previewData && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Ready to import {previewData.validRecords} animals
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Import Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Animals to import:</span>
                  <span className="font-medium">{previewData.validRecords}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duplicate records:</span>
                  <span className="font-medium">{previewData.duplicateCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge>Ready to Import</Badge>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("preview")} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={executeImport.isPending}
                className="flex-1"
              >
                {executeImport.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  "Confirm & Import"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Complete */}
        {step === "complete" && importResult && (
          <div className="space-y-4">
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Import Complete
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Successful</p>
                    <p className="text-2xl font-bold text-green-600">
                      {importResult.results.successfulImports}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                    <p className="text-2xl font-bold text-red-600">
                      {importResult.results.failedImports}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button onClick={() => onOpenChange(false)} className="w-full">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
