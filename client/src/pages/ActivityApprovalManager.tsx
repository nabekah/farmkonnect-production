import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Clock, Loader2, AlertCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const ACTIVITY_TYPES = [
  { value: 'crop_health', label: 'Crop Health Check' },
  { value: 'pest_monitoring', label: 'Pest Monitoring' },
  { value: 'disease_detection', label: 'Disease Detection' },
  { value: 'irrigation', label: 'Irrigation' },
  { value: 'fertilizer_application', label: 'Fertilizer Application' },
  { value: 'weed_control', label: 'Weed Control' },
  { value: 'harvest', label: 'Harvest' },
  { value: 'equipment_check', label: 'Equipment Check' },
  { value: 'soil_test', label: 'Soil Test' },
  { value: 'weather_observation', label: 'Weather Observation' },
  { value: 'general_note', label: 'General Note' },
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  submitted: 'bg-blue-100 text-blue-800',
  reviewed: 'bg-green-100 text-green-800',
};

interface ActivityLog {
  id: number;
  logId?: string;
  userId?: number;
  activityType: string;
  title: string;
  description?: string;
  status: string;
  createdAt?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  photoUrls?: string[];
  duration?: number;
}

export function ActivityApprovalManager() {
  const [selectedRecords, setSelectedRecords] = useState<number[]>([]);
  const [detailRecord, setDetailRecord] = useState<ActivityLog | null>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | null>(null);
  const [bulkReason, setBulkReason] = useState('');

  // Fetch pending activities
  const { data: activitiesData, isLoading, refetch } = trpc.fieldWorker.getActivityLogs.useQuery(
    { farmId: 1, limit: 100, offset: 0 },
    { enabled: true }
  );

  // Get activities from response
  const activities = useMemo(() => {
    if (!activitiesData) return [];
    if (Array.isArray(activitiesData)) return activitiesData;
    if (activitiesData && typeof activitiesData === 'object' && 'logs' in activitiesData) {
      const logs = (activitiesData as any).logs;
      return Array.isArray(logs) ? logs : [];
    }
    return [];
  }, [activitiesData]);

  // Filter to show only submitted/draft activities
  const pendingActivities = useMemo(() => {
    return activities.filter((a: ActivityLog) => a.status === 'submitted' || a.status === 'draft');
  }, [activities]);

  // Approval mutations
  const approveActivityMutation = trpc.activityApproval.approveActivity.useMutation({
    onSuccess: () => {
      refetch();
      setDetailRecord(null);
      setApprovalComment('');
    },
  });

  const rejectActivityMutation = trpc.activityApproval.rejectActivity.useMutation({
    onSuccess: () => {
      refetch();
      setDetailRecord(null);
      setRejectionReason('');
    },
  });

  const bulkApproveMutation = trpc.activityApproval.bulkApproveActivities.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedRecords([]);
      setBulkAction(null);
    },
  });

  const bulkRejectMutation = { isPending: false };
  const handleBulkReject = () => {};
  const handleBulkApprove = async () => {
    if (selectedRecords.length === 0) return;
    await bulkApproveMutation.mutateAsync({
      ids: selectedRecords,
    });
  };

  // Handle bulk selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRecords(pendingActivities.map((a: any) => a.id));
    } else {
      setSelectedRecords([]);
    }
  };

  const handleSelectRecord = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedRecords([...selectedRecords, id]);
    } else {
      setSelectedRecords(selectedRecords.filter(rid => rid !== id));
    }
  };

  const handleApprove = async () => {
    if (!detailRecord) return;
    await approveActivityMutation.mutateAsync({
      id: detailRecord.id,
      reviewNotes: approvalComment,
    });
  };

  const handleReject = async () => {
    if (!detailRecord) return;
    await rejectActivityMutation.mutateAsync({
      id: detailRecord.id,
      reviewNotes: rejectionReason,
    });
  };

  // Get activity type label
  const getActivityLabel = (type: string) => {
    return ACTIVITY_TYPES.find(t => t.value === type)?.label || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading pending activities...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Activity Approval Manager</h1>
          <p className="text-muted-foreground">Review and approve field worker activity records</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{pendingActivities.length}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">
                  {pendingActivities.filter((a: any) => a.status === 'draft').length}
                </p>
                <p className="text-sm text-muted-foreground">Draft</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {pendingActivities.filter((a: any) => a.status === 'submitted').length}
                </p>
                <p className="text-sm text-muted-foreground">Submitted</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {activities.filter((a: any) => a.status === 'reviewed').length}
                </p>
                <p className="text-sm text-muted-foreground">Reviewed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bulk Actions */}
        {selectedRecords.length > 0 && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <p className="text-sm font-medium text-blue-900">
                  {selectedRecords.length} record(s) selected
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleBulkApprove}
                    disabled={bulkApproveMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {bulkApproveMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Approve All
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setBulkAction('reject')}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject All (Coming Soon)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedRecords([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bulk Rejection Dialog */}
        <Dialog open={bulkAction === 'reject'} onOpenChange={(open) => !open && setBulkAction(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Selected Activities</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Reason for Rejection</label>
                <Textarea
                  placeholder="Explain why these activities are being rejected..."
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkAction(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkReject}
                disabled={!bulkReason.trim() || bulkRejectMutation.isPending}
              >
                {bulkRejectMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  'Reject All'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Activities Table */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Activities</CardTitle>
            <CardDescription>
              {pendingActivities.length === 0
                ? 'No activities pending review'
                : `${pendingActivities.length} activities awaiting approval`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingActivities.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">All activities have been reviewed!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedRecords.length === pendingActivities.length && pendingActivities.length > 0}
                          onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                        />
                      </TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingActivities.map((activity: any) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedRecords.includes(activity.id)}
                            onCheckedChange={(checked) => handleSelectRecord(activity.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{activity.title}</TableCell>
                        <TableCell>{getActivityLabel(activity.activityType)}</TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[activity.status] || 'bg-gray-100 text-gray-800'}>
                            {activity.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {activity.createdAt ? new Date(activity.createdAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDetailRecord(activity)}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Review Dialog */}
        <Dialog open={!!detailRecord} onOpenChange={(open) => !open && setDetailRecord(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Activity Record</DialogTitle>
            </DialogHeader>
            {detailRecord && (
              <div className="space-y-6">
                {/* Activity Details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Title</p>
                      <p className="text-foreground font-medium">{detailRecord.title}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Type</p>
                      <p className="text-foreground">{getActivityLabel(detailRecord.activityType)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <Badge className={STATUS_COLORS[detailRecord.status] || 'bg-gray-100 text-gray-800'}>
                        {detailRecord.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date</p>
                      <p className="text-foreground">
                        {detailRecord.createdAt ? new Date(detailRecord.createdAt).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {detailRecord.description && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Description</p>
                      <p className="text-foreground whitespace-pre-wrap">{detailRecord.description}</p>
                    </div>
                  )}

                  {detailRecord.gpsLatitude && detailRecord.gpsLongitude && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">GPS Location</p>
                      <p className="text-foreground">
                        {detailRecord.gpsLatitude.toFixed(4)}, {detailRecord.gpsLongitude.toFixed(4)}
                      </p>
                    </div>
                  )}

                  {detailRecord.photoUrls && detailRecord.photoUrls.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Photos ({detailRecord.photoUrls.length})
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {detailRecord.photoUrls.map((url: string, idx: number) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`Photo ${idx + 1}`}
                            className="w-full h-24 object-cover rounded border"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Approval/Rejection Section */}
                <div className="border-t pt-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Approval Comments (Optional)</label>
                    <Textarea
                      placeholder="Add any comments about this activity..."
                      value={approvalComment}
                      onChange={(e) => setApprovalComment(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Rejection Reason (if rejecting)</label>
                    <Textarea
                      placeholder="Explain why this activity is being rejected..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <DialogFooter className="flex gap-2">
                  <Button variant="outline" onClick={() => setDetailRecord(null)}>
                    Close
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={!rejectionReason.trim() || rejectActivityMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {rejectActivityMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    Reject
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={approveActivityMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {approveActivityMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Approve
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
