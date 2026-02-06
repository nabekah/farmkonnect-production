import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';
import { format } from 'date-fns';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'grant' | 'update' | 'revoke' | 'expire';
  performedBy: string;
  targetUser: string;
  targetEmail: string;
  farmId: string;
  farmName: string;
  previousRole?: string;
  newRole?: string;
  expirationDate?: string;
  reason?: string;
  ipAddress?: string;
}

interface PermissionAuditLogProps {
  farmId: string;
  farmName: string;
  logs?: AuditLogEntry[];
}

export const PermissionAuditLog: React.FC<PermissionAuditLogProps> = ({
  farmId,
  farmName,
  logs = [],
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [searchEmail, setSearchEmail] = useState('');

  // Mock audit logs if none provided
  const auditLogs: AuditLogEntry[] = logs.length > 0 ? logs : [
    {
      id: '1',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      action: 'grant',
      performedBy: 'John Farmer',
      targetUser: 'Jane Manager',
      targetEmail: 'jane@farm.com',
      farmId,
      farmName,
      newRole: 'editor',
      reason: 'Promoted to farm manager',
      ipAddress: '192.168.1.100',
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      action: 'grant',
      performedBy: 'John Farmer',
      targetUser: 'Bob Viewer',
      targetEmail: 'bob@farm.com',
      farmId,
      farmName,
      newRole: 'viewer',
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      reason: 'Temporary access for audit',
      ipAddress: '192.168.1.101',
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      action: 'update',
      performedBy: 'John Farmer',
      targetUser: 'Jane Manager',
      targetEmail: 'jane@farm.com',
      farmId,
      farmName,
      previousRole: 'viewer',
      newRole: 'editor',
      reason: 'Role upgrade',
      ipAddress: '192.168.1.100',
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      action: 'revoke',
      performedBy: 'John Farmer',
      targetUser: 'Old User',
      targetEmail: 'old@farm.com',
      farmId,
      farmName,
      previousRole: 'viewer',
      reason: 'User no longer with organization',
      ipAddress: '192.168.1.100',
    },
  ];

  // Filter logs
  const filteredLogs = auditLogs.filter((log) => {
    const actionMatch = filterAction === 'all' || log.action === filterAction;
    const emailMatch = log.targetEmail.toLowerCase().includes(searchEmail.toLowerCase());
    return actionMatch && emailMatch;
  });

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'grant':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'revoke':
        return 'bg-red-100 text-red-800';
      case 'expire':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'grant':
        return 'Access Granted';
      case 'update':
        return 'Permission Updated';
      case 'revoke':
        return 'Access Revoked';
      case 'expire':
        return 'Access Expired';
      default:
        return action;
    }
  };

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Action', 'Performed By', 'Target User', 'Email', 'Role', 'Reason'];
    const rows = filteredLogs.map((log) => [
      format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      getActionLabel(log.action),
      log.performedBy,
      log.targetUser,
      log.targetEmail,
      log.newRole || log.previousRole || '-',
      log.reason || '-',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-log-${farmName}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Audit Log</CardTitle>
        <CardDescription>Track all changes to farm access permissions for {farmName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search by email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
            />
          </div>
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="grant">Access Granted</SelectItem>
              <SelectItem value="update">Updated</SelectItem>
              <SelectItem value="revoke">Revoked</SelectItem>
              <SelectItem value="expire">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportCSV} size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Audit Log Entries */}
        <div className="space-y-2">
          {filteredLogs.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No audit log entries found</p>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition"
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Badge className={getActionBadgeColor(log.action)}>
                        {getActionLabel(log.action)}
                      </Badge>
                      <div>
                        <p className="font-medium text-sm">{log.targetUser}</p>
                        <p className="text-xs text-gray-500">{log.targetEmail}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm')}
                    </p>
                    <p className="text-xs font-medium mt-1">
                      by {log.performedBy}
                    </p>
                  </div>
                  {expandedId === log.id ? (
                    <ChevronUp className="w-5 h-5 ml-2" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-2" />
                  )}
                </div>

                {/* Expanded Details */}
                {expandedId === log.id && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {log.previousRole && (
                        <div>
                          <p className="text-gray-600">Previous Role</p>
                          <p className="font-medium capitalize">{log.previousRole}</p>
                        </div>
                      )}
                      {log.newRole && (
                        <div>
                          <p className="text-gray-600">New Role</p>
                          <p className="font-medium capitalize">{log.newRole}</p>
                        </div>
                      )}
                      {log.expirationDate && (
                        <div>
                          <p className="text-gray-600">Expiration Date</p>
                          <p className="font-medium">
                            {format(new Date(log.expirationDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      )}
                      {log.ipAddress && (
                        <div>
                          <p className="text-gray-600">IP Address</p>
                          <p className="font-medium font-mono text-xs">{log.ipAddress}</p>
                        </div>
                      )}
                    </div>
                    {log.reason && (
                      <div className="pt-2 border-t">
                        <p className="text-gray-600 text-sm">Reason</p>
                        <p className="text-sm">{log.reason}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-2 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {auditLogs.filter((l) => l.action === 'grant').length}
            </p>
            <p className="text-xs text-gray-600">Granted</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {auditLogs.filter((l) => l.action === 'update').length}
            </p>
            <p className="text-xs text-gray-600">Updated</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {auditLogs.filter((l) => l.action === 'revoke').length}
            </p>
            <p className="text-xs text-gray-600">Revoked</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {auditLogs.filter((l) => l.action === 'expire').length}
            </p>
            <p className="text-xs text-gray-600">Expired</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
