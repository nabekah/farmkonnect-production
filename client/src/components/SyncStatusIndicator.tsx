import React from 'react'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { AlertCircle, Check, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function SyncStatusIndicator() {
  const { isOnline, pendingCount, failedCount, syncStatus, performSync } = useOfflineSync()

  if (!syncStatus) {
    return null
  }

  const lastSyncTime = syncStatus.lastSyncTime
    ? new Date(syncStatus.lastSyncTime).toLocaleTimeString()
    : 'Never'

  return (
    <div className="flex items-center gap-2">
      {/* Online/Offline Status */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
            <span className="text-xs font-medium">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Last sync: {lastSyncTime}</p>
        </TooltipContent>
      </Tooltip>

      {/* Pending Items Badge */}
      {pendingCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
              {pendingCount} pending
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{pendingCount} items waiting to sync</p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Failed Items Badge */}
      {failedCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
              <AlertCircle className="w-3 h-3 mr-1" />
              {failedCount} failed
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{failedCount} items failed to sync</p>
            {syncStatus.lastError && <p className="text-xs mt-1">{syncStatus.lastError}</p>}
          </TooltipContent>
        </Tooltip>
      )}

      {/* Sync Success Badge */}
      {pendingCount === 0 && failedCount === 0 && isOnline && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
              <Check className="w-3 h-3 mr-1" />
              Synced
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>All data synced</p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Manual Sync Button */}
      {pendingCount > 0 && isOnline && (
        <button
          onClick={() => performSync()}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Sync now"
        >
          <RefreshCw className="w-4 h-4 text-blue-600" />
        </button>
      )}
    </div>
  )
}
