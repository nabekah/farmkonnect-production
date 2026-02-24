import React, { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Download, Trash2, RotateCcw, Plus } from 'lucide-react';

export function AdminBackupDashboard() {
  const { user } = useAuth();
  const [selectedBackupId, setSelectedBackupId] = useState<string | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <Alert className="m-4">
        <AlertDescription>
          Access denied. Only administrators can manage backups.
        </AlertDescription>
      </Alert>
    );
  }

  // Fetch backups list
  const { data: backups, isLoading: backupsLoading, refetch: refetchBackups } = trpc.backup.listBackups.useQuery();

  // Create backup mutation
  const createBackupMutation = trpc.backup.createBackup.useMutation({
    onSuccess: () => {
      refetchBackups();
    },
  });

  // Restore backup mutation
  const restoreBackupMutation = trpc.backup.restoreBackup.useMutation({
    onSuccess: () => {
      setRestoreLoading(false);
      setSelectedBackupId(null);
      refetchBackups();
    },
    onError: () => {
      setRestoreLoading(false);
    },
  });

  // Delete backup mutation
  const deleteBackupMutation = trpc.backup.deleteBackup.useMutation({
    onSuccess: () => {
      setDeleteLoading(false);
      refetchBackups();
    },
    onError: () => {
      setDeleteLoading(false);
    },
  });

  const handleCreateBackup = async () => {
    try {
      await createBackupMutation.mutateAsync();
    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to restore this backup? This will overwrite current data.')) {
      return;
    }
    setRestoreLoading(true);
    setSelectedBackupId(backupId);
    try {
      await restoreBackupMutation.mutateAsync({ backupId });
    } catch (error) {
      console.error('Failed to restore backup:', error);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup?')) {
      return;
    }
    setDeleteLoading(true);
    try {
      await deleteBackupMutation.mutateAsync({ backupId });
    } catch (error) {
      console.error('Failed to delete backup:', error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Database Backups</h1>
          <p className="text-gray-600 mt-2">Manage automated database backups and restoration</p>
        </div>
        <Button
          onClick={handleCreateBackup}
          disabled={createBackupMutation.isPending}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          {createBackupMutation.isPending ? 'Creating...' : 'Create Backup'}
        </Button>
      </div>

      {/* Backup Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backups?.length || 0}</div>
            <p className="text-xs text-gray-600 mt-1">30-day retention policy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {backups && backups.length > 0
                ? new Date(backups[0].createdAt).toLocaleDateString()
                : 'Never'}
            </div>
            <p className="text-xs text-gray-600 mt-1">Automatic daily at 2 AM UTC</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-gray-600 mt-1">Automated backups running</p>
          </CardContent>
        </Card>
      </div>

      {/* Backups List */}
      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
          <CardDescription>Recent database backups with restoration options</CardDescription>
        </CardHeader>
        <CardContent>
          {backupsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : backups && backups.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Backup ID</th>
                    <th className="text-left py-2 px-4">Created</th>
                    <th className="text-left py-2 px-4">Size</th>
                    <th className="text-left py-2 px-4">Status</th>
                    <th className="text-left py-2 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((backup: any) => (
                    <tr key={backup.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4 font-mono text-xs">{backup.id.substring(0, 8)}...</td>
                      <td className="py-2 px-4">
                        {new Date(backup.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2 px-4">
                        {backup.size ? `${(backup.size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                      </td>
                      <td className="py-2 px-4">
                        <span className="inline-block px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                          Completed
                        </span>
                      </td>
                      <td className="py-2 px-4 space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestoreBackup(backup.id)}
                          disabled={restoreLoading && selectedBackupId === backup.id}
                          className="gap-1"
                        >
                          {restoreLoading && selectedBackupId === backup.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3 h-3" />
                          )}
                          Restore
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteBackup(backup.id)}
                          disabled={deleteLoading}
                          className="gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              <p>No backups available yet. Create one to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Settings</CardTitle>
          <CardDescription>Automated backup configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Schedule</h4>
            <p className="text-sm text-gray-600">Automatic backups run daily at 2:00 AM UTC</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Retention Policy</h4>
            <p className="text-sm text-gray-600">Backups are retained for 30 days before automatic deletion</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Storage</h4>
            <p className="text-sm text-gray-600">Backups are stored securely on the database server</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
