import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react-native'
import { useOfflineSync } from '../lib/offlineSync'

/**
 * Mobile Offline Sync Indicator Component
 * Displays connection status and pending sync items
 */

interface SyncItem {
  id: string
  type: 'task' | 'shift' | 'worker' | 'notification'
  title: string
  status: 'pending' | 'syncing' | 'synced' | 'error'
  timestamp: Date
}

export const OfflineSyncIndicator: React.FC = () => {
  const {
    isOnline,
    pendingItems,
    syncStatus,
    isSyncing,
    syncError,
    manualSync,
  } = useOfflineSync()

  const [showDetails, setShowDetails] = useState(false)
  const [syncItems, setSyncItems] = useState<SyncItem[]>([])
  const slideAnim = React.useRef(new Animated.Value(0)).current

  /**
   * Load pending items
   */
  useEffect(() => {
    loadPendingItems()
  }, [pendingItems])

  /**
   * Animate details panel
   */
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showDetails ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start()
  }, [showDetails])

  /**
   * Load pending sync items
   */
  const loadPendingItems = async () => {
    try {
      // Get pending items from cache
      const items: SyncItem[] = []

      // Get pending tasks
      const tasks = await getPendingTasks()
      items.push(
        ...tasks.map((t) => ({
          id: `task-${t.id}`,
          type: 'task' as const,
          title: t.title,
          status: 'pending' as const,
          timestamp: new Date(t.timestamp),
        }))
      )

      // Get pending shifts
      const shifts = await getPendingShifts()
      items.push(
        ...shifts.map((s) => ({
          id: `shift-${s.id}`,
          type: 'shift' as const,
          title: s.title,
          status: 'pending' as const,
          timestamp: new Date(s.timestamp),
        }))
      )

      // Get pending workers
      const workers = await getPendingWorkers()
      items.push(
        ...workers.map((w) => ({
          id: `worker-${w.id}`,
          type: 'worker' as const,
          title: w.name,
          status: 'pending' as const,
          timestamp: new Date(w.timestamp),
        }))
      )

      setSyncItems(items)
    } catch (error) {
      console.error('[OfflineSyncIndicator] Error loading pending items:', error)
    }
  }

  /**
   * Handle manual sync
   */
  const handleManualSync = async () => {
    try {
      await manualSync()
      // Reload pending items after sync
      await loadPendingItems()
    } catch (error) {
      console.error('[OfflineSyncIndicator] Error during manual sync:', error)
    }
  }

  /**
   * Get status color
   */
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'synced':
        return '#10b981' // green
      case 'syncing':
        return '#3b82f6' // blue
      case 'error':
        return '#ef4444' // red
      case 'pending':
        return '#f59e0b' // amber
      default:
        return '#6b7280' // gray
    }
  }

  /**
   * Get status icon
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return <CheckCircle size={16} color={getStatusColor(status)} />
      case 'syncing':
        return <RefreshCw size={16} color={getStatusColor(status)} />
      case 'error':
        return <AlertCircle size={16} color={getStatusColor(status)} />
      case 'pending':
        return <AlertCircle size={16} color={getStatusColor(status)} />
      default:
        return null
    }
  }

  const pendingCount = syncItems.filter((i) => i.status === 'pending').length
  const syncingCount = syncItems.filter((i) => i.status === 'syncing').length
  const errorCount = syncItems.filter((i) => i.status === 'error').length

  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <TouchableOpacity
        style={[
          styles.statusBar,
          { backgroundColor: isOnline ? '#f0fdf4' : '#fef2f2' },
        ]}
        onPress={() => setShowDetails(!showDetails)}
      >
        <View style={styles.statusContent}>
          <View style={styles.statusLeft}>
            {isOnline ? (
              <>
                <Wifi size={18} color="#10b981" />
                <Text style={styles.statusText}>Online</Text>
              </>
            ) : (
              <>
                <WifiOff size={18} color="#ef4444" />
                <Text style={styles.statusText}>Offline</Text>
              </>
            )}
          </View>

          {/* Pending Items Badge */}
          {pendingCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingCount} pending</Text>
            </View>
          )}

          {/* Sync Status */}
          {isSyncing && (
            <View style={styles.syncingIndicator}>
              <RefreshCw size={16} color="#3b82f6" />
              <Text style={styles.syncingText}>Syncing...</Text>
            </View>
          )}

          {syncError && (
            <View style={styles.errorIndicator}>
              <AlertCircle size={16} color="#ef4444" />
              <Text style={styles.errorText}>Sync error</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Details Panel */}
      {showDetails && (
        <Animated.View
          style={[
            styles.detailsPanel,
            {
              opacity: slideAnim,
              maxHeight: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 500],
              }),
            },
          ]}
        >
          {/* Summary */}
          <View style={styles.summary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Pending</Text>
              <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>
                {pendingCount}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Syncing</Text>
              <Text style={[styles.summaryValue, { color: '#3b82f6' }]}>
                {syncingCount}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Errors</Text>
              <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
                {errorCount}
              </Text>
            </View>
          </View>

          {/* Pending Items List */}
          {syncItems.length > 0 && (
            <View style={styles.itemsList}>
              <Text style={styles.itemsTitle}>Pending Items</Text>
              {syncItems.map((item) => (
                <View key={item.id} style={styles.syncItem}>
                  <View style={styles.itemIcon}>
                    {getStatusIcon(item.status)}
                  </View>
                  <View style={styles.itemContent}>
                    <Text style={styles.itemType}>
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </Text>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemTime}>
                      {item.timestamp.toLocaleTimeString()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.itemStatus,
                      { backgroundColor: getStatusColor(item.status) },
                    ]}
                  >
                    <Text style={styles.itemStatusText}>
                      {item.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Sync Error Message */}
          {syncError && (
            <View style={styles.errorMessage}>
              <AlertCircle size={16} color="#ef4444" />
              <Text style={styles.errorMessageText}>{syncError}</Text>
            </View>
          )}

          {/* Manual Sync Button */}
          {!isOnline && (
            <Text style={styles.offlineNote}>
              You are offline. Changes will sync when connection is restored.
            </Text>
          )}

          {isOnline && pendingCount > 0 && (
            <TouchableOpacity
              style={[
                styles.syncButton,
                isSyncing && styles.syncButtonDisabled,
              ]}
              onPress={handleManualSync}
              disabled={isSyncing}
            >
              <RefreshCw
                size={18}
                color={isSyncing ? '#9ca3af' : '#ffffff'}
              />
              <Text style={styles.syncButtonText}>
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}
    </View>
  )
}

/**
 * Helper functions to get pending items
 */

async function getPendingTasks(): Promise<any[]> {
  // In production, would fetch from AsyncStorage
  return []
}

async function getPendingShifts(): Promise<any[]> {
  // In production, would fetch from AsyncStorage
  return []
}

async function getPendingWorkers(): Promise<any[]> {
  // In production, would fetch from AsyncStorage
  return []
}

/**
 * Styles
 */
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statusBar: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  badge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  syncingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  syncingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  errorIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  detailsPanel: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  itemsList: {
    marginBottom: 12,
  },
  itemsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  syncItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  itemIcon: {
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemType: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    marginVertical: 2,
  },
  itemTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
  itemStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  itemStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'capitalize',
  },
  errorMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  errorMessageText: {
    flex: 1,
    fontSize: 12,
    color: '#991b1b',
  },
  offlineNote: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 12,
    textAlign: 'center',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
  },
  syncButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  syncButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
})
