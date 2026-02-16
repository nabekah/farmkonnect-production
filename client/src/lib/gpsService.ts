/**
 * GPS Location Service
 * Handles geolocation, tracking, and location-based features
 */

export interface LocationCoordinates {
  latitude: number
  longitude: number
  accuracy: number
  altitude?: number
  altitudeAccuracy?: number
  heading?: number
  speed?: number
  timestamp: number
}

export interface TaskLocation {
  taskId: number
  latitude: number
  longitude: number
  radius: number // Geofence radius in meters
  name: string
  address?: string
}

export interface LocationHistory {
  taskId: number
  locations: LocationCoordinates[]
  startTime: number
  endTime?: number
  totalDistance: number
  averageSpeed: number
}

export class GPSService {
  private watchId: number | null = null
  private currentLocation: LocationCoordinates | null = null
  private locationHistory: Map<number, LocationCoordinates[]> = new Map()
  private taskLocations: Map<number, TaskLocation> = new Map()
  private geofenceAlerts: Set<(alert: any) => void> = new Set()
  private locationUpdates: Set<(location: LocationCoordinates) => void> = new Set()
  private isTracking = false
  private trackingStartTime = 0

  /**
   * Request location permission and get current position
   */
  async requestLocationPermission(): Promise<boolean> {
    if (!('geolocation' in navigator)) {
      console.error('Geolocation not supported')
      return false
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' })

      if (permission.state === 'denied') {
        console.error('Location permission denied')
        return false
      }

      if (permission.state === 'prompt') {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve(true),
            () => resolve(false),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          )
        })
      }

      return true
    } catch (error) {
      console.error('Error requesting location permission:', error)
      return false
    }
  }

  /**
   * Get current device location
   */
  async getCurrentLocation(): Promise<LocationCoordinates | null> {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LocationCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude ?? undefined,
            altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
            heading: position.coords.heading ?? undefined,
            speed: position.coords.speed ?? undefined,
            timestamp: position.timestamp,
          }
          this.currentLocation = location
          resolve(location)
        },
        (error) => {
          console.error('Error getting location:', error)
          resolve(null)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    })
  }

  /**
   * Start tracking location for a task
   */
  startTracking(taskId: number): boolean {
    if (this.isTracking) {
      console.warn('Already tracking')
      return false
    }

    this.isTracking = true
    this.trackingStartTime = Date.now()
    this.locationHistory.set(taskId, [])

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: LocationCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude ?? undefined,
          altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
          heading: position.coords.heading ?? undefined,
          speed: position.coords.speed ?? undefined,
          timestamp: position.timestamp,
        }

        this.currentLocation = location

        // Add to history
        const history = this.locationHistory.get(taskId) || []
        history.push(location)
        this.locationHistory.set(taskId, history)

        // Check geofences
        this.checkGeofences(location)

        // Notify listeners
        this.locationUpdates.forEach((callback) => callback(location))
      },
      (error) => {
        console.error('Tracking error:', error)
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    )

    console.log(`Started tracking task ${taskId}`)
    return true
  }

  /**
   * Stop tracking location
   */
  stopTracking(taskId: number): LocationHistory | null {
    if (!this.isTracking || this.watchId === null) {
      console.warn('Not tracking')
      return null
    }

    navigator.geolocation.clearWatch(this.watchId)
    this.watchId = null
    this.isTracking = false

    const locations = this.locationHistory.get(taskId) || []
    if (locations.length === 0) {
      return null
    }

    const totalDistance = this.calculateTotalDistance(locations)
    const averageSpeed = this.calculateAverageSpeed(locations)

    const history: LocationHistory = {
      taskId,
      locations,
      startTime: this.trackingStartTime,
      endTime: Date.now(),
      totalDistance,
      averageSpeed,
    }

    console.log(`Stopped tracking task ${taskId}`)
    return history
  }

  /**
   * Set task location (geofence)
   */
  setTaskLocation(taskLocation: TaskLocation): void {
    this.taskLocations.set(taskLocation.taskId, taskLocation)
    console.log(`Set location for task ${taskLocation.taskId}`)
  }

  /**
   * Get task location
   */
  getTaskLocation(taskId: number): TaskLocation | undefined {
    return this.taskLocations.get(taskId)
  }

  /**
   * Check if device is within task geofence
   */
  isWithinGeofence(taskId: number, location: LocationCoordinates): boolean {
    const taskLocation = this.taskLocations.get(taskId)
    if (!taskLocation) return false

    const distance = this.calculateDistance(
      location.latitude,
      location.longitude,
      taskLocation.latitude,
      taskLocation.longitude
    )

    return distance <= taskLocation.radius
  }

  /**
   * Get distance to task location in meters
   */
  getDistanceToTask(taskId: number, location?: LocationCoordinates): number | null {
    const currentLoc = location || this.currentLocation
    if (!currentLoc) return null

    const taskLocation = this.taskLocations.get(taskId)
    if (!taskLocation) return null

    return this.calculateDistance(
      currentLoc.latitude,
      currentLoc.longitude,
      taskLocation.latitude,
      taskLocation.longitude
    )
  }

  /**
   * Get location history for a task
   */
  getLocationHistory(taskId: number): LocationCoordinates[] {
    return this.locationHistory.get(taskId) || []
  }

  /**
   * Subscribe to location updates
   */
  onLocationUpdate(callback: (location: LocationCoordinates) => void) {
    this.locationUpdates.add(callback)
    return () => this.locationUpdates.delete(callback)
  }

  /**
   * Subscribe to geofence alerts
   */
  onGeofenceAlert(callback: (alert: any) => void) {
    this.geofenceAlerts.add(callback)
    return () => this.geofenceAlerts.delete(callback)
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000 // Earth's radius in meters
    const dLat = this.toRad(lat2 - lat1)
    const dLon = this.toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Convert degrees to radians
   */
  private toRad(deg: number): number {
    return (deg * Math.PI) / 180
  }

  /**
   * Calculate total distance traveled
   */
  private calculateTotalDistance(locations: LocationCoordinates[]): number {
    if (locations.length < 2) return 0

    let totalDistance = 0
    for (let i = 1; i < locations.length; i++) {
      const distance = this.calculateDistance(
        locations[i - 1].latitude,
        locations[i - 1].longitude,
        locations[i].latitude,
        locations[i].longitude
      )
      totalDistance += distance
    }

    return totalDistance
  }

  /**
   * Calculate average speed
   */
  private calculateAverageSpeed(locations: LocationCoordinates[]): number {
    if (locations.length < 2) return 0

    const totalDistance = this.calculateTotalDistance(locations)
    const totalTime = (locations[locations.length - 1].timestamp - locations[0].timestamp) / 1000 // seconds
    return totalTime > 0 ? totalDistance / totalTime : 0 // m/s
  }

  /**
   * Check geofences and trigger alerts
   */
  private checkGeofences(location: LocationCoordinates): void {
    this.taskLocations.forEach((taskLocation, taskId) => {
      const isInside = this.isWithinGeofence(taskId, location)
      const wasInside = this.currentLocation
        ? this.isWithinGeofence(taskId, this.currentLocation)
        : false

      if (isInside && !wasInside) {
        // Entered geofence
        this.geofenceAlerts.forEach((callback) =>
          callback({
            type: 'enter',
            taskId,
            location: taskLocation,
            timestamp: Date.now(),
          })
        )
      } else if (!isInside && wasInside) {
        // Exited geofence
        this.geofenceAlerts.forEach((callback) =>
          callback({
            type: 'exit',
            taskId,
            location: taskLocation,
            timestamp: Date.now(),
          })
        )
      }
    })
  }

  /**
   * Get current location accuracy
   */
  getCurrentAccuracy(): number | null {
    return this.currentLocation?.accuracy ?? null
  }

  /**
   * Get current speed
   */
  getCurrentSpeed(): number | null {
    return this.currentLocation?.speed ?? null
  }

  /**
   * Clear all data
   */
  clear(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
    }
    this.currentLocation = null
    this.locationHistory.clear()
    this.taskLocations.clear()
    this.isTracking = false
  }
}

// Export singleton instance
export const gpsService = new GPSService()
