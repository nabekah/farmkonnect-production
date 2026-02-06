import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Eye, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
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
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  draft: <Clock className="w-4 h-4" />,
  submitted: <Clock className="w-4 h-4" />,
  approved: <CheckCircle className="w-4 h-4" />,
  rejected: <XCircle className="w-4 h-4" />,
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
export function ActivityHistoryClean() {
  const [selectedRecords, setSelectedRecords] = useState<number[]>([]);
  const [detailRecord, setDetailRecord] = useState<ActivityLog | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchTitle, setSearchTitle] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'type' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch activity logs
  const { data: activitiesData, isLoading } = trpc.fieldWorker.getActivityLogs.useQuery(
    { farmId: 1, limit: 100, offset: 0 },
    { enabled: true }
  );

  // Get activities from response
  const activities = useMemo(() => {
    if (!activitiesData) return [];
    return Array.isArray(activitiesData) ? activitiesData : (activitiesData?.logs || []);
  }, [activitiesData]);

  // Filter and sort activities
  const filteredActivities = useMemo(() => {
    let filtered = activities.filter((activity: any) => {
      const matchesType = !filterType || activity.activityType === filterType;
      const matchesStatus = !filterStatus || activity.status === filterStatus;
      const matchesTitle = !searchTitle || (activity.title && activity.title.toLowerCase().includes(searchTitle.toLowerCase()));
      return matchesType && matchesStatus && matchesTitle;
    });

    // Sort
    filtered.sort((a: any, b: any) => {
      let compareValue = 0;
      if (sortBy === 'date') {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        compareValue = dateA - dateB;
      } else if (sortBy === 'type') {
        compareValue = (a.activityType || '').localeCompare(b.activityType || '');
      } else if (sortBy === 'status') {
        compareValue = (a.status || '').localeCompare(b.status || '');
      }
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return filtered;
  }, [activities, filterType, filterStatus, searchTitle, sortBy, sortOrder]);

  // Handle bulk selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRecords(filteredActivities.map((a: any) => a.id));
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

  // Export to CSV
  const handleExportCSV = () => {
    const recordsToExport = selectedRecords.length > 0
      ? filteredActivities.filter((a: any) => selectedRecords.includes(a.id))
      : filteredActivities;

    const headers = ['ID', 'Activity Type', 'Title', 'Status', 'Created At', 'GPS Location', 'Photos'];
    const rows = recordsToExport.map((r: any) => [
      r.id,
      r.activityType,
      r.title,
      r.status,
      r.createdAt ? new Date(r.createdAt).toLocaleString() : '',
      r.gpsLatitude && r.gpsLongitude ? `${r.gpsLatitude.toFixed(4)}, ${r.gpsLongitude.toFixed(4)}` : 'N/A',
      r.photoUrls ? r.photoUrls.length : 0,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map((cell: any) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
            <p className="text-muted-foreground">Loading activity history...</p>
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Activity History</h1>
          <p className="text-muted-foreground">View and manage all logged field activities</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search Title</label>
                <Input
                  placeholder="Search by title..."
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Activity Type</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    {ACTIVITY_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="type">Type</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedRecords.length > 0 && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-blue-900">
                  {selectedRecords.length} record(s) selected
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportCSV}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export Selected
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

        {/* Results Summary */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Showing {filteredActivities.length} of {activities.length} activities
              {selectedRecords.length > 0 && ` (${selectedRecords.length} selected)`}
            </p>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="pt-6">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No activities found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedRecords.length === filteredActivities.length && filteredActivities.length > 0}
                          onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                        />
                      </TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>GPS</TableHead>
                      <TableHead>Photos</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredActivities.map((activity: any) => (
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
                        <TableCell className="text-sm">
                          {activity.gpsLatitude && activity.gpsLongitude
                            ? `${activity.gpsLatitude.toFixed(2)}, ${activity.gpsLongitude.toFixed(2)}`
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {activity.photoUrls ? activity.photoUrls.length : 0}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDetailRecord(activity)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
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

        {/* Detail Modal */}
        <Dialog open={!!detailRecord} onOpenChange={(open) => !open && setDetailRecord(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Activity Details</DialogTitle>
            </DialogHeader>
            {detailRecord && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Title</p>
                    <p className="text-foreground">{detailRecord.title}</p>
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
                    <p className="text-foreground">{detailRecord.description}</p>
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
                    <p className="text-sm font-medium text-muted-foreground mb-2">Photos ({detailRecord.photoUrls.length})</p>
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
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
