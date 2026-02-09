import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Download, Send, Filter, TrendingDown, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";

/**
 * Training Compliance Reports Component
 * Shows which workers are missing required certifications
 * with escalation workflow for non-compliant workers
 */
export const TrainingComplianceReports: React.FC = () => {
  const [selectedFarm, setSelectedFarm] = useState(1);
  const [filterStatus, setFilterStatus] = useState<"all" | "compliant" | "non_compliant" | "critical">("all");
  const [selectedWorkers, setSelectedWorkers] = useState<number[]>([]);
  const [showEscalationForm, setShowEscalationForm] = useState(false);

  // Mock compliance data
  const complianceData = [
    {
      workerId: 1,
      workerName: "John Smith",
      department: "Field Operations",
      complianceStatus: "compliant",
      completedTrainings: 5,
      requiredTrainings: 5,
      compliancePercentage: 100,
      missingCertifications: [],
      lastComplianceCheck: "2026-02-09",
    },
    {
      workerId: 2,
      workerName: "Sarah Johnson",
      department: "Equipment Management",
      complianceStatus: "non_compliant",
      completedTrainings: 3,
      requiredTrainings: 5,
      compliancePercentage: 60,
      missingCertifications: ["Pesticide Handling", "Equipment Safety"],
      lastComplianceCheck: "2026-02-09",
    },
    {
      workerId: 3,
      workerName: "Michael Brown",
      department: "Field Operations",
      complianceStatus: "critical",
      completedTrainings: 1,
      requiredTrainings: 5,
      compliancePercentage: 20,
      missingCertifications: ["Agricultural Safety", "Pesticide Handling", "First Aid", "Equipment Safety"],
      lastComplianceCheck: "2026-02-08",
    },
    {
      workerId: 4,
      workerName: "Emily Davis",
      department: "Crop Management",
      complianceStatus: "compliant",
      completedTrainings: 5,
      requiredTrainings: 5,
      compliancePercentage: 100,
      missingCertifications: [],
      lastComplianceCheck: "2026-02-09",
    },
    {
      workerId: 5,
      workerName: "David Wilson",
      department: "Field Operations",
      complianceStatus: "non_compliant",
      completedTrainings: 2,
      requiredTrainings: 5,
      compliancePercentage: 40,
      missingCertifications: ["Agricultural Safety", "Pesticide Handling", "First Aid"],
      lastComplianceCheck: "2026-02-07",
    },
  ];

  const filteredData =
    filterStatus === "all"
      ? complianceData
      : complianceData.filter((w) => w.complianceStatus === filterStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant":
        return "bg-green-100 text-green-800 border-green-300";
      case "non_compliant":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getComplianceColor = (percentage: number) => {
    if (percentage === 100) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const handleSelectWorker = (workerId: number) => {
    setSelectedWorkers((prev) =>
      prev.includes(workerId) ? prev.filter((id) => id !== workerId) : [...prev, workerId]
    );
  };

  const handleSendEscalation = () => {
    if (selectedWorkers.length === 0) {
      alert("Please select at least one worker");
      return;
    }

    // Mock escalation
    alert(`Escalation notices sent to ${selectedWorkers.length} workers`);
    setSelectedWorkers([]);
    setShowEscalationForm(false);
  };

  const exportReport = () => {
    const csvContent = `Worker Name,Department,Compliance %,Status,Missing Certifications,Last Check
${filteredData.map((w) => `"${w.workerName}","${w.department}",${w.compliancePercentage}%,"${w.complianceStatus}","${w.missingCertifications.join(", ")}","${w.lastComplianceCheck}"`).join("\n")}`;

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent));
    element.setAttribute("download", "training_compliance_report.csv");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Calculate summary statistics
  const compliantCount = complianceData.filter((w) => w.complianceStatus === "compliant").length;
  const nonCompliantCount = complianceData.filter((w) => w.complianceStatus === "non_compliant").length;
  const criticalCount = complianceData.filter((w) => w.complianceStatus === "critical").length;
  const avgCompliance = Math.round(
    complianceData.reduce((sum, w) => sum + w.compliancePercentage, 0) / complianceData.length
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Training Compliance Reports</h1>
            <p className="text-gray-600 mt-1">Monitor worker training compliance and manage escalations</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportReport} variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            {selectedWorkers.length > 0 && (
              <Button
                onClick={() => setShowEscalationForm(true)}
                className="bg-red-600 hover:bg-red-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Escalation ({selectedWorkers.length})
              </Button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Workers</p>
                <p className="text-3xl font-bold text-gray-900">{complianceData.length}</p>
              </div>
              <Users className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Compliant</p>
                <p className="text-3xl font-bold text-green-600">{compliantCount}</p>
              </div>
              <div className="text-sm text-green-600">{Math.round((compliantCount / complianceData.length) * 100)}%</div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Non-Compliant</p>
                <p className="text-3xl font-bold text-yellow-600">{nonCompliantCount}</p>
              </div>
              <div className="text-sm text-yellow-600">{Math.round((nonCompliantCount / complianceData.length) * 100)}%</div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Critical</p>
                <p className="text-3xl font-bold text-red-600">{criticalCount}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-600 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 p-4">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Workers</option>
              <option value="compliant">Compliant</option>
              <option value="non_compliant">Non-Compliant</option>
              <option value="critical">Critical</option>
            </select>
            <span className="text-gray-600 text-sm ml-auto">Showing {filteredData.length} workers</span>
          </div>
        </Card>

        {/* Compliance Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedWorkers(filteredData.map((w) => w.workerId));
                        } else {
                          setSelectedWorkers([]);
                        }
                      }}
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Worker Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Department</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Compliance</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Missing Certifications</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Check</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((worker) => (
                  <tr key={worker.workerId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedWorkers.includes(worker.workerId)}
                        onChange={() => handleSelectWorker(worker.workerId)}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-gray-900 font-medium">{worker.workerName}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{worker.department}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${worker.compliancePercentage === 100 ? "bg-green-600" : worker.compliancePercentage >= 60 ? "bg-yellow-600" : "bg-red-600"}`}
                            style={{ width: `${worker.compliancePercentage}%` }}
                          ></div>
                        </div>
                        <span className={`font-medium ${getComplianceColor(worker.compliancePercentage)}`}>
                          {worker.compliancePercentage}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(worker.complianceStatus)}`}>
                        {worker.complianceStatus === "compliant"
                          ? "Compliant"
                          : worker.complianceStatus === "non_compliant"
                            ? "Non-Compliant"
                            : "Critical"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {worker.missingCertifications.length > 0 ? (
                        <div className="text-sm">
                          <p className="text-red-600 font-medium">{worker.missingCertifications.length} missing</p>
                          <p className="text-gray-600 text-xs">{worker.missingCertifications.slice(0, 2).join(", ")}</p>
                        </div>
                      ) : (
                        <p className="text-green-600 text-sm">All current</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">{worker.lastComplianceCheck}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Escalation Form Modal */}
        {showEscalationForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Send Escalation Notice</h2>

                <div className="space-y-4">
                  <div>
                    <p className="text-gray-700 font-medium mb-2">
                      Selected Workers: {selectedWorkers.length}
                    </p>
                    <div className="bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                      {selectedWorkers.map((id) => {
                        const worker = complianceData.find((w) => w.workerId === id);
                        return (
                          <p key={id} className="text-gray-700 text-sm">
                            • {worker?.workerName}
                          </p>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Escalation Level</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Level 1 - Reminder</option>
                      <option>Level 2 - Warning</option>
                      <option>Level 3 - Suspension</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                      placeholder="Add a custom message to include in the escalation notice..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => setShowEscalationForm(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSendEscalation}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      Send Escalation
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingComplianceReports;
