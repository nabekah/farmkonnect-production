import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, Filter } from 'lucide-react';
import { ActivitySearchFilters } from '@/lib/activitySearch';

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

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'reviewed', label: 'Reviewed' },
];

interface ActivitySearchFilterProps {
  onFiltersChange: (filters: ActivitySearchFilters) => void;
  isLoading?: boolean;
}

export function ActivitySearchFilter({
  onFiltersChange,
  isLoading = false,
}: ActivitySearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearch = () => {
    const filters: ActivitySearchFilters = {
      searchQuery: searchQuery || undefined,
      activityType: selectedTypes.length > 0 ? selectedTypes : undefined,
      status: selectedStatus.length > 0 ? selectedStatus : undefined,
      dateRange:
        startDate && endDate
          ? {
              startDate: new Date(startDate),
              endDate: new Date(endDate),
            }
          : undefined,
    };
    onFiltersChange(filters);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedTypes([]);
    setSelectedStatus([]);
    setStartDate('');
    setEndDate('');
    onFiltersChange({});
  };

  const toggleActivityType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleStatus = (status: string) => {
    setSelectedStatus((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const hasActiveFilters =
    searchQuery ||
    selectedTypes.length > 0 ||
    selectedStatus.length > 0 ||
    startDate ||
    endDate;

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activities by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        <Button onClick={handleSearch} disabled={isLoading}>
          Search
        </Button>
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={handleClearFilters}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Advanced Filters Toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full"
      >
        <Filter className="h-4 w-4 mr-2" />
        {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
      </Button>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="space-y-4 pt-4 border-t">
          {/* Activity Type Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Activity Type
            </label>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_TYPES.map((type) => (
                <Badge
                  key={type.value}
                  variant={
                    selectedTypes.includes(type.value) ? 'default' : 'outline'
                  }
                  className="cursor-pointer"
                  onClick={() => toggleActivityType(type.value)}
                >
                  {type.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map((status) => (
                <Badge
                  key={status.value}
                  variant={
                    selectedStatus.includes(status.value) ? 'default' : 'outline'
                  }
                  className="cursor-pointer"
                  onClick={() => toggleStatus(status.value)}
                >
                  {status.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {searchQuery && (
            <Badge variant="secondary">
              Search: {searchQuery}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => setSearchQuery('')}
              />
            </Badge>
          )}
          {selectedTypes.map((type) => (
            <Badge key={type} variant="secondary">
              {ACTIVITY_TYPES.find((t) => t.value === type)?.label}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => toggleActivityType(type)}
              />
            </Badge>
          ))}
          {selectedStatus.map((status) => (
            <Badge key={status} variant="secondary">
              {STATUS_OPTIONS.find((s) => s.value === status)?.label}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => toggleStatus(status)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
