import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Shield, UserPlus, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

export default function RoleManagement() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const utils = trpc.useUtils();

  // Toast function
  const toast = (props: { title: string; description?: string; variant?: "default" | "destructive" }) => {
    const toastEl = document.createElement("div");
    toastEl.className = `fixed bottom-4 right-4 bg-${props.variant === "destructive" ? "red" : "green"}-600 text-white px-6 py-3 rounded-lg shadow-lg z-50`;
    toastEl.innerHTML = `<strong>${props.title}</strong>${props.description ? `<br/><span class="text-sm">${props.description}</span>` : ""}`;
    document.body.appendChild(toastEl);
    setTimeout(() => toastEl.remove(), 3000);
  };

  // Fetch data
  const { data: users } = trpc.security.account.listUsers.useQuery({
    status: "all",
    approvalStatus: "approved", // Only show approved users
  });

  const { data: roles } = trpc.security.rbac.listRoles.useQuery();

  const { data: userRoles } = trpc.security.rbac.getUserRoles.useQuery(
    { userId: selectedUserId! },
    { enabled: !!selectedUserId }
  );

  // Mutations
  const assignRole = trpc.security.rbac.assignRoleToUser.useMutation({
    onSuccess: () => {
      toast({ title: "Role Assigned", description: "Role has been assigned to user" });
      utils.security.rbac.getUserRoles.invalidate();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const removeRole = trpc.security.rbac.removeRoleFromUser.useMutation({
    onSuccess: () => {
      toast({ title: "Role Removed", description: "Role has been removed from user" });
      utils.security.rbac.getUserRoles.invalidate();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Helper to check if user has a role
  const userHasRole = (roleId: number) => {
    return userRoles?.some((ur: any) => ur.roleId === roleId) || false;
  };

  // Helper to get role name
  const getRoleName = (roleId: number) => {
    return roles?.find((r: any) => r.id === roleId)?.displayName || "Unknown";
  };

  // Handle assign multiple roles
  const handleAssignRoles = () => {
    if (!selectedUserId || selectedRoles.length === 0) return;

    // Assign each selected role
    selectedRoles.forEach((roleId) => {
      if (!userHasRole(roleId)) {
        assignRole.mutate({ userId: selectedUserId, roleId });
      }
    });

    setSelectedRoles([]);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Role Management</h1>
          <p className="text-muted-foreground">Assign roles to users and manage role assignments</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Select a user to manage their roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {users?.map((user: any) => (
                <div
                  key={user.id}
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-accent ${
                    selectedUserId === user.id ? "bg-accent" : ""
                  }`}
                  onClick={() => setSelectedUserId(user.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{user.name || `User ${user.id}`}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Badge variant="outline">{user.role}</Badge>
                        {user.accountStatus === "active" && <Badge variant="default">Active</Badge>}
                        {user.accountStatus === "disabled" && <Badge variant="destructive">Disabled</Badge>}
                        {user.accountStatus === "suspended" && <Badge variant="secondary">Suspended</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right: Role Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>Role Assignment</CardTitle>
            <CardDescription>
              {selectedUserId
                ? `Manage roles for ${users?.find((u: any) => u.id === selectedUserId)?.name || "selected user"}`
                : "Select a user to manage their roles"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedUserId ? (
              <div className="space-y-6">
                {/* Current Roles */}
                <div>
                  <h4 className="font-semibold mb-3">Current Roles</h4>
                  {userRoles && userRoles.length > 0 ? (
                    <div className="space-y-2">
                      {userRoles.map((ur: any) => {
                        const role = roles?.find((r: any) => r.id === ur.roleId);
                        return (
                          <div key={ur.id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <p className="font-medium">{role?.displayName || "Unknown Role"}</p>
                              <p className="text-xs text-muted-foreground">
                                Assigned: {new Date(ur.assignedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeRole.mutate({ userId: selectedUserId, roleId: ur.roleId })}
                              disabled={removeRole.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No roles assigned yet</p>
                  )}
                </div>

                {/* Assign New Roles */}
                <div>
                  <h4 className="font-semibold mb-3">Assign New Roles</h4>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Assign Roles
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Assign Roles to User</DialogTitle>
                        <DialogDescription>Select one or more roles to assign to this user</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid gap-3">
                          {roles?.map((role: any) => {
                            const hasRole = userHasRole(role.id);
                            const isSelected = selectedRoles.includes(role.id);
                            return (
                              <div
                                key={role.id}
                                className={`flex items-center space-x-3 p-3 border rounded-lg ${
                                  hasRole ? "opacity-50 bg-muted" : ""
                                }`}
                              >
                                <Checkbox
                                  id={`role-${role.id}`}
                                  checked={isSelected}
                                  disabled={hasRole}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedRoles([...selectedRoles, role.id]);
                                    } else {
                                      setSelectedRoles(selectedRoles.filter((id) => id !== role.id));
                                    }
                                  }}
                                />
                                <div className="flex-1">
                                  <Label htmlFor={`role-${role.id}`} className="font-medium cursor-pointer">
                                    {role.displayName}
                                  </Label>
                                  <p className="text-sm text-muted-foreground">{role.description}</p>
                                  {role.isSystemRole && (
                                    <Badge variant="outline" className="mt-1">
                                      System Role
                                    </Badge>
                                  )}
                                  {hasRole && (
                                    <Badge variant="default" className="mt-1 ml-2">
                                      Already Assigned
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={handleAssignRoles}
                            disabled={selectedRoles.length === 0 || assignRole.isPending}
                          >
                            Assign {selectedRoles.length > 0 && `(${selectedRoles.length})`} Role
                            {selectedRoles.length !== 1 ? "s" : ""}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Available Roles Reference */}
                <div>
                  <h4 className="font-semibold mb-3">Available Roles</h4>
                  <div className="space-y-2">
                    {roles?.map((role: any) => (
                      <div key={role.id} className="p-2 border rounded text-sm">
                        <p className="font-medium">{role.displayName}</p>
                        <p className="text-xs text-muted-foreground">{role.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Select a user to manage their roles</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Users with Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Role Overview</CardTitle>
          <CardDescription>View all users and their assigned roles</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Base Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Custom Roles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user: any) => (
                <TableRow key={user.id} className="cursor-pointer hover:bg-accent" onClick={() => setSelectedUserId(user.id)}>
                  <TableCell className="font-medium">{user.name || `User ${user.id}`}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.accountStatus === "active" ? "default" : "destructive"}>
                      {user.accountStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">Click to view/edit</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
