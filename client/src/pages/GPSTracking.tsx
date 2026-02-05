import React, { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock, AlertCircle, CheckCircle2, Pause, Play } from 'lucide-react';

interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy: number;
}

interface RouteData {
  startTime: number;
  endTime?: number;
  distance: number; // in meters
  points: LocationPoint[];
  isTracking: boolean;
}

export function GPSTracking() {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationPoint | null>(null);
  const [routeData, setRouteData] = useState<RouteData>({
    startTime: 0,
    distance: 0,
    points: [],
    isTracking: false,
  });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Get current location
  const getCurrentLocation = (): Promise<LocationPoint> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          resolve({
            latitude,
            longitude,
            timestamp: Date.now(),
            accuracy,
          });
        },
        (error) => reject(error)
      );
    });
  };

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (point1: LocationPoint, point2: LocationPoint): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1.latitude * Math.PI) / 180) *
        Math.cos((point2.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Start tracking
  const startTracking = async () => {
    try {
      setError(null);
      const location = await getCurrentLocation();
      
      setRouteData({
        startTime: Date.now(),
        distance: 0,
        points: [location],
        isTracking: true,
      });
      setCurrentLocation(location);
      setIsTracking(true);

      // Track location every 10 seconds
      const interval = setInterval(async () => {
        try {
          const newLocation = await getCurrentLocation();
          setCurrentLocation(newLocation);
          
          setRouteData((prev) => {
            const lastPoint = prev.points[prev.points.length - 1];
            const additionalDistance = calculateDistance(lastPoint, newLocation);
            
            return {
              ...prev,
              points: [...prev.points, newLocation],
              distance: prev.distance + additionalDistance,
            };
          });
        } catch (err) {
          console.error('Error getting location:', err);
        }
      }, 10000);

      // Store interval ID for cleanup
      (window as any).gpsTrackingInterval = interval;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
      setError(errorMessage);
      console.error('Error starting tracking:', err);
    }
  };

  // Stop tracking
  const stopTracking = () => {
    if ((window as any).gpsTrackingInterval) {
      clearInterval((window as any).gpsTrackingInterval);
    }
    
    setRouteData((prev) => ({
      ...prev,
      endTime: Date.now(),
      isTracking: false,
    }));
    setIsTracking(false);
  };

  // Pause/Resume tracking
  const togglePause = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  // Update elapsed time
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - routeData.startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isTracking, routeData.startTime]);

  // Format time
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format distance
  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">GPS Route Tracking</h1>
          <p className="text-muted-foreground">Track your field work route with real-time GPS data</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Tracking Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Tracking Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Status */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Status</p>
                <div className="flex items-center gap-2">
                  {isTracking ? (
                    <>
                      <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-semibold text-green-600">Tracking Active</span>
                    </>
                  ) : (
                    <>
                      <div className="h-3 w-3 bg-gray-400 rounded-full"></div>
                      <span className="font-semibold text-gray-600">Not Tracking</span>
                    </>
                  )}
                </div>
              </div>

              {/* Elapsed Time */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Elapsed Time</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="text-2xl font-bold font-mono">{formatTime(elapsedTime)}</span>
                </div>
              </div>

              {/* Distance */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Distance Traveled</p>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-orange-600" />
                  <span className="text-2xl font-bold">{formatDistance(routeData.distance)}</span>
                </div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex gap-3">
              {!isTracking ? (
                <Button onClick={startTracking} className="gap-2" size="lg">
                  <Play className="h-4 w-4" />
                  Start Tracking
                </Button>
              ) : (
                <>
                  <Button onClick={togglePause} variant="outline" className="gap-2" size="lg">
                    <Pause className="h-4 w-4" />
                    Pause
                  </Button>
                  <Button onClick={stopTracking} variant="destructive" className="gap-2" size="lg">
                    Stop Tracking
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current Location */}
        {currentLocation && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Current Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Latitude</span>
                  <code className="bg-gray-100 px-3 py-1 rounded font-mono">
                    {currentLocation.latitude.toFixed(6)}
                  </code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Longitude</span>
                  <code className="bg-gray-100 px-3 py-1 rounded font-mono">
                    {currentLocation.longitude.toFixed(6)}
                  </code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Accuracy</span>
                  <span className="font-semibold">±{Math.round(currentLocation.accuracy)} m</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="text-sm">
                    {new Date(currentLocation.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Route Points */}
        <Card>
          <CardHeader>
            <CardTitle>Route Points ({routeData.points.length})</CardTitle>
            <CardDescription>GPS coordinates recorded during tracking</CardDescription>
          </CardHeader>
          <CardContent>
            {routeData.points.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No route points recorded yet. Start tracking to record your route.
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {routeData.points.map((point, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-mono">
                        {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(point.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <Badge variant="outline">±{Math.round(point.accuracy)}m</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">GPS Tracking Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Keep your device with you while working in the field</li>
            <li>• GPS accuracy improves in open areas away from buildings</li>
            <li>• Location is updated every 10 seconds for optimal accuracy</li>
            <li>• Your route data is automatically saved to your activity log</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
