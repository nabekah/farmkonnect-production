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
import { Download, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ActivitySearchFilter } from '@/components/ActivitySearchFilter';
import { searchActivities, sortActivities, ActivitySearchFilters } from '@/lib/activitySearch';
import { useState, useMemo } from 'react';

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

const STATUS_ICONS: Record<string, React.ReactNode> = {
  draft: <Clock className="w-4 h-4" />,
  submitted: <CheckCircle className="w-4 h-4" />,
  reviewed: <CheckCircle className="w-4 h-4" />,
};

export function ActivityHistory() {
  const [selectedRecords, setSelectedRecords] = useState<number[]>([]);
  const [detailRecord, setDetailRecord] = useState<any>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchTitle, setSearchTitle] = useState('');
  const [searchFilters, setSearchFilters] = useState<ActivitySearchFilters>({});
  const [sortBy, setSortBy] = useState<'date' | 'type' | 'status' | 'title'>('date');
  const [sortAscending, setSortAscending] = useState(false);

  const { data: activities, isLoading } = trpc.fieldWorker.getActivityLogs.useQuery({ farmId: 1 });

  const filteredActivities = useMemo(() => {
    if (!activities) return [];

    const activitiesList = Array.isArray(activities) ? activities : (activities?.logs || []) as any[];
    return activitiesList.filter((activity: any) => {
      const matchesType = !filterType || activity.activityType === filterType;
      const matchesStatus = !filterStatus || activity.status === filterStatus;
      const matchesTitle = !searchTitle || activity.title.toLowerCase().includes(searchTitle.toLowerCase());
      return matchesType && matchesStatus && matchesTitle;
    });
  }, [activities, filterType, filterStatus, searchTitle]);

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

  const handleExportCSV = () => {
    const recordsToExport = selectedRecords.length > 0 
      ? filteredActivities.filter((a: any) => selectedRecords.includes(a.id))
      : filteredActivities;

    const headers = ['ID', 'Log ID', 'User ID', 'Activity Type', 'Title', 'Status', 'Created At'];
    const rows = recordsToExport.map((r: any) => [
      r.id,
      r.logId,
      r.userId,
      r.activityType,
      r.title,
      r.status,
      new Date(r.createdAt).toLocaleString(),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Activity History</h1>
        <p className="text-gray-600 mt-2">View and manage all field worker activity logs</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search by title..."
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
            />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Activity Type" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => { setFilterType(''); setFilterStatus(''); setSearchTitle(''); }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedRecords.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{selectedRecords.length} records selected</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleExportCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Selected
                </Button>
                <Button size="sm" variant="destructive">
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Records</CardTitle>
          <CardDescription>Total: {filteredActivities.length} records</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading activity records...</div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No activity records found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedRecords.length === filteredActivities.length && filteredActivities.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Log ID</TableHead>
                    <TableHead>Activity Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
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
                      <TableCell className="font-mono text-sm">{activity.logId}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {ACTIVITY_TYPES.find(t => t.value === activity.activityType)?.label || activity.activityType}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{activity.title}</TableCell>
                      <TableCell>{activity.userId}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[activity.status] || ''}>
                          <span className="mr-1">{STATUS_ICONS[activity.status]}</span>
                          {activity.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(activity.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDetailRecord(activity)}
                        >
                          <Eye className="w-4 h-4" />
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
      {detailRecord && (
        <Dialog open={!!detailRecord} onOpenChange={() => setDetailRecord(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{detailRecord.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Log ID</label>
                  <p className="font-mono">{detailRecord.logId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Activity Type</label>
                  <p>{ACTIVITY_TYPES.find(t => t.value === detailRecord.activityType)?.label}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">User ID</label>
                  <p>{detailRecord.userId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <Badge className={STATUS_COLORS[detailRecord.status] || ''}>
                    {detailRecord.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Farm ID</label>
                  <p>{detailRecord.farmId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Field ID</label>
                  <p>{detailRecord.fieldId || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="text-sm">{detailRecord.description || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Observations</label>
                <p className="text-sm">{detailRecord.observations || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Duration</label>
                  <p>{detailRecord.duration ? `${detailRecord.duration} minutes` : 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Created</label>
                  <p>{new Date(detailRecord.createdAt).toLocaleString()}</p>
                </div>
              </div>
              {detailRecord.gpsLatitude && detailRecord.gpsLongitude && (
                <div>
                  <label className="text-sm font-medium text-gray-600">GPS Location</label>
                  <p className="text-sm">Lat: {detailRecord.gpsLatitude}, Long: {detailRecord.gpsLongitude}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
