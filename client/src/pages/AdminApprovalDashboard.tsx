import React, { useState } from 'react';
import { trpc } from '../lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function AdminApprovalDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const { data: stats, isLoading: statsLoading } = trpc.userApproval.getApprovalStats.useQuery();
  const { data: pendingUsers, isLoading: pendingLoading, refetch: refetchPending } = trpc.userApproval.getPendingUsers.useQuery();
  const { data: approvedUsers, isLoading: approvedLoading } = trpc.userApproval.getApprovedUsers.useQuery();
  const { data: rejectedUsers, isLoading: rejectedLoading } = trpc.userApproval.getRejectedUsers.useQuery();

  // Mutations
  const approveUserMutation = trpc.userApproval.approveUser.useMutation();
  const rejectUserMutation = trpc.userApproval.rejectUser.useMutation();

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <h2 className="text-xl font-bold">Access Denied</h2>
          </div>
          <p className="text-gray-600">You don't have permission to access this page. Only admins can view user approvals.</p>
        </Card>
      </div>
    );
  }

  const handleApproveUser = async (userId: number) => {
    setIsSubmitting(true);
    try {
      await approveUserMutation.mutateAsync({ userId });
      await refetchPending();
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to approve user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectUser = async (userId: number) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setIsSubmitting(true);
    try {
      await rejectUserMutation.mutateAsync({
        userId,
        reason: rejectionReason,
      });
      await refetchPending();
      setSelectedUser(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Failed to reject user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderUserList = (users: any[], status: 'pending' | 'approved' | 'rejected') => {
    if (!users || users.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No {status} users</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {users.map((u) => (
          <Card key={u.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{u.name}</h3>
                <p className="text-sm text-gray-600">{u.email}</p>
                {u.phone && <p className="text-sm text-gray-600">{u.phone}</p>}
                <div className="flex gap-2 mt-2">
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {u.role}
                  </span>
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                    {u.loginMethod}
                  </span>
                </div>
                {u.accountStatusReason && (
                  <p className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">
                    <strong>Reason:</strong> {u.accountStatusReason}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApproveUser(u.id)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedUser(u.id)}
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>

            {selectedUser === u.id && status === 'pending' && (
              <div className="mt-4 p-4 bg-red-50 rounded border border-red-200">
                <label className="block text-sm font-semibold mb-2">Rejection Reason</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this user registration is being rejected..."
                  className="w-full p-2 border rounded mb-3 text-sm"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => handleRejectUser(u.id)}
                    disabled={isSubmitting || !rejectionReason.trim()}
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Rejection'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedUser(null);
                      setRejectionReason('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">User Approval Dashboard</h1>
          <p className="text-gray-600">Manage and approve new user registrations</p>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-6">
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
              <p className="text-gray-600">Total Users</p>
            </Card>
            <Card className="p-6 border-yellow-200 bg-yellow-50">
              <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-gray-600">Pending Approval</p>
            </Card>
            <Card className="p-6 border-green-200 bg-green-50">
              <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-gray-600">Approved</p>
            </Card>
            <Card className="p-6 border-red-200 bg-red-50">
              <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
              <p className="text-gray-600">Rejected</p>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeTab === 'pending'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Pending ({stats?.pending || 0})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeTab === 'approved'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Approved ({stats?.approved || 0})
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeTab === 'rejected'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Rejected ({stats?.rejected || 0})
          </button>
        </div>

        {/* Content */}
        <Card className="p-6">
          {activeTab === 'pending' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Pending Approvals</h2>
              {pendingLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : (
                renderUserList(pendingUsers, 'pending')
              )}
            </div>
          )}

          {activeTab === 'approved' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Approved Users</h2>
              {approvedLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                </div>
              ) : (
                renderUserList(approvedUsers, 'approved')
              )}
            </div>
          )}

          {activeTab === 'rejected' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Rejected Users</h2>
              {rejectedLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                </div>
              ) : (
                renderUserList(rejectedUsers, 'rejected')
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
