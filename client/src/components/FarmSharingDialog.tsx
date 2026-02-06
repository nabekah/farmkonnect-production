import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Calendar } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from '@/lib/toastNotifications';

export interface SharedUser {
  userId: string;
  email: string;
  role: 'viewer' | 'editor' | 'admin';
  grantedAt: string;
  expiresAt?: string;
}

interface FarmSharingDialogProps {
  farmId: string;
  farmName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FarmSharingDialog: React.FC<FarmSharingDialogProps> = ({
  farmId,
  farmName,
  open,
  onOpenChange,
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor' | 'admin'>('viewer');
  const [expirationDays, setExpirationDays] = useState<string>('');
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);

  const grantPermissionMutation = trpc.farmPermissions.grant.useMutation();
  const revokePermissionMutation = trpc.farmPermissions.revoke.useMutation();
  const listPermissionsMutation = trpc.farmPermissions.list.useMutation();

  // Load existing permissions when dialog opens
  React.useEffect(() => {
    if (open) {
      listPermissionsMutation.mutate(
        { farmId },
        {
          onSuccess: (data) => {
            setSharedUsers(data);
          },
          onError: () => {
            toast({
              title: 'Error',
              description: 'Failed to load shared users',
              type: 'error',
            });
          },
        }
      );
    }
  }, [open, farmId]);

  const handleGrantPermission = async () => {
    if (!email.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        type: 'error',
      });
      return;
    }

    const expiresAt = expirationDays
      ? new Date(Date.now() + parseInt(expirationDays) * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    grantPermissionMutation.mutate(
      {
        farmId,
        email,
        role,
        expiresAt,
      },
      {
        onSuccess: (newPermission) => {
          setSharedUsers([...sharedUsers, newPermission]);
          setEmail('');
          setRole('viewer');
          setExpirationDays('');
          toast({
            title: 'Success',
            description: `Access granted to ${email}`,
            type: 'success',
          });
        },
        onError: (error: any) => {
          toast({
            title: 'Error',
            description: error.message || 'Failed to grant permission',
            type: 'error',
          });
        },
      }
    );
  };

  const handleRevokePermission = (userId: string, userEmail: string) => {
    revokePermissionMutation.mutate(
      { farmId, userId },
      {
        onSuccess: () => {
          setSharedUsers(sharedUsers.filter((u) => u.userId !== userId));
          toast({
            title: 'Success',
            description: `Access revoked for ${userEmail}`,
            type: 'success',
          });
        },
        onError: () => {
          toast({
            title: 'Error',
            description: 'Failed to revoke permission',
            type: 'error',
          });
        },
      }
    );
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'editor':
        return 'bg-blue-100 text-blue-800';
      case 'viewer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share Farm Access</DialogTitle>
          <DialogDescription>
            Manage who has access to {farmName}. Set roles and expiration dates for temporary access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New User Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Grant Access</CardTitle>
              <CardDescription>Add a new user to this farm</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="User email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                />
                <Select value={role} onValueChange={(value: any) => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <Input
                    placeholder="Expiration (days)"
                    type="number"
                    value={expirationDays}
                    onChange={(e) => setExpirationDays(e.target.value)}
                    min="1"
                  />
                </div>
                <Button
                  onClick={handleGrantPermission}
                  disabled={grantPermissionMutation.isPending}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {grantPermissionMutation.isPending ? 'Granting...' : 'Grant Access'}
                </Button>
              </div>

              <p className="text-xs text-gray-500">
                Leave expiration empty for permanent access. Roles: Viewer (read-only), Editor (can modify),
                Admin (full control)
              </p>
            </CardContent>
          </Card>

          {/* Shared Users List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Access</CardTitle>
              <CardDescription>
                {sharedUsers.length} user{sharedUsers.length !== 1 ? 's' : ''} have access to this farm
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sharedUsers.length === 0 ? (
                <p className="text-sm text-gray-500">No users have access to this farm yet</p>
              ) : (
                <div className="space-y-3">
                  {sharedUsers.map((user) => (
                    <div
                      key={user.userId}
                      className={`flex items-center justify-between p-3 border rounded-lg ${
                        isExpired(user.expiresAt) ? 'bg-red-50 border-red-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                          {user.expiresAt && (
                            <span className="text-xs text-gray-500">
                              {isExpired(user.expiresAt) ? 'Expired' : `Expires ${new Date(user.expiresAt).toLocaleDateString()}`}
                            </span>
                          )}
                          {!user.expiresAt && <span className="text-xs text-gray-500">Permanent</span>}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokePermission(user.userId, user.email)}
                        disabled={revokePermissionMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
