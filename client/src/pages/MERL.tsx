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
import { BarChart3, TrendingUp, AlertCircle, Camera, Target } from "lucide-react";
import { DatePickerPopover } from "@/components/DatePickerPopover";

export default function MERL() {
  const [selectedFarm, setSelectedFarm] = useState<number | null>(null);
  const [showKPIDialog, setShowKPIDialog] = useState(false);
  const [showVisitDialog, setShowVisitDialog] = useState(false);
  const [showChallengeDialog, setShowChallengeDialog] = useState(false);

  // Queries
  const { data: farms = [] } = trpc.farms.list.useQuery();
  const { data: kpis = [], refetch: refetchKPIs } = trpc.merl.kpis.list.useQuery();
  const { data: kpiValues = [], refetch: refetchKPIValues } = trpc.merl.kpiValues.list.useQuery({
    farmId: selectedFarm || undefined,
  });
  const { data: visits = [], refetch: refetchVisits } = trpc.merl.visits.list.useQuery({
    farmId: selectedFarm || undefined,
  });
  const { data: challenges = [], refetch: refetchChallenges } = trpc.merl.challenges.list.useQuery({
    farmId: selectedFarm || undefined,
  });

  // Mutations
  const createKPI = trpc.merl.kpis.create.useMutation({
    onSuccess: () => {
      refetchKPIs();
      setShowKPIDialog(false);
    },
  });

  const createVisit = trpc.merl.visits.create.useMutation({
    onSuccess: () => {
      refetchVisits();
      setShowVisitDialog(false);
    },
  });

  const createChallenge = trpc.merl.challenges.create.useMutation({
    onSuccess: () => {
      refetchChallenges();
      setShowChallengeDialog(false);
    },
  });

  const updateChallengeStatus = trpc.merl.challenges.update.useMutation({
    onSuccess: () => refetchChallenges(),
  });

  // Form states
  const [newKPI, setNewKPI] = useState({
    kpiName: "",
    description: "",
    targetValue: "",
    unitOfMeasure: "",
  });

  const [newVisit, setNewVisit] = useState({
    farmId: 0,
    visitDate: new Date(),
    observations: "",
    photoEvidenceUrl: "",
  });

  const [newChallenge, setNewChallenge] = useState({
    farmId: 0,
    challengeDescription: "",
    category: "",
    severity: "medium" as "low" | "medium" | "high" | "critical",
    reportedDate: new Date(),
  });

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      low: "outline",
      medium: "secondary",
      high: "default",
      critical: "destructive",
    };
    return <Badge variant={variants[severity] || "default"}>{severity}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      open: "destructive",
      in_progress: "default",
      resolved: "secondary",
      closed: "outline",
    };
    return <Badge variant={variants[status] || "default"}>{status.replace("_", " ")}</Badge>;
  };

  const openChallenges = challenges.filter((c) => c.status === "open" || c.status === "in_progress");
  const criticalChallenges = challenges.filter((c) => c.severity === "critical" && c.status !== "resolved");

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">MERL Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitoring, Evaluation, Reporting & Learning
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={selectedFarm?.toString() || "all"}
            onValueChange={(value) => setSelectedFarm(value === "all" ? null : parseInt(value))}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All farms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All farms</SelectItem>
              {farms.map((f) => (
                <SelectItem key={f.id} value={f.id.toString()}>
                  {f.farmName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total KPIs</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.length}</div>
            <p className="text-xs text-muted-foreground">Performance indicators tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monitoring Visits</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visits.length}</div>
            <p className="text-xs text-muted-foreground">Field visits recorded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Challenges</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openChallenges.length}</div>
            <p className="text-xs text-muted-foreground">
              {criticalChallenges.length} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KPI Measurements</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiValues.length}</div>
            <p className="text-xs text-muted-foreground">Data points collected</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="kpis" className="space-y-6">
        <TabsList>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="visits">Monitoring Visits</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
        </TabsList>

        <TabsContent value="kpis" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showKPIDialog} onOpenChange={setShowKPIDialog}>
              <DialogTrigger asChild>
                <Button>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Add KPI
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create KPI Indicator</DialogTitle>
                  <DialogDescription>Define a new performance indicator to track</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>KPI Name</Label>
                    <Input
                      value={newKPI.kpiName}
                      onChange={(e) => setNewKPI({ ...newKPI, kpiName: e.target.value })}
                      placeholder="e.g., Crop Yield per Hectare"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newKPI.description}
                      onChange={(e) => setNewKPI({ ...newKPI, description: e.target.value })}
                      placeholder="Describe what this KPI measures"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Target Value</Label>
                      <Input
                        value={newKPI.targetValue}
                        onChange={(e) => setNewKPI({ ...newKPI, targetValue: e.target.value })}
                        placeholder="e.g., 5000"
                      />
                    </div>
                    <div>
                      <Label>Unit</Label>
                      <Input
                        value={newKPI.unitOfMeasure}
                        onChange={(e) => setNewKPI({ ...newKPI, unitOfMeasure: e.target.value })}
                        placeholder="e.g., kg/ha"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => createKPI.mutate(newKPI)}
                    disabled={!newKPI.kpiName}
                    className="w-full"
                  >
                    Create KPI
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {kpis.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No KPIs defined yet. Create one to start tracking performance.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {kpis.map((kpi) => {
                const values = kpiValues.filter((v) => v.kpiId === kpi.id);
                const latestValue = values[values.length - 1];
                return (
                  <Card key={kpi.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        {kpi.kpiName}
                      </CardTitle>
                      <CardDescription>{kpi.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Target</p>
                          <p className="text-lg font-semibold">
                            {kpi.targetValue} {kpi.unitOfMeasure}
                          </p>
                        </div>
                        {latestValue && (
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Latest</p>
                            <p className="text-lg font-semibold">
                              {latestValue.actualValue} {kpi.unitOfMeasure}
                            </p>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {values.length} measurements recorded
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="visits" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showVisitDialog} onOpenChange={setShowVisitDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Camera className="w-4 h-4 mr-2" />
                  Record Visit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Monitoring Visit</DialogTitle>
                  <DialogDescription>Document a field monitoring visit</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Farm</Label>
                    <Select
                      value={newVisit.farmId.toString()}
                      onValueChange={(value) => setNewVisit({ ...newVisit, farmId: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select farm" />
                      </SelectTrigger>
                      <SelectContent>
                        {farms.map((f) => (
                          <SelectItem key={f.id} value={f.id.toString()}>
                            {f.farmName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Visit Date</Label>
                    <DatePickerPopover
                      value={newVisit.visitDate}
                      onChange={(date) => setNewVisit({ ...newVisit, visitDate: date || new Date() })}
                    />
                  </div>
                  <div>
                    <Label>Observations</Label>
                    <Textarea
                      value={newVisit.observations}
                      onChange={(e) => setNewVisit({ ...newVisit, observations: e.target.value })}
                      placeholder="Record your observations from the visit"
                      rows={4}
                    />
                  </div>
                  <Button
                    onClick={() => createVisit.mutate(newVisit)}
                    disabled={!newVisit.farmId}
                    className="w-full"
                  >
                    Record Visit
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {visits.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No monitoring visits recorded yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {visits.map((visit) => {
                const farm = farms.find((f) => f.id === visit.farmId);
                return (
                  <Card key={visit.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{farm?.farmName || "Unknown Farm"}</CardTitle>
                          <CardDescription>
                            {new Date(visit.visitDate).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Camera className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{visit.observations}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showChallengeDialog} onOpenChange={setShowChallengeDialog}>
              <DialogTrigger asChild>
                <Button>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Report Challenge
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Report Challenge</DialogTitle>
                  <DialogDescription>Document a challenge or issue</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Farm</Label>
                    <Select
                      value={newChallenge.farmId.toString()}
                      onValueChange={(value) => setNewChallenge({ ...newChallenge, farmId: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select farm" />
                      </SelectTrigger>
                      <SelectContent>
                        {farms.map((f) => (
                          <SelectItem key={f.id} value={f.id.toString()}>
                            {f.farmName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Challenge Description</Label>
                    <Textarea
                      value={newChallenge.challengeDescription}
                      onChange={(e) => setNewChallenge({ ...newChallenge, challengeDescription: e.target.value })}
                      placeholder="Describe the challenge or issue"
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Category</Label>
                      <Input
                        value={newChallenge.category}
                        onChange={(e) => setNewChallenge({ ...newChallenge, category: e.target.value })}
                        placeholder="e.g., Pest, Weather"
                      />
                    </div>
                    <div>
                      <Label>Severity</Label>
                      <Select
                        value={newChallenge.severity}
                        onValueChange={(value: any) => setNewChallenge({ ...newChallenge, severity: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    onClick={() => createChallenge.mutate(newChallenge)}
                    disabled={!newChallenge.farmId || !newChallenge.challengeDescription}
                    className="w-full"
                  >
                    Report Challenge
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {challenges.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No challenges reported yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {challenges.map((challenge) => {
                const farm = farms.find((f) => f.id === challenge.farmId);
                return (
                  <Card key={challenge.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{farm?.farmName || "Unknown Farm"}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-2">
                            {challenge.category && <Badge variant="outline">{challenge.category}</Badge>}
                            {new Date(challenge.reportedDate).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {challenge.severity && getSeverityBadge(challenge.severity)}
                          {challenge.status && getStatusBadge(challenge.status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap mb-4">{challenge.challengeDescription}</p>
                      {challenge.status !== "resolved" && challenge.status !== "closed" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateChallengeStatus.mutate({ id: challenge.id, status: "in_progress" })}
                          >
                            Mark In Progress
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateChallengeStatus.mutate({ id: challenge.id, status: "resolved" })}
                          >
                            Mark Resolved
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
