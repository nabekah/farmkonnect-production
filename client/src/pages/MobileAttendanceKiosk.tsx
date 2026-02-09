import React, { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Fingerprint, Lock, CheckCircle, AlertCircle } from "lucide-react";

export default function MobileAttendanceKiosk() {
  const [authMethod, setAuthMethod] = useState<"pin" | "biometric" | null>(null);
  const [pin, setPin] = useState("");
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Mock worker data
  const workers = [
    { id: 1, name: "Kwame Mensah", pin: "1234", role: "Field Worker", lastClockIn: "08:00 AM" },
    { id: 2, name: "Ama Osei", pin: "5678", role: "Farm Manager", lastClockIn: "07:30 AM" },
    { id: 3, name: "Kofi Boateng", pin: "9012", role: "Technician", lastClockIn: "08:15 AM" },
    { id: 4, name: "Akosua Addo", pin: "3456", role: "Worker", lastClockIn: "08:30 AM" },
    { id: 5, name: "Yaw Mensah", pin: "7890", role: "Driver", lastClockIn: "07:45 AM" },
  ];

  const handlePinInput = (digit: string) => {
    if (pin.length < 4) {
      setPin(pin + digit);
    }
  };

  const handlePinDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handlePinSubmit = () => {
    const worker = workers.find((w) => w.pin === pin);
    if (worker) {
      setSelectedWorker(worker);
      setAttendanceStatus("success");
      setStatusMessage(`Welcome ${worker.name}! Clock in recorded at ${new Date().toLocaleTimeString()}`);
      setPin("");
      setTimeout(() => {
        setAuthMethod(null);
        setAttendanceStatus("idle");
        setSelectedWorker(null);
      }, 3000);
    } else {
      setAttendanceStatus("error");
      setStatusMessage("Invalid PIN. Please try again.");
      setPin("");
      setTimeout(() => {
        setAttendanceStatus("idle");
      }, 2000);
    }
  };

  const handleBiometricScan = async () => {
    setIsBiometricScanning(true);
    // Simulate biometric scanning
    setTimeout(() => {
      const randomWorker = workers[Math.floor(Math.random() * workers.length)];
      setSelectedWorker(randomWorker);
      setAttendanceStatus("success");
      setStatusMessage(`Biometric match: ${randomWorker.name}! Clock in recorded at ${new Date().toLocaleTimeString()}`);
      setIsBiometricScanning(false);
      setTimeout(() => {
        setAuthMethod(null);
        setAttendanceStatus("idle");
        setSelectedWorker(null);
      }, 3000);
    }, 2000);
  };

  // Idle screen - Select authentication method
  if (!authMethod) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <Clock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Attendance Kiosk</CardTitle>
            <CardDescription>Select authentication method to clock in/out</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Button
              onClick={() => setAuthMethod("pin")}
              className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold flex items-center justify-center gap-3"
            >
              <Lock className="h-6 w-6" />
              PIN Authentication
            </Button>

            <Button
              onClick={() => setAuthMethod("biometric")}
              className="w-full h-16 bg-purple-600 hover:bg-purple-700 text-white text-lg font-semibold flex items-center justify-center gap-3"
            >
              <Fingerprint className="h-6 w-6" />
              Biometric Scan
            </Button>

            <div className="pt-4 border-t text-center text-sm text-gray-600">
              <p>Farm: Akosua's Organic Farm</p>
              <p>Time: {new Date().toLocaleTimeString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // PIN authentication screen
  if (authMethod === "pin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <CardTitle>Enter PIN</CardTitle>
            <CardDescription>4-digit PIN required</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* PIN Display */}
            <div className="bg-gray-100 rounded-lg p-6 text-center">
              <div className="text-4xl font-bold tracking-widest text-gray-800">
                {"●".repeat(pin.length)}
                {pin.length < 4 && "○".repeat(4 - pin.length)}
              </div>
            </div>

            {/* Status Messages */}
            {attendanceStatus === "error" && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{statusMessage}</AlertDescription>
              </Alert>
            )}

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <Button
                  key={digit}
                  onClick={() => handlePinInput(digit.toString())}
                  disabled={pin.length >= 4}
                  className="h-14 text-xl font-bold bg-blue-100 hover:bg-blue-200 text-blue-900 disabled:opacity-50"
                >
                  {digit}
                </Button>
              ))}

              <Button
                onClick={() => setAuthMethod(null)}
                className="col-span-2 h-14 bg-gray-400 hover:bg-gray-500 text-white font-bold"
              >
                Back
              </Button>

              <Button
                onClick={() => handlePinInput("0")}
                disabled={pin.length >= 4}
                className="h-14 text-xl font-bold bg-blue-100 hover:bg-blue-200 text-blue-900 disabled:opacity-50"
              >
                0
              </Button>
            </div>

            {/* Delete and Submit */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handlePinDelete}
                className="h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold"
              >
                Delete
              </Button>

              <Button
                onClick={handlePinSubmit}
                disabled={pin.length !== 4}
                className="h-12 bg-green-600 hover:bg-green-700 text-white font-bold disabled:opacity-50"
              >
                Submit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Biometric authentication screen
  if (authMethod === "biometric") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <Fingerprint className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <CardTitle>Biometric Authentication</CardTitle>
            <CardDescription>Place your finger on the scanner</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Biometric Scanner Animation */}
            <div className="bg-gradient-to-b from-purple-100 to-purple-50 rounded-lg p-8 text-center">
              <div className="relative w-32 h-32 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-purple-600 animate-pulse"></div>
                <Fingerprint className={`h-16 w-16 text-purple-600 mx-auto mt-8 ${isBiometricScanning ? "animate-bounce" : ""}`} />
              </div>
              <p className="text-sm text-gray-600 mt-4">
                {isBiometricScanning ? "Scanning..." : "Ready to scan"}
              </p>
            </div>

            {/* Status Messages */}
            {attendanceStatus === "success" && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{statusMessage}</AlertDescription>
              </Alert>
            )}

            {attendanceStatus === "error" && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{statusMessage}</AlertDescription>
              </Alert>
            )}

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setAuthMethod(null)}
                className="h-12 bg-gray-400 hover:bg-gray-500 text-white font-bold"
              >
                Back
              </Button>

              <Button
                onClick={handleBiometricScan}
                disabled={isBiometricScanning}
                className="h-12 bg-green-600 hover:bg-green-700 text-white font-bold disabled:opacity-50"
              >
                {isBiometricScanning ? "Scanning..." : "Scan"}
              </Button>
            </div>

            {/* Worker List for Testing */}
            <div className="pt-4 border-t">
              <p className="text-xs text-gray-600 mb-2">Registered Workers:</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {workers.map((w) => (
                  <div key={w.id} className="text-xs text-gray-700 p-1 bg-gray-50 rounded">
                    {w.name} - {w.role}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}
