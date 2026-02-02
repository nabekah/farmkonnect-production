import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, Mail, Eye, Plus, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ScheduleFormData {
  farmId: number;
  reportType: "financial" | "livestock" | "complete";
  frequency: "daily" | "weekly" | "monthly";
  recipients: string[];
  scheduledTime: string;
  timezone: string;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  templateId?: number;
  useRecipientGroup?: boolean;
  recipientGroupId?: number;
}

export default function AdvancedReportScheduling() {
  const [farms] = trpc.farms.list.useSuspenseQuery();
  const [selectedFarm, setSelectedFarm] = useState<number | null>(farms?.[0]?.id || null);
  const [formData, setFormData] = useState<ScheduleFormData>({
    farmId: selectedFarm || 0,
    reportType: "financial",
    frequency: "weekly",
    recipients: [""],
    scheduledTime: "09:00",
    timezone: "UTC",
    daysOfWeek: [1], // Monday
  });

  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Fetch recipient groups for selected farm
  const { data: recipientGroups } = trpc.recipientManagement.getGroupsForFarm.useQuery(
    { farmId: selectedFarm || 0 },
    { enabled: !!selectedFarm }
  );

  // Fetch templates for selected farm
  const { data: templates } = trpc.reportTemplates.getTemplatesForFarm.useQuery(
    { farmId: selectedFarm || 0 },
    { enabled: !!selectedFarm }
  );

  const createSchedule = trpc.reportScheduling.createSchedule.useMutation();

  const handleAddRecipient = () => {
    setFormData({
      ...formData,
      recipients: [...formData.recipients, ""],
    });
  };

  const handleRemoveRecipient = (index: number) => {
    setFormData({
      ...formData,
      recipients: formData.recipients.filter((_, i) => i !== index),
    });
  };

  const handleRecipientChange = (index: number, value: string) => {
    const newRecipients = [...formData.recipients];
    newRecipients[index] = value;
    setFormData({ ...formData, recipients: newRecipients });
  };

  const handleToggleDayOfWeek = (day: number) => {
    const daysOfWeek = formData.daysOfWeek || [];
    if (daysOfWeek.includes(day)) {
      setFormData({
        ...formData,
        daysOfWeek: daysOfWeek.filter((d) => d !== day),
      });
    } else {
      setFormData({
        ...formData,
        daysOfWeek: [...daysOfWeek, day],
      });
    }
  };

  const handlePreview = () => {
    // Generate preview data
    const preview = {
      farmId: selectedFarm,
      reportType: formData.reportType,
      frequency: formData.frequency,
      scheduledTime: formData.scheduledTime,
      timezone: formData.timezone,
      recipients: formData.recipients.filter((r) => r.trim()),
      nextScheduledDate: calculateNextScheduleDate(),
      template: templates?.find((t) => t.id === formData.templateId),
    };
    setPreviewData(preview);
    setShowPreview(true);
  };

  const calculateNextScheduleDate = () => {
    const now = new Date();
    const [hours, minutes] = formData.scheduledTime.split(":").map(Number);

    if (formData.frequency === "daily") {
      const next = new Date(now);
      next.setHours(hours, minutes, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      return next.toISOString();
    } else if (formData.frequency === "weekly") {
      const next = new Date(now);
      const daysOfWeek = formData.daysOfWeek || [1];
      const currentDay = next.getDay();
      let daysToAdd = 0;

      for (const day of daysOfWeek.sort()) {
        if (day > currentDay) {
          daysToAdd = day - currentDay;
          break;
        }
      }

      if (daysToAdd === 0) {
        daysToAdd = 7 + (daysOfWeek[0] - currentDay);
      }

      next.setDate(next.getDate() + daysToAdd);
      next.setHours(hours, minutes, 0, 0);
      return next.toISOString();
    } else {
      const next = new Date(now);
      const dayOfMonth = formData.dayOfMonth || 1;
      next.setDate(dayOfMonth);
      next.setHours(hours, minutes, 0, 0);
      if (next <= now) next.setMonth(next.getMonth() + 1);
      return next.toISOString();
    }
  };

  const handleSubmit = async () => {
    if (!selectedFarm) {
      alert("Please select a farm");
      return;
    }

    const validRecipients = formData.recipients.filter((r) => r.trim());
    if (validRecipients.length === 0) {
      alert("Please add at least one recipient");
      return;
    }

    try {
      await createSchedule.mutateAsync({
        farmId: selectedFarm,
        reportType: formData.reportType,
        frequency: formData.frequency,
        recipients: validRecipients,
      });

      alert("Report schedule created successfully!");
      setFormData({
        farmId: selectedFarm,
        reportType: "financial",
        frequency: "weekly",
        recipients: [""],
        scheduledTime: "09:00",
        timezone: "UTC",
        daysOfWeek: [1],
      });
    } catch (error) {
      alert(`Failed to create schedule: ${error}`);
    }
  };

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Advanced Report Scheduling</h1>
        <p className="text-muted-foreground mt-2">
          Schedule automated reports with custom timing, recipients, and templates
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Farm Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Farm</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedFarm?.toString() || ""}
                onValueChange={(value) => setSelectedFarm(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a farm" />
                </SelectTrigger>
                <SelectContent>
                  {farms?.map((farm) => (
                    <SelectItem key={farm.id} value={farm.id.toString()}>
                      {farm.farmName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Report Type & Frequency */}
          <Card>
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Report Type</Label>
                  <Select
                    value={formData.reportType}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, reportType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="livestock">Livestock</SelectItem>
                      <SelectItem value="complete">Complete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Frequency</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, frequency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Template Selection */}
              {templates && templates.length > 0 && (
                <div>
                  <Label>Report Template (Optional)</Label>
                  <Select
                    value={formData.templateId?.toString() || ""}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        templateId: value ? parseInt(value) : undefined,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Use default template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedule Timing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Schedule Timing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Time (24-hour format)</Label>
                  <Input
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduledTime: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>Timezone</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) =>
                      setFormData({ ...formData, timezone: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">EST</SelectItem>
                      <SelectItem value="CST">CST</SelectItem>
                      <SelectItem value="MST">MST</SelectItem>
                      <SelectItem value="PST">PST</SelectItem>
                      <SelectItem value="IST">IST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Days of Week Selection */}
              {formData.frequency === "weekly" && (
                <div>
                  <Label>Days of Week</Label>
                  <div className="flex gap-2 mt-2">
                    {dayLabels.map((day, index) => (
                      <Checkbox
                        key={index}
                        checked={(formData.daysOfWeek || []).includes(index)}
                        onCheckedChange={() => handleToggleDayOfWeek(index)}
                        className="w-10 h-10"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Day of Month Selection */}
              {formData.frequency === "monthly" && (
                <div>
                  <Label>Day of Month</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dayOfMonth || 1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dayOfMonth: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recipients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Recipients
              </CardTitle>
              <CardDescription>
                Add individual email addresses or select a recipient group
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recipient Group Option */}
              {recipientGroups && recipientGroups.length > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.useRecipientGroup || false}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        useRecipientGroup: !!checked,
                      })
                    }
                  />
                  <Label>Use Recipient Group</Label>
                </div>
              )}

              {formData.useRecipientGroup && recipientGroups && (
                <Select
                  value={formData.recipientGroupId?.toString() || ""}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      recipientGroupId: parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a recipient group" />
                  </SelectTrigger>
                  <SelectContent>
                    {recipientGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name} ({group.memberCount} members)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {!formData.useRecipientGroup && (
                <div className="space-y-2">
                  {formData.recipients.map((recipient, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="recipient@example.com"
                        value={recipient}
                        onChange={(e) => handleRecipientChange(index, e.target.value)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRecipient(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddRecipient}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Recipient
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handlePreview} variant="outline" className="flex-1">
              <Eye className="w-4 h-4 mr-2" />
              Preview Schedule
            </Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={createSchedule.isPending}>
              {createSchedule.isPending ? "Creating..." : "Create Schedule"}
            </Button>
          </div>
        </div>

        {/* Preview Panel */}
        {showPreview && previewData && (
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Schedule Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Report Type</p>
                  <p className="font-semibold capitalize">{previewData.reportType}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Frequency</p>
                  <p className="font-semibold capitalize">{previewData.frequency}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Scheduled Time</p>
                  <p className="font-semibold">
                    {previewData.scheduledTime} {previewData.timezone}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Next Scheduled Date</p>
                  <p className="font-semibold">
                    {new Date(previewData.nextScheduledDate).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Recipients</p>
                  <div className="space-y-1 mt-2">
                    {previewData.recipients.map((email: string, idx: number) => (
                      <p key={idx} className="text-sm bg-secondary p-2 rounded">
                        {email}
                      </p>
                    ))}
                  </div>
                </div>

                {previewData.template && (
                  <div>
                    <p className="text-sm text-muted-foreground">Template</p>
                    <p className="font-semibold">{previewData.template.name}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
