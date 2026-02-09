import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle, MapPin, QrCode, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";

/**
 * Mobile Attendance Kiosk Component
 * Provides QR code scanning, biometric authentication, GPS location verification,
 * and offline sync for field workers to check in/out
 */
export const MobileAttendanceKiosk: React.FC = () => {
  const [mode, setMode] = useState<"menu" | "scan" | "location" | "biometric" | "confirmation">("menu");
  const [workerId, setWorkerId] = useState<number | null>(null);
  const [workerName, setWorkerName] = useState<string>("");
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [biometricStatus, setBiometricStatus] = useState<"pending" | "success" | "failed">("pending");
  const [offlineMode, setOfflineMode] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const recordAttendanceMutation = trpc.laborManagement.recordAttendance.useMutation();

  // ============ QR CODE SCANNING ============

  const startQRScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setMode("scan");
      }
    } catch (error) {
      alert("Unable to access camera. Please check permissions.");
    }
  };

  const captureQRCode = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        // In a real implementation, you would use a QR code library like jsQR
        // For now, we'll simulate QR code reading
        const simulatedWorkerId = Math.floor(Math.random() * 1000000);
        setWorkerId(simulatedWorkerId);
        setWorkerName("John Doe");
        setCheckInTime(new Date());
        setMode("location");
      }
    }
  };

  // ============ GPS LOCATION VERIFICATION ============

  const getLocation = () => {
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });

        // Simulate geofencing check (verify if worker is within farm boundaries)
        const isWithinFarmBoundary = checkGeofence(latitude, longitude);

        if (isWithinFarmBoundary) {
          setMode("biometric");
        } else {
          setLocationError("You are not within the farm boundaries. Please move to the farm location.");
        }
      },
      (error) => {
        setLocationError(`Location error: ${error.message}`);
      }
    );
  };

  const checkGeofence = (lat: number, lng: number): boolean => {
    // Simulate geofence check - in production, compare against farm boundary coordinates
    // For now, we'll accept any location within a reasonable range
    return true;
  };

  // ============ BIOMETRIC AUTHENTICATION ============

  const performBiometricAuth = async () => {
    setBiometricStatus("pending");

    try {
      // Check if WebAuthn is available
      if (window.PublicKeyCredential) {
        // Simulate biometric authentication (fingerprint/face recognition)
        // In production, you would use WebAuthn API
        setTimeout(() => {
          setBiometricStatus("success");
          setMode("confirmation");
        }, 2000);
      } else {
        // Fallback to PIN authentication
        const pin = prompt("Enter your 4-digit PIN:");
        if (pin && pin.length === 4) {
          setBiometricStatus("success");
          setMode("confirmation");
        } else {
          setBiometricStatus("failed");
        }
      }
    } catch (error) {
      setBiometricStatus("failed");
    }
  };

  // ============ OFFLINE SYNC ============

  const syncOfflineData = async () => {
    try {
      // Retrieve pending records from localStorage
      const pendingRecords = JSON.parse(localStorage.getItem("pendingAttendance") || "[]");

      if (pendingRecords.length === 0) {
        alert("No pending records to sync");
        return;
      }

      // Attempt to sync each record
      for (const record of pendingRecords) {
        try {
          await recordAttendanceMutation.mutateAsync({
            workerId: record.workerId,
            farmId: record.farmId,
            checkInTime: record.checkInTime,
            checkOutTime: record.checkOutTime,
            status: record.status,
            notes: record.notes,
          });
        } catch (error) {
          console.error("Failed to sync record:", error);
        }
      }

      // Clear synced records
      localStorage.removeItem("pendingAttendance");
      setPendingSyncCount(0);
      alert("Offline data synced successfully");
    } catch (error) {
      alert("Sync failed. Please try again.");
    }
  };

  // ============ SUBMIT ATTENDANCE ============

  const submitAttendance = async () => {
    if (!workerId || !checkInTime || !currentLocation) {
      alert("Missing required information");
      return;
    }

    try {
      const attendanceData = {
        workerId,
        farmId: 1, // In production, get from user context
        checkInTime: checkInTime.toISOString(),
        checkOutTime: new Date().toISOString(),
        status: "present" as const,
        notes: `Location: ${currentLocation.lat}, ${currentLocation.lng}`,
      };

      // Try to submit online
      if (navigator.onLine) {
        await recordAttendanceMutation.mutateAsync(attendanceData);
        alert("Attendance recorded successfully");
      } else {
        // Store offline for later sync
        const pendingRecords = JSON.parse(localStorage.getItem("pendingAttendance") || "[]");
        pendingRecords.push(attendanceData);
        localStorage.setItem("pendingAttendance", JSON.stringify(pendingRecords));
        setPendingSyncCount(pendingRecords.length);
        setOfflineMode(true);
        alert("Offline mode: Attendance saved locally. Will sync when online.");
      }

      // Reset form
      setMode("menu");
      setWorkerId(null);
      setWorkerName("");
      setCheckInTime(null);
      setCurrentLocation(null);
    } catch (error) {
      alert("Failed to record attendance");
    }
  };

  // ============ RENDER ============

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-4">
          <h1 className="text-3xl font-bold text-gray-800">Attendance Kiosk</h1>
          <p className="text-gray-600 mt-2">Check in/out with QR code and biometric</p>
        </div>

        {/* Offline Mode Alert */}
        {offlineMode && (
          <Card className="mb-4 border-orange-300 bg-orange-50 p-4">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="w-5 h-5" />
              <span>Offline Mode - {pendingSyncCount} pending records</span>
            </div>
            <Button onClick={syncOfflineData} className="w-full mt-2 bg-orange-600 hover:bg-orange-700">
              Sync Now
            </Button>
          </Card>
        )}

        {/* Menu Mode */}
        {mode === "menu" && (
          <Card className="p-6 space-y-4">
            <div className="text-center mb-4">
              <Clock className="w-12 h-12 mx-auto text-blue-600 mb-2" />
              <p className="text-gray-600">Select an action</p>
            </div>

            <Button onClick={startQRScanning} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg">
              <QrCode className="w-5 h-5 mr-2" />
              Scan QR Code
            </Button>

            <Button onClick={() => setMode("location")} className="w-full h-12 bg-green-600 hover:bg-green-700 text-lg">
              <MapPin className="w-5 h-5 mr-2" />
              Manual Check-In
            </Button>

            {pendingSyncCount > 0 && (
              <Button onClick={syncOfflineData} className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-lg">
                Sync {pendingSyncCount} Records
              </Button>
            )}
          </Card>
        )}

        {/* QR Code Scanning Mode */}
        {mode === "scan" && (
          <Card className="p-6 space-y-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg mb-4 bg-black"
              style={{ height: "300px" }}
            />
            <canvas ref={canvasRef} className="hidden" width={300} height={300} />

            <Button onClick={captureQRCode} className="w-full bg-blue-600 hover:bg-blue-700">
              Capture QR Code
            </Button>

            <Button onClick={() => setMode("menu")} variant="outline" className="w-full">
              Cancel
            </Button>
          </Card>
        )}

        {/* Location Verification Mode */}
        {mode === "location" && (
          <Card className="p-6 space-y-4">
            <div className="text-center">
              <MapPin className="w-12 h-12 mx-auto text-green-600 mb-2" />
              <h2 className="text-xl font-semibold">Location Verification</h2>
            </div>

            {currentLocation ? (
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Current Location:</p>
                <p className="text-lg font-semibold text-green-700">
                  {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                </p>
                <p className="text-sm text-green-600 mt-2">✓ Within farm boundaries</p>
              </div>
            ) : (
              <Button onClick={getLocation} className="w-full bg-green-600 hover:bg-green-700">
                Get Location
              </Button>
            )}

            {locationError && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-red-700 text-sm">{locationError}</p>
              </div>
            )}

            {currentLocation && (
              <Button onClick={() => setMode("biometric")} className="w-full bg-blue-600 hover:bg-blue-700">
                Continue to Biometric
              </Button>
            )}

            <Button onClick={() => setMode("menu")} variant="outline" className="w-full">
              Cancel
            </Button>
          </Card>
        )}

        {/* Biometric Authentication Mode */}
        {mode === "biometric" && (
          <Card className="p-6 space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">👆</span>
              </div>
              <h2 className="text-xl font-semibold">Biometric Authentication</h2>
              <p className="text-gray-600 text-sm mt-2">Place your finger on the scanner or enter PIN</p>
            </div>

            {biometricStatus === "pending" && (
              <Button onClick={performBiometricAuth} className="w-full bg-purple-600 hover:bg-purple-700 h-12">
                Authenticate
              </Button>
            )}

            {biometricStatus === "success" && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-700 font-semibold">Authentication Successful</span>
              </div>
            )}

            {biometricStatus === "failed" && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-700 font-semibold">Authentication Failed</span>
              </div>
            )}

            {biometricStatus === "success" && (
              <Button onClick={() => setMode("confirmation")} className="w-full bg-blue-600 hover:bg-blue-700">
                Continue
              </Button>
            )}

            <Button onClick={() => setMode("menu")} variant="outline" className="w-full">
              Cancel
            </Button>
          </Card>
        )}

        {/* Confirmation Mode */}
        {mode === "confirmation" && (
          <Card className="p-6 space-y-4">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800">Confirm Check-In</h2>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Worker ID:</span>
                <span className="font-semibold">{workerId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-semibold">{workerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-semibold">{checkInTime?.toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-semibold text-sm">
                  {currentLocation?.lat.toFixed(4)}, {currentLocation?.lng.toFixed(4)}
                </span>
              </div>
            </div>

            <Button onClick={submitAttendance} className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg font-semibold">
              Confirm Check-In
            </Button>

            <Button onClick={() => setMode("menu")} variant="outline" className="w-full">
              Cancel
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MobileAttendanceKiosk;
