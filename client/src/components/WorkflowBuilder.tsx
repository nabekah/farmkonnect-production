import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Play, Save, X } from "lucide-react";

interface WorkflowNode {
  id: string;
  type: "trigger" | "condition" | "action" | "notification";
  label: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export function WorkflowBuilder() {
  const [workflowName, setWorkflowName] = useState("New Workflow");
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    {
      id: "trigger-1",
      type: "trigger",
      label: "Failed Login Alert",
      config: { threshold: 3, timeWindow: 5 },
      position: { x: 50, y: 50 },
    },
  ]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showNodePalette, setShowNodePalette] = useState(false);

  const nodeTypes = [
    { type: "trigger", label: "Trigger", color: "bg-blue-100 border-blue-300" },
    { type: "condition", label: "Condition", color: "bg-purple-100 border-purple-300" },
    { type: "action", label: "Action", color: "bg-green-100 border-green-300" },
    { type: "notification", label: "Notification", color: "bg-orange-100 border-orange-300" },
  ];

  const actionTemplates = {
    trigger: [
      "Failed Login Alert",
      "Suspicious Device",
      "Budget Exceeded",
      "Access Denied",
    ],
    condition: [
      "Check IP Whitelist",
      "Verify Device",
      "Check Time Window",
      "Verify User Role",
    ],
    action: [
      "Lock Account",
      "Send Alert",
      "Create Ticket",
      "Log Event",
      "Disable User",
    ],
    notification: [
      "Email Admin",
      "SMS Alert",
      "In-app Notification",
      "Slack Message",
    ],
  };

  const addNode = (type: WorkflowNode["type"], label: string) => {
    const newNode: WorkflowNode = {
      id: `${type}-${Date.now()}`,
      type,
      label,
      config: {},
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
      },
    };
    setNodes([...nodes, newNode]);
    setShowNodePalette(false);
  };

  const deleteNode = (id: string) => {
    setNodes(nodes.filter((n) => n.id !== id));
    setEdges(edges.filter((e) => e.source !== id && e.target !== id));
  };

  const connectNodes = (sourceId: string, targetId: string) => {
    if (sourceId !== targetId) {
      setEdges([
        ...edges,
        {
          id: `edge-${sourceId}-${targetId}`,
          source: sourceId,
          target: targetId,
        },
      ]);
    }
  };

  const getNodeColor = (type: WorkflowNode["type"]) => {
    const colors: Record<string, string> = {
      trigger: "bg-blue-50 border-blue-300",
      condition: "bg-purple-50 border-purple-300",
      action: "bg-green-50 border-green-300",
      notification: "bg-orange-50 border-orange-300",
    };
    return colors[type] || "bg-gray-50 border-gray-300";
  };

  return (
    <div className="space-y-4">
      {/* Workflow Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="text-lg font-semibold"
                placeholder="Workflow Name"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Create automated security incident response workflows without coding
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button size="sm">
                <Play className="h-4 w-4 mr-1" />
                Test
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Canvas Area */}
      <Card className="relative">
        <CardHeader>
          <CardTitle>Workflow Canvas</CardTitle>
          <CardDescription>Drag nodes to build your workflow</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Canvas */}
          <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 h-96 overflow-auto">
            {/* Grid Background */}
            <svg className="absolute inset-0 w-full h-full" style={{ backgroundImage: "radial-gradient(circle, #e5e7eb 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
              {/* Draw Edges */}
              {edges.map((edge) => {
                const source = nodes.find((n) => n.id === edge.source);
                const target = nodes.find((n) => n.id === edge.target);
                if (!source || !target) return null;

                return (
                  <line
                    key={edge.id}
                    x1={source.position.x + 60}
                    y1={source.position.y + 30}
                    x2={target.position.x + 60}
                    y2={target.position.y + 30}
                    stroke="#9ca3af"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#9ca3af" />
                </marker>
              </defs>
            </svg>

            {/* Nodes */}
            <div className="relative">
              {nodes.map((node) => (
                <div
                  key={node.id}
                  className={`absolute w-32 p-3 border-2 rounded-lg cursor-move transition-all ${
                    selectedNode === node.id
                      ? "ring-2 ring-blue-500 shadow-lg"
                      : "shadow"
                  } ${getNodeColor(node.type)}`}
                  style={{
                    left: `${node.position.x}px`,
                    top: `${node.position.y}px`,
                  }}
                  onClick={() => setSelectedNode(node.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {node.type}
                    </Badge>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNode(node.id);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-sm font-medium text-center">{node.label}</p>
                  <div className="flex gap-1 mt-2 justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedNode && selectedNode !== node.id) {
                          connectNodes(selectedNode, node.id);
                        }
                      }}
                      className="text-xs px-2 py-1 bg-white border rounded hover:bg-gray-100"
                    >
                      Connect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Node Button */}
          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              onClick={() => setShowNodePalette(!showNodePalette)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Node
            </Button>
          </div>

          {/* Node Palette */}
          {showNodePalette && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {nodeTypes.map((nodeType) => (
                <div key={nodeType.type} className="space-y-2">
                  <p className="text-sm font-semibold">{nodeType.label}</p>
                  <div className="space-y-1">
                    {actionTemplates[nodeType.type as keyof typeof actionTemplates].map(
                      (template) => (
                        <Button
                          key={template}
                          size="sm"
                          variant="outline"
                          className="w-full justify-start text-xs"
                          onClick={() =>
                            addNode(nodeType.type as WorkflowNode["type"], template)
                          }
                        >
                          {template}
                        </Button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workflow Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{nodes.length}</p>
              <p className="text-sm text-muted-foreground">Nodes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{edges.length}</p>
              <p className="text-sm text-muted-foreground">Connections</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {nodes.filter((n) => n.type === "trigger").length}
              </p>
              <p className="text-sm text-muted-foreground">Triggers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {nodes.filter((n) => n.type === "action").length}
              </p>
              <p className="text-sm text-muted-foreground">Actions</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
