import { useState, useEffect } from 'react';

// Storage key for preferences
const STORAGE_KEY = 'dashboardPreferences';

export interface DashboardPreferences {
  selectedFarmId: number | null;
  visibleKPIs: {
    revenue: boolean;
    expenses: boolean;
    profit: boolean;
    animals: boolean;
    workers: boolean;
    ponds: boolean;
    assets: boolean;
  };
  defaultFarmId?: number | null;
  refreshInterval?: number; // in milliseconds
  isPollingEnabled?: boolean;
}

const DEFAULT_PREFERENCES: DashboardPreferences = {
  selectedFarmId: null,
  visibleKPIs: {
    revenue: true,
    expenses: true,
    profit: true,
    animals: true,
    workers: true,
    ponds: true,
    assets: true,
  },
  refreshInterval: 30000, // 30 seconds
  isPollingEnabled: true,
};

export const useDashboardPreferences = () => {
  const [preferences, setPreferences] = useState<DashboardPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all properties exist
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (error) {
      console.error('Failed to parse dashboard preferences:', error);
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save preferences to localStorage whenever they change
  const updatePreferences = (newPreferences: Partial<DashboardPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save dashboard preferences:', error);
    }
  };

  // Update selected farm
  const setSelectedFarmId = (farmId: number | null) => {
    updatePreferences({ selectedFarmId: farmId });
  };

  // Update KPI visibility
  const setKPIVisibility = (kpi: keyof DashboardPreferences['visibleKPIs'], visible: boolean) => {
    updatePreferences({
      visibleKPIs: {
        ...preferences.visibleKPIs,
        [kpi]: visible,
      },
    });
  };

  // Set default farm
  const setDefaultFarmId = (farmId: number | null) => {
    updatePreferences({ defaultFarmId: farmId });
  };

  // Update refresh interval
  const setRefreshInterval = (interval: number) => {
    updatePreferences({ refreshInterval: interval });
  };

  // Toggle polling
  const togglePolling = () => {
    updatePreferences({ isPollingEnabled: !preferences.isPollingEnabled });
  };

  // Reset to defaults
  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear dashboard preferences:', error);
    }
  };

  return {
    preferences,
    isLoaded,
    updatePreferences,
    setSelectedFarmId,
    setKPIVisibility,
    setDefaultFarmId,
    setRefreshInterval,
    togglePolling,
    resetPreferences,
  };
};
