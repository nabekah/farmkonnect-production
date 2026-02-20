import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle, XCircle, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const UserApprovalDashboard: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [rejectionReason, setRejectionReason] = useState("");
  const [suspensionReason, setSuspensionReason] = useState("");

  const { data: pendingRequests = [], refetch, isLoading } = trpc.userApproval.getPendingRequests.useQuery();

  const approveMutation = trpc.userApproval.approveUser.useMutation({
    onSuccess: () => {
      toast.success("User approved successfully");
      refetch();
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to approve user");
    }
  });

  const rejectMutation = trpc.userApproval.rejectUser.useMutation({
    onSuccess: () => {
      toast.success("User rejected successfully");
      refetch();
      setSelectedUser(null);
      setRejectionReason("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reject user");
    }
  });

  const suspendMutation = trpc.userApproval.suspendUser.useMutation({
    onSuccess: () => {
      toast.success("User suspended successfully");
      refetch();
      setSelectedUser(null);
      setSuspensionReason("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to suspend user");
    }
  });

  const bulkApproveMutation = trpc.userApproval.bulkApproveUsers.useMutation({
    onSuccess: (result) => {
      toast.success(result.message);
      refetch();
      setSelectedUsers(new Set());
    },
    onError: (error) => {
      toast.error(error.message || "Failed to bulk approve users");
    }
  });

  const bulkRejectMutation = trpc.userApproval.bulkRejectUsers.useMutation({
    onSuccess: (result) => {
      toast.success(result.message);
      refetch();
      setSelectedUsers(new Set());
      setRejectionReason("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to bulk reject users");
    }
  });

  const bulkSuspendMutation = trpc.userApproval.bulkSuspendUsers.useMutation({
    onSuccess: (result) => {
      toast.success(result.message);
      refetch();
      setSelectedUsers(new Set());
      setSuspensionReason("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to bulk suspend users");
    }
  });

  const handleApprove = async (userId: number) => {
    try {
      await approveMutation.mutateAsync({ userId });
    } catch (error) {
      console.error("Error approving user:", error);
    }
  };

  const handleReject = async (userId: number) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    try {
      await rejectMutation.mutateAsync({ userId, reason: rejectionReason });
    } catch (error) {
      console.error("Error rejecting user:", error);
    }
  };

  const handleSuspend = async (userId: number) => {
    if (!suspensionReason.trim()) {
      toast.error("Please provide a suspension reason");
      return;
    }
    try {
      await suspendMutation.mutateAsync({ userId, reason: suspensionReason });
    } catch (error) {
      console.error("Error suspending user:", error);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedUsers.size === 0) {
      toast.error("Please select users to approve");
      return;
    }
    try {
      await bulkApproveMutation.mutateAsync({
        userIds: Array.from(selectedUsers)
      });
    } catch (error) {
      console.error("Error bulk approving users:", error);
    }
  };

  const handleBulkReject = async () => {
    if (selectedUsers.size === 0) {
      toast.error("Please select users to reject");
      return;
    }
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    try {
      await bulkRejectMutation.mutateAsync({
        userIds: Array.from(selectedUsers),
        reason: rejectionReason
      });
    } catch (error) {
      console.error("Error bulk rejecting users:", error);
    }
  };

  const handleBulkSuspend = async () => {
    if (selectedUsers.size === 0) {
      toast.error("Please select users to suspend");
      return;
    }
    if (!suspensionReason.trim()) {
      toast.error("Please provide a suspension reason");
      return;
    }
    try {
      await bulkSuspendMutation.mutateAsync({
        userIds: Array.from(selectedUsers),
        reason: suspensionReason
      });
    } catch (error) {
      console.error("Error bulk suspending users:", error);
    }
  };

  const toggleUserSelection = (userId: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const toggleAllSelection = () => {
    if (selectedUsers.size === pendingRequests.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(pendingRequests.map((r: any) => r.id)));
    }
  };

  const getStatusBadge = (status: string, emailVerified: boolean) => {
    if (!emailVerified) {
      return <Badge className="bg-orange-100 text-orange-800">Email Unverified</Badge>;
    }
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const selectedUserData = pendingRequests.find((r: any) => r.id === selectedUser);

  return (
    <div className="space-y-6">
      {/* Bulk Actions Bar */}
      {selectedUsers.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium">
                {selectedUsers.size} user{selectedUsers.size !== 1 ? "s" : ""} selected
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUsers(new Set())}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Selection
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleBulkApprove}
                disabled={bulkApproveMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {bulkApproveMutation.isPending ? "Approving..." : "Bulk Approve"}
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkReject}
                disabled={bulkRejectMutation.isPending || !rejectionReason.trim()}
              >
                <XCircle className="h-4 w-4 mr-2" />
                {bulkRejectMutation.isPending ? "Rejecting..." : "Bulk Reject"}
              </Button>
              <Button
                variant="outline"
                onClick={handleBulkSuspend}
                disabled={bulkSuspendMutation.isPending || !suspensionReason.trim()}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                {bulkSuspendMutation.isPending ? "Suspending..." : "Bulk Suspend"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Approval Requests</CardTitle>
              <CardDescription>Review and approve new user registrations ({pendingRequests.length} pending)</CardDescription>
            </div>
            {pendingRequests.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedUsers.size === pendingRequests.length && pendingRequests.length > 0}
                  onCheckedChange={toggleAllSelection}
                  title="Select all"
                />
                <span className="text-sm text-gray-600">Select All</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              Loading approval requests...
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending approval requests
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request: any) => (
                <div
                  key={request.id}
                  className={`border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition flex items-center gap-3 ${
                    selectedUser === request.id ? "border-blue-500 bg-blue-50" : ""
                  }`}
                  onClick={() => setSelectedUser(request.id)}
                >
                  <Checkbox
                    checked={selectedUsers.has(request.id)}
                    onCheckedChange={() => toggleUserSelection(request.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{request.name}</h3>
                        <p className="text-sm text-gray-600">{request.email}</p>
                        {request.phone && <p className="text-xs text-gray-500">{request.phone}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{request.role}</Badge>
                        {getStatusBadge(request.approvalStatus, request.emailVerified)}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Registered: {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Actions */}
      {selectedUser && selectedUserData && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Approval Actions</CardTitle>
            <CardDescription>
              {selectedUserData.name} ({selectedUserData.email})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-white rounded border">
              <div>
                <p className="text-xs text-gray-600">Role</p>
                <p className="font-semibold">{selectedUserData.role}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Login Method</p>
                <p className="font-semibold">{selectedUserData.loginMethod}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Status</p>
                <p className="font-semibold">{selectedUserData.approvalStatus}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Email Verified</p>
                <p className="font-semibold">{selectedUserData.emailVerified ? "Yes" : "No"}</p>
              </div>
            </div>

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
                {approveMutation.isPending ? "Approving..." : "Approve"}
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleReject(selectedUser)}
                disabled={rejectMutation.isPending || !rejectionReason.trim()}
              >
                <XCircle className="h-4 w-4 mr-2" />
                {rejectMutation.isPending ? "Rejecting..." : "Reject"}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSuspend(selectedUser)}
                disabled={suspendMutation.isPending || !suspensionReason.trim()}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                {suspendMutation.isPending ? "Suspending..." : "Suspend"}
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
