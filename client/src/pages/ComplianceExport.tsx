import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Download, CheckCircle, AlertCircle, Calendar } from "lucide-react";

export default function ComplianceExport() {
  const [reportType, setReportType] = useState("ssnit");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [exportFormat, setExportFormat] = useState("csv");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const reportTypes = [
    {
      id: "ssnit",
      name: "SSNIT Contribution Report",
      description: "Social Security and National Insurance Trust contributions",
      authority: "SSNIT",
    },
    {
      id: "gra",
      name: "GRA Tax Report",
      description: "Ghana Revenue Authority income tax report",
      authority: "GRA",
    },
    {
      id: "payroll_summary",
      name: "Annual Payroll Summary",
      description: "Complete annual payroll and deduction summary",
      authority: "Internal",
    },
    {
      id: "annual_tax",
      name: "Annual Tax Certificate",
      description: "Individual worker tax certificate",
      authority: "GRA",
    },
  ];

  const handleGenerateReport = () => {
    setMessageType("success");
    setMessage(`${reportTypes.find((r) => r.id === reportType)?.name} for ${year} generated successfully!`);

    setTimeout(() => setMessage(""), 3000);
  };

  const handleDownloadReport = () => {
    const format = exportFormat === "csv" ? "CSV" : "JSON";
    setMessageType("success");
    setMessage(`Report downloaded as ${format} format`);

    setTimeout(() => setMessage(""), 3000);
  };

  const existingReports = [
    {
      id: 1,
      type: "SSNIT Contribution Report",
      year: 2025,
      generatedDate: "2026-01-31",
      fileName: "SSNIT_Report_2025.csv",
    },
    {
      id: 2,
      type: "GRA Tax Report",
      year: 2025,
      generatedDate: "2026-01-31",
      fileName: "GRA_Tax_Report_2025.csv",
    },
    {
      id: 3,
      type: "Annual Payroll Summary",
      year: 2025,
      generatedDate: "2026-01-31",
      fileName: "Payroll_Summary_2025.csv",
    },
    {
      id: 4,
      type: "SSNIT Contribution Report",
      year: 2024,
      generatedDate: "2025-01-31",
      fileName: "SSNIT_Report_2024.csv",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Compliance Export</h1>
        <p className="text-gray-600 mt-2">Generate and export compliance reports for Ghana tax authorities</p>
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
        {/* Report Generator */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Generate Compliance Report</CardTitle>
              <CardDescription>Select report type and year to generate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Report Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Report Type</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {reportTypes.map((type) => (
                    <div
                      key={type.id}
                      onClick={() => setReportType(type.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        reportType === type.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <p className="font-semibold text-gray-900">{type.name}</p>
                      <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                      <p className="text-xs text-gray-500 mt-2">Authority: {type.authority}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Year Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Export Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "csv", name: "CSV", description: "Spreadsheet format" },
                    { id: "json", name: "JSON", description: "Data interchange format" },
                  ].map((format) => (
                    <div
                      key={format.id}
                      onClick={() => setExportFormat(format.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        exportFormat === format.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p className="font-semibold text-gray-900">{format.name}</p>
                      <p className="text-xs text-gray-600">{format.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button onClick={handleGenerateReport} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
                <Button onClick={handleDownloadReport} variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>

              {/* Info Alert */}
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Reports are generated based on your farm's payroll data for the selected year. Ensure all payroll records are complete before generating compliance reports.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Report Information */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Report Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">SSNIT Report</h4>
                <p className="text-gray-600">
                  Required for Social Security contributions. Must be filed annually with SSNIT.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">GRA Tax Report</h4>
                <p className="text-gray-600">
                  Required for income tax reporting. Must be filed with Ghana Revenue Authority.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Payroll Summary</h4>
                <p className="text-gray-600">
                  Internal record of all payroll transactions for audit and compliance purposes.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <h4 className="font-semibold text-yellow-900 mb-2">Important</h4>
                <p className="text-yellow-800 text-xs">
                  Keep all generated reports for at least 7 years for audit purposes as required by Ghana law.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Existing Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Previously Generated Reports</CardTitle>
          <CardDescription>Download or regenerate compliance reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {existingReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-gray-900">{report.type}</p>
                    <p className="text-sm text-gray-600">
                      Year {report.year} • Generated {report.generatedDate}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
