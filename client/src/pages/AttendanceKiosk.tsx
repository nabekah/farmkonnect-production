import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

export default function AttendanceKiosk() {
  const [mode, setMode] = useState<"select" | "pin" | "biometric">("select");
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [pinInput, setPinInput] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [currentTime, setCurrentTime] = useState(new Date());
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mock workers data
  const workers = [
    { id: 1, name: "John Doe", pin: "1234", position: "Field Worker" },
    { id: 2, name: "Jane Smith", pin: "5678", position: "Supervisor" },
    { id: 3, name: "Peter Johnson", pin: "9012", position: "Farm Manager" },
    { id: 4, name: "Mary Williams", pin: "3456", position: "Field Worker" },
    { id: 5, name: "David Brown", pin: "7890", position: "Equipment Operator" },
  ];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleWorkerSelect = (worker: any) => {
    setSelectedWorker(worker);
    setMode("pin");
    setPinInput("");
    setMessage("");
  };

  const handlePINSubmit = () => {
    if (pinInput === selectedWorker.pin) {
      handleClockIn();
    } else {
      setMessageType("error");
      setMessage("Invalid PIN. Please try again.");
      setPinInput("");
    }
  };

  const handleClockIn = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString();

    setMessageType("success");
    setMessage(`✓ ${selectedWorker.name} clocked in at ${timeString}`);

    // Reset after 3 seconds
    setTimeout(() => {
      setMode("select");
      setSelectedWorker(null);
      setPinInput("");
      setMessage("");
    }, 3000);
  };

  const handleBiometricCapture = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        // In real implementation, send to biometric service
        handleClockIn();
      }
    }
  };

  const startBiometric = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setMessageType("error");
      setMessage("Unable to access camera. Please use PIN authentication.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Attendance Kiosk</h1>
          <p className="text-gray-600 mt-2">Clock In / Clock Out</p>
          <div className="text-5xl font-bold text-indigo-600 mt-4 font-mono">
            {currentTime.toLocaleTimeString()}
          </div>
          <div className="text-lg text-gray-600 mt-2">
            {currentTime.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>

        {/* Main Card */}
        <Card className="shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle>Worker Authentication</CardTitle>
            <CardDescription className="text-blue-100">
              {mode === "select" && "Select your name or enter PIN"}
              {mode === "pin" && "Enter your PIN to clock in"}
              {mode === "biometric" && "Scan your face to clock in"}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-8">
            {/* Message Alert */}
            {message && (
              <Alert className={`mb-6 ${messageType === "success" ? "bg-green-50 border-green-200" : messageType === "error" ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}>
                <div className="flex items-center gap-2">
                  {messageType === "success" && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {messageType === "error" && <XCircle className="h-5 w-5 text-red-600" />}
                  {messageType === "info" && <AlertCircle className="h-5 w-5 text-blue-600" />}
                  <AlertDescription className={messageType === "success" ? "text-green-800" : messageType === "error" ? "text-red-800" : "text-blue-800"}>
                    {message}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {/* Worker Selection */}
            {mode === "select" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {workers.map((worker) => (
                    <button
                      key={worker.id}
                      onClick={() => handleWorkerSelect(worker)}
                      className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all text-left"
                    >
                      <div className="font-bold text-gray-900">{worker.name}</div>
                      <div className="text-sm text-gray-600">{worker.position}</div>
                    </button>
                  ))}
                </div>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or use authentication method</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setMode("pin");
                      setPinInput("");
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
                  >
                    PIN Authentication
                  </Button>
                  <Button
                    onClick={() => {
                      setMode("biometric");
                      startBiometric();
                    }}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-6 text-lg"
                  >
                    Biometric (Face)
                  </Button>
                </div>
              </div>
            )}

            {/* PIN Entry */}
            {mode === "pin" && selectedWorker && (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-center text-gray-700">
                    <span className="font-bold text-lg">{selectedWorker.name}</span>
                    <br />
                    <span className="text-sm text-gray-600">{selectedWorker.position}</span>
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Enter Your PIN</label>
                  <Input
                    type="password"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.slice(0, 4))}
                    placeholder="••••"
                    className="text-center text-4xl font-bold tracking-widest py-8 border-2"
                    maxLength={4}
                    onKeyPress={(e) => e.key === "Enter" && handlePINSubmit()}
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      onClick={() => setPinInput((prev) => (prev.length < 4 ? prev + num : prev))}
                      className="p-4 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold text-xl transition-colors"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={() => setPinInput((prev) => prev.slice(0, -1))}
                    className="p-4 bg-red-100 hover:bg-red-200 rounded-lg font-bold text-xl transition-colors col-span-3"
                  >
                    Clear
                  </button>
                </div>

                <div className="flex gap-3">
                  <Button onClick={() => setMode("select")} variant="outline" className="flex-1 py-6">
                    Back
                  </Button>
                  <Button onClick={handlePINSubmit} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 text-lg">
                    <Clock className="mr-2 h-5 w-5" />
                    Clock In
                  </Button>
                </div>
              </div>
            )}

            {/* Biometric Entry */}
            {mode === "biometric" && selectedWorker && (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-center text-gray-700">
                    <span className="font-bold text-lg">{selectedWorker.name}</span>
                    <br />
                    <span className="text-sm text-gray-600">{selectedWorker.position}</span>
                  </p>
                </div>

                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover" />
                  <canvas ref={canvasRef} className="hidden" width={640} height={480} />
                </div>

                <div className="flex gap-3">
                  <Button onClick={() => setMode("select")} variant="outline" className="flex-1 py-6">
                    Back
                  </Button>
                  <Button onClick={handleBiometricCapture} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 text-lg">
                    <Clock className="mr-2 h-5 w-5" />
                    Capture & Clock In
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600">
          <p className="text-sm">FarmKonnect Attendance System</p>
          <p className="text-xs mt-1">For support, contact your farm manager</p>
        </div>
      </div>
    </div>
  );
}
