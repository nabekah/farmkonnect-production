import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, UserCheck, UserCog, Users, Search, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";


export default function RoleManagement() {
  const toast = ({ title, description, variant }: { title: string; description: string; variant?: string }) => {
    console.log(`${title}: ${description}`);
  };
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [newAccreditationStatus, setNewAccreditationStatus] = useState<string>("");

  // Queries
  const { data: allUsers, refetch: refetchUsers } = trpc.roleManagement.getAllUsers.useQuery({
    role: roleFilter === "all" ? undefined : (roleFilter as any),
    search: searchQuery || undefined,
  });

  const { data: specialists, refetch: refetchSpecialists } =
    trpc.roleManagement.getAllSpecialists.useQuery();

  const { data: myRole } = trpc.roleManagement.getMyRole.useQuery();

  // Mutations
  const updateRoleMutation = trpc.roleManagement.updateUserRole.useMutation({
    onSuccess: () => {
      toast({
        title: "Role Updated",
        description: "User role has been updated successfully.",
      });
      refetchUsers();
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateAccreditationMutation = trpc.roleManagement.updateAccreditationStatus.useMutation({
    onSuccess: () => {
      toast({
        title: "Accreditation Updated",
        description: "Accreditation status has been updated successfully.",
      });
      refetchSpecialists();
      refetchUsers();
      setSelectedProfile(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpdateRole = () => {
    if (selectedUser && newRole) {
      updateRoleMutation.mutate({
        userId: selectedUser.id,
        role: newRole as any,
      });
    }
  };

  const handleUpdateAccreditation = () => {
    if (selectedProfile && newAccreditationStatus) {
      updateAccreditationMutation.mutate({
        profileId: selectedProfile.id,
        status: newAccreditationStatus as any,
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      farmer: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      agent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      veterinarian: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      buyer: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      transporter: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      user: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    };
    return colors[role] || colors.user;
  };

  const getAccreditationIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "expired":
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case "revoked":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  // Check if current user is admin
  const isAdmin = myRole?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You do not have permission to access role management. This feature is restricted to administrators.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <UserCog className="h-8 w-8" />
          Role Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage user roles, permissions, and specialist accreditations
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <Label>Search Users</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="w-48">
            <Label>Filter by Role</Label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="farmer">Farmer</SelectItem>
                <SelectItem value="agent">Extension Agent</SelectItem>
                <SelectItem value="veterinarian">Veterinarian</SelectItem>
                <SelectItem value="buyer">Buyer</SelectItem>
                <SelectItem value="transporter">Transporter</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users ({allUsers?.length || 0})
          </CardTitle>
          <CardDescription>Manage user roles and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Accreditation</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allUsers?.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name || "N/A"}</TableCell>
                  <TableCell>{user.email || "N/A"}</TableCell>
                  <TableCell>{user.phone || "N/A"}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {user.specialistProfile ? (
                      <div className="flex items-center gap-2">
                        {getAccreditationIcon(user.specialistProfile.accreditationStatus)}
                        <span className="text-sm capitalize">
                          {user.specialistProfile.accreditationStatus}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setNewRole(user.role);
                          }}
                        >
                          Edit Role
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update User Role</DialogTitle>
                          <DialogDescription>
                            Change the role for {user.name || user.email}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label>Current Role</Label>
                            <Badge className={`${getRoleBadgeColor(user.role)} mt-2`}>
                              {user.role}
                            </Badge>
                          </div>
                          <div>
                            <Label>New Role</Label>
                            <Select value={newRole} onValueChange={setNewRole}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="farmer">Farmer</SelectItem>
                                <SelectItem value="agent">Extension Agent</SelectItem>
                                <SelectItem value="veterinarian">Veterinarian</SelectItem>
                                <SelectItem value="buyer">Buyer</SelectItem>
                                <SelectItem value="transporter">Transporter</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            onClick={handleUpdateRole}
                            disabled={updateRoleMutation.isPending}
                            className="w-full"
                          >
                            {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Specialists Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Specialists ({specialists?.length || 0})
          </CardTitle>
          <CardDescription>Manage extension agents and veterinarians accreditation</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>License Number</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {specialists?.map((specialist: any) => (
                <TableRow key={specialist.id}>
                  <TableCell className="font-medium">{specialist.name || "N/A"}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(specialist.role)}>{specialist.role}</Badge>
                  </TableCell>
                  <TableCell>{specialist.profile?.licenseNumber || "N/A"}</TableCell>
                  <TableCell>{specialist.profile?.specialization || "N/A"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {specialist.profile?.licenseExpiryDate
                      ? new Date(specialist.profile.licenseExpiryDate).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {specialist.profile ? (
                      <div className="flex items-center gap-2">
                        {getAccreditationIcon(specialist.profile.accreditationStatus)}
                        <span className="text-sm capitalize">
                          {specialist.profile.accreditationStatus}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No Profile</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {specialist.profile && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedProfile(specialist.profile);
                              setNewAccreditationStatus(specialist.profile.accreditationStatus);
                            }}
                          >
                            Update Status
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Update Accreditation Status</DialogTitle>
                            <DialogDescription>
                              Change the accreditation status for {specialist.name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <Label>Current Status</Label>
                              <div className="flex items-center gap-2 mt-2">
                                {getAccreditationIcon(specialist.profile.accreditationStatus)}
                                <span className="capitalize">
                                  {specialist.profile.accreditationStatus}
                                </span>
                              </div>
                            </div>
                            <div>
                              <Label>New Status</Label>
                              <Select
                                value={newAccreditationStatus}
                                onValueChange={setNewAccreditationStatus}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="verified">Verified</SelectItem>
                                  <SelectItem value="expired">Expired</SelectItem>
                                  <SelectItem value="revoked">Revoked</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              onClick={handleUpdateAccreditation}
                              disabled={updateAccreditationMutation.isPending}
                              className="w-full"
                            >
                              {updateAccreditationMutation.isPending
                                ? "Updating..."
                                : "Update Status"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
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
