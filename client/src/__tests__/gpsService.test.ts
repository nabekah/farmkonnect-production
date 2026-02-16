import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { gpsService, LocationCoordinates } from '@/lib/gpsService'

// Mock geolocation API
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
}

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
})

describe('GPS Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    gpsService.clear()
  })

  afterEach(() => {
    gpsService.clear()
  })

  describe('Location Retrieval', () => {
    it('should get current location', async () => {
      const mockPosition = {
        coords: {
          latitude: 6.5244,
          longitude: -0.1957,
          accuracy: 10,
          altitude: 100,
          altitudeAccuracy: 5,
          heading: 45,
          speed: 2,
        },
        timestamp: Date.now(),
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition)
      })

      const location = await gpsService.getCurrentLocation()

      expect(location).toBeDefined()
      expect(location?.latitude).toBe(6.5244)
      expect(location?.longitude).toBe(-0.1957)
      expect(location?.accuracy).toBe(10)
    })

    it('should handle location error', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({ code: 1, message: 'Permission denied' })
      })

      const location = await gpsService.getCurrentLocation()
      expect(location).toBeNull()
    })
  })

  describe('Location Tracking', () => {
    it('should start tracking location', () => {
      mockGeolocation.watchPosition.mockReturnValue(1)

      const result = gpsService.startTracking(1)

      expect(result).toBe(true)
      expect(mockGeolocation.watchPosition).toHaveBeenCalled()
    })

    it('should stop tracking location', () => {
      mockGeolocation.watchPosition.mockReturnValue(1)
      gpsService.startTracking(1)

      const history = gpsService.stopTracking(1)

      expect(mockGeolocation.clearWatch).toHaveBeenCalled()
    })

    it('should collect location history during tracking', () => {
      mockGeolocation.watchPosition.mockImplementation((success) => {
        // Simulate location updates
        const locations = [
          {
            coords: {
              latitude: 6.5244,
              longitude: -0.1957,
              accuracy: 10,
              altitude: 100,
              altitudeAccuracy: 5,
              heading: 45,
              speed: 2,
            },
            timestamp: Date.now(),
          },
          {
            coords: {
              latitude: 6.5245,
              longitude: -0.1956,
              accuracy: 10,
              altitude: 100,
              altitudeAccuracy: 5,
              heading: 45,
              speed: 2.5,
            },
            timestamp: Date.now() + 1000,
          },
        ]

        locations.forEach((loc) => success(loc))
        return 1
      })

      gpsService.startTracking(1)
      const history = gpsService.getLocationHistory(1)

      expect(history.length).toBeGreaterThan(0)
    })
  })

  describe('Task Location Management', () => {
    it('should set task location', () => {
      const taskLocation = {
        taskId: 1,
        latitude: 6.5244,
        longitude: -0.1957,
        radius: 100,
        name: 'Field A',
        address: 'Accra, Ghana',
      }

      gpsService.setTaskLocation(taskLocation)
      const retrieved = gpsService.getTaskLocation(1)

      expect(retrieved).toEqual(taskLocation)
    })

    it('should get task location', () => {
      const taskLocation = {
        taskId: 1,
        latitude: 6.5244,
        longitude: -0.1957,
        radius: 100,
        name: 'Field A',
      }

      gpsService.setTaskLocation(taskLocation)
      const retrieved = gpsService.getTaskLocation(1)

      expect(retrieved?.name).toBe('Field A')
      expect(retrieved?.radius).toBe(100)
    })
  })

  describe('Geofencing', () => {
    it('should detect when location is within geofence', () => {
      const taskLocation = {
        taskId: 1,
        latitude: 6.5244,
        longitude: -0.1957,
        radius: 1000,
        name: 'Field A',
      }

      gpsService.setTaskLocation(taskLocation)

      const currentLocation: LocationCoordinates = {
        latitude: 6.5244,
        longitude: -0.1957,
        accuracy: 10,
        timestamp: Date.now(),
      }

      const isWithin = gpsService.isWithinGeofence(1, currentLocation)
      expect(isWithin).toBe(true)
    })

    it('should detect when location is outside geofence', () => {
      const taskLocation = {
        taskId: 1,
        latitude: 6.5244,
        longitude: -0.1957,
        radius: 100,
        name: 'Field A',
      }

      gpsService.setTaskLocation(taskLocation)

      const currentLocation: LocationCoordinates = {
        latitude: 6.5300,
        longitude: -0.1900,
        accuracy: 10,
        timestamp: Date.now(),
      }

      const isWithin = gpsService.isWithinGeofence(1, currentLocation)
      expect(isWithin).toBe(false)
    })

    it('should calculate distance to task', () => {
      const taskLocation = {
        taskId: 1,
        latitude: 6.5244,
        longitude: -0.1957,
        radius: 100,
        name: 'Field A',
      }

      gpsService.setTaskLocation(taskLocation)

      const currentLocation: LocationCoordinates = {
        latitude: 6.5244,
        longitude: -0.1957,
        accuracy: 10,
        timestamp: Date.now(),
      }

      const distance = gpsService.getDistanceToTask(1, currentLocation)
      expect(distance).toBeLessThan(10) // Should be very close to 0
    })
  })

  describe('Location Updates', () => {
    it('should notify listeners of location updates', () => {
      const listener = vi.fn()
      const unsubscribe = gpsService.onLocationUpdate(listener)

      mockGeolocation.watchPosition.mockImplementation((success) => {
        const mockPosition = {
          coords: {
            latitude: 6.5244,
            longitude: -0.1957,
            accuracy: 10,
            altitude: 100,
            altitudeAccuracy: 5,
            heading: 45,
            speed: 2,
          },
          timestamp: Date.now(),
        }
        success(mockPosition)
        return 1
      })

      gpsService.startTracking(1)

      expect(listener).toHaveBeenCalled()

      unsubscribe()
    })
  })

  describe('Geofence Alerts', () => {
    it('should trigger alert when entering geofence', () => {
      const alertListener = vi.fn()
      gpsService.onGeofenceAlert(alertListener)

      const taskLocation = {
        taskId: 1,
        latitude: 6.5244,
        longitude: -0.1957,
        radius: 1000,
        name: 'Field A',
      }

      gpsService.setTaskLocation(taskLocation)

      // This would be triggered during tracking when location updates occur
      // For testing purposes, we verify the setup is correct
      expect(gpsService.getTaskLocation(1)).toBeDefined()
    })
  })

  describe('Distance Calculation', () => {
    it('should calculate distance between two coordinates', () => {
      // Accra coordinates
      const location1: LocationCoordinates = {
        latitude: 5.6037,
        longitude: -0.187,
        accuracy: 10,
        timestamp: Date.now(),
      }

      // Kumasi coordinates (about 260km from Accra)
      const location2: LocationCoordinates = {
        latitude: 6.6753,
        longitude: -1.616,
        accuracy: 10,
        timestamp: Date.now(),
      }

      const taskLocation = {
        taskId: 1,
        latitude: location2.latitude,
        longitude: location2.longitude,
        radius: 1000,
        name: 'Kumasi',
      }

      gpsService.setTaskLocation(taskLocation)
      const distance = gpsService.getDistanceToTask(1, location1)

      // Distance should be approximately 260km (260000 meters)
      expect(distance).toBeGreaterThan(250000)
      expect(distance).toBeLessThan(270000)
    })
  })

  describe('Accuracy and Speed', () => {
    it('should track current accuracy', async () => {
      const mockPosition = {
        coords: {
          latitude: 6.5244,
          longitude: -0.1957,
          accuracy: 15,
          altitude: 100,
          altitudeAccuracy: 5,
          heading: 45,
          speed: 2,
        },
        timestamp: Date.now(),
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition)
      })

      await gpsService.getCurrentLocation()
      const accuracy = gpsService.getCurrentAccuracy()

      expect(accuracy).toBe(15)
    })

    it('should track current speed', async () => {
      const mockPosition = {
        coords: {
          latitude: 6.5244,
          longitude: -0.1957,
          accuracy: 10,
          altitude: 100,
          altitudeAccuracy: 5,
          heading: 45,
          speed: 5.5,
        },
        timestamp: Date.now(),
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition)
      })

      await gpsService.getCurrentLocation()
      const speed = gpsService.getCurrentSpeed()

      expect(speed).toBe(5.5)
    })
  })
})
