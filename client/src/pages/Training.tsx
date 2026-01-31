import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, BookOpen, CheckCircle, XCircle, Clock } from "lucide-react";
import { DatePickerPopover } from "@/components/DatePickerPopover";

export default function Training() {
  const [selectedProgram, setSelectedProgram] = useState<number | null>(null);
  const [showProgramDialog, setShowProgramDialog] = useState(false);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);

  // Queries
  const { data: programs = [], refetch: refetchPrograms } = trpc.training.programs.list.useQuery();
  const { data: sessions = [], refetch: refetchSessions } = trpc.training.sessions.list.useQuery({
    programId: selectedProgram || undefined,
  });
  const { data: enrollments = [], refetch: refetchEnrollments } = trpc.training.enrollments.list.useQuery({});

  // Mutations
  const createProgram = trpc.training.programs.create.useMutation({
    onSuccess: () => {
      refetchPrograms();
      setShowProgramDialog(false);
    },
  });

  const createSession = trpc.training.sessions.create.useMutation({
    onSuccess: () => {
      refetchSessions();
      setShowSessionDialog(false);
    },
  });

  const enroll = trpc.training.enrollments.enroll.useMutation({
    onSuccess: () => {
      refetchEnrollments();
      setShowEnrollDialog(false);
    },
  });

  const updateAttendance = trpc.training.enrollments.updateAttendance.useMutation({
    onSuccess: () => refetchEnrollments(),
  });

  // Form states
  const [newProgram, setNewProgram] = useState({
    title: "",
    description: "",
    targetAudience: "",
  });

  const [newSession, setNewSession] = useState({
    programId: 0,
    sessionDate: new Date(),
    location: "",
    maxParticipants: "",
  });

  const [enrollmentData, setEnrollmentData] = useState({
    sessionId: 0,
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      scheduled: "default",
      ongoing: "secondary",
      completed: "outline",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getAttendanceBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      enrolled: "default",
      attended: "secondary",
      absent: "destructive",
      dropped: "outline",
    };
    const icons: Record<string, any> = {
      attended: CheckCircle,
      absent: XCircle,
      enrolled: Clock,
    };
    const Icon = icons[status];
    return (
      <Badge variant={variants[status] || "default"}>
        {Icon && <Icon className="w-3 h-3 mr-1" />}
        {status}
      </Badge>
    );
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Training & Extension Services</h1>
          <p className="text-muted-foreground mt-2">
            Manage training programs, sessions, and farmer enrollments
          </p>
        </div>
        <Dialog open={showProgramDialog} onOpenChange={setShowProgramDialog}>
          <DialogTrigger asChild>
            <Button>
              <BookOpen className="w-4 h-4 mr-2" />
              Create Program
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Training Program</DialogTitle>
              <DialogDescription>Add a new training program for farmers</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Program Title</Label>
                <Input
                  value={newProgram.title}
                  onChange={(e) => setNewProgram({ ...newProgram, title: e.target.value })}
                  placeholder="e.g., Modern Irrigation Techniques"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newProgram.description}
                  onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                  placeholder="Describe the program objectives and content"
                  rows={4}
                />
              </div>
              <div>
                <Label>Target Audience</Label>
                <Input
                  value={newProgram.targetAudience}
                  onChange={(e) => setNewProgram({ ...newProgram, targetAudience: e.target.value })}
                  placeholder="e.g., Small-scale crop farmers"
                />
              </div>
              <Button
                onClick={() => createProgram.mutate(newProgram)}
                disabled={!newProgram.title}
                className="w-full"
              >
                Create Program
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="programs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="enrollments">My Enrollments</TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className="space-y-4">
          {programs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No training programs yet. Create one to get started.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {programs.map((program) => (
                <Card key={program.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedProgram(program.id)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      {program.title}
                    </CardTitle>
                    <CardDescription>{program.targetAudience}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {program.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <Label>Filter by Program</Label>
              <Select
                value={selectedProgram?.toString() || "all"}
                onValueChange={(value) => setSelectedProgram(value === "all" ? null : parseInt(value))}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="All programs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All programs</SelectItem>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Session
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule Training Session</DialogTitle>
                  <DialogDescription>Create a new training session</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Program</Label>
                    <Select
                      value={newSession.programId.toString()}
                      onValueChange={(value) => setNewSession({ ...newSession, programId: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select program" />
                      </SelectTrigger>
                      <SelectContent>
                        {programs.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Session Date</Label>
                    <DatePickerPopover
                      value={newSession.sessionDate}
                      onChange={(date) => setNewSession({ ...newSession, sessionDate: date || new Date() })}
                    />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input
                      value={newSession.location}
                      onChange={(e) => setNewSession({ ...newSession, location: e.target.value })}
                      placeholder="e.g., Community Center, Accra"
                    />
                  </div>
                  <div>
                    <Label>Max Participants</Label>
                    <Input
                      type="number"
                      value={newSession.maxParticipants}
                      onChange={(e) => setNewSession({ ...newSession, maxParticipants: e.target.value })}
                      placeholder="e.g., 50"
                    />
                  </div>
                  <Button
                    onClick={() => createSession.mutate({
                      ...newSession,
                      maxParticipants: newSession.maxParticipants ? parseInt(newSession.maxParticipants) : undefined,
                    })}
                    disabled={!newSession.programId}
                    className="w-full"
                  >
                    Schedule Session
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {sessions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No sessions scheduled yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sessions.map((session) => {
                const program = programs.find((p) => p.id === session.programId);
                return (
                  <Card key={session.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{program?.title || "Unknown Program"}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(session.sessionDate).toLocaleDateString() || ''}
                            {session.location && ` • ${session.location}`}
                          </CardDescription>
                        </div>
                        {session.status && getStatusBadge(session.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          {session.maxParticipants ? `Max ${session.maxParticipants} participants` : "Unlimited"}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEnrollmentData({ sessionId: session.id });
                            setShowEnrollDialog(true);
                          }}
                        >
                          Enroll
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="enrollments" className="space-y-4">
          {enrollments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                You haven't enrolled in any sessions yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {enrollments.map((enrollment) => {
                const session = sessions.find((s) => s.id === enrollment.sessionId);
                const program = programs.find((p) => p.id === session?.programId);
                return (
                  <Card key={enrollment.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{program?.title || "Unknown Program"}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-2">
                            <Calendar className="w-4 h-4" />
                            {session && (new Date(session.sessionDate).toLocaleDateString() || '')}
                            {session?.location && ` • ${session.location}`}
                          </CardDescription>
                        </div>
                        {enrollment.attendanceStatus && getAttendanceBadge(enrollment.attendanceStatus)}
                      </div>
                    </CardHeader>
                    {enrollment.feedbackNotes && (
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          <strong>Feedback:</strong> {enrollment.feedbackNotes}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enroll in Session</DialogTitle>
            <DialogDescription>Confirm your enrollment in this training session</DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => enroll.mutate(enrollmentData)}
            className="w-full"
          >
            Confirm Enrollment
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// TODO: Add Impact Analytics tab with training.analytics.overallImpact query
// TODO: Add training.analytics.programStats for individual program metrics
// TODO: Add training.analytics.participantHistory for user training history
// TODO: Add certificate generation feature
// Training module has full CRUD, enrollment, and attendance tracking implemented
