import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Clock, CheckCircle2, Download } from "lucide-react";

export default function SellerPayouts() {
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const { data: summary } = trpc.marketplace.getPayoutSummary.useQuery();
  const { data: payouts = [] } = trpc.marketplace.getSellerPayouts.useQuery({ status: filter });
  const { data: pendingData } = trpc.marketplace.calculatePendingPayouts.useQuery();

  const exportToCSV = () => {
    const headers = ["Date", "Order ID", "Amount", "Status", "Payment Method", "Reference"];
    const rows = payouts.map((p: any) => [
      new Date(p.createdAt).toLocaleDateString(),
      p.orderId,
      `GH₵${parseFloat(p.amount).toFixed(2)}`,
      p.status,
      p.paymentMethod || "N/A",
      p.transactionReference || "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(",")),
    ].join("\\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `seller-payouts-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const statusConfig = {
    pending: { label: "Pending", color: "bg-yellow-500", icon: Clock },
    processing: { label: "Processing", color: "bg-blue-500", icon: TrendingUp },
    completed: { label: "Completed", color: "bg-green-500", icon: CheckCircle2 },
    failed: { label: "Failed", color: "bg-red-500", icon: Clock },
  };

  return (
    <div className="container max-w-7xl py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Seller Payouts</h1>
        <Button onClick={exportToCSV} variant="outline" className="w-full sm:w-auto">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">GH₵{summary?.totalEarnings.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GH₵{summary?.pendingBalance.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingData?.deliveredOrders || 0} delivered orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GH₵{summary?.paidOut.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed payouts</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Payout History</h2>
        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payouts Table/Cards */}
      {payouts.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center text-muted-foreground">
              No payout records found
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium">Order ID</th>
                      <th className="p-4 font-medium">Amount</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Payment Method</th>
                      <th className="p-4 font-medium">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((payout: any) => {
                      const config = statusConfig[payout.status as keyof typeof statusConfig];
                      const Icon = config.icon;
                      return (
                        <tr key={payout.id} className="border-b hover:bg-accent/50">
                          <td className="p-4">
                            {new Date(payout.createdAt).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="p-4 font-mono text-sm">{payout.orderId}</td>
                          <td className="p-4 font-semibold">
                            GH₵{parseFloat(payout.amount).toFixed(2)}
                          </td>
                          <td className="p-4">
                            <Badge className={`${config.color} text-white`}>
                              <Icon className="h-3 w-3 mr-1" />
                              {config.label}
                            </Badge>
                          </td>
                          <td className="p-4 capitalize">{payout.paymentMethod || "N/A"}</td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {payout.transactionReference || "N/A"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {payouts.map((payout: any) => {
              const config = statusConfig[payout.status as keyof typeof statusConfig];
              const Icon = config.icon;
              return (
                <Card key={payout.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-muted-foreground">Order #{payout.orderId}</p>
                        <p className="text-lg font-bold">GH₵{parseFloat(payout.amount).toFixed(2)}</p>
                      </div>
                      <Badge className={`${config.color} text-white`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Date</p>
                        <p>{new Date(payout.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Payment Method</p>
                        <p className="capitalize">{payout.paymentMethod || "N/A"}</p>
                      </div>
                    </div>
                    {payout.transactionReference && (
                      <div>
                        <p className="text-xs text-muted-foreground">Reference</p>
                        <p className="text-xs font-mono">{payout.transactionReference}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
