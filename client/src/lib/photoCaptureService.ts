/**
 * Photo Capture Service
 * Handles camera access, photo capture, compression, and upload
 */

export interface CapturedPhoto {
  id: string
  taskId: number
  photoData: Blob
  thumbnail?: Blob
  timestamp: number
  location?: { latitude: number; longitude: number }
  metadata: {
    width: number
    height: number
    mimeType: string
    size: number
    originalSize: number
    compressionRatio: number
  }
}

export interface PhotoUploadProgress {
  photoId: string
  progress: number // 0-100
  status: 'pending' | 'uploading' | 'completed' | 'failed'
  error?: string
}

export class PhotoCaptureService {
  private videoStream: MediaStream | null = null
  private videoElement: HTMLVideoElement | null = null
  private canvasElement: HTMLCanvasElement | null = null
  private photos: Map<string, CapturedPhoto> = new Map()
  private uploadListeners: Set<(progress: PhotoUploadProgress) => void> = new Set()

  /**
   * Request camera permission
   */
  async requestCameraPermission(): Promise<boolean> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('Camera not supported')
      return false
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Back camera for mobile
        audio: false,
      })

      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach((track) => track.stop())
      return true
    } catch (error) {
      console.error('Camera permission denied:', error)
      return false
    }
  }

  /**
   * Start camera preview
   */
  async startCamera(videoElement: HTMLVideoElement): Promise<boolean> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Camera not supported')
        return false
      }

      this.videoElement = videoElement

      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      videoElement.srcObject = this.videoStream
      await videoElement.play()

      return true
    } catch (error) {
      console.error('Error starting camera:', error)
      return false
    }
  }

  /**
   * Stop camera preview
   */
  stopCamera(): void {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach((track) => track.stop())
      this.videoStream = null
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null
    }
  }

  /**
   * Capture photo from video stream
   */
  async capturePhoto(
    taskId: number,
    location?: { latitude: number; longitude: number }
  ): Promise<CapturedPhoto | null> {
    if (!this.videoElement) {
      console.error('Video element not initialized')
      return null
    }

    try {
      // Create canvas if not exists
      if (!this.canvasElement) {
        this.canvasElement = document.createElement('canvas')
      }

      const canvas = this.canvasElement
      canvas.width = this.videoElement.videoWidth
      canvas.height = this.videoElement.videoHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        console.error('Could not get canvas context')
        return null
      }

      ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height)

      // Convert to blob
      const photoBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!)
        }, 'image/jpeg', 0.8)
      })

      // Compress thumbnail
      const thumbnailBlob = await this.createThumbnail(canvas)

      const photoId = `photo-${taskId}-${Date.now()}`
      const originalSize = photoBlob.size

      // Compress photo
      const compressedBlob = await this.compressPhoto(photoBlob)
      const compressionRatio = (1 - compressedBlob.size / originalSize) * 100

      const photo: CapturedPhoto = {
        id: photoId,
        taskId,
        photoData: compressedBlob,
        thumbnail: thumbnailBlob,
        timestamp: Date.now(),
        location,
        metadata: {
          width: canvas.width,
          height: canvas.height,
          mimeType: 'image/jpeg',
          size: compressedBlob.size,
          originalSize,
          compressionRatio,
        },
      }

      this.photos.set(photoId, photo)
      console.log(`Captured photo ${photoId}`)

      return photo
    } catch (error) {
      console.error('Error capturing photo:', error)
      return null
    }
  }

  /**
   * Compress photo to reduce file size
   */
  private async compressPhoto(blob: Blob, quality: number = 0.7): Promise<Blob> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.readAsDataURL(blob)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height

          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0)
          }

          canvas.toBlob((compressedBlob) => {
            resolve(compressedBlob || blob)
          }, 'image/jpeg', quality)
        }
      }
    })
  }

  /**
   * Create thumbnail for photo
   */
  private async createThumbnail(
    canvas: HTMLCanvasElement,
    maxWidth: number = 200,
    maxHeight: number = 200
  ): Promise<Blob> {
    return new Promise((resolve) => {
      const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height)
      const width = canvas.width * ratio
      const height = canvas.height * ratio

      const thumbCanvas = document.createElement('canvas')
      thumbCanvas.width = width
      thumbCanvas.height = height

      const ctx = thumbCanvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(canvas, 0, 0, width, height)
      }

      thumbCanvas.toBlob((blob) => {
        resolve(blob || new Blob())
      }, 'image/jpeg', 0.6)
    })
  }

  /**
   * Get captured photo
   */
  getPhoto(photoId: string): CapturedPhoto | undefined {
    return this.photos.get(photoId)
  }

  /**
   * Get all photos for a task
   */
  getTaskPhotos(taskId: number): CapturedPhoto[] {
    return Array.from(this.photos.values()).filter((photo) => photo.taskId === taskId)
  }

  /**
   * Delete photo
   */
  deletePhoto(photoId: string): boolean {
    return this.photos.delete(photoId)
  }

  /**
   * Upload photo to server
   */
  async uploadPhoto(photoId: string, uploadUrl: string): Promise<boolean> {
    const photo = this.photos.get(photoId)
    if (!photo) {
      console.error('Photo not found')
      return false
    }

    try {
      this.notifyUploadProgress({
        photoId,
        progress: 0,
        status: 'uploading',
      })

      const formData = new FormData()
      formData.append('photo', photo.photoData, `${photoId}.jpg`)
      formData.append('taskId', photo.taskId.toString())
      formData.append('timestamp', photo.timestamp.toString())

      if (photo.location) {
        formData.append('latitude', photo.location.latitude.toString())
        formData.append('longitude', photo.location.longitude.toString())
      }

      formData.append('metadata', JSON.stringify(photo.metadata))

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          this.notifyUploadProgress({
            photoId,
            progress,
            status: 'uploading',
          })
        }
      })

      return new Promise((resolve) => {
        xhr.addEventListener('load', () => {
          if (xhr.status === 200 || xhr.status === 201) {
            this.notifyUploadProgress({
              photoId,
              progress: 100,
              status: 'completed',
            })
            resolve(true)
          } else {
            this.notifyUploadProgress({
              photoId,
              progress: 0,
              status: 'failed',
              error: `Upload failed with status ${xhr.status}`,
            })
            resolve(false)
          }
        })

        xhr.addEventListener('error', () => {
          this.notifyUploadProgress({
            photoId,
            progress: 0,
            status: 'failed',
            error: 'Network error',
          })
          resolve(false)
        })

        xhr.open('POST', uploadUrl)
        xhr.send(formData)
      })
    } catch (error) {
      this.notifyUploadProgress({
        photoId,
        progress: 0,
        status: 'failed',
        error: String(error),
      })
      return false
    }
  }

  /**
   * Subscribe to upload progress
   */
  onUploadProgress(callback: (progress: PhotoUploadProgress) => void) {
    this.uploadListeners.add(callback)
    return () => this.uploadListeners.delete(callback)
  }

  private notifyUploadProgress(progress: PhotoUploadProgress): void {
    this.uploadListeners.forEach((callback) => callback(progress))
  }

  /**
   * Get photo statistics
   */
  getStatistics() {
    const photos = Array.from(this.photos.values())
    const totalSize = photos.reduce((sum, photo) => sum + photo.metadata.size, 0)
    const totalOriginalSize = photos.reduce((sum, photo) => sum + photo.metadata.originalSize, 0)
    const averageCompression =
      photos.length > 0
        ? photos.reduce((sum, photo) => sum + photo.metadata.compressionRatio, 0) / photos.length
        : 0

    return {
      totalPhotos: photos.length,
      totalSize,
      totalOriginalSize,
      averageCompression,
      savedSpace: totalOriginalSize - totalSize,
    }
  }

  /**
   * Clear all photos
   */
  clear(): void {
    this.photos.clear()
    this.stopCamera()
    this.canvasElement = null
    this.videoElement = null
  }
}

// Export singleton instance
export const photoCaptureService = new PhotoCaptureService()
