import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { format } from 'date-fns';

export interface AuditLog {
  id?: string;
  userId: number;
  userName?: string;
  entityType: string;
  entityId: number;
  action: 'create' | 'update' | 'delete' | 'import' | 'export';
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changedFields?: string[];
  reason?: string;
  createdAt: Date;
}

interface AuditLogViewerProps {
  logs: AuditLog[];
  loading?: boolean;
  onRefresh?: () => void;
}

export function AuditLogViewer({ logs, loading = false, onRefresh }: AuditLogViewerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filterAction, setFilterAction] = useState<string>('');
  const [filterEntity, setFilterEntity] = useState<string>('');

  const filteredLogs = logs.filter(log => {
    if (filterAction && log.action !== filterAction) return false;
    if (filterEntity && log.entityType !== filterEntity) return false;
    return true;
  });

  const entityTypes = Array.from(new Set(logs.map(l => l.entityType)));
  const actions = Array.from(new Set(logs.map(l => l.action)));

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      case 'import':
        return 'bg-purple-100 text-purple-800';
      case 'export':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Audit Logs</h3>
        {onRefresh && (
          <Button size="sm" variant="outline" onClick={onRefresh} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Actions</SelectItem>
            {actions.map(action => (
              <SelectItem key={action} value={action}>
                {action.charAt(0).toUpperCase() + action.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterEntity} onValueChange={setFilterEntity}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Entities</SelectItem>
            {entityTypes.map(entity => (
              <SelectItem key={entity} value={entity}>
                {entity}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filteredLogs.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">No audit logs found</p>
        ) : (
          filteredLogs.map((log, index) => {
            const logId = log.id || `log_${index}`;
            const isExpanded = expandedId === logId;

            return (
              <div key={logId} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : logId)}
                  className="w-full p-3 hover:bg-gray-50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${getActionColor(log.action)}`}>
                      {log.action.toUpperCase()}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{log.entityType} #{log.entityId}</p>
                      <p className="text-xs text-gray-600">
                        {log.userName || `User ${log.userId}`} • {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {log.changedFields && log.changedFields.length > 0 && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {log.changedFields.length} field{log.changedFields.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="bg-gray-50 p-3 border-t space-y-3">
                    {log.changedFields && log.changedFields.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Changed Fields:</p>
                        <div className="flex flex-wrap gap-1">
                          {log.changedFields.map(field => (
                            <span key={field} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {field}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {log.reason && (
                      <div>
                        <p className="text-sm font-medium">Reason:</p>
                        <p className="text-sm text-gray-700">{log.reason}</p>
                      </div>
                    )}

                    {log.oldValues && Object.keys(log.oldValues).length > 0 && (
                      <div>
                        <p className="text-sm font-medium">Previous Values:</p>
                        <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                          {JSON.stringify(log.oldValues, null, 2)}
                        </pre>
                      </div>
                    )}

                    {log.newValues && Object.keys(log.newValues).length > 0 && (
                      <div>
                        <p className="text-sm font-medium">New Values:</p>
                        <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                          {JSON.stringify(log.newValues, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Audit Log Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Entity</p>
                  <p className="text-sm text-gray-700">{selectedLog.entityType} #{selectedLog.entityId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Action</p>
                  <p className={`text-sm font-semibold px-2 py-1 rounded inline-block ${getActionColor(selectedLog.action)}`}>
                    {selectedLog.action.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">User</p>
                  <p className="text-sm text-gray-700">{selectedLog.userName || `User ${selectedLog.userId}`}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Date</p>
                  <p className="text-sm text-gray-700">{format(new Date(selectedLog.createdAt), 'MMM dd, yyyy HH:mm:ss')}</p>
                </div>
              </div>

              {selectedLog.changedFields && selectedLog.changedFields.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Changed Fields ({selectedLog.changedFields.length}):</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedLog.changedFields.map(field => (
                      <span key={field} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedLog.reason && (
                <div>
                  <p className="text-sm font-medium">Reason:</p>
                  <p className="text-sm text-gray-700">{selectedLog.reason}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedLog.oldValues && (
                  <div>
                    <p className="text-sm font-medium mb-2">Previous Values:</p>
                    <pre className="text-xs bg-gray-50 p-2 rounded border overflow-auto max-h-40">
                      {JSON.stringify(selectedLog.oldValues, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.newValues && (
                  <div>
                    <p className="text-sm font-medium mb-2">New Values:</p>
                    <pre className="text-xs bg-gray-50 p-2 rounded border overflow-auto max-h-40">
                      {JSON.stringify(selectedLog.newValues, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
