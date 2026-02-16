import React, { useEffect, useRef, useState } from 'react'
import { useGPS } from '@/hooks/useGPS'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, MapPin, Navigation, Zap } from 'lucide-react'

interface TaskLocationMapProps {
  taskId: number
  taskTitle: string
  taskLocation: {
    latitude: number
    longitude: number
    radius: number
    name: string
    address?: string
  }
}

export function TaskLocationMap({ taskId, taskTitle, taskLocation }: TaskLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const {
    isSupported,
    hasPermission,
    currentLocation,
    isTracking,
    requestPermission,
    startTracking,
    stopTracking,
    setTaskLocation,
    isWithinGeofence,
    getDistanceToTask,
    onGeofenceAlert,
  } = useGPS()

  const [distanceToTask, setDistanceToTask] = useState<number | null>(null)
  const [isInGeofence, setIsInGeofence] = useState(false)
  const [geofenceAlert, setGeofenceAlert] = useState<string | null>(null)

  useEffect(() => {
    // Set task location
    setTaskLocation({
      taskId,
      latitude: taskLocation.latitude,
      longitude: taskLocation.longitude,
      radius: taskLocation.radius,
      name: taskLocation.name,
      address: taskLocation.address,
    })

    // Subscribe to geofence alerts
    const unsubscribe = onGeofenceAlert((alert) => {
      if (alert.type === 'enter') {
        setGeofenceAlert('You have entered the task area!')
      } else if (alert.type === 'exit') {
        setGeofenceAlert('You have left the task area!')
      }

      // Clear alert after 3 seconds
      setTimeout(() => setGeofenceAlert(null), 3000)
    })

    return () => unsubscribe()
  }, [taskId, taskLocation, setTaskLocation, onGeofenceAlert])

  useEffect(() => {
    if (currentLocation) {
      const distance = getDistanceToTask(taskId, currentLocation)
      setDistanceToTask(distance)

      const inGeofence = isWithinGeofence(taskId, currentLocation)
      setIsInGeofence(inGeofence)
    }
  }, [currentLocation, taskId, getDistanceToTask, isWithinGeofence])

  const handleStartTracking = async () => {
    if (!hasPermission) {
      const granted = await requestPermission()
      if (!granted) return
    }

    startTracking(taskId)
  }

  const handleStopTracking = () => {
    const history = stopTracking(taskId)
    if (history) {
      console.log('Location history:', history)
    }
  }

  const formatDistance = (meters: number | null) => {
    if (meters === null) return 'N/A'
    if (meters < 1000) {
      return `${Math.round(meters)}m`
    }
    return `${(meters / 1000).toFixed(2)}km`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Task Location
        </CardTitle>
        <CardDescription>{taskTitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isSupported && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900">GPS Not Supported</h4>
              <p className="text-sm text-red-700">Your device does not support GPS</p>
            </div>
          </div>
        )}

        {isSupported && !hasPermission && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 mb-3">
              Location permission is required to track your position
            </p>
            <Button
              onClick={requestPermission}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Enable Location
            </Button>
          </div>
        )}

        {isSupported && hasPermission && (
          <>
            {/* Map Container */}
            <div
              ref={mapRef}
              className="w-full h-64 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center"
            >
              <div className="text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Map view coming soon</p>
                <p className="text-xs text-gray-500 mt-1">
                  Task: {taskLocation.latitude.toFixed(4)}, {taskLocation.longitude.toFixed(4)}
                </p>
              </div>
            </div>

            {/* Geofence Alert */}
            {geofenceAlert && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                <Zap className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800 font-medium">{geofenceAlert}</p>
              </div>
            )}

            {/* Location Status */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-3">
                  <p className="text-xs text-blue-700 font-medium mb-1">Distance to Task</p>
                  <p className="text-2xl font-bold text-blue-900">{formatDistance(distanceToTask)}</p>
                </CardContent>
              </Card>

              <Card className={`bg-gradient-to-br ${isInGeofence ? 'from-green-50 to-green-100 border-green-200' : 'from-red-50 to-red-100 border-red-200'}`}>
                <CardContent className="p-3">
                  <p className={`text-xs font-medium mb-1 ${isInGeofence ? 'text-green-700' : 'text-red-700'}`}>
                    Geofence Status
                  </p>
                  <Badge className={isInGeofence ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}>
                    {isInGeofence ? 'Inside' : 'Outside'}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Task Location Info */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-semibold text-gray-900 mb-2">{taskLocation.name}</p>
              {taskLocation.address && (
                <p className="text-xs text-gray-600 mb-2">{taskLocation.address}</p>
              )}
              <p className="text-xs text-gray-600">
                Coordinates: {taskLocation.latitude.toFixed(4)}, {taskLocation.longitude.toFixed(4)}
              </p>
              <p className="text-xs text-gray-600">
                Geofence Radius: {taskLocation.radius}m
              </p>
            </div>

            {/* Tracking Controls */}
            <div className="flex gap-2">
              {!isTracking ? (
                <Button
                  onClick={handleStartTracking}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  Start Tracking
                </Button>
              ) : (
                <Button
                  onClick={handleStopTracking}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  Stop Tracking
                </Button>
              )}

              <Button variant="outline" className="flex-1">
                <MapPin className="w-4 h-4 mr-2" />
                Navigate
              </Button>
            </div>

            {/* Tracking Status */}
            {isTracking && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                  Location tracking active
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
