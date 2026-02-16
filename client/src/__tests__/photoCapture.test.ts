import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { photoCaptureService } from '@/lib/photoCaptureService'

// Mock getUserMedia
const mockGetUserMedia = vi.fn()
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
  },
  writable: true,
})

describe('Photo Capture Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    photoCaptureService.clear()
  })

  afterEach(() => {
    photoCaptureService.clear()
  })

  describe('Camera Permission', () => {
    it('should request camera permission', async () => {
      const mockStream = {
        getTracks: () => [{ stop: vi.fn() }],
      }

      mockGetUserMedia.mockResolvedValue(mockStream)

      const hasPermission = await photoCaptureService.requestCameraPermission()

      expect(hasPermission).toBe(true)
      expect(mockGetUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.any(Object),
          audio: false,
        })
      )
    })

    it('should handle permission denial', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('Permission denied'))

      const hasPermission = await photoCaptureService.requestCameraPermission()

      expect(hasPermission).toBe(false)
    })
  })

  describe('Camera Control', () => {
    it('should start camera', async () => {
      const mockStream = {
        getTracks: () => [],
      }

      mockGetUserMedia.mockResolvedValue(mockStream)

      const videoElement = document.createElement('video')
      const success = await photoCaptureService.startCamera(videoElement)

      expect(success).toBe(true)
      expect(videoElement.srcObject).toBe(mockStream)
    })

    it('should stop camera', async () => {
      const mockTrack = { stop: vi.fn() }
      const mockStream = {
        getTracks: () => [mockTrack],
      }

      mockGetUserMedia.mockResolvedValue(mockStream)

      const videoElement = document.createElement('video')
      await photoCaptureService.startCamera(videoElement)

      photoCaptureService.stopCamera()

      expect(mockTrack.stop).toHaveBeenCalled()
    })
  })

  describe('Photo Capture', () => {
    it('should capture photo with metadata', async () => {
      const mockStream = {
        getTracks: () => [],
      }

      mockGetUserMedia.mockResolvedValue(mockStream)

      const videoElement = document.createElement('video')
      videoElement.width = 1280
      videoElement.height = 720

      await photoCaptureService.startCamera(videoElement)

      const location = { latitude: 6.5244, longitude: -0.1957 }
      const photo = await photoCaptureService.capturePhoto(1, location)

      expect(photo).toBeDefined()
      expect(photo?.taskId).toBe(1)
      expect(photo?.location).toEqual(location)
      expect(photo?.metadata.width).toBe(1280)
      expect(photo?.metadata.height).toBe(720)
      expect(photo?.metadata.mimeType).toBe('image/jpeg')
    })

    it('should compress photo', async () => {
      const mockStream = {
        getTracks: () => [],
      }

      mockGetUserMedia.mockResolvedValue(mockStream)

      const videoElement = document.createElement('video')
      videoElement.width = 1280
      videoElement.height = 720

      await photoCaptureService.startCamera(videoElement)

      const photo = await photoCaptureService.capturePhoto(1)

      expect(photo?.metadata.compressionRatio).toBeGreaterThan(0)
      expect(photo?.metadata.size).toBeLessThan(photo?.metadata.originalSize!)
    })

    it('should create thumbnail', async () => {
      const mockStream = {
        getTracks: () => [],
      }

      mockGetUserMedia.mockResolvedValue(mockStream)

      const videoElement = document.createElement('video')
      videoElement.width = 1280
      videoElement.height = 720

      await photoCaptureService.startCamera(videoElement)

      const photo = await photoCaptureService.capturePhoto(1)

      expect(photo?.thumbnail).toBeDefined()
      expect(photo?.thumbnail?.size).toBeLessThan(photo?.photoData.size!)
    })
  })

  describe('Photo Management', () => {
    it('should get photo by ID', async () => {
      const mockStream = {
        getTracks: () => [],
      }

      mockGetUserMedia.mockResolvedValue(mockStream)

      const videoElement = document.createElement('video')
      videoElement.width = 1280
      videoElement.height = 720

      await photoCaptureService.startCamera(videoElement)

      const photo = await photoCaptureService.capturePhoto(1)
      const retrieved = photoCaptureService.getPhoto(photo!.id)

      expect(retrieved).toEqual(photo)
    })

    it('should get all photos for a task', async () => {
      const mockStream = {
        getTracks: () => [],
      }

      mockGetUserMedia.mockResolvedValue(mockStream)

      const videoElement = document.createElement('video')
      videoElement.width = 1280
      videoElement.height = 720

      await photoCaptureService.startCamera(videoElement)

      // Capture multiple photos
      await photoCaptureService.capturePhoto(1)
      await photoCaptureService.capturePhoto(1)
      await photoCaptureService.capturePhoto(2)

      const taskPhotos = photoCaptureService.getTaskPhotos(1)

      expect(taskPhotos).toHaveLength(2)
      expect(taskPhotos.every((p) => p.taskId === 1)).toBe(true)
    })

    it('should delete photo', async () => {
      const mockStream = {
        getTracks: () => [],
      }

      mockGetUserMedia.mockResolvedValue(mockStream)

      const videoElement = document.createElement('video')
      videoElement.width = 1280
      videoElement.height = 720

      await photoCaptureService.startCamera(videoElement)

      const photo = await photoCaptureService.capturePhoto(1)
      const deleted = photoCaptureService.deletePhoto(photo!.id)

      expect(deleted).toBe(true)
      expect(photoCaptureService.getPhoto(photo!.id)).toBeUndefined()
    })
  })

  describe('Photo Upload', () => {
    it('should upload photo', async () => {
      const mockStream = {
        getTracks: () => [],
      }

      mockGetUserMedia.mockResolvedValue(mockStream)

      const videoElement = document.createElement('video')
      videoElement.width = 1280
      videoElement.height = 720

      await photoCaptureService.startCamera(videoElement)

      const photo = await photoCaptureService.capturePhoto(1)

      // Mock XMLHttpRequest
      const mockXHR = {
        upload: { addEventListener: vi.fn() },
        addEventListener: vi.fn(),
        open: vi.fn(),
        send: vi.fn(),
        status: 200,
      }

      global.XMLHttpRequest = vi.fn(() => mockXHR) as any

      // Simulate upload completion
      const uploadPromise = photoCaptureService.uploadPhoto(photo!.id, '/upload')

      // Trigger load event
      const loadCallback = mockXHR.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'load'
      )?.[1]
      if (loadCallback) {
        loadCallback()
      }

      const success = await uploadPromise

      expect(success).toBe(true)
      expect(mockXHR.open).toHaveBeenCalledWith('POST', '/upload')
      expect(mockXHR.send).toHaveBeenCalled()
    })

    it('should track upload progress', async () => {
      const mockStream = {
        getTracks: () => [],
      }

      mockGetUserMedia.mockResolvedValue(mockStream)

      const videoElement = document.createElement('video')
      videoElement.width = 1280
      videoElement.height = 720

      await photoCaptureService.startCamera(videoElement)

      const photo = await photoCaptureService.capturePhoto(1)

      const progressUpdates: any[] = []
      const unsubscribe = photoCaptureService.onUploadProgress((progress) => {
        progressUpdates.push(progress)
      })

      // Mock XMLHttpRequest
      const mockXHR = {
        upload: { addEventListener: vi.fn() },
        addEventListener: vi.fn(),
        open: vi.fn(),
        send: vi.fn(),
        status: 200,
      }

      global.XMLHttpRequest = vi.fn(() => mockXHR) as any

      const uploadPromise = photoCaptureService.uploadPhoto(photo!.id, '/upload')

      // Simulate progress events
      const progressCallback = mockXHR.upload.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'progress'
      )?.[1]

      if (progressCallback) {
        progressCallback({ lengthComputable: true, loaded: 50, total: 100 })
      }

      // Trigger load event
      const loadCallback = mockXHR.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'load'
      )?.[1]
      if (loadCallback) {
        loadCallback()
      }

      await uploadPromise

      expect(progressUpdates.length).toBeGreaterThan(0)

      unsubscribe()
    })
  })

  describe('Statistics', () => {
    it('should calculate storage statistics', async () => {
      const mockStream = {
        getTracks: () => [],
      }

      mockGetUserMedia.mockResolvedValue(mockStream)

      const videoElement = document.createElement('video')
      videoElement.width = 1280
      videoElement.height = 720

      await photoCaptureService.startCamera(videoElement)

      await photoCaptureService.capturePhoto(1)
      await photoCaptureService.capturePhoto(1)

      const stats = photoCaptureService.getStatistics()

      expect(stats.totalPhotos).toBe(2)
      expect(stats.totalSize).toBeGreaterThan(0)
      expect(stats.totalOriginalSize).toBeGreaterThan(stats.totalSize)
      expect(stats.averageCompression).toBeGreaterThan(0)
      expect(stats.savedSpace).toBeGreaterThan(0)
    })
  })
})
