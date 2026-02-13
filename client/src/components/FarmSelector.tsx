import React from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';

interface FarmSelectorProps {
  selectedFarmId: string | null;
  onFarmSelect: (farmId: string | null) => void;
  showAllFarmsOption?: boolean;
}

export function FarmSelector({
  selectedFarmId,
  onFarmSelect,
  showAllFarmsOption = true,
}: FarmSelectorProps) {
  const { user } = useAuth();

  // Fetch user's farms
  const { data: farms, isLoading } = trpc.farms.listFarms.useQuery(
    { userId: user?.id || '' },
    { enabled: !!user?.id }
  );

  const selectedFarm = farms?.find((f: any) => f.id.toString() === selectedFarmId);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Select Farm</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Farm</label>
          <Select
            value={selectedFarmId || 'all'}
            onValueChange={(value) => onFarmSelect(value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a farm" />
            </SelectTrigger>
            <SelectContent>
              {showAllFarmsOption && (
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <span>📊 All Farms</span>
                  </div>
                </SelectItem>
              )}
              {isLoading ? (
                <SelectItem value="loading" disabled>
                  Loading farms...
                </SelectItem>
              ) : farms && farms.length > 0 ? (
                farms.map((farm: any) => (
                  <SelectItem key={farm.id} value={farm.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span>{farm.farmName}</span>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>
                  No farms available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Farm Info Display */}
        {selectedFarm ? (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-blue-900">{selectedFarm.farmName}</h3>
              <Badge variant="secondary">{selectedFarm.farmType || 'Mixed'}</Badge>
            </div>
            {selectedFarm.location && (
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <MapPin className="w-4 h-4" />
                <span>{selectedFarm.location}</span>
              </div>
            )}
            {selectedFarm.sizeHectares && (
              <div className="text-sm text-blue-700">
                Size: {selectedFarm.sizeHectares} hectares
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-purple-900">All Farms</h3>
              <Badge variant="outline">Consolidated View</Badge>
            </div>
            <p className="text-sm text-purple-700">
              Viewing financial data aggregated across all your farms
            </p>
          </div>
        )}

        {/* Farm Count */}
        {farms && farms.length > 0 && (
          <div className="text-xs text-gray-600 pt-2 border-t">
            You have {farms.length} farm{farms.length !== 1 ? 's' : ''}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
