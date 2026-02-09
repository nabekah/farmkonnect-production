import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Download, Eye, Edit, DollarSign, User, Calendar, AlertCircle } from "lucide-react";

export default function WorkerSelfService() {
  const [activeTab, setActiveTab] = useState("payslips");
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
  const [editingBankInfo, setEditingBankInfo] = useState(false);

  // Mock worker data
  const workerData = {
    name: "John Doe",
    workerId: "WRK-2024-001",
    position: "Farm Manager",
    farmName: "Green Valley Farm",
    email: "john.doe@example.com",
    phone: "+233 24 123 4567",
    hireDate: "2024-01-15",
    bankAccount: "1234567890",
    bankName: "GCB Bank",
    accountHolder: "John Doe",
  };

  const payslips = [
    {
      id: 1,
      month: "February 2026",
      date: "2026-02-25",
      basicSalary: 2500,
      allowances: 300,
      deductions: 450,
      netPay: 2350,
      status: "paid",
    },
    {
      id: 2,
      month: "January 2026",
      date: "2026-01-25",
      basicSalary: 2500,
      allowances: 300,
      deductions: 450,
      netPay: 2350,
      status: "paid",
    },
    {
      id: 3,
      month: "December 2025",
      date: "2025-12-25",
      basicSalary: 2500,
      allowances: 300,
      deductions: 450,
      netPay: 2350,
      status: "paid",
    },
  ];

  const taxDocuments = [
    {
      id: 1,
      type: "Annual Tax Certificate",
      year: 2025,
      downloadDate: "2026-01-31",
      status: "ready",
    },
    {
      id: 2,
      type: "SSNIT Contribution Statement",
      year: 2025,
      downloadDate: "2026-01-31",
      status: "ready",
    },
    {
      id: 3,
      type: "Payroll Summary",
      year: 2025,
      downloadDate: "2026-01-31",
      status: "ready",
    },
  ];

  const handleDownloadPayslip = (payslip: any) => {
    console.log("Downloading payslip:", payslip);
    // In production, this would generate and download a PDF
  };

  const handleDownloadTaxDoc = (doc: any) => {
    console.log("Downloading tax document:", doc);
    // In production, this would generate and download a PDF
  };

  const handleUpdateBankInfo = () => {
    setEditingBankInfo(false);
    console.log("Bank info updated");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Payroll Portal</h1>
        <p className="text-gray-600 mt-2">View payslips, tax documents, and manage your account</p>
      </div>

      {/* Worker Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-semibold text-gray-900">{workerData.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Position</p>
                <p className="font-semibold text-gray-900">{workerData.position}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Farm</p>
                <p className="font-semibold text-gray-900">{workerData.farmName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Worker ID</p>
                <p className="font-semibold text-gray-900">{workerData.workerId}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="payslips">Payslips</TabsTrigger>
          <TabsTrigger value="tax-documents">Tax Documents</TabsTrigger>
          <TabsTrigger value="bank-info">Bank Info</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        {/* Payslips Tab */}
        <TabsContent value="payslips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payslips</CardTitle>
              <CardDescription>View and download your monthly payslips</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {payslips.map((payslip) => (
                <div key={payslip.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-semibold text-gray-900">{payslip.month}</p>
                          <p className="text-sm text-gray-600">{payslip.date}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm mt-3">
                        <div>
                          <p className="text-gray-600">Basic Salary</p>
                          <p className="font-semibold text-gray-900">GHS {payslip.basicSalary.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Deductions</p>
                          <p className="font-semibold text-red-600">-GHS {payslip.deductions.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Net Pay</p>
                          <p className="font-semibold text-green-600">GHS {payslip.netPay.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPayslip(payslip)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPayslip(payslip)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Payslip Detail Modal */}
          {selectedPayslip && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Payslip Details - {selectedPayslip.month}</CardTitle>
                  <button
                    onClick={() => setSelectedPayslip(null)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    ✕
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded">
                    <p className="text-sm text-gray-600">Basic Salary</p>
                    <p className="text-lg font-semibold text-gray-900">
                      GHS {selectedPayslip.basicSalary.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded">
                    <p className="text-sm text-gray-600">Allowances</p>
                    <p className="text-lg font-semibold text-gray-900">
                      GHS {selectedPayslip.allowances.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded">
                    <p className="text-sm text-gray-600">Tax & Deductions</p>
                    <p className="text-lg font-semibold text-red-600">
                      -GHS {selectedPayslip.deductions.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded">
                    <p className="text-sm text-gray-600">Net Pay</p>
                    <p className="text-lg font-semibold text-green-600">
                      GHS {selectedPayslip.netPay.toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleDownloadPayslip(selectedPayslip)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tax Documents Tab */}
        <TabsContent value="tax-documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax Documents</CardTitle>
              <CardDescription>Download your annual tax certificates and statements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {taxDocuments.map((doc) => (
                <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-semibold text-gray-900">{doc.type}</p>
                        <p className="text-sm text-gray-600">Year {doc.year}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadTaxDoc(doc)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bank Information Tab */}
        <TabsContent value="bank-info" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Bank Account Information</CardTitle>
                  <CardDescription>Update your payment details</CardDescription>
                </div>
                {!editingBankInfo && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingBankInfo(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!editingBankInfo ? (
                <div className="space-y-3">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Bank Name</p>
                    <p className="font-semibold text-gray-900">{workerData.bankName}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Account Number</p>
                    <p className="font-semibold text-gray-900">{workerData.bankAccount}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Account Holder</p>
                    <p className="font-semibold text-gray-900">{workerData.accountHolder}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Changes to bank information will be effective for the next payroll cycle.
                    </AlertDescription>
                  </Alert>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                    <input
                      type="text"
                      defaultValue={workerData.bankName}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                    <input
                      type="text"
                      defaultValue={workerData.bankAccount}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleUpdateBankInfo}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingBankInfo(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Information Tab */}
        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Your registered contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold text-gray-900">{workerData.email}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Phone Number</p>
                <p className="font-semibold text-gray-900">{workerData.phone}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Hire Date</p>
                <p className="font-semibold text-gray-900">{workerData.hireDate}</p>
              </div>
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  To update your contact information, please contact your farm manager.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
