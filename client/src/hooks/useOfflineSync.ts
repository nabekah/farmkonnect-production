import { useEffect, useState, useCallback } from 'react'
import { offlineSyncManager } from '@/lib/offlineSync'

interface SyncStatus {
  lastSyncTime: number
  isOnline: boolean
  pendingCount: number
  failedCount: number
  lastError?: string
}

export function useOfflineSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initialize = async () => {
      await offlineSyncManager.initialize()
      const status = await offlineSyncManager.getSyncStatus()
      setSyncStatus(status)
      setIsInitialized(true)
    }

    initialize()

    // Subscribe to sync status changes
    const unsubscribe = offlineSyncManager.onSyncStatusChange((status) => {
      setSyncStatus(status)
    })

    return () => {
      unsubscribe()
      offlineSyncManager.destroy()
    }
  }, [])

  const saveTask = useCallback(async (task: any) => {
    await offlineSyncManager.saveTask(task)
  }, [])

  const getTask = useCallback(async (taskId: number) => {
    return offlineSyncManager.getTask(taskId)
  }, [])

  const getAllTasks = useCallback(async (farmId: number) => {
    return offlineSyncManager.getAllTasks(farmId)
  }, [])

  const deleteTask = useCallback(async (taskId: number) => {
    await offlineSyncManager.deleteTask(taskId)
  }, [])

  const savePhoto = useCallback(
    async (taskId: number, photoData: Blob, location?: { lat: number; lng: number }) => {
      return offlineSyncManager.savePhoto(taskId, photoData, location)
    },
    []
  )

  const getTaskPhotos = useCallback(async (taskId: number) => {
    return offlineSyncManager.getTaskPhotos(taskId)
  }, [])

  const deletePhoto = useCallback(async (photoId: string) => {
    await offlineSyncManager.deletePhoto(photoId)
  }, [])

  const getSyncQueue = useCallback(async () => {
    return offlineSyncManager.getSyncQueue()
  }, [])

  const performSync = useCallback(async () => {
    await offlineSyncManager.performSync()
  }, [])

  return {
    // Status
    syncStatus,
    isInitialized,
    isOnline: syncStatus?.isOnline ?? navigator.onLine,
    pendingCount: syncStatus?.pendingCount ?? 0,
    failedCount: syncStatus?.failedCount ?? 0,

    // Task operations
    saveTask,
    getTask,
    getAllTasks,
    deleteTask,

    // Photo operations
    savePhoto,
    getTaskPhotos,
    deletePhoto,

    // Sync operations
    getSyncQueue,
    performSync,
  }
}
