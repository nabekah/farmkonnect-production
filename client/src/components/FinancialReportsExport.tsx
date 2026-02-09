import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, Download, Calendar } from "lucide-react";
import { toast } from "sonner";

interface FinancialReportsExportProps {
  farmId: string;
  farmName: string;
  startDate: Date;
  endDate: Date;
}

export const FinancialReportsExport: React.FC<FinancialReportsExportProps> = ({
  farmId,
  farmName,
  startDate,
  endDate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [reportType, setReportType] = useState<"summary" | "detailed">("summary");
  const [isExporting, setIsExporting] = useState(false);

  const { data: summary } = trpc.financialManagement.getFinancialSummary.useQuery(
    { farmId, startDate, endDate },
    { enabled: !!farmId }
  );

  const { data: expenses = [] } = trpc.financialManagement.getExpenses.useQuery(
    { farmId, startDate, endDate },
    { enabled: !!farmId }
  );

  const { data: revenue = [] } = trpc.financialManagement.getRevenue.useQuery(
    { farmId, startDate, endDate },
    { enabled: !!farmId }
  );

  const handleExport = async () => {
    try {
      setIsExporting(true);

      let csv = '';
      csv += `Financial Report - ${farmName}\n`;
      csv += `Date Range: ${startDate.toLocaleDateString('en-US')} to ${endDate.toLocaleDateString('en-US')}\n\n`;

      csv += 'SUMMARY\n';
      csv += 'Total Revenue,Total Expenses,Profit,Profit Margin %\n';
      csv += `${summary?.totalRevenue || 0},${summary?.totalExpenses || 0},${summary?.profit || 0},${summary?.profitMargin || 0}\n\n`;

      if (reportType === 'detailed') {
        csv += 'EXPENSES\n';
        csv += 'Date,Type,Description,Amount,Vendor\n';
        expenses.forEach((exp: any) => {
          csv += `${exp.expenseDate},"${exp.expenseType}","${exp.description}",${exp.amount},"${exp.vendor}"\n`;
        });

        csv += '\nREVENUE\n';
        csv += 'Date,Type,Description,Amount,Buyer\n';
        revenue.forEach((rev: any) => {
          csv += `${rev.revenueDate},"${rev.revenueType}","${rev.description}",${rev.amount},"${rev.buyer}"\n`;
        });
      }

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${farmName}_financial_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Report exported successfully!');
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to export report');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5" />
              Export Reports
            </CardTitle>
            <CardDescription>Download financial reports as CSV</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Financial Report</DialogTitle>
          <DialogDescription>
            Select report type and download as CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Farm</label>
            <p className="text-sm text-gray-600">{farmName}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range
            </label>
            <p className="text-sm text-gray-600">
              {startDate.toLocaleDateString('en-US')} to {endDate.toLocaleDateString('en-US')}
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="report-type" className="text-sm font-semibold">Report Type</label>
            <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
              <SelectTrigger id="report-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Summary Only</SelectItem>
                <SelectItem value="detailed">Detailed with Transactions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Preview</label>
            <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-1">
              <p><strong>Revenue:</strong> GHS {(summary?.totalRevenue || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
              <p><strong>Expenses:</strong> GHS {(summary?.totalExpenses || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
              <p><strong>Profit:</strong> GHS {(summary?.profit || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
              <p><strong>Margin:</strong> {(summary?.profitMargin || 0).toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-2">
                {expenses.length} expenses | {revenue.length} revenue records
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
