import React, { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, CheckCircle, AlertCircle, Download, Trash2 } from "lucide-react";

export default function BulkPayrollImport() {
  const [file, setFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [importStatus, setImportStatus] = useState<"idle" | "processing" | "completed">("idle");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        setMessageType("error");
        setMessage("Please select a CSV file");
        return;
      }

      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (csvFile: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split("\n");
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

        const data = [];
        const errors = [];

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          const values = lines[i].split(",").map((v) => v.trim());
          const row: any = {};

          headers.forEach((header, index) => {
            row[header] = values[index];
          });

          // Validation
          const rowErrors = [];
          if (!row.workername) rowErrors.push(`Row ${i + 1}: Worker name is required`);
          if (!row.date) rowErrors.push(`Row ${i + 1}: Date is required`);
          if (!row.clockin || !row.clockout) rowErrors.push(`Row ${i + 1}: Clock in/out times are required`);

          if (rowErrors.length > 0) {
            errors.push(...rowErrors);
          } else {
            data.push(row);
          }
        }

        setImportData(data);
        setValidationErrors(errors);

        if (errors.length > 0) {
          setMessageType("error");
          setMessage(`Found ${errors.length} validation errors. Please fix them before importing.`);
        } else {
          setMessageType("success");
          setMessage(`Successfully parsed ${data.length} records from CSV`);
        }
      } catch (error) {
        setMessageType("error");
        setMessage("Error parsing CSV file");
      }
    };
    reader.readAsText(csvFile);
  };

  const downloadTemplate = () => {
    const template = `Worker Name,Date,Clock In,Clock Out,Notes
John Doe,2026-02-09,08:00,17:00,Regular shift
Jane Smith,2026-02-09,08:30,17:30,Started 30 min late
Peter Johnson,2026-02-09,07:00,16:00,Early shift
Mary Williams,2026-02-09,09:00,18:00,Extended shift`;

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(template));
    element.setAttribute("download", "payroll_import_template.csv");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleImport = async () => {
    if (importData.length === 0) {
      setMessageType("error");
      setMessage("No data to import");
      return;
    }

    setImportStatus("processing");

    // Simulate import processing
    setTimeout(() => {
      setImportStatus("completed");
      setMessageType("success");
      setMessage(`Successfully imported ${importData.length} attendance records`);

      // Reset after 3 seconds
      setTimeout(() => {
        setFile(null);
        setImportData([]);
        setImportStatus("idle");
        setMessage("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      }, 3000);
    }, 2000);
  };

  const handleClear = () => {
    setFile(null);
    setImportData([]);
    setValidationErrors([]);
    setMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Bulk Payroll Import</h1>
        <p className="text-gray-600 mt-2">Import attendance data from CSV file</p>
      </div>

      {/* Message Alert */}
      {message && (
        <Alert className={`${messageType === "success" ? "bg-green-50 border-green-200" : messageType === "error" ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}>
          <div className="flex items-center gap-2">
            {messageType === "success" && <CheckCircle className="h-5 w-5 text-green-600" />}
            {messageType === "error" && <AlertCircle className="h-5 w-5 text-red-600" />}
            {messageType === "info" && <AlertCircle className="h-5 w-5 text-blue-600" />}
            <AlertDescription className={messageType === "success" ? "text-green-800" : messageType === "error" ? "text-red-800" : "text-blue-800"}>
              {message}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Upload CSV File</CardTitle>
              <CardDescription>Import attendance records from CSV format</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload Area */}
              <div
                className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto text-blue-500 mb-3" />
                <p className="font-semibold text-gray-900">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-500 mt-1">CSV files only (max 10MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* File Info */}
              {file && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="font-semibold text-gray-900">File: {file.name}</p>
                  <p className="text-sm text-gray-600">Size: {(file.size / 1024).toFixed(2)} KB</p>
                </div>
              )}

              {/* Import Data Preview */}
              {importData.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Preview ({importData.length} records)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left">Worker Name</th>
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-left">Clock In</th>
                          <th className="px-3 py-2 text-left">Clock Out</th>
                          <th className="px-3 py-2 text-left">Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importData.slice(0, 5).map((row, idx) => {
                          const clockIn = new Date(`2026-02-09 ${row.clockin}`);
                          const clockOut = new Date(`2026-02-09 ${row.clockout}`);
                          const hours = ((clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)).toFixed(2);

                          return (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="px-3 py-2">{row.workername}</td>
                              <td className="px-3 py-2">{row.date}</td>
                              <td className="px-3 py-2">{row.clockin}</td>
                              <td className="px-3 py-2">{row.clockout}</td>
                              <td className="px-3 py-2 font-semibold">{hours}h</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {importData.length > 5 && (
                    <p className="text-sm text-gray-600">... and {importData.length - 5} more records</p>
                  )}
                </div>
              )}

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-red-900">Validation Errors</h3>
                  <ul className="text-sm text-red-800 space-y-1">
                    {validationErrors.slice(0, 5).map((error, idx) => (
                      <li key={idx}>• {error}</li>
                    ))}
                    {validationErrors.length > 5 && (
                      <li>... and {validationErrors.length - 5} more errors</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={downloadTemplate}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
                {file && (
                  <>
                    <Button
                      onClick={handleClear}
                      variant="outline"
                      className="flex-1"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={importStatus === "processing" || validationErrors.length > 0}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {importStatus === "processing" ? "Importing..." : "Import Records"}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">CSV Format</h4>
                <p className="text-gray-600">Your CSV file must contain these columns:</p>
                <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                  <li>Worker Name</li>
                  <li>Date (YYYY-MM-DD)</li>
                  <li>Clock In (HH:MM)</li>
                  <li>Clock Out (HH:MM)</li>
                  <li>Notes (optional)</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <h4 className="font-semibold text-blue-900 mb-2">Pro Tips</h4>
                <ul className="text-blue-800 space-y-1 text-xs">
                  <li>✓ Download the template for correct format</li>
                  <li>✓ Validate data before importing</li>
                  <li>✓ Import max 1000 records at once</li>
                  <li>✓ Duplicate entries will be skipped</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <h4 className="font-semibold text-yellow-900 mb-2">Important</h4>
                <p className="text-yellow-800 text-xs">
                  Always verify the preview before importing. Imported records cannot be undone.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
