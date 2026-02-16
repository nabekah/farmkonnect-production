import { useEffect, useState, useRef, useCallback } from 'react'
import { photoCaptureService, CapturedPhoto, PhotoUploadProgress } from '@/lib/photoCaptureService'

interface PhotoCaptureStatus {
  isSupported: boolean
  hasPermission: boolean
  isCameraActive: boolean
  isCapturing: boolean
  error?: string
}

export function usePhotoCapture() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<PhotoCaptureStatus>({
    isSupported: !!navigator.mediaDevices?.getUserMedia,
    hasPermission: false,
    isCameraActive: false,
    isCapturing: false,
  })

  const [uploadProgress, setUploadProgress] = useState<Map<string, PhotoUploadProgress>>(new Map())
  const [photos, setPhotos] = useState<CapturedPhoto[]>([])

  useEffect(() => {
    // Subscribe to upload progress
    const unsubscribe = photoCaptureService.onUploadProgress((progress) => {
      setUploadProgress((prev) => new Map(prev).set(progress.photoId, progress))
    })

    return () => {
      unsubscribe()
      photoCaptureService.clear()
    }
  }, [])

  const requestCameraPermission = useCallback(async () => {
    if (!status.isSupported) {
      setStatus((prev) => ({
        ...prev,
        error: 'Camera not supported',
      }))
      return false
    }

    try {
      const hasPermission = await photoCaptureService.requestCameraPermission()
      setStatus((prev) => ({
        ...prev,
        hasPermission,
        error: hasPermission ? undefined : 'Permission denied',
      }))
      return hasPermission
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        error: String(error),
      }))
      return false
    }
  }, [status.isSupported])

  const startCamera = useCallback(async () => {
    if (!videoRef.current) {
      setStatus((prev) => ({
        ...prev,
        error: 'Video element not available',
      }))
      return false
    }

    if (!status.hasPermission) {
      const granted = await requestCameraPermission()
      if (!granted) return false
    }

    try {
      const success = await photoCaptureService.startCamera(videoRef.current)
      setStatus((prev) => ({
        ...prev,
        isCameraActive: success,
        error: success ? undefined : 'Failed to start camera',
      }))
      return success
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        error: String(error),
      }))
      return false
    }
  }, [status.hasPermission, requestCameraPermission])

  const stopCamera = useCallback(() => {
    photoCaptureService.stopCamera()
    setStatus((prev) => ({
      ...prev,
      isCameraActive: false,
    }))
  }, [])

  const capturePhoto = useCallback(
    async (taskId: number, location?: { latitude: number; longitude: number }) => {
      if (!status.isCameraActive) {
        setStatus((prev) => ({
          ...prev,
          error: 'Camera not active',
        }))
        return null
      }

      try {
        setStatus((prev) => ({
          ...prev,
          isCapturing: true,
        }))

        const photo = await photoCaptureService.capturePhoto(taskId, location)

        if (photo) {
          setPhotos((prev) => [...prev, photo])
        }

        setStatus((prev) => ({
          ...prev,
          isCapturing: false,
        }))

        return photo
      } catch (error) {
        setStatus((prev) => ({
          ...prev,
          isCapturing: false,
          error: String(error),
        }))
        return null
      }
    },
    [status.isCameraActive]
  )

  const getTaskPhotos = useCallback((taskId: number) => {
    return photoCaptureService.getTaskPhotos(taskId)
  }, [])

  const deletePhoto = useCallback((photoId: string) => {
    const success = photoCaptureService.deletePhoto(photoId)
    if (success) {
      setPhotos((prev) => prev.filter((p) => p.id !== photoId))
    }
    return success
  }, [])

  const uploadPhoto = useCallback(async (photoId: string, uploadUrl: string) => {
    return photoCaptureService.uploadPhoto(photoId, uploadUrl)
  }, [])

  const getStatistics = useCallback(() => {
    return photoCaptureService.getStatistics()
  }, [])

  return {
    // Refs
    videoRef,

    // Status
    ...status,

    // Photos
    photos,
    uploadProgress: Object.fromEntries(uploadProgress),

    // Methods
    requestCameraPermission,
    startCamera,
    stopCamera,
    capturePhoto,
    getTaskPhotos,
    deletePhoto,
    uploadPhoto,
    getStatistics,
  }
}
