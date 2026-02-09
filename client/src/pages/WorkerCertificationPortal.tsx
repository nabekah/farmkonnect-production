import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Download, Upload, CheckCircle, Clock, FileText } from "lucide-react";
import { trpc } from "@/lib/trpc";

/**
 * Worker Certification Portal Component
 * Self-service portal where workers can view expiring certifications,
 * submit renewal requests, upload documents, and download certificates
 */
export const WorkerCertificationPortal: React.FC = () => {
  const [selectedCertification, setSelectedCertification] = useState<number | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [renewalNotes, setRenewalNotes] = useState("");
  const [showRenewalForm, setShowRenewalForm] = useState(false);

  // Mock worker certifications
  const workerCertifications = [
    {
      id: 1,
      name: "Agricultural Safety Certification",
      issuedDate: "2023-02-09",
      expiryDate: "2026-02-09",
      certificateNumber: "AGS-2023-001",
      status: "valid",
      daysUntilExpiry: 365,
      issuer: "Ghana Agricultural Board",
    },
    {
      id: 2,
      name: "Pesticide Handling License",
      issuedDate: "2022-08-15",
      expiryDate: "2025-08-15",
      certificateNumber: "PHL-2022-045",
      status: "expiring_soon",
      daysUntilExpiry: 188,
      issuer: "Environmental Protection Agency",
    },
    {
      id: 3,
      name: "First Aid & CPR Certification",
      issuedDate: "2021-12-01",
      expiryDate: "2024-12-01",
      certificateNumber: "FAC-2021-102",
      status: "expired",
      daysUntilExpiry: -70,
      issuer: "Red Cross Ghana",
    },
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleSubmitRenewal = () => {
    if (!selectedCertification || !uploadedFile) {
      alert("Please select a certification and upload a document");
      return;
    }

    // Mock submission
    alert(`Renewal request submitted for certification ${selectedCertification}. Document: ${uploadedFile.name}`);
    setShowRenewalForm(false);
    setUploadedFile(null);
    setRenewalNotes("");
  };

  const downloadCertificate = (certId: number) => {
    const cert = workerCertifications.find((c) => c.id === certId);
    if (!cert) return;

    // Mock PDF download
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8,Certificate Mock PDF");
    element.setAttribute("download", `${cert.certificateNumber}.pdf`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "valid":
        return "bg-green-100 text-green-800 border-green-300";
      case "expiring_soon":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "expired":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "valid":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "expiring_soon":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case "expired":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Certifications</h1>
          <p className="text-gray-600 mt-1">View, renew, and download your professional certifications</p>
        </div>

        {/* Certification Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Certifications</p>
                <p className="text-3xl font-bold text-gray-900">{workerCertifications.length}</p>
              </div>
              <FileText className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Valid</p>
                <p className="text-3xl font-bold text-green-600">
                  {workerCertifications.filter((c) => c.status === "valid").length}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Action Needed</p>
                <p className="text-3xl font-bold text-red-600">
                  {workerCertifications.filter((c) => c.status === "expiring_soon" || c.status === "expired").length}
                </p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-600 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Certifications List */}
        <div className="space-y-4">
          {workerCertifications.map((cert) => (
            <Card key={cert.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(cert.status)}
                    <h3 className="text-lg font-bold text-gray-900">{cert.name}</h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(cert.status)}`}>
                      {cert.status === "valid"
                        ? "Valid"
                        : cert.status === "expiring_soon"
                          ? "Expiring Soon"
                          : "Expired"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-gray-600 text-sm">Certificate Number</p>
                      <p className="text-gray-900 font-medium">{cert.certificateNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Issued Date</p>
                      <p className="text-gray-900 font-medium">{new Date(cert.issuedDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Expiry Date</p>
                      <p className={`font-medium ${cert.status === "expired" ? "text-red-600" : "text-gray-900"}`}>
                        {new Date(cert.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Days Until Expiry</p>
                      <p className={`font-medium ${cert.daysUntilExpiry < 0 ? "text-red-600" : cert.daysUntilExpiry < 90 ? "text-yellow-600" : "text-green-600"}`}>
                        {cert.daysUntilExpiry < 0 ? `${Math.abs(cert.daysUntilExpiry)} days ago` : `${cert.daysUntilExpiry} days`}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mt-3">Issued by: {cert.issuer}</p>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    onClick={() => downloadCertificate(cert.id)}
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>

                  {(cert.status === "expiring_soon" || cert.status === "expired") && (
                    <Button
                      onClick={() => {
                        setSelectedCertification(cert.id);
                        setShowRenewalForm(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Renew
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Renewal Form Modal */}
        {showRenewalForm && selectedCertification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Submit Renewal Request</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Certification</label>
                    <p className="text-gray-900 font-medium">
                      {workerCertifications.find((c) => c.id === selectedCertification)?.name}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Training Certificate</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                      <input type="file" onChange={handleFileUpload} className="hidden" id="file-input" accept=".pdf,.jpg,.png" />
                      <label htmlFor="file-input" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 text-sm">
                          {uploadedFile ? uploadedFile.name : "Click to upload or drag and drop"}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">PDF, JPG, or PNG (Max 5MB)</p>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                    <textarea
                      value={renewalNotes}
                      onChange={(e) => setRenewalNotes(e.target.value)}
                      placeholder="Add any relevant information about your renewal..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => setShowRenewalForm(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmitRenewal}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Submit Request
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Help Section */}
        <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
          <h3 className="font-bold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-gray-700 text-sm">
            Contact your farm administrator if you need assistance with certification renewal or have questions about your certifications.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default WorkerCertificationPortal;
