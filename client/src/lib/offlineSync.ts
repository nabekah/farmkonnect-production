/**
 * Offline Data Sync Manager
 * Handles local data persistence, sync queue, and conflict resolution
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface OfflineSyncSchema extends DBSchema {
  tasks: {
    key: number
    value: {
      id: number
      title: string
      description: string
      status: string
      priority: string
      estimatedHours: number
      actualHours: number
      dueDate?: string
      farmId: number
      workerId: number
      workerName: string
      taskType: string
      location?: string
      photos?: string[]
      createdAt: string
      updatedAt: string
      syncStatus: 'pending' | 'synced' | 'conflict'
      lastSyncTime?: string
      localChanges?: Record<string, any>
    }
  }
  syncQueue: {
    key: string
    value: {
      id: string
      action: 'create' | 'update' | 'delete'
      entityType: 'task' | 'photo' | 'location'
      entityId: number
      data: Record<string, any>
      timestamp: number
      retries: number
      lastError?: string
      status: 'pending' | 'processing' | 'failed'
    }
  }
  syncStatus: {
    key: string
    value: {
      lastSyncTime: number
      isOnline: boolean
      pendingCount: number
      failedCount: number
      lastError?: string
    }
  }
  photos: {
    key: string
    value: {
      id: string
      taskId: number
      photoData: Blob
      timestamp: number
      location?: { lat: number; lng: number }
      uploadStatus: 'pending' | 'uploading' | 'uploaded'
      uploadUrl?: string
      syncStatus: 'pending' | 'synced'
    }
  }
}

class OfflineSyncManager {
  private db: IDBPDatabase<OfflineSyncSchema> | null = null
  private isOnline = navigator.onLine
  private syncInterval: NodeJS.Timeout | null = null
  private listeners: Set<(status: any) => void> = new Set()

  async initialize() {
    try {
      this.db = await openDB<OfflineSyncSchema>('farmkonnect-offline', 1, {
        upgrade(db) {
          // Tasks store
          if (!db.objectStoreNames.contains('tasks')) {
            const taskStore = db.createObjectStore('tasks', { keyPath: 'id' })
            taskStore.createIndex('syncStatus', 'syncStatus')
            taskStore.createIndex('farmId', 'farmId')
            taskStore.createIndex('status', 'status')
          }

          // Sync queue store
          if (!db.objectStoreNames.contains('syncQueue')) {
            const queueStore = db.createObjectStore('syncQueue', { keyPath: 'id' })
            queueStore.createIndex('status', 'status')
            queueStore.createIndex('timestamp', 'timestamp')
          }

          // Sync status store
          if (!db.objectStoreNames.contains('syncStatus')) {
            db.createObjectStore('syncStatus', { keyPath: 'key' })
          }

          // Photos store
          if (!db.objectStoreNames.contains('photos')) {
            const photoStore = db.createObjectStore('photos', { keyPath: 'id' })
            photoStore.createIndex('taskId', 'taskId')
            photoStore.createIndex('uploadStatus', 'uploadStatus')
          }
        },
      })

      // Set up online/offline listeners
      window.addEventListener('online', () => this.handleOnline())
      window.addEventListener('offline', () => this.handleOffline())

      // Start periodic sync
      this.startPeriodicSync()

      console.log('Offline sync manager initialized')
    } catch (error) {
      console.error('Failed to initialize offline sync manager:', error)
    }
  }

  // Task Management
  async saveTask(task: any) {
    if (!this.db) return

    const existingTask = await this.db.get('tasks', task.id)
    const taskToSave = {
      ...task,
      syncStatus: existingTask?.syncStatus === 'synced' ? 'pending' : 'pending',
      lastSyncTime: new Date().toISOString(),
      localChanges: existingTask?.localChanges || {},
    }

    await this.db.put('tasks', taskToSave)
    await this.addToSyncQueue('update', 'task', task.id, task)
    this.notifyListeners()
  }

  async getTask(taskId: number) {
    if (!this.db) return null
    return this.db.get('tasks', taskId)
  }

  async getAllTasks(farmId: number) {
    if (!this.db) return []
    const allTasks = await this.db.getAll('tasks')
    return allTasks.filter((task) => task.farmId === farmId)
  }

  async deleteTask(taskId: number) {
    if (!this.db) return

    await this.db.delete('tasks', taskId)
    await this.addToSyncQueue('delete', 'task', taskId, {})
    this.notifyListeners()
  }

  // Photo Management
  async savePhoto(taskId: number, photoData: Blob, location?: { lat: number; lng: number }) {
    if (!this.db) return

    const photoId = `photo-${taskId}-${Date.now()}`
    const photo = {
      id: photoId,
      taskId,
      photoData,
      timestamp: Date.now(),
      location,
      uploadStatus: 'pending' as const,
      syncStatus: 'pending' as const,
    }

    await this.db.put('photos', photo)
    await this.addToSyncQueue('create', 'photo', taskId, photo)
    this.notifyListeners()

    return photoId
  }

  async getTaskPhotos(taskId: number) {
    if (!this.db) return []
    const index = this.db.transaction('photos').store.index('taskId')
    return index.getAll(taskId)
  }

  async deletePhoto(photoId: string) {
    if (!this.db) return

    const photo = await this.db.get('photos', photoId)
    if (photo) {
      await this.db.delete('photos', photoId)
      await this.addToSyncQueue('delete', 'photo', photo.taskId, { photoId })
      this.notifyListeners()
    }
  }

  // Sync Queue Management
  private async addToSyncQueue(
    action: 'create' | 'update' | 'delete',
    entityType: 'task' | 'photo' | 'location',
    entityId: number,
    data: Record<string, any>
  ) {
    if (!this.db) return

    const queueItem = {
      id: `${action}-${entityType}-${entityId}-${Date.now()}`,
      action,
      entityType,
      entityId,
      data,
      timestamp: Date.now(),
      retries: 0,
      status: 'pending' as const,
    }

    await this.db.put('syncQueue', queueItem)
  }

  async getSyncQueue() {
    if (!this.db) return []
    return this.db.getAll('syncQueue')
  }

  async getPendingSyncItems() {
    if (!this.db) return []
    const index = this.db.transaction('syncQueue').store.index('status')
    return index.getAll('pending')
  }

  async markSyncItemAsProcessing(queueId: string) {
    if (!this.db) return

    const item = await this.db.get('syncQueue', queueId)
    if (item) {
      item.status = 'processing'
      await this.db.put('syncQueue', item)
    }
  }

  async markSyncItemAsSuccess(queueId: string) {
    if (!this.db) return
    await this.db.delete('syncQueue', queueId)
  }

  async markSyncItemAsFailed(queueId: string, error: string) {
    if (!this.db) return

    const item = await this.db.get('syncQueue', queueId)
    if (item) {
      item.status = item.retries < 3 ? 'pending' : 'failed'
      item.retries += 1
      item.lastError = error
      await this.db.put('syncQueue', item)
    }
  }

  // Sync Status Management
  async getSyncStatus() {
    if (!this.db) return null
    return this.db.get('syncStatus', 'current')
  }

  private async updateSyncStatus() {
    if (!this.db) return

    const pendingItems = await this.getPendingSyncItems()
    const failedItems = pendingItems.filter((item) => item.status === 'failed')

    const status = {
      key: 'current',
      lastSyncTime: Date.now(),
      isOnline: this.isOnline,
      pendingCount: pendingItems.length,
      failedCount: failedItems.length,
      lastError: failedItems[0]?.lastError,
    }

    await this.db.put('syncStatus', status)
    this.notifyListeners()
  }

  // Online/Offline Handling
  private handleOnline() {
    this.isOnline = true
    console.log('Device is online')
    this.updateSyncStatus()
    this.performSync()
  }

  private handleOffline() {
    this.isOnline = false
    console.log('Device is offline')
    this.updateSyncStatus()
  }

  // Sync Operations
  private startPeriodicSync() {
    if (this.syncInterval) clearInterval(this.syncInterval)

    // Sync every 30 seconds if online
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.performSync()
      }
    }, 30000)
  }

  async performSync() {
    if (!this.isOnline || !this.db) return

    try {
      const pendingItems = await this.getPendingSyncItems()

      for (const item of pendingItems) {
        await this.markSyncItemAsProcessing(item.id)

        try {
          // Simulate sync operation
          // In real implementation, this would call the server API
          await new Promise((resolve) => setTimeout(resolve, 1000))

          await this.markSyncItemAsSuccess(item.id)

          // Update task sync status
          if (item.entityType === 'task') {
            const task = await this.db.get('tasks', item.entityId)
            if (task) {
              task.syncStatus = 'synced'
              await this.db.put('tasks', task)
            }
          }
        } catch (error) {
          await this.markSyncItemAsFailed(item.id, String(error))
        }
      }

      await this.updateSyncStatus()
    } catch (error) {
      console.error('Sync error:', error)
    }
  }

  // Conflict Resolution
  async resolveConflict(taskId: number, serverVersion: any, localVersion: any) {
    if (!this.db) return

    // Simple conflict resolution: server version wins
    // In production, implement more sophisticated conflict resolution
    const task = await this.db.get('tasks', taskId)
    if (task) {
      task.syncStatus = 'synced'
      task.localChanges = {}
      await this.db.put('tasks', task)
    }
  }

  // Listeners
  onSyncStatusChange(callback: (status: any) => void) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private notifyListeners() {
    this.updateSyncStatus().then(() => {
      this.listeners.forEach((listener) => {
        this.getSyncStatus().then((status) => {
          listener(status)
        })
      })
    })
  }

  // Cleanup
  destroy() {
    if (this.syncInterval) clearInterval(this.syncInterval)
    window.removeEventListener('online', () => this.handleOnline())
    window.removeEventListener('offline', () => this.handleOffline())
  }
}

// Export singleton instance
export const offlineSyncManager = new OfflineSyncManager()
