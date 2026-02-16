import React, { useEffect, useState } from 'react'
import { usePhotoCapture } from '@/hooks/usePhotoCapture'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Camera, Trash2, Upload, Download } from 'lucide-react'

interface PhotoCaptureProps {
  taskId: number
  taskTitle: string
  onPhotosChange?: (photos: any[]) => void
}

export function PhotoCapture({ taskId, taskTitle, onPhotosChange }: PhotoCaptureProps) {
  const {
    videoRef,
    isSupported,
    hasPermission,
    isCameraActive,
    isCapturing,
    error,
    photos,
    uploadProgress,
    requestCameraPermission,
    startCamera,
    stopCamera,
    capturePhoto,
    getTaskPhotos,
    deletePhoto,
    uploadPhoto,
    getStatistics,
  } = usePhotoCapture()

  const [taskPhotos, setTaskPhotos] = useState<any[]>([])
  const [showCamera, setShowCamera] = useState(false)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    const photos = getTaskPhotos(taskId)
    setTaskPhotos(photos)
    setStats(getStatistics())
    onPhotosChange?.(photos)
  }, [taskId, getTaskPhotos, getStatistics, onPhotosChange])

  const handleStartCamera = async () => {
    const success = await startCamera()
    if (success) {
      setShowCamera(true)
    }
  }

  const handleStopCamera = () => {
    stopCamera()
    setShowCamera(false)
  }

  const handleCapturePhoto = async () => {
    const photo = await capturePhoto(taskId)
    if (photo) {
      const updatedPhotos = getTaskPhotos(taskId)
      setTaskPhotos(updatedPhotos)
      setStats(getStatistics())
      onPhotosChange?.(updatedPhotos)
    }
  }

  const handleDeletePhoto = (photoId: string) => {
    if (deletePhoto(photoId)) {
      const updatedPhotos = getTaskPhotos(taskId)
      setTaskPhotos(updatedPhotos)
      setStats(getStatistics())
      onPhotosChange?.(updatedPhotos)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Photo Evidence
        </CardTitle>
        <CardDescription>{taskTitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isSupported && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900">Camera Not Supported</h4>
              <p className="text-sm text-red-700">Your device does not support camera access</p>
            </div>
          </div>
        )}

        {isSupported && !hasPermission && !showCamera && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 mb-3">
              Camera permission is required to capture photos
            </p>
            <Button
              onClick={requestCameraPermission}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Enable Camera
            </Button>
          </div>
        )}

        {isSupported && hasPermission && (
          <>
            {/* Camera Preview */}
            {showCamera && (
              <div className="space-y-3">
                <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    autoPlay
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCapturePhoto}
                    disabled={isCapturing}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    {isCapturing ? 'Capturing...' : 'Capture Photo'}
                  </Button>

                  <Button
                    onClick={handleStopCamera}
                    variant="outline"
                    className="flex-1"
                  >
                    Close Camera
                  </Button>
                </div>
              </div>
            )}

            {/* Camera Control */}
            {!showCamera && (
              <Button
                onClick={handleStartCamera}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Open Camera
              </Button>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Statistics */}
            {stats && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-2">Storage Stats</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                  <div>
                    <p className="font-medium">Total Photos</p>
                    <p className="text-lg font-bold">{stats.totalPhotos}</p>
                  </div>
                  <div>
                    <p className="font-medium">Total Size</p>
                    <p className="text-lg font-bold">{formatFileSize(stats.totalSize)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Compression</p>
                    <p className="text-lg font-bold">{Math.round(stats.averageCompression)}%</p>
                  </div>
                  <div>
                    <p className="font-medium">Saved Space</p>
                    <p className="text-lg font-bold">{formatFileSize(stats.savedSpace)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Photos Gallery */}
            {taskPhotos.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Captured Photos ({taskPhotos.length})</h4>

                <div className="grid grid-cols-2 gap-3">
                  {taskPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square group"
                    >
                      {/* Thumbnail Preview */}
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-gray-400" />
                      </div>

                      {/* Overlay Actions */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white hover:bg-white text-gray-900"
                          onClick={() => handleDeletePhoto(photo.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Photo Info */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                        <p className="text-xs text-white font-medium">
                          {formatFileSize(photo.metadata.size)}
                        </p>
                        <p className="text-xs text-gray-300">
                          {new Date(photo.timestamp).toLocaleTimeString()}
                        </p>
                      </div>

                      {/* Upload Progress */}
                      {uploadProgress[photo.id] && (
                        <div className="absolute inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center">
                          <div className="w-12 h-12 rounded-full border-4 border-gray-300 border-t-blue-500 animate-spin"></div>
                          <p className="text-xs text-white mt-2">
                            {uploadProgress[photo.id].progress}%
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {taskPhotos.length === 0 && !showCamera && (
              <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No photos captured yet</p>
                <p className="text-xs text-gray-500 mt-1">
                  Capture photos to document task completion
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
