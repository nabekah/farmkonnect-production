import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, AlertCircle, CheckCircle2, Plus, Edit, Trash2 } from "lucide-react";
import { DatePickerPopover } from "@/components/DatePickerPopover";


export default function BusinessStrategy() {
  const toast = ({ title, description }: { title: string; description: string }) => {
    console.log(`${title}: ${description}`);
  };
  const utils = trpc.useUtils();

  // Strategic Goals State
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [newGoal, setNewGoal] = useState({
    farmId: 1,
    goalDescription: "",
    startDate: new Date(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    status: "planning" as "planning" | "in_progress" | "completed" | "abandoned",
  });

  // SWOT Analysis State
  const [isSwotDialogOpen, setIsSwotDialogOpen] = useState(false);
  const [editingSwot, setEditingSwot] = useState<any>(null);
  const [newSwot, setNewSwot] = useState({
    farmId: 1,
    analysisDate: new Date(),
    strengths: "",
    weaknesses: "",
    opportunities: "",
    threats: "",
  });

  // Queries
  const { data: goals = [], isLoading: goalsLoading } = trpc.business.goals.list.useQuery({});
  const { data: swotAnalyses = [], isLoading: swotLoading } = trpc.business.swot.list.useQuery({});
  const { data: farms = [] } = trpc.farms.list.useQuery();

  // Mutations
  const createGoal = trpc.business.goals.create.useMutation({
    onSuccess: () => {
      utils.business.goals.list.invalidate();
      setIsGoalDialogOpen(false);
      resetGoalForm();
      toast({ title: "Success", description: "Strategic goal created successfully" });
    },
  });

  const updateGoal = trpc.business.goals.update.useMutation({
    onSuccess: () => {
      utils.business.goals.list.invalidate();
      setIsGoalDialogOpen(false);
      setEditingGoal(null);
      resetGoalForm();
      toast({ title: "Success", description: "Strategic goal updated successfully" });
    },
  });

  const deleteGoal = trpc.business.goals.delete.useMutation({
    onSuccess: () => {
      utils.business.goals.list.invalidate();
      toast({ title: "Success", description: "Strategic goal deleted successfully" });
    },
  });

  const createSwot = trpc.business.swot.create.useMutation({
    onSuccess: () => {
      utils.business.swot.list.invalidate();
      setIsSwotDialogOpen(false);
      resetSwotForm();
      toast({ title: "Success", description: "SWOT analysis created successfully" });
    },
  });

  const updateSwot = trpc.business.swot.update.useMutation({
    onSuccess: () => {
      utils.business.swot.list.invalidate();
      setIsSwotDialogOpen(false);
      setEditingSwot(null);
      resetSwotForm();
      toast({ title: "Success", description: "SWOT analysis updated successfully" });
    },
  });

  const deleteSwot = trpc.business.swot.delete.useMutation({
    onSuccess: () => {
      utils.business.swot.list.invalidate();
      toast({ title: "Success", description: "SWOT analysis deleted successfully" });
    },
  });

  // Helper Functions
  const resetGoalForm = () => {
    setNewGoal({
      farmId: 1,
      goalDescription: "",
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      status: "planning",
    });
  };

  const resetSwotForm = () => {
    setNewSwot({
      farmId: 1,
      analysisDate: new Date(),
      strengths: "",
      weaknesses: "",
      opportunities: "",
      threats: "",
    });
  };

  const handleCreateGoal = () => {
    createGoal.mutate(newGoal);
  };

  const handleUpdateGoal = () => {
    if (editingGoal) {
      updateGoal.mutate({
        id: editingGoal.id,
        goalDescription: newGoal.goalDescription,
        startDate: newGoal.startDate,
        endDate: newGoal.endDate,
        status: newGoal.status,
      });
    }
  };

  const handleEditGoal = (goal: any) => {
    setEditingGoal(goal);
    setNewGoal({
      farmId: goal.farmId,
      goalDescription: goal.goalDescription || "",
      startDate: goal.startDate ? new Date(goal.startDate) : new Date(),
      endDate: goal.endDate ? new Date(goal.endDate) : new Date(),
      status: goal.status || "planning",
    });
    setIsGoalDialogOpen(true);
  };

  const handleCreateSwot = () => {
    createSwot.mutate(newSwot);
  };

  const handleUpdateSwot = () => {
    if (editingSwot) {
      updateSwot.mutate({
        id: editingSwot.id,
        analysisDate: newSwot.analysisDate,
        strengths: newSwot.strengths,
        weaknesses: newSwot.weaknesses,
        opportunities: newSwot.opportunities,
        threats: newSwot.threats,
      });
    }
  };

  const handleEditSwot = (swot: any) => {
    setEditingSwot(swot);
    setNewSwot({
      farmId: swot.farmId,
      analysisDate: swot.analysisDate ? new Date(swot.analysisDate) : new Date(),
      strengths: swot.strengths || "",
      weaknesses: swot.weaknesses || "",
      opportunities: swot.opportunities || "",
      threats: swot.threats || "",
    });
    setIsSwotDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      planning: "secondary",
      in_progress: "default",
      completed: "outline",
      abandoned: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status.replace("_", " ")}</Badge>;
  };

  const calculateProgress = (goal: any) => {
    if (goal.status === "completed") return 100;
    if (goal.status === "abandoned") return 0;
    if (!goal.startDate || !goal.endDate) return 0;

    const start = new Date(goal.startDate).getTime();
    const end = new Date(goal.endDate).getTime();
    const now = Date.now();

    if (now < start) return 0;
    if (now > end) return 100;

    const progress = ((now - start) / (end - start)) * 100;
    return Math.round(progress);
  };

  // Summary Statistics
  const goalStats = {
    total: goals.length,
    planning: goals.filter((g) => g.status === "planning").length,
    inProgress: goals.filter((g) => g.status === "in_progress").length,
    completed: goals.filter((g) => g.status === "completed").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Business Strategy</h1>
          <p className="text-muted-foreground">Strategic planning and SWOT analysis for farm growth</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goalStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Planning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goalStats.planning}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goalStats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goalStats.completed}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="goals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="goals">Strategic Goals</TabsTrigger>
          <TabsTrigger value="swot">SWOT Analysis</TabsTrigger>
        </TabsList>

        {/* Strategic Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Strategic Goals</h2>
            <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingGoal(null); resetGoalForm(); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Goal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingGoal ? "Edit Strategic Goal" : "Create Strategic Goal"}</DialogTitle>
                  <DialogDescription>
                    Define strategic objectives for farm growth and development
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="farm">Farm</Label>
                    <Select
                      value={String(newGoal.farmId)}
                      onValueChange={(value) => setNewGoal({ ...newGoal, farmId: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select farm" />
                      </SelectTrigger>
                      <SelectContent>
                        {farms.map((farm) => (
                          <SelectItem key={farm.id} value={String(farm.id)}>
                            {farm.farmName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="goalDescription">Goal Description</Label>
                    <Textarea
                      id="goalDescription"
                      placeholder="Describe the strategic goal..."
                      value={newGoal.goalDescription}
                      onChange={(e) => setNewGoal({ ...newGoal, goalDescription: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Start Date</Label>
                      <DatePickerPopover
                        value={newGoal.startDate}
                        onChange={(date: Date | undefined) => setNewGoal({ ...newGoal, startDate: date || new Date() })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>End Date</Label>
                      <DatePickerPopover
                        value={newGoal.endDate}
                        onChange={(date: Date | undefined) => setNewGoal({ ...newGoal, endDate: date || new Date() })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={newGoal.status}
                      onValueChange={(value: any) => setNewGoal({ ...newGoal, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="abandoned">Abandoned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={editingGoal ? handleUpdateGoal : handleCreateGoal}
                    disabled={!newGoal.goalDescription}
                  >
                    {editingGoal ? "Update Goal" : "Create Goal"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {goalsLoading ? (
            <div className="text-center py-8">Loading goals...</div>
          ) : goals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No strategic goals yet. Create your first goal to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {goals.map((goal) => {
                const progress = calculateProgress(goal);
                const farm = farms.find((f) => f.id === goal.farmId);
                return (
                  <Card key={goal.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{goal.goalDescription}</CardTitle>
                            {getStatusBadge(goal.status || "planning")}
                          </div>
                          <CardDescription>
                            {farm?.farmName} • {goal.startDate ? new Date(goal.startDate).toLocaleDateString() : "N/A"} - {goal.endDate ? new Date(goal.endDate).toLocaleDateString() : "N/A"}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditGoal(goal)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteGoal.mutate({ id: goal.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* SWOT Analysis Tab */}
        <TabsContent value="swot" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">SWOT Analysis</h2>
            <Dialog open={isSwotDialogOpen} onOpenChange={setIsSwotDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingSwot(null); resetSwotForm(); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Analysis
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingSwot ? "Edit SWOT Analysis" : "Create SWOT Analysis"}</DialogTitle>
                  <DialogDescription>
                    Analyze Strengths, Weaknesses, Opportunities, and Threats
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="farm">Farm</Label>
                      <Select
                        value={String(newSwot.farmId)}
                        onValueChange={(value) => setNewSwot({ ...newSwot, farmId: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select farm" />
                        </SelectTrigger>
                        <SelectContent>
                          {farms.map((farm) => (
                            <SelectItem key={farm.id} value={String(farm.id)}>
                              {farm.farmName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Analysis Date</Label>
                      <DatePickerPopover
                        value={newSwot.analysisDate}
                        onChange={(date: Date | undefined) => setNewSwot({ ...newSwot, analysisDate: date || new Date() })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="strengths" className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Strengths
                      </Label>
                      <Textarea
                        id="strengths"
                        placeholder="Internal positive attributes..."
                        value={newSwot.strengths}
                        onChange={(e) => setNewSwot({ ...newSwot, strengths: e.target.value })}
                        rows={6}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="weaknesses" className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        Weaknesses
                      </Label>
                      <Textarea
                        id="weaknesses"
                        placeholder="Internal areas for improvement..."
                        value={newSwot.weaknesses}
                        onChange={(e) => setNewSwot({ ...newSwot, weaknesses: e.target.value })}
                        rows={6}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="opportunities" className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        Opportunities
                      </Label>
                      <Textarea
                        id="opportunities"
                        placeholder="External favorable conditions..."
                        value={newSwot.opportunities}
                        onChange={(e) => setNewSwot({ ...newSwot, opportunities: e.target.value })}
                        rows={6}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="threats" className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        Threats
                      </Label>
                      <Textarea
                        id="threats"
                        placeholder="External challenges and risks..."
                        value={newSwot.threats}
                        onChange={(e) => setNewSwot({ ...newSwot, threats: e.target.value })}
                        rows={6}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={editingSwot ? handleUpdateSwot : handleCreateSwot}>
                    {editingSwot ? "Update Analysis" : "Create Analysis"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {swotLoading ? (
            <div className="text-center py-8">Loading SWOT analyses...</div>
          ) : swotAnalyses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No SWOT analyses yet. Create your first analysis to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {swotAnalyses.map((swot) => {
                const farm = farms.find((f) => f.id === swot.farmId);
                return (
                  <Card key={swot.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{farm?.farmName} SWOT Analysis</CardTitle>
                          <CardDescription>
                            {swot.analysisDate ? new Date(swot.analysisDate).toLocaleDateString() : "N/A"}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditSwot(swot)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteSwot.mutate({ id: swot.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <Card className="border-green-200 bg-green-50/50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              Strengths
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm whitespace-pre-wrap">{swot.strengths || "Not specified"}</p>
                          </CardContent>
                        </Card>
                        <Card className="border-red-200 bg-red-50/50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-red-600" />
                              Weaknesses
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm whitespace-pre-wrap">{swot.weaknesses || "Not specified"}</p>
                          </CardContent>
                        </Card>
                        <Card className="border-blue-200 bg-blue-50/50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-blue-600" />
                              Opportunities
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm whitespace-pre-wrap">{swot.opportunities || "Not specified"}</p>
                          </CardContent>
                        </Card>
                        <Card className="border-orange-200 bg-orange-50/50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-orange-600" />
                              Threats
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm whitespace-pre-wrap">{swot.threats || "Not specified"}</p>
                          </CardContent>
                        </Card>
                      </div>
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
