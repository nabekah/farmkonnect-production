import React, { useState } from 'react';
import { trpc } from '../lib/trpc';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, Clock, FileCheck, Trash2 } from 'lucide-react';

interface VerificationRequest {
  id: string;
  veterinarianId: number;
  veterinarianName: string;
  veterinarianEmail: string;
  specialty: string;
  region: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  documents: Array<{
    id: string;
    type: string;
    url: string;
    verified: boolean;
  }>;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
}

export default function VeterinarianVerificationAdmin() {
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [rejectionReason, setRejectionReason] = useState('');
  const [additionalInfoMessage, setAdditionalInfoMessage] = useState('');

  // Fetch pending verification requests
  const { data: requestsData, isLoading: requestsLoading, refetch: refetchRequests } =
    trpc.veterinarianVerification.getPendingRequests.useQuery({
      limit: 50,
      offset: 0,
    });

  // Fetch verification statistics
  const { data: statsData } = trpc.veterinarianVerification.getStatistics.query();

  // Approve request mutation
  const approveRequestMutation = trpc.veterinarianVerification.approveRequest.useMutation({
    onSuccess: () => {
      refetchRequests();
      setSelectedRequest(null);
    },
  });

  // Reject request mutation
  const rejectRequestMutation = trpc.veterinarianVerification.rejectRequest.useMutation({
    onSuccess: () => {
      refetchRequests();
      setSelectedRequest(null);
      setRejectionReason('');
    },
  });

  // Verify document mutation
  const verifyDocumentMutation = trpc.veterinarianVerification.verifyDocument.useMutation({
    onSuccess: () => {
      refetchRequests();
    },
  });

  // Request additional info mutation
  const requestAdditionalInfoMutation =
    trpc.veterinarianVerification.requestAdditionalInfo.useMutation({
      onSuccess: () => {
        refetchRequests();
        setSelectedRequest(null);
        setAdditionalInfoMessage('');
      },
    });

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-4">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            You do not have permission to access this page. Admin access required.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleApprove = async () => {
    if (!selectedRequest) return;
    await approveRequestMutation.mutateAsync({
      requestId: selectedRequest.id,
      notes: 'Approved by admin',
    });
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason) return;
    await rejectRequestMutation.mutateAsync({
      requestId: selectedRequest.id,
      rejectionReason,
    });
  };

  const handleVerifyDocument = async (documentId: string, verified: boolean) => {
    if (!selectedRequest) return;
    await verifyDocumentMutation.mutateAsync({
      requestId: selectedRequest.id,
      documentId,
      verified,
      notes: verified ? 'Document verified' : 'Document rejected',
    });
  };

  const handleRequestAdditionalInfo = async () => {
    if (!selectedRequest || !additionalInfoMessage) return;
    await requestAdditionalInfoMutation.mutateAsync({
      requestId: selectedRequest.id,
      requiredDocuments: ['license', 'certificate'],
      message: additionalInfoMessage,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'under_review':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 border-green-200';
      case 'rejected':
        return 'bg-red-50 border-red-200';
      case 'under_review':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Veterinarian Verification Admin</h1>
          <p className="text-gray-600 mt-1">Review and approve veterinarian registrations</p>
        </div>

        {/* Statistics */}
        {statsData && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{statsData.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-900">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">{statsData.pending}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-yellow-900">Under Review</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-yellow-600">{statsData.underReview}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-900">Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{statsData.approved}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-900">Rejected</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">{statsData.rejected}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Requests List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Verification Requests</CardTitle>
                <CardDescription>{requestsData?.total || 0} total requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {requestsLoading ? (
                    <p className="text-gray-600">Loading requests...</p>
                  ) : requestsData?.requests && requestsData.requests.length > 0 ? (
                    requestsData.requests.map((request: VerificationRequest) => (
                      <button
                        key={request.id}
                        onClick={() => setSelectedRequest(request)}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                          selectedRequest?.id === request.id
                            ? 'bg-blue-100 border-blue-500'
                            : `${getStatusColor(request.status)} border-transparent hover:border-gray-300`
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {getStatusIcon(request.status)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{request.veterinarianName}</p>
                            <p className="text-xs text-gray-600">{request.specialty}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-gray-600 text-sm">No requests found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Request Details */}
          <div className="lg:col-span-2">
            {selectedRequest ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedRequest.veterinarianName}</CardTitle>
                      <CardDescription>{selectedRequest.specialty}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedRequest.status)}
                      <span className="text-sm font-medium capitalize">{selectedRequest.status}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Email</p>
                        <p className="font-medium">{selectedRequest.veterinarianEmail}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Region</p>
                        <p className="font-medium">{selectedRequest.region}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Submitted</p>
                        <p className="font-medium">
                          {new Date(selectedRequest.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      {selectedRequest.reviewedAt && (
                        <div>
                          <p className="text-gray-600">Reviewed</p>
                          <p className="font-medium">
                            {new Date(selectedRequest.reviewedAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">Documents</h3>
                    <div className="space-y-2">
                      {selectedRequest.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <FileCheck className="w-4 h-4 text-gray-600" />
                            <div>
                              <p className="text-sm font-medium capitalize">{doc.type}</p>
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline"
                              >
                                View Document
                              </a>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {doc.verified ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-yellow-600" />
                            )}
                            <button
                              onClick={() =>
                                handleVerifyDocument(doc.id, !doc.verified)
                              }
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              {doc.verified ? 'Unverify' : 'Verify'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  {selectedRequest.status === 'pending' || selectedRequest.status === 'under_review' ? (
                    <div className="space-y-3 pt-4 border-t">
                      <h3 className="font-semibold text-gray-900">Actions</h3>

                      {/* Request Additional Info */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-900">
                          Request Additional Information
                        </label>
                        <textarea
                          value={additionalInfoMessage}
                          onChange={(e) => setAdditionalInfoMessage(e.target.value)}
                          placeholder="Enter message to request additional documents..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={2}
                        />
                        <button
                          onClick={handleRequestAdditionalInfo}
                          disabled={!additionalInfoMessage || requestAdditionalInfoMutation.isPending}
                          className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 text-sm font-medium"
                        >
                          {requestAdditionalInfoMutation.isPending ? 'Sending...' : 'Request Info'}
                        </button>
                      </div>

                      {/* Rejection Reason */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-900">
                          Rejection Reason (if rejecting)
                        </label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Enter reason for rejection..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          rows={2}
                        />
                      </div>

                      {/* Approve/Reject Buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={handleApprove}
                          disabled={approveRequestMutation.isPending}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium"
                        >
                          {approveRequestMutation.isPending ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          onClick={handleReject}
                          disabled={!rejectionReason || rejectRequestMutation.isPending}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 text-sm font-medium"
                        >
                          {rejectRequestMutation.isPending ? 'Rejecting...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-600">
                        This request has been {selectedRequest.status}.
                        {selectedRequest.rejectionReason && (
                          <>
                            <br />
                            <strong>Reason:</strong> {selectedRequest.rejectionReason}
                          </>
                        )}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-600">Select a request to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
