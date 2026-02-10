import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileText, Sheet, Mail } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface FinancialReportExporterProps {
  farmId: string;
  farmName: string;
  startDate: Date;
  endDate: Date;
}

export const FinancialReportExporter: React.FC<FinancialReportExporterProps> = ({
  farmId,
  farmName,
  startDate,
  endDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [reportName, setReportName] = useState(`${farmName} Financial Report - ${new Date().toLocaleDateString()}`);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch financial data
  const { data: summary } = trpc.financialManagement.getFinancialSummary.useQuery({
    farmId,
    startDate,
    endDate,
  });

  const { data: expenseBreakdown } = trpc.financialManagement.getExpenseBreakdown.useQuery({
    farmId,
    startDate,
    endDate,
  });

  const { data: revenueBreakdown } = trpc.financialManagement.getRevenueBreakdown.useQuery({
    farmId,
    startDate,
    endDate,
  });

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // Create a new window for printing
      const printWindow = window.open("", "", "width=800,height=600");
      if (!printWindow) {
        alert("Please allow popups to export PDF");
        return;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${reportName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
            .header h1 { margin: 0; color: #1f2937; }
            .header p { margin: 5px 0; color: #666; }
            .section { margin: 20px 0; page-break-inside: avoid; }
            .section h2 { color: #3b82f6; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
            .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 15px 0; }
            .kpi-card { border: 1px solid #e5e7eb; padding: 15px; border-radius: 5px; background: #f9fafb; }
            .kpi-label { font-size: 12px; color: #666; margin-bottom: 5px; }
            .kpi-value { font-size: 24px; font-weight: bold; color: #1f2937; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th { background: #f3f4f6; padding: 10px; text-align: left; font-weight: bold; border-bottom: 2px solid #e5e7eb; }
            td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
            tr:hover { background: #f9fafb; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #666; font-size: 12px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${reportName}</h1>
            <p>Farm: ${farmName}</p>
            <p>Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>

          ${includeSummary ? `
            <div class="section">
              <h2>Financial Summary</h2>
              <div class="kpi-grid">
                <div class="kpi-card">
                  <div class="kpi-label">Total Revenue</div>
                  <div class="kpi-value">GHS ${summary?.totalRevenue?.toLocaleString('en-US', { maximumFractionDigits: 2 }) || '0'}</div>
                </div>
                <div class="kpi-card">
                  <div class="kpi-label">Total Expenses</div>
                  <div class="kpi-value">GHS ${summary?.totalExpenses?.toLocaleString('en-US', { maximumFractionDigits: 2 }) || '0'}</div>
                </div>
                <div class="kpi-card">
                  <div class="kpi-label">Net Profit</div>
                  <div class="kpi-value" style="color: ${(summary?.profit || 0) >= 0 ? '#059669' : '#dc2626'}">
                    GHS ${summary?.profit?.toLocaleString('en-US', { maximumFractionDigits: 2 }) || '0'}
                  </div>
                </div>
                <div class="kpi-card">
                  <div class="kpi-label">Profit Margin</div>
                  <div class="kpi-value">${summary?.profitMargin?.toFixed(1) || '0'}%</div>
                </div>
              </div>
            </div>
          ` : ''}

          ${includeDetails ? `
            <div class="section">
              <h2>Expense Breakdown</h2>
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Amount (GHS)</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  ${expenseBreakdown?.map((item: any) => `
                    <tr>
                      <td>${item.name}</td>
                      <td>${item.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                      <td>${item.percentage}%</td>
                    </tr>
                  `).join('') || '<tr><td colspan="3">No data available</td></tr>'}
                </tbody>
              </table>
            </div>

            <div class="section">
              <h2>Revenue Breakdown</h2>
              <table>
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Amount (GHS)</th>
                  </tr>
                </thead>
                <tbody>
                  ${revenueBreakdown?.map((item: any) => `
                    <tr>
                      <td>${item.name}</td>
                      <td>${item.value.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                    </tr>
                  `).join('') || '<tr><td colspan="2">No data available</td></tr>'}
                </tbody>
              </table>
            </div>
          ` : ''}

          <div class="footer">
            <p>This is an automatically generated financial report from FarmKonnect Management System</p>
            <p>For more information, visit your dashboard</p>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Trigger print dialog
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      // Create CSV content
      const csvContent = [
        ["Financial Report", reportName],
        ["Farm", farmName],
        ["Period", `${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`],
        ["Generated", new Date().toLocaleString()],
        [],
        ["FINANCIAL SUMMARY"],
        ["Metric", "Amount (GHS)"],
        ["Total Revenue", summary?.totalRevenue || 0],
        ["Total Expenses", summary?.totalExpenses || 0],
        ["Net Profit", summary?.profit || 0],
        ["Profit Margin (%)", summary?.profitMargin || 0],
        [],
        ["EXPENSE BREAKDOWN"],
        ["Category", "Amount (GHS)", "Percentage (%)"],
        ...(expenseBreakdown?.map((item: any) => [item.name, item.value, item.percentage]) || []),
        [],
        ["REVENUE BREAKDOWN"],
        ["Source", "Amount (GHS)"],
        ...(revenueBreakdown?.map((item: any) => [item.name, item.value]) || []),
      ];

      const csvString = csvContent.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

      // Create blob and download
      const blob = new Blob([csvString], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportName}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting Excel:", error);
      alert("Failed to export Excel. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Financial Report</DialogTitle>
          <DialogDescription>
            Customize and export your financial report in PDF or Excel format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Report Name */}
          <div>
            <Label htmlFor="reportName">Report Name</Label>
            <Input
              id="reportName"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Enter report name"
            />
          </div>

          {/* Report Options */}
          <div className="space-y-3">
            <Label>Include in Report</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="summary"
                  checked={includeSummary}
                  onChange={(e) => setIncludeSummary(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="summary" className="text-sm cursor-pointer">
                  Financial Summary (KPIs)
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="details"
                  checked={includeDetails}
                  onChange={(e) => setIncludeDetails(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="details" className="text-sm cursor-pointer">
                  Detailed Breakdowns (Expenses & Revenue)
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="charts"
                  checked={includeCharts}
                  onChange={(e) => setIncludeCharts(e.target.checked)}
                  disabled
                  className="w-4 h-4 opacity-50"
                />
                <label htmlFor="charts" className="text-sm cursor-pointer opacity-50">
                  Charts (PDF only)
                </label>
              </div>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <Button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="gap-2"
              variant="default"
            >
              <FileText className="h-4 w-4" />
              PDF
            </Button>
            <Button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="gap-2"
              variant="outline"
            >
              <Sheet className="h-4 w-4" />
              Excel
            </Button>
          </div>

          {/* Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
            <p>💡 PDF exports can be printed directly. Excel exports can be edited and shared with accountants.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialReportExporter;
