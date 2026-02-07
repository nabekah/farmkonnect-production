/**
 * Advanced Activity Search and Filtering Utility
 * Provides comprehensive search, filtering, and sorting capabilities for activities
 */

export interface ActivitySearchFilters {
  searchQuery?: string;
  activityType?: string[];
  status?: string[];
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  farmId?: number;
  fieldId?: number;
  userId?: number;
  hasGPS?: boolean;
  hasPhotos?: boolean;
}

export interface Activity {
  id: string;
  logId: string;
  title: string;
  description?: string;
  activityType: string;
  status: string;
  gpsLatitude?: number | null;
  gpsLongitude?: number | null;
  photoUrls?: string[];
  createdAt: string;
  farmId: number;
  fieldId?: number;
  userId: number;
}

export interface SearchResult {
  activities: Activity[];
  total: number;
  filtered: number;
  appliedFilters: ActivitySearchFilters;
}

/**
 * Search and filter activities based on multiple criteria
 */
export function searchActivities(
  activities: Activity[],
  filters: ActivitySearchFilters
): SearchResult {
  let filtered = [...activities];

  // Text search across title, description, and observations
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter((activity) => {
      const searchableText = [
        activity.title,
        activity.description || '',
      ]
        .join(' ')
        .toLowerCase();
      return searchableText.includes(query);
    });
  }

  // Filter by activity type
  if (filters.activityType && filters.activityType.length > 0) {
    filtered = filtered.filter((activity) =>
      filters.activityType!.includes(activity.activityType)
    );
  }

  // Filter by status
  if (filters.status && filters.status.length > 0) {
    filtered = filtered.filter((activity) =>
      filters.status!.includes(activity.status)
    );
  }

  // Filter by date range
  if (filters.dateRange) {
    const { startDate, endDate } = filters.dateRange;
    filtered = filtered.filter((activity) => {
      const activityDate = new Date(activity.createdAt);
      return activityDate >= startDate && activityDate <= endDate;
    });
  }

  // Filter by farm
  if (filters.farmId) {
    filtered = filtered.filter((activity) => activity.farmId === filters.farmId);
  }

  // Filter by field
  if (filters.fieldId) {
    filtered = filtered.filter((activity) => activity.fieldId === filters.fieldId);
  }

  // Filter by user
  if (filters.userId) {
    filtered = filtered.filter((activity) => activity.userId === filters.userId);
  }

  // Filter by GPS presence
  if (filters.hasGPS !== undefined) {
    filtered = filtered.filter((activity) => {
      const hasGPS = activity.gpsLatitude !== null && activity.gpsLongitude !== null;
      return hasGPS === filters.hasGPS;
    });
  }

  // Filter by photos presence
  if (filters.hasPhotos !== undefined) {
    filtered = filtered.filter((activity) => {
      const hasPhotos = activity.photoUrls && activity.photoUrls.length > 0;
      return hasPhotos === filters.hasPhotos;
    });
  }

  return {
    activities: filtered,
    total: activities.length,
    filtered: filtered.length,
    appliedFilters: filters,
  };
}

/**
 * Sort activities by specified field
 */
export function sortActivities(
  activities: Activity[],
  sortBy: 'date' | 'type' | 'status' | 'title' = 'date',
  ascending: boolean = false
): Activity[] {
  const sorted = [...activities];

  switch (sortBy) {
    case 'date':
      sorted.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return ascending ? dateA - dateB : dateB - dateA;
      });
      break;
    case 'type':
      sorted.sort((a, b) => {
        return ascending
          ? a.activityType.localeCompare(b.activityType)
          : b.activityType.localeCompare(a.activityType);
      });
      break;
    case 'status':
      sorted.sort((a, b) => {
        return ascending
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      });
      break;
    case 'title':
      sorted.sort((a, b) => {
        return ascending
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      });
      break;
  }

  return sorted;
}

/**
 * Get activity statistics for dashboard
 */
export function getActivityStats(activities: Activity[]) {
  return {
    total: activities.length,
    byType: activities.reduce(
      (acc, activity) => {
        acc[activity.activityType] = (acc[activity.activityType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    byStatus: activities.reduce(
      (acc, activity) => {
        acc[activity.status] = (acc[activity.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    withGPS: activities.filter(
      (a) => a.gpsLatitude !== null && a.gpsLongitude !== null
    ).length,
    withPhotos: activities.filter((a) => a.photoUrls && a.photoUrls.length > 0)
      .length,
  };
}
