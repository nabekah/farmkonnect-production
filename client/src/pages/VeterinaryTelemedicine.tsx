import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Calendar, Clock, User, Phone, Plus, MapPin, AlertCircle, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function VeterinaryTelemedicine() {
  const [selectedCall, setSelectedCall] = useState<number | null>(null);

  // Fetch telemedicine calls
  const { data: calls = [], isLoading } = trpc.veterinary.getTelemedicineCalls.useQuery({
    farmId: 1,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isUpcoming = (scheduledTime: string) => {
    return new Date(scheduledTime) > new Date();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Telemedicine Consultations</h1>
          <p className="text-muted-foreground mt-2">Schedule and conduct video consultations with veterinarians</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Schedule Consultation
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Consultations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calls.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {calls.filter(c => c.status === "scheduled").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {calls.filter(c => c.status === "completed").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {calls.filter(c => isUpcoming(c.scheduledTime)).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Consultations List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Loading consultations...</p>
            </CardContent>
          </Card>
        ) : calls.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center py-8">No telemedicine consultations scheduled</p>
            </CardContent>
          </Card>
        ) : (
          calls.map((call) => (
            <Card key={call.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{call.consultationType || "General Consultation"}</h3>
                      <Badge className={getStatusColor(call.status)}>
                        {call.status === "in_progress" && <Video className="w-3 h-3 mr-1" />}
                        {call.status === "completed" && <CheckCircle className="w-3 h-3 mr-1" />}
                        {call.status.replace("_", " ").charAt(0).toUpperCase() + call.status.replace("_", " ").slice(1)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{new Date(call.scheduledTime).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{new Date(call.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{call.veterinarianName || "Not assigned"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{call.veterinarianPhone || "N/A"}</span>
                      </div>
                    </div>

                    {call.meetingLink && (
                      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                        <Video className="w-4 h-4 text-blue-600" />
                        <a href={call.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm font-medium">
                          Join Video Call
                        </a>
                      </div>
                    )}

                    {call.notes && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Notes:</strong> {call.notes}
                      </div>
                    )}

                    {call.duration && (
                      <div className="text-sm font-medium">
                        Duration: {call.duration} minutes
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    {call.status === "scheduled" && isUpcoming(call.scheduledTime) && (
                      <Button className="gap-2 bg-green-600 hover:bg-green-700">
                        <Video className="w-4 h-4" />
                        Join Call
                      </Button>
                    )}
                    {call.status === "completed" && call.recordingUrl && (
                      <Button variant="outline" size="sm" className="gap-1">
                        <Video className="w-4 h-4" />
                        View Recording
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
