import React, { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, Camera, ChevronLeft, Search, Calendar, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useWebSocket } from '@/hooks/useWebSocket';

interface Activity {
  id: string;
  logId: string;
  title: string;
  description: string;
  activityType: string;
  gpsLatitude?: number | null;
  gpsLongitude?: number | null;
  photoUrls?: string[];
  createdAt: string;
  fieldId?: number;
  status?: string;
}

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

export function ViewAllActivities() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'photos'>('date');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Get farm ID from user - default to 1 for now
  const farmId = 1;

  // Fetch real activities from database
  const { data: activitiesData, isLoading, refetch } = trpc.fieldWorker.getActivityLogs.useQuery(
    { farmId, limit: 100 },
    { enabled: !!farmId }
  );

  // Set up WebSocket listeners for real-time updates
  useWebSocket({
    onActivityCreated: () => refetch(),
    onActivityUpdated: () => refetch(),
  });

  // Update activities when data changes
  useEffect(() => {
    if (activitiesData?.logs) {
      const mappedActivities: Activity[] = activitiesData.logs.map((log: any) => ({
        id: log.id?.toString() || log.logId,
        logId: log.logId,
        title: log.title,
        description: log.description || '',
        activityType: log.activityType,
        gpsLatitude: log.gpsLatitude,
        gpsLongitude: log.gpsLongitude,
        photoUrls: log.photoUrls || [],
        createdAt: log.createdAt,
        status: log.status,
      }));
      setActivities(mappedActivities);
    }
  }, [activitiesData]);

  // Filter and sort activities
  useEffect(() => {
    let filtered = activities;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((activity) => activity.activityType === filterType);
    }

    // Filter by date range
    const now = new Date();
    if (dateRange === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filtered = filtered.filter((activity) => new Date(activity.createdAt) >= today);
    } else if (dateRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((activity) => new Date(activity.createdAt) >= weekAgo);
    } else if (dateRange === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((activity) => new Date(activity.createdAt) >= monthAgo);
    }

    // Search
    if (searchQuery) {
      filtered = filtered.filter(
        (activity) =>
          activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          activity.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'photos') {
      const photoCount = (photos: string[] | undefined) => photos?.length || 0;
      filtered.sort((a, b) => photoCount(b.photoUrls) - photoCount(a.photoUrls));
    }

    setFilteredActivities(filtered);
  }, [activities, filterType, searchQuery, sortBy, dateRange]);

  const getActivityColor = (type: string) => {
    const colors: Record<string, string> = {
      crop_health: 'bg-green-100 text-green-800',
      pest_monitoring: 'bg-red-100 text-red-800',
      disease_detection: 'bg-orange-100 text-orange-800',
      irrigation: 'bg-blue-100 text-blue-800',
      fertilizer_application: 'bg-yellow-100 text-yellow-800',
      weed_control: 'bg-purple-100 text-purple-800',
      harvest: 'bg-amber-100 text-amber-800',
      equipment_check: 'bg-gray-100 text-gray-800',
      soil_test: 'bg-brown-100 text-brown-800',
      weather_observation: 'bg-cyan-100 text-cyan-800',
      general_note: 'bg-slate-100 text-slate-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getActivityLabel = (type: string) => {
    return ACTIVITY_TYPES.find((t) => t.value === type)?.label || type;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/field-worker/dashboard')}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-foreground">All Activities</h1>
            <p className="text-muted-foreground">View and manage your logged field activities</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Activities</p>
            <p className="text-3xl font-bold">{filteredActivities.length}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search Activities</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Activity Type</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {ACTIVITY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Date Range</label>
                <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Recent First</SelectItem>
                    <SelectItem value="photos">Most Photos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-2 text-muted-foreground">Loading activities...</p>
          </div>
        )}

        {/* Activities List */}
        {!isLoading && filteredActivities.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No activities found. Start logging activities to see them here!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredActivities.map((activity) => (
              <Card key={activity.logId} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-2">
                        <Badge className={getActivityColor(activity.activityType)}>
                          {getActivityLabel(activity.activityType)}
                        </Badge>
                        {activity.status && (
                          <Badge variant="outline" className="capitalize">
                            {activity.status}
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">{activity.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{activity.description}</p>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {formatDate(activity.createdAt)} at {formatTime(activity.createdAt)}
                          </span>
                        </div>
                        {activity.gpsLatitude && activity.gpsLongitude && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>
                              {activity.gpsLatitude.toFixed(4)}, {activity.gpsLongitude.toFixed(4)}
                            </span>
                          </div>
                        )}
                        {activity.photoUrls && activity.photoUrls.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Camera className="h-4 w-4" />
                            <span>{activity.photoUrls.length} photo(s)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
