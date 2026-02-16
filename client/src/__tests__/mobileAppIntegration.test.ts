import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { offlineSyncManager } from '@/lib/offlineSync'
import { gpsService } from '@/lib/gpsService'
import { photoCaptureService } from '@/lib/photoCaptureService'

/**
 * Integration tests for Mobile App & Field Worker Interface
 * Tests all features working together: offline sync, GPS tracking, photo capture
 */

describe('Mobile App Integration Tests', () => {
  beforeEach(async () => {
    // Initialize all services
    await offlineSyncManager.initialize()
  })

  afterEach(() => {
    // Cleanup
    offlineSyncManager.destroy()
    gpsService.clear()
    photoCaptureService.clear()
  })

  describe('Complete Task Workflow', () => {
    it('should complete full task workflow: offline, GPS, photos', async () => {
      // Step 1: Create a task offline
      const task = {
        id: 1,
        title: 'Plant Corn Field A',
        description: 'Plant corn seeds in field A',
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

      // Step 2: Set task location and start GPS tracking
      const taskLocation = {
        taskId: 1,
        latitude: 6.5244,
        longitude: -0.1957,
        radius: 500,
        name: 'Field A',
        address: 'Accra, Ghana',
      }

      gpsService.setTaskLocation(taskLocation)
      const retrievedLocation = gpsService.getTaskLocation(1)
      expect(retrievedLocation).toEqual(taskLocation)

      // Step 3: Simulate location update
      const currentLocation = {
        latitude: 6.5244,
        longitude: -0.1957,
        accuracy: 10,
        timestamp: Date.now(),
      }

      const isInGeofence = gpsService.isWithinGeofence(1, currentLocation)
      expect(isInGeofence).toBe(true)

      // Step 4: Capture photo evidence
      const photoData = new Blob(['test photo'], { type: 'image/jpeg' })
      const photoId = await offlineSyncManager.savePhoto(1, photoData, {
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
      })

      expect(photoId).toBeDefined()

      // Step 5: Verify all data is saved offline
      const taskPhotos = await offlineSyncManager.getTaskPhotos(1)
      expect(taskPhotos).toHaveLength(1)

      // Step 6: Check sync queue
      const syncQueue = await offlineSyncManager.getSyncQueue()
      expect(syncQueue.length).toBeGreaterThan(0)

      // Step 7: Verify sync status
      const syncStatus = await offlineSyncManager.getSyncStatus()
      expect(syncStatus?.pendingCount).toBeGreaterThan(0)
    })
  })

  describe('Offline to Online Transition', () => {
    it('should handle offline to online transition gracefully', async () => {
      // Create data while offline
      const task = {
        id: 1,
        title: 'Test Task',
        description: 'Test',
        status: 'pending',
        priority: 'medium',
        estimatedHours: 4,
        actualHours: 0,
        farmId: 1,
        workerId: 1,
        workerName: 'Worker',
        taskType: 'weeding',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await offlineSyncManager.saveTask(task)

      // Add photo
      const photoData = new Blob(['photo'], { type: 'image/jpeg' })
      await offlineSyncManager.savePhoto(1, photoData)

      // Check pending items
      let syncStatus = await offlineSyncManager.getSyncStatus()
      expect(syncStatus?.pendingCount).toBeGreaterThan(0)

      // Simulate sync (mark as success)
      const queue = await offlineSyncManager.getSyncQueue()
      for (const item of queue) {
        await offlineSyncManager.markSyncItemAsSuccess(item.id)
      }

      // Verify all synced
      syncStatus = await offlineSyncManager.getSyncStatus()
      expect(syncStatus?.pendingCount).toBe(0)
    })
  })

  describe('Multi-Task Management', () => {
    it('should manage multiple tasks with different statuses', async () => {
      // Create multiple tasks
      const tasks = [
        {
          id: 1,
          title: 'Plant Corn',
          description: 'Plant corn seeds',
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
          title: 'Weed Field B',
          description: 'Remove weeds',
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
        {
          id: 3,
          title: 'Harvest Tomatoes',
          description: 'Harvest ripe tomatoes',
          status: 'completed',
          priority: 'low',
          estimatedHours: 6,
          actualHours: 6,
          farmId: 1,
          workerId: 1,
          workerName: 'Worker 1',
          taskType: 'harvesting',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      // Save all tasks
      for (const task of tasks) {
        await offlineSyncManager.saveTask(task)
      }

      // Retrieve all tasks
      const farmTasks = await offlineSyncManager.getAllTasks(1)
      expect(farmTasks).toHaveLength(3)

      // Verify statuses
      const pendingTasks = farmTasks.filter((t) => t.status === 'pending')
      const inProgressTasks = farmTasks.filter((t) => t.status === 'in_progress')
      const completedTasks = farmTasks.filter((t) => t.status === 'completed')

      expect(pendingTasks).toHaveLength(1)
      expect(inProgressTasks).toHaveLength(1)
      expect(completedTasks).toHaveLength(1)
    })
  })

  describe('GPS Tracking with Task Management', () => {
    it('should track location while managing tasks', async () => {
      // Create task
      const task = {
        id: 1,
        title: 'Field Work',
        description: 'Work in field A',
        status: 'in_progress',
        priority: 'high',
        estimatedHours: 8,
        actualHours: 4,
        farmId: 1,
        workerId: 1,
        workerName: 'Worker',
        taskType: 'planting',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await offlineSyncManager.saveTask(task)

      // Set task location
      const taskLocation = {
        taskId: 1,
        latitude: 6.5244,
        longitude: -0.1957,
        radius: 500,
        name: 'Field A',
      }

      gpsService.setTaskLocation(taskLocation)

      // Simulate location updates
      const locations = [
        { latitude: 6.5244, longitude: -0.1957, accuracy: 10, timestamp: Date.now() },
        { latitude: 6.5245, longitude: -0.1956, accuracy: 10, timestamp: Date.now() + 1000 },
        { latitude: 6.5246, longitude: -0.1955, accuracy: 10, timestamp: Date.now() + 2000 },
      ]

      // Check geofence for each location
      const geofenceStatuses = locations.map((loc) => gpsService.isWithinGeofence(1, loc))

      expect(geofenceStatuses).toHaveLength(3)
      expect(geofenceStatuses.every((status) => status === true)).toBe(true)
    })
  })

  describe('Photo Evidence with Task Tracking', () => {
    it('should capture photos with GPS metadata', async () => {
      // Create task
      const task = {
        id: 1,
        title: 'Photo Documentation',
        description: 'Document task with photos',
        status: 'in_progress',
        priority: 'high',
        estimatedHours: 2,
        actualHours: 1,
        farmId: 1,
        workerId: 1,
        workerName: 'Worker',
        taskType: 'inspection',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await offlineSyncManager.saveTask(task)

      // Capture multiple photos with location
      const locations = [
        { lat: 6.5244, lng: -0.1957 },
        { lat: 6.5245, lng: -0.1956 },
        { lat: 6.5246, lng: -0.1955 },
      ]

      for (let i = 0; i < locations.length; i++) {
        const photoData = new Blob([`photo ${i + 1}`], { type: 'image/jpeg' })
        await offlineSyncManager.savePhoto(1, photoData, locations[i])
      }

      // Retrieve all photos
      const photos = await offlineSyncManager.getTaskPhotos(1)

      expect(photos).toHaveLength(3)
      expect(photos.every((p) => p.location !== undefined)).toBe(true)

      // Verify locations are captured
      photos.forEach((photo, index) => {
        expect(photo.location?.lat).toBe(locations[index].lat)
        expect(photo.location?.lng).toBe(locations[index].lng)
      })
    })
  })

  describe('Sync Queue Management', () => {
    it('should manage sync queue with mixed operations', async () => {
      // Create task
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

      // Add photo
      const photoData = new Blob(['photo'], { type: 'image/jpeg' })
      await offlineSyncManager.savePhoto(1, photoData)

      // Get sync queue
      let queue = await offlineSyncManager.getSyncQueue()
      expect(queue.length).toBeGreaterThan(0)

      // Mark first item as success
      if (queue.length > 0) {
        await offlineSyncManager.markSyncItemAsSuccess(queue[0].id)
      }

      // Verify queue updated
      queue = await offlineSyncManager.getSyncQueue()
      expect(queue.length).toBeLessThan(2)

      // Mark remaining as failed
      for (const item of queue) {
        await offlineSyncManager.markSyncItemAsFailed(item.id, 'Network error')
      }

      // Verify failed items still in queue with retry count
      queue = await offlineSyncManager.getSyncQueue()
      expect(queue.every((item) => item.retries > 0)).toBe(true)
    })
  })

  describe('Performance and Load Testing', () => {
    it('should handle multiple tasks efficiently', async () => {
      const startTime = Date.now()

      // Create 10 tasks
      for (let i = 1; i <= 10; i++) {
        const task = {
          id: i,
          title: `Task ${i}`,
          description: `Description ${i}`,
          status: i % 3 === 0 ? 'completed' : i % 2 === 0 ? 'in_progress' : 'pending',
          priority: ['high', 'medium', 'low'][i % 3],
          estimatedHours: 4 + i,
          actualHours: i % 2 === 0 ? 2 + i : 0,
          farmId: 1,
          workerId: (i % 3) + 1,
          workerName: `Worker ${(i % 3) + 1}`,
          taskType: ['planting', 'weeding', 'harvesting'][i % 3],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        await offlineSyncManager.saveTask(task)

        // Add 2 photos per task
        for (let j = 0; j < 2; j++) {
          const photoData = new Blob([`photo ${j}`], { type: 'image/jpeg' })
          await offlineSyncManager.savePhoto(i, photoData)
        }
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      // Verify all tasks saved
      const allTasks = await offlineSyncManager.getAllTasks(1)
      expect(allTasks).toHaveLength(10)

      // Verify all photos saved
      let totalPhotos = 0
      for (let i = 1; i <= 10; i++) {
        const photos = await offlineSyncManager.getTaskPhotos(i)
        totalPhotos += photos.length
      }
      expect(totalPhotos).toBe(20)

      // Performance check - should complete in reasonable time
      expect(duration).toBeLessThan(5000) // 5 seconds for 10 tasks + 20 photos
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle and recover from errors gracefully', async () => {
      // Test task creation with valid data
      const task = {
        id: 1,
        title: 'Error Test Task',
        description: 'Test error handling',
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

      // Test photo with invalid data
      const invalidPhotoData = new Blob([], { type: 'image/jpeg' })
      const photoId = await offlineSyncManager.savePhoto(1, invalidPhotoData)

      // Should still save even with empty data
      expect(photoId).toBeDefined()

      // Test retrieval after errors
      const retrievedTask = await offlineSyncManager.getTask(1)
      expect(retrievedTask).toBeDefined()

      const photos = await offlineSyncManager.getTaskPhotos(1)
      expect(photos).toHaveLength(1)
    })
  })
})
