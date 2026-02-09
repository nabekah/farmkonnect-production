import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";

export const UserApprovalDashboard: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [suspensionReason, setSuspensionReason] = useState("");

  const { data: pendingRequests = [], refetch } = trpc.userApproval.getPendingRequests.useQuery();

  const approveMutation = trpc.userApproval.approveUser.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedUser(null);
    }
  });

  const rejectMutation = trpc.userApproval.rejectUser.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedUser(null);
      setRejectionReason("");
    }
  });

  const suspendMutation = trpc.userApproval.suspendUser.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedUser(null);
      setSuspensionReason("");
    }
  });

  const handleApprove = async (userId: string) => {
    try {
      await approveMutation.mutateAsync({ userId });
    } catch (error) {
      console.error("Error approving user:", error);
    }
  };

  const handleReject = async (userId: string) => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    try {
      await rejectMutation.mutateAsync({ userId, reason: rejectionReason });
    } catch (error) {
      console.error("Error rejecting user:", error);
    }
  };

  const handleSuspend = async (userId: string) => {
    if (!suspensionReason.trim()) {
      alert("Please provide a suspension reason");
      return;
    }
    try {
      await suspendMutation.mutateAsync({ userId, reason: suspensionReason });
    } catch (error) {
      console.error("Error suspending user:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      case "suspended":
        return <Badge className="bg-orange-100 text-orange-800"><AlertCircle className="h-3 w-3 mr-1" /> Suspended</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Approval Requests</CardTitle>
          <CardDescription>Review and approve new user registrations</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending approval requests
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request: any) => (
                <div
                  key={request.userId}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedUser(request.userId)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{request.fullName}</h3>
                      <p className="text-sm text-gray-600">{request.email}</p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                  <p className="text-xs text-gray-500">
                    Requested: {new Date(request.requestedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Actions */}
      {selectedUser && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Approval Actions</CardTitle>
            <CardDescription>
              {pendingRequests.find((r: any) => r.userId === selectedUser)?.fullName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rejection Reason (if rejecting):</label>
              <Input
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Suspension Reason (if suspending):</label>
              <Input
                placeholder="Enter reason for suspension..."
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleApprove(selectedUser)}
                disabled={approveMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleReject(selectedUser)}
                disabled={rejectMutation.isPending || !rejectionReason.trim()}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSuspend(selectedUser)}
                disabled={suspendMutation.isPending || !suspensionReason.trim()}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Suspend
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedUser(null);
                  setRejectionReason("");
                  setSuspensionReason("");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
