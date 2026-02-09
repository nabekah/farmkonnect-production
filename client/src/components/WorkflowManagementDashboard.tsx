import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Play, Copy, Eye } from "lucide-react";
import { WorkflowBuilder } from "./WorkflowBuilder";

interface Workflow {
  id: number;
  name: string;
  description: string;
  trigger: string;
  isActive: boolean;
  executionCount: number;
  lastExecutedAt?: Date;
  createdAt: Date;
}

interface WorkflowTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  trigger: string;
}

export function WorkflowManagementDashboard() {
  const [view, setView] = useState<"list" | "builder" | "templates">("list");
  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: 1,
      name: "Critical Alert Response",
      description: "Automatically respond to critical security alerts",
      trigger: "critical_alert",
      isActive: true,
      executionCount: 42,
      lastExecutedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
    {
      id: 2,
      name: "Failed Login Lockout",
      description: "Lock account after 5 failed login attempts",
      trigger: "failed_login",
      isActive: true,
      executionCount: 18,
      lastExecutedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    },
  ]);

  const templates: WorkflowTemplate[] = [
    {
      id: 101,
      name: "Failed Login Alert",
      description: "Alert on multiple failed login attempts",
      category: "Authentication",
      trigger: "failed_login",
    },
    {
      id: 102,
      name: "Suspicious Device Detection",
      description: "Alert when new device accesses system",
      category: "Device Security",
      trigger: "new_device",
    },
    {
      id: 103,
      name: "Budget Exceeded Alert",
      description: "Alert when farm budget is exceeded",
      category: "Financial",
      trigger: "budget_exceeded",
    },
    {
      id: 104,
      name: "Unauthorized Access Attempt",
      description: "Alert on unauthorized access attempts",
      category: "Access Control",
      trigger: "unauthorized_access",
    },
    {
      id: 105,
      name: "Data Export Alert",
      description: "Alert when large data exports are requested",
      category: "Data Protection",
      trigger: "data_export",
    },
    {
      id: 106,
      name: "Role Change Alert",
      description: "Alert when user roles are changed",
      category: "Access Control",
      trigger: "role_change",
    },
  ];

  const toggleWorkflow = (id: number) => {
    setWorkflows(
      workflows.map((w) =>
        w.id === id ? { ...w, isActive: !w.isActive } : w
      )
    );
  };

  const deleteWorkflow = (id: number) => {
    setWorkflows(workflows.filter((w) => w.id !== id));
  };

  const createFromTemplate = (template: WorkflowTemplate) => {
    const newWorkflow: Workflow = {
      id: Math.max(...workflows.map((w) => w.id), 0) + 1,
      name: template.name,
      description: template.description,
      trigger: template.trigger,
      isActive: true,
      executionCount: 0,
      createdAt: new Date(),
    };
    setWorkflows([...workflows, newWorkflow]);
    setView("list");
  };

  if (view === "builder") {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => setView("list")}
        >
          ← Back to Workflows
        </Button>
        <WorkflowBuilder />
      </div>
    );
  }

  if (view === "templates") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Workflow Templates</h2>
            <p className="text-muted-foreground">
              Pre-built workflows for common security scenarios
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setView("list")}
          >
            ← Back to Workflows
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </div>
                  <Badge variant="secondary">{template.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => createFromTemplate(template)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Use Template
                  </Button>
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workflow Management</h2>
          <p className="text-muted-foreground">
            Create and manage automated security incident response workflows
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setView("templates")}
          >
            View Templates
          </Button>
          <Button onClick={() => setView("builder")}>
            <Plus className="h-4 w-4 mr-1" />
            New Workflow
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{workflows.length}</p>
              <p className="text-sm text-muted-foreground">Total Workflows</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {workflows.filter((w) => w.isActive).length}
              </p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {workflows.reduce((sum, w) => sum + w.executionCount, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Executions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{templates.length}</p>
              <p className="text-sm text-muted-foreground">Templates Available</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflows List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Workflows</CardTitle>
          <CardDescription>
            Manage your automated security incident response workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{workflow.name}</h3>
                    <Badge variant={workflow.isActive ? "default" : "secondary"}>
                      {workflow.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {workflow.description}
                  </p>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Trigger: {workflow.trigger}</span>
                    <span>Executions: {workflow.executionCount}</span>
                    {workflow.lastExecutedAt && (
                      <span>
                        Last run: {workflow.lastExecutedAt.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleWorkflow(workflow.id)}
                  >
                    {workflow.isActive ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setView("builder")}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteWorkflow(workflow.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
