import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { offlineSyncManager } from '@/lib/offlineSync'

describe('Offline Sync Manager', () => {
  beforeEach(async () => {
    // Clear IndexedDB before each test
    const dbs = await window.indexedDB.databases()
    for (const db of dbs) {
      if (db.name === 'farmkonnect-offline') {
        window.indexedDB.deleteDatabase(db.name)
      }
    }
    await offlineSyncManager.initialize()
  })

  afterEach(() => {
    offlineSyncManager.destroy()
  })

  describe('Task Management', () => {
    it('should save a task to offline storage', async () => {
      const task = {
        id: 1,
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending',
        priority: 'high',
        estimatedHours: 8,
        actualHours: 0,
        farmId: 1,
        workerId: 1,
        workerName: 'John Doe',
        taskType: 'planting',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await offlineSyncManager.saveTask(task)
      const savedTask = await offlineSyncManager.getTask(1)

      expect(savedTask).toBeDefined()
      expect(savedTask?.title).toBe('Test Task')
      expect(savedTask?.syncStatus).toBe('pending')
    })

    it('should retrieve all tasks for a farm', async () => {
      const tasks = [
        {
          id: 1,
          title: 'Task 1',
          description: 'Desc 1',
          status: 'pending',
          priority: 'high',
          estimatedHours: 8,
          actualHours: 0,
          farmId: 1,
          workerId: 1,
          workerName: 'Worker 1',
          taskType: 'planting',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 2,
          title: 'Task 2',
          description: 'Desc 2',
          status: 'in_progress',
          priority: 'medium',
          estimatedHours: 4,
          actualHours: 2,
          farmId: 1,
          workerId: 2,
          workerName: 'Worker 2',
          taskType: 'weeding',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      for (const task of tasks) {
        await offlineSyncManager.saveTask(task)
      }

      const farmTasks = await offlineSyncManager.getAllTasks(1)
      expect(farmTasks).toHaveLength(2)
      expect(farmTasks[0].title).toBe('Task 1')
      expect(farmTasks[1].title).toBe('Task 2')
    })

    it('should delete a task', async () => {
      const task = {
        id: 1,
        title: 'Task to Delete',
        description: 'Desc',
        status: 'pending',
        priority: 'low',
        estimatedHours: 2,
        actualHours: 0,
        farmId: 1,
        workerId: 1,
        workerName: 'Worker',
        taskType: 'harvesting',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await offlineSyncManager.saveTask(task)
      await offlineSyncManager.deleteTask(1)

      const deletedTask = await offlineSyncManager.getTask(1)
      expect(deletedTask).toBeUndefined()
    })

    it('should update task sync status', async () => {
      const task = {
        id: 1,
        title: 'Task',
        description: 'Desc',
        status: 'pending',
        priority: 'high',
        estimatedHours: 8,
        actualHours: 0,
        farmId: 1,
        workerId: 1,
        workerName: 'Worker',
        taskType: 'planting',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await offlineSyncManager.saveTask(task)
      let savedTask = await offlineSyncManager.getTask(1)
      expect(savedTask?.syncStatus).toBe('pending')

      // After sync, status should be updated
      // This would be done by the sync process
      savedTask!.syncStatus = 'synced'
      await offlineSyncManager.saveTask(savedTask!)

      const updatedTask = await offlineSyncManager.getTask(1)
      expect(updatedTask?.syncStatus).toBe('synced')
    })
  })

  describe('Photo Management', () => {
    it('should save a photo to offline storage', async () => {
      const photoData = new Blob(['test photo data'], { type: 'image/jpeg' })
      const location = { lat: 6.5244, lng: -0.1957 }

      const photoId = await offlineSyncManager.savePhoto(1, photoData, location)

      expect(photoId).toBeDefined()
      expect(photoId).toMatch(/^photo-/)
    })

    it('should retrieve task photos', async () => {
      const photoData1 = new Blob(['photo 1'], { type: 'image/jpeg' })
      const photoData2 = new Blob(['photo 2'], { type: 'image/jpeg' })

      await offlineSyncManager.savePhoto(1, photoData1)
      await offlineSyncManager.savePhoto(1, photoData2)

      const photos = await offlineSyncManager.getTaskPhotos(1)
      expect(photos).toHaveLength(2)
      expect(photos[0].taskId).toBe(1)
      expect(photos[1].taskId).toBe(1)
    })

    it('should delete a photo', async () => {
      const photoData = new Blob(['test'], { type: 'image/jpeg' })
      const photoId = await offlineSyncManager.savePhoto(1, photoData)

      await offlineSyncManager.deletePhoto(photoId!)

      const photos = await offlineSyncManager.getTaskPhotos(1)
      expect(photos).toHaveLength(0)
    })

    it('should include location metadata with photo', async () => {
      const photoData = new Blob(['test'], { type: 'image/jpeg' })
      const location = { lat: 6.5244, lng: -0.1957 }

      const photoId = await offlineSyncManager.savePhoto(1, photoData, location)
      const photos = await offlineSyncManager.getTaskPhotos(1)

      expect(photos[0].location).toEqual(location)
    })
  })

  describe('Sync Queue Management', () => {
    it('should add items to sync queue', async () => {
      const task = {
        id: 1,
        title: 'Task',
        description: 'Desc',
        status: 'pending',
        priority: 'high',
        estimatedHours: 8,
        actualHours: 0,
        farmId: 1,
        workerId: 1,
        workerName: 'Worker',
        taskType: 'planting',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await offlineSyncManager.saveTask(task)

      const queue = await offlineSyncManager.getSyncQueue()
      expect(queue.length).toBeGreaterThan(0)
      expect(queue[0].action).toBe('update')
      expect(queue[0].entityType).toBe('task')
    })

    it('should get pending sync items', async () => {
      const task = {
        id: 1,
        title: 'Task',
        description: 'Desc',
        status: 'pending',
        priority: 'high',
        estimatedHours: 8,
        actualHours: 0,
        farmId: 1,
        workerId: 1,
        workerName: 'Worker',
        taskType: 'planting',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await offlineSyncManager.saveTask(task)

      const pendingItems = await offlineSyncManager.getPendingSyncItems()
      expect(pendingItems.length).toBeGreaterThan(0)
      expect(pendingItems[0].status).toBe('pending')
    })

    it('should mark sync item as success', async () => {
      const task = {
        id: 1,
        title: 'Task',
        description: 'Desc',
        status: 'pending',
        priority: 'high',
        estimatedHours: 8,
        actualHours: 0,
        farmId: 1,
        workerId: 1,
        workerName: 'Worker',
        taskType: 'planting',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await offlineSyncManager.saveTask(task)

      const queue = await offlineSyncManager.getSyncQueue()
      const queueId = queue[0].id

      await offlineSyncManager.markSyncItemAsSuccess(queueId)

      const updatedQueue = await offlineSyncManager.getSyncQueue()
      expect(updatedQueue).toHaveLength(0)
    })

    it('should mark sync item as failed with retry', async () => {
      const task = {
        id: 1,
        title: 'Task',
        description: 'Desc',
        status: 'pending',
        priority: 'high',
        estimatedHours: 8,
        actualHours: 0,
        farmId: 1,
        workerId: 1,
        workerName: 'Worker',
        taskType: 'planting',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await offlineSyncManager.saveTask(task)

      const queue = await offlineSyncManager.getSyncQueue()
      const queueId = queue[0].id

      await offlineSyncManager.markSyncItemAsFailed(queueId, 'Network error')

      const updatedQueue = await offlineSyncManager.getSyncQueue()
      expect(updatedQueue[0].status).toBe('pending')
      expect(updatedQueue[0].retries).toBe(1)
      expect(updatedQueue[0].lastError).toBe('Network error')
    })
  })

  describe('Sync Status', () => {
    it('should get sync status', async () => {
      const status = await offlineSyncManager.getSyncStatus()
      expect(status).toBeDefined()
      expect(status?.isOnline).toBeDefined()
      expect(status?.pendingCount).toBeDefined()
      expect(status?.failedCount).toBeDefined()
    })

    it('should track pending items count', async () => {
      const task = {
        id: 1,
        title: 'Task',
        description: 'Desc',
        status: 'pending',
        priority: 'high',
        estimatedHours: 8,
        actualHours: 0,
        farmId: 1,
        workerId: 1,
        workerName: 'Worker',
        taskType: 'planting',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await offlineSyncManager.saveTask(task)

      const status = await offlineSyncManager.getSyncStatus()
      expect(status?.pendingCount).toBeGreaterThan(0)
    })
  })

  describe('Offline/Online Handling', () => {
    it('should notify listeners on sync status change', async () => {
      const listener = vi.fn()
      const unsubscribe = offlineSyncManager.onSyncStatusChange(listener)

      const task = {
        id: 1,
        title: 'Task',
        description: 'Desc',
        status: 'pending',
        priority: 'high',
        estimatedHours: 8,
        actualHours: 0,
        farmId: 1,
        workerId: 1,
        workerName: 'Worker',
        taskType: 'planting',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await offlineSyncManager.saveTask(task)

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(listener).toHaveBeenCalled()

      unsubscribe()
    })
  })
})
