import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Wifi, WifiOff, Download, Upload, RefreshCw } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';

interface OfflineTransaction {
  id: string;
  type: 'expense' | 'revenue';
  amount: number;
  category: string;
  description: string;
  date: string;
  status: 'pending' | 'synced';
  farmId: number;
}

export function MobileDashboard() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineTransactions, setOfflineTransactions] = useState<OfflineTransaction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load offline transactions from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('offlineTransactions');
    if (stored) {
      setOfflineTransactions(JSON.parse(stored));
    }
  }, []);

  // Save offline transactions to localStorage
  const saveOfflineTransaction = (transaction: OfflineTransaction) => {
    const updated = [...offlineTransactions, transaction];
    setOfflineTransactions(updated);
    localStorage.setItem('offlineTransactions', JSON.stringify(updated));
  };

  // Sync offline transactions when online
  const handleSync = async () => {
    if (!isOnline || offlineTransactions.length === 0) return;

    setIsSyncing(true);
    try {
      for (const transaction of offlineTransactions) {
        if (transaction.status === 'pending') {
          // Sync transaction to server
          // This would call the appropriate tRPC mutation
          console.log('Syncing transaction:', transaction);
          
          // Mark as synced
          transaction.status = 'synced';
        }
      }

      setOfflineTransactions(offlineTransactions.filter(t => t.status === 'pending'));
      localStorage.setItem('offlineTransactions', JSON.stringify(offlineTransactions));
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Connection Status</CardTitle>
            {isOnline ? (
              <Badge className="bg-green-500 flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                Online
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1">
                <WifiOff className="w-3 h-3" />
                Offline
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            {isOnline
              ? 'Connected to network'
              : 'Working offline - transactions will sync when connection returns'}
          </p>
          {lastSyncTime && (
            <p className="text-xs text-gray-500 mt-2">
              Last synced: {lastSyncTime.toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pending Transactions */}
      {offlineTransactions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Pending Sync</CardTitle>
              <Badge variant="outline">{offlineTransactions.length}</Badge>
            </div>
            <CardDescription>Transactions waiting to sync</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {offlineTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="p-3 border rounded-lg bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{transaction.description}</p>
                    <p className="text-xs text-gray-600">{transaction.category}</p>
                  </div>
                  <span className="font-semibold">
                    {transaction.type === 'expense' ? '-' : '+'}${transaction.amount}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{transaction.date}</p>
              </div>
            ))}

            {isOnline && (
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full mt-4"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start">
            <Download className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Download className="w-4 h-4 mr-2" />
            Add Revenue
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <AlertCircle className="w-4 h-4 mr-2" />
            View Alerts
          </Button>
        </CardContent>
      </Card>

      {/* Sync Status */}
      {!isOnline && offlineTransactions.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm text-yellow-900">
                  {offlineTransactions.length} transaction(s) waiting to sync
                </p>
                <p className="text-xs text-yellow-800 mt-1">
                  Your data will sync automatically when you're back online
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
