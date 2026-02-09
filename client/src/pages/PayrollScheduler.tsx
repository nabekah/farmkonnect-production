import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Calendar, CheckCircle, AlertCircle, Play, Settings } from "lucide-react";

export default function PayrollScheduler() {
  const [scheduleType, setScheduleType] = useState("monthly");
  const [paymentDay, setPaymentDay] = useState("25");
  const [paymentTime, setPaymentTime] = useState("09:00");
  const [notifyWorkers, setNotifyWorkers] = useState(true);
  const [notifyManagement, setNotifyManagement] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");

  // Mock current schedule
  const currentSchedule = {
    scheduleType: "monthly",
    paymentDay: 25,
    paymentTime: "09:00",
    enabled: true,
    lastRun: "2026-02-08 09:15:30",
    nextRun: "2026-03-25 09:00:00",
    totalProcessed: 45,
    successRate: 98.5,
  };

  const handleSaveSchedule = () => {
    setMessageType("success");
    setMessage(`Payroll schedule updated successfully. Next run: ${currentSchedule.nextRun}`);

    setTimeout(() => setMessage(""), 3000);
  };

  const handleManualTrigger = () => {
    setMessageType("success");
    setMessage("Payroll processing started. Processing 45 pending payrolls...");

    setTimeout(() => {
      setMessage("Payroll processing completed successfully. 45 payments processed.");
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Payroll Automation Scheduler</h1>
        <p className="text-gray-600 mt-2">Configure automatic payroll processing and notifications</p>
      </div>

      {/* Message Alert */}
      {message && (
        <Alert className={`${messageType === "success" ? "bg-green-50 border-green-200" : messageType === "error" ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}>
          <div className="flex items-center gap-2">
            {messageType === "success" && <CheckCircle className="h-5 w-5 text-green-600" />}
            {messageType === "error" && <AlertCircle className="h-5 w-5 text-red-600" />}
            {messageType === "info" && <AlertCircle className="h-5 w-5 text-blue-600" />}
            <AlertDescription className={messageType === "success" ? "text-green-800" : messageType === "error" ? "text-red-800" : "text-blue-800"}>
              {message}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule Configuration */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Configuration</CardTitle>
              <CardDescription>Set up automatic payroll processing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Schedule Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payroll Frequency</label>
                <Select value={scheduleType} onValueChange={setScheduleType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Day */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {scheduleType === "monthly" ? "Payment Day of Month" : "Payment Day of Week"}
                </label>
                <Select value={paymentDay} onValueChange={setPaymentDay}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scheduleType === "monthly" ? (
                      <>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <SelectItem key={day} value={day.toString()}>
                            Day {day}
                          </SelectItem>
                        ))}
                      </>
                    ) : (
                      <>
                        <SelectItem value="0">Sunday</SelectItem>
                        <SelectItem value="1">Monday</SelectItem>
                        <SelectItem value="2">Tuesday</SelectItem>
                        <SelectItem value="3">Wednesday</SelectItem>
                        <SelectItem value="4">Thursday</SelectItem>
                        <SelectItem value="5">Friday</SelectItem>
                        <SelectItem value="6">Saturday</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Time</label>
                <Input
                  type="time"
                  value={paymentTime}
                  onChange={(e) => setPaymentTime(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Notifications */}
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold text-gray-900">Notifications</h3>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyWorkers}
                    onChange={(e) => setNotifyWorkers(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Notify workers of payment (Email/SMS)</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyManagement}
                    onChange={(e) => setNotifyManagement(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Notify management of processing results</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button onClick={handleSaveSchedule} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <Settings className="mr-2 h-4 w-4" />
                  Save Schedule
                </Button>
                <Button onClick={handleManualTrigger} variant="outline" className="flex-1">
                  <Play className="mr-2 h-4 w-4" />
                  Run Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Schedule Info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Frequency</p>
                <p className="font-semibold text-gray-900 capitalize">{currentSchedule.scheduleType}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Payment Day</p>
                <p className="font-semibold text-gray-900">Day {currentSchedule.paymentDay}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Payment Time</p>
                <p className="font-semibold text-gray-900">{currentSchedule.paymentTime}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="font-semibold text-green-600">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Last Run</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="font-semibold text-gray-900">{currentSchedule.lastRun}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Processed</p>
                <p className="font-semibold text-gray-900">{currentSchedule.totalProcessed} payrolls</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="font-semibold text-green-600">{currentSchedule.successRate}%</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Next Run</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Scheduled for</p>
                  <p className="font-semibold text-gray-900">{currentSchedule.nextRun}</p>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                The system will automatically process all pending payrolls at the scheduled time.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Processing History */}
      <Card>
        <CardHeader>
          <CardTitle>Processing History</CardTitle>
          <CardDescription>Recent payroll automation runs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { date: "2026-02-08", time: "09:15:30", processed: 45, success: 45, failed: 0 },
              { date: "2026-01-25", time: "09:00:15", processed: 45, success: 44, failed: 1 },
              { date: "2026-01-08", time: "09:05:45", processed: 42, success: 42, failed: 0 },
              { date: "2025-12-25", time: "09:00:30", processed: 40, success: 40, failed: 0 },
            ].map((run, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-semibold text-gray-900">{run.date} at {run.time}</p>
                    <p className="text-sm text-gray-600">{run.processed} payrolls processed</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">{run.success} success</p>
                  {run.failed > 0 && <p className="text-sm text-red-600">{run.failed} failed</p>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
