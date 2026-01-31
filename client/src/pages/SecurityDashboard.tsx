import { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { Shield, Users, Key, Activity, AlertTriangle, CheckCircle, XCircle, Lock, Settings as SettingsIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

export default function SecurityDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const utils = trpc.useUtils();

  // Toast function
  const toast = (props: { title: string; description?: string; variant?: "default" | "destructive" }) => {
    const toastEl = document.createElement("div");
    toastEl.className = `fixed bottom-4 right-4 bg-${props.variant === "destructive" ? "red" : "green"}-600 text-white px-6 py-3 rounded-lg shadow-lg z-50`;
    toastEl.innerHTML = `<strong>${props.title}</strong>${props.description ? `<br/><span class="text-sm">${props.description}</span>` : ""}`;
    document.body.appendChild(toastEl);
    setTimeout(() => toastEl.remove(), 3000);
  };

  // ============================================================================
  // OVERVIEW TAB
  // ============================================================================
  const { data: auditStats } = trpc.security.auditLogs.getStatistics.useQuery();
  const { data: pendingApprovals } = trpc.security.approval.listPendingApprovals.useQuery();
  const { data: activeSessions } = trpc.security.sessions.listAllSessions.useQuery({});

  const seedSystem = trpc.security.system.seedSecuritySystem.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Success", description: data.message });
        setIsInitialized(true);
        utils.security.invalidate();
      } else {
        toast({ title: "Info", description: data.message });
        setIsInitialized(true);
      }
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Auto-initialize on first load
  useEffect(() => {
    if (!isInitialized && !seedSystem.isPending) {
      seedSystem.mutate();
    }
  }, []);

  // ============================================================================
  // USER APPROVAL TAB
  // ============================================================================
  const approveUser = trpc.security.approval.approveUser.useMutation({
    onSuccess: () => {
      toast({ title: "User Approved", description: "User account has been activated" });
      utils.security.approval.listPendingApprovals.invalidate();
    },
  });

  const rejectUser = trpc.security.approval.rejectUser.useMutation({
    onSuccess: () => {
      toast({ title: "User Rejected", description: "User account has been rejected" });
      utils.security.approval.listPendingApprovals.invalidate();
    },
  });

  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // ============================================================================
  // ACCOUNT MANAGEMENT TAB
  // ============================================================================
  const { data: users } = trpc.security.account.listUsers.useQuery({
    status: "all",
    approvalStatus: "all",
  });

  const disableAccount = trpc.security.account.disableAccount.useMutation({
    onSuccess: () => {
      toast({ title: "Account Disabled" });
      utils.security.account.listUsers.invalidate();
    },
  });

  const enableAccount = trpc.security.account.enableAccount.useMutation({
    onSuccess: () => {
      toast({ title: "Account Enabled" });
      utils.security.account.listUsers.invalidate();
    },
  });

  const suspendAccount = trpc.security.account.suspendAccount.useMutation({
    onSuccess: () => {
      toast({ title: "Account Suspended" });
      utils.security.account.listUsers.invalidate();
    },
  });

  const [accountAction, setAccountAction] = useState<{ userId: number; action: string; reason?: string } | null>(null);

  // ============================================================================
  // RBAC TAB - ENHANCED
  // ============================================================================
  const { data: roles } = trpc.security.rbac.listRoles.useQuery();
  const { data: modules } = trpc.security.rbac.listModulePermissions.useQuery();
  const { data: rolePermissions } = trpc.security.rbac.getRolePermissions.useQuery(
    { roleId: selectedRoleId! },
    { enabled: !!selectedRoleId }
  );

  const createRole = trpc.security.rbac.createRole.useMutation({
    onSuccess: () => {
      toast({ title: "Role Created" });
      utils.security.rbac.listRoles.invalidate();
      setNewRole({ roleName: "", displayName: "", description: "" });
    },
  });

  const setRolePermissions = trpc.security.rbac.setRolePermissions.useMutation({
    onSuccess: () => {
      toast({ title: "Permissions Updated" });
      utils.security.rbac.getRolePermissions.invalidate();
    },
  });

  const deleteRole = trpc.security.rbac.deleteRole.useMutation({
    onSuccess: () => {
      toast({ title: "Role Deleted" });
      utils.security.rbac.listRoles.invalidate();
      setSelectedRoleId(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const [newRole, setNewRole] = useState({ roleName: "", displayName: "", description: "" });

  // Helper to get current permission for a module
  const getPermissionForModule = (moduleId: number) => {
    return rolePermissions?.find((rp: any) => rp.permissionId === moduleId) || {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canExport: false,
    };
  };

  // Helper to update permission
  const updatePermission = (moduleId: number, field: string, value: boolean) => {
    const currentPerm = getPermissionForModule(moduleId);
    setRolePermissions.mutate({
      roleId: selectedRoleId!,
      permissionId: moduleId,
      canView: field === "canView" ? value : currentPerm.canView,
      canCreate: field === "canCreate" ? value : currentPerm.canCreate,
      canEdit: field === "canEdit" ? value : currentPerm.canEdit,
      canDelete: field === "canDelete" ? value : currentPerm.canDelete,
      canExport: field === "canExport" ? value : currentPerm.canExport,
    });
  };

  // Group modules by category
  const groupedModules = modules?.reduce((acc: any, module: any) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {});

  // ============================================================================
  // AUDIT LOGS TAB
  // ============================================================================
  const { data: auditLogs } = trpc.security.auditLogs.list.useQuery({
    limit: 50,
  });

  // ============================================================================
  // SESSIONS TAB
  // ============================================================================
  const terminateSession = trpc.security.sessions.terminateSession.useMutation({
    onSuccess: () => {
      toast({ title: "Session Terminated" });
      utils.security.sessions.listAllSessions.invalidate();
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-muted-foreground">Manage system security, users, roles, and permissions</p>
        </div>
        {!isInitialized && (
          <Button onClick={() => seedSystem.mutate()} disabled={seedSystem.isPending}>
            <Shield className="mr-2 h-4 w-4" />
            {seedSystem.isPending ? "Initializing..." : "Initialize Security System"}
          </Button>
        )}
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="approvals">
            Approvals
            {pendingApprovals && pendingApprovals.length > 0 && (
              <Badge className="ml-2" variant="destructive">
                {pendingApprovals.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="rbac">RBAC</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingApprovals?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Users awaiting approval</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeSessions?.filter((s) => s.isActive).length || 0}</div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{auditStats?.failedLoginAttempts || 0}</div>
                <p className="text-xs text-muted-foreground">Total failed attempts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">MFA Enrollments</CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{auditStats?.mfaEnrollments || 0}</div>
                <p className="text-xs text-muted-foreground">Users with MFA</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Security Overview</CardTitle>
              <CardDescription>System security status and recent activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">System Status</span>
                  <Badge variant="default">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Operational
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Security Level</span>
                  <Badge variant="default">High</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Roles Configured</span>
                  <span className="text-sm text-muted-foreground">{roles?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Modules Protected</span>
                  <span className="text-sm text-muted-foreground">{modules?.length || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* USER APPROVALS TAB */}
        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending User Approvals</CardTitle>
              <CardDescription>Review and approve new user registrations</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingApprovals && pendingApprovals.length > 0 ? (
                <div className="space-y-4">
                  {pendingApprovals.map((request: any) => (
                    <div key={request.id} className="flex items-center justify-between border-b pb-4">
                      <div>
                        <p className="font-medium">User ID: {request.userId}</p>
                        <p className="text-sm text-muted-foreground">Requested Role: {request.requestedRole || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">Justification: {request.justification || "None provided"}</p>
                        <p className="text-xs text-muted-foreground">
                          Requested: {new Date(request.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveUser.mutate({ userId: request.userId })}
                          disabled={approveUser.isPending}
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="destructive" onClick={() => setSelectedUserId(request.userId)}>
                              <XCircle className="mr-1 h-4 w-4" />
                              Reject
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reject User</DialogTitle>
                              <DialogDescription>Provide a reason for rejection</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Rejection Reason</Label>
                                <Textarea
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  placeholder="Enter reason for rejection..."
                                />
                              </div>
                              <Button
                                onClick={() => {
                                  if (selectedUserId && rejectionReason) {
                                    rejectUser.mutate({ userId: selectedUserId, reviewNotes: rejectionReason });
                                    setRejectionReason("");
                                    setSelectedUserId(null);
                                  }
                                }}
                                disabled={!rejectionReason || rejectUser.isPending}
                              >
                                Confirm Rejection
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No pending approvals</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ACCOUNT MANAGEMENT TAB */}
        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Accounts</CardTitle>
              <CardDescription>Manage user account status and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {users?.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{user.name || `User ${user.id}`}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant={user.accountStatus === "active" ? "default" : "destructive"}>
                          {user.accountStatus}
                        </Badge>
                        <Badge variant={user.approvalStatus === "approved" ? "default" : "secondary"}>
                          {user.approvalStatus}
                        </Badge>
                        {user.mfaEnabled && (
                          <Badge variant="outline">
                            <Key className="mr-1 h-3 w-3" />
                            MFA
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {user.accountStatus === "active" && (
                        <>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                Disable
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Disable Account</DialogTitle>
                                <DialogDescription>Provide a reason for disabling this account</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Textarea
                                  placeholder="Reason for disabling..."
                                  onChange={(e) => setAccountAction({ userId: user.id, action: "disable", reason: e.target.value })}
                                />
                                <Button
                                  onClick={() => {
                                    if (accountAction?.reason) {
                                      disableAccount.mutate({ userId: user.id, reason: accountAction.reason });
                                      setAccountAction(null);
                                    }
                                  }}
                                  disabled={!accountAction?.reason}
                                >
                                  Confirm Disable
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                Suspend
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Suspend Account</DialogTitle>
                                <DialogDescription>Temporarily suspend this account</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Textarea
                                  placeholder="Reason for suspension..."
                                  onChange={(e) => setAccountAction({ userId: user.id, action: "suspend", reason: e.target.value })}
                                />
                                <Button
                                  onClick={() => {
                                    if (accountAction?.reason) {
                                      suspendAccount.mutate({ userId: user.id, reason: accountAction.reason });
                                      setAccountAction(null);
                                    }
                                  }}
                                  disabled={!accountAction?.reason}
                                >
                                  Confirm Suspend
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}
                      {(user.accountStatus === "disabled" || user.accountStatus === "suspended") && (
                        <Button size="sm" onClick={() => enableAccount.mutate({ userId: user.id })}>
                          Enable
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RBAC TAB - ENHANCED WITH MODULE PERMISSION ASSIGNMENT */}
        <TabsContent value="rbac" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Left: Roles List */}
            <Card>
              <CardHeader>
                <CardTitle>Roles</CardTitle>
                <CardDescription>Select a role to manage its permissions</CardDescription>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="mt-2">
                      <Shield className="mr-2 h-4 w-4" />
                      Create New Role
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Custom Role</DialogTitle>
                      <DialogDescription>Define a new role with custom permissions</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Role Name (lowercase, underscores)</Label>
                        <Input
                          value={newRole.roleName}
                          onChange={(e) => setNewRole({ ...newRole, roleName: e.target.value })}
                          placeholder="e.g., data_analyst"
                        />
                      </div>
                      <div>
                        <Label>Display Name</Label>
                        <Input
                          value={newRole.displayName}
                          onChange={(e) => setNewRole({ ...newRole, displayName: e.target.value })}
                          placeholder="e.g., Data Analyst"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={newRole.description}
                          onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                          placeholder="Role description..."
                        />
                      </div>
                      <Button
                        onClick={() => createRole.mutate(newRole)}
                        disabled={!newRole.roleName || !newRole.displayName || createRole.isPending}
                      >
                        Create Role
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {roles?.map((role: any) => (
                    <div
                      key={role.id}
                      className={`p-3 border rounded-lg cursor-pointer hover:bg-accent ${
                        selectedRoleId === role.id ? "bg-accent" : ""
                      }`}
                      onClick={() => setSelectedRoleId(role.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{role.displayName}</p>
                          <p className="text-sm text-muted-foreground">{role.description}</p>
                          {role.isSystemRole && (
                            <Badge variant="outline" className="mt-1">
                              System Role
                            </Badge>
                          )}
                        </div>
                        {!role.isSystemRole && selectedRoleId === role.id && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete role "${role.displayName}"?`)) {
                                deleteRole.mutate({ roleId: role.id });
                              }
                            }}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Right: Module Permissions */}
            <Card>
              <CardHeader>
                <CardTitle>Module Permissions</CardTitle>
                <CardDescription>
                  {selectedRoleId
                    ? `Configure permissions for ${roles?.find((r: any) => r.id === selectedRoleId)?.displayName}`
                    : "Select a role to configure permissions"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedRoleId && groupedModules ? (
                  <div className="space-y-6">
                    {Object.entries(groupedModules).map(([category, categoryModules]: [string, any]) => (
                      <div key={category}>
                        <h4 className="font-semibold mb-2">{category}</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Module</TableHead>
                              <TableHead className="text-center w-16">View</TableHead>
                              <TableHead className="text-center w-16">Create</TableHead>
                              <TableHead className="text-center w-16">Edit</TableHead>
                              <TableHead className="text-center w-16">Delete</TableHead>
                              <TableHead className="text-center w-16">Export</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {categoryModules.map((module: any) => {
                              const perm = getPermissionForModule(module.id);
                              return (
                                <TableRow key={module.id}>
                                  <TableCell className="font-medium">{module.displayName}</TableCell>
                                  <TableCell className="text-center">
                                    <Checkbox
                                      checked={perm.canView}
                                      onCheckedChange={(checked) => updatePermission(module.id, "canView", !!checked)}
                                    />
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Checkbox
                                      checked={perm.canCreate}
                                      onCheckedChange={(checked) => updatePermission(module.id, "canCreate", !!checked)}
                                    />
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Checkbox
                                      checked={perm.canEdit}
                                      onCheckedChange={(checked) => updatePermission(module.id, "canEdit", !!checked)}
                                    />
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Checkbox
                                      checked={perm.canDelete}
                                      onCheckedChange={(checked) => updatePermission(module.id, "canDelete", !!checked)}
                                    />
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Checkbox
                                      checked={perm.canExport}
                                      onCheckedChange={(checked) => updatePermission(module.id, "canExport", !!checked)}
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Select a role to configure permissions</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AUDIT LOGS TAB */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Audit Logs</CardTitle>
              <CardDescription>Track all security-related events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {auditLogs?.map((log: any) => (
                  <div key={log.id} className="flex items-start justify-between border-b pb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={log.severity === "high" || log.severity === "critical" ? "destructive" : "default"}>
                          {log.severity}
                        </Badge>
                        <span className="font-medium">{log.eventType}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{log.eventDescription}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(log.createdAt).toLocaleString()} • User ID: {log.userId || "System"} • IP: {log.ipAddress || "N/A"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SESSIONS TAB */}
        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Monitor and manage user sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activeSessions?.map((session: any) => (
                  <div key={session.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">User ID: {session.userId}</p>
                      <p className="text-sm text-muted-foreground">{session.deviceName || "Unknown Device"}</p>
                      <p className="text-xs text-muted-foreground">
                        IP: {session.ipAddress} • Last Activity: {new Date(session.lastActivity).toLocaleString()}
                      </p>
                      <Badge variant={session.isActive ? "default" : "secondary"}>
                        {session.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {session.isActive && (
                      <Button size="sm" variant="destructive" onClick={() => terminateSession.mutate({ sessionId: session.id })}>
                        <Lock className="mr-1 h-4 w-4" />
                        Terminate
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
