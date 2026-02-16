import { useEffect, useState, useCallback } from 'react'
import { gpsService, LocationCoordinates, TaskLocation, LocationHistory } from '@/lib/gpsService'

interface GPSStatus {
  isSupported: boolean
  hasPermission: boolean
  isTracking: boolean
  currentLocation: LocationCoordinates | null
  currentAccuracy: number | null
  currentSpeed: number | null
  error?: string
}

export function useGPS() {
  const [status, setStatus] = useState<GPSStatus>({
    isSupported: 'geolocation' in navigator,
    hasPermission: false,
    isTracking: false,
    currentLocation: null,
    currentAccuracy: null,
    currentSpeed: null,
  })

  useEffect(() => {
    if (!status.isSupported) {
      return
    }

    // Subscribe to location updates
    const unsubscribeLocation = gpsService.onLocationUpdate((location) => {
      setStatus((prev) => ({
        ...prev,
        currentLocation: location,
        currentAccuracy: gpsService.getCurrentAccuracy(),
        currentSpeed: gpsService.getCurrentSpeed(),
      }))
    })

    return () => {
      unsubscribeLocation()
    }
  }, [status.isSupported])

  const requestPermission = useCallback(async () => {
    if (!status.isSupported) {
      setStatus((prev) => ({
        ...prev,
        error: 'Geolocation not supported',
      }))
      return false
    }

    try {
      const hasPermission = await gpsService.requestLocationPermission()
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

  const getCurrentLocation = useCallback(async () => {
    try {
      const location = await gpsService.getCurrentLocation()
      if (location) {
        setStatus((prev) => ({
          ...prev,
          currentLocation: location,
          currentAccuracy: gpsService.getCurrentAccuracy(),
        }))
      }
      return location
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        error: String(error),
      }))
      return null
    }
  }, [])

  const startTracking = useCallback((taskId: number) => {
    try {
      const success = gpsService.startTracking(taskId)
      setStatus((prev) => ({
        ...prev,
        isTracking: success,
      }))
      return success
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        error: String(error),
      }))
      return false
    }
  }, [])

  const stopTracking = useCallback((taskId: number) => {
    try {
      const history = gpsService.stopTracking(taskId)
      setStatus((prev) => ({
        ...prev,
        isTracking: false,
      }))
      return history
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        error: String(error),
      }))
      return null
    }
  }, [])

  const setTaskLocation = useCallback((taskLocation: TaskLocation) => {
    try {
      gpsService.setTaskLocation(taskLocation)
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        error: String(error),
      }))
    }
  }, [])

  const getTaskLocation = useCallback((taskId: number) => {
    return gpsService.getTaskLocation(taskId)
  }, [])

  const isWithinGeofence = useCallback(
    (taskId: number, location?: LocationCoordinates) => {
      if (!location && !status.currentLocation) return false
      return gpsService.isWithinGeofence(taskId, location || status.currentLocation!)
    },
    [status.currentLocation]
  )

  const getDistanceToTask = useCallback(
    (taskId: number, location?: LocationCoordinates) => {
      return gpsService.getDistanceToTask(taskId, location)
    },
    []
  )

  const getLocationHistory = useCallback((taskId: number) => {
    return gpsService.getLocationHistory(taskId)
  }, [])

  const onGeofenceAlert = useCallback((callback: (alert: any) => void) => {
    return gpsService.onGeofenceAlert(callback)
  }, [])

  return {
    // Status
    ...status,

    // Methods
    requestPermission,
    getCurrentLocation,
    startTracking,
    stopTracking,
    setTaskLocation,
    getTaskLocation,
    isWithinGeofence,
    getDistanceToTask,
    getLocationHistory,
    onGeofenceAlert,
  }
}
