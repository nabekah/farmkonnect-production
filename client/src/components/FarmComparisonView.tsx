import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Farm {
  id: number;
  farmName: string;
  location?: string;
}

interface FarmKPIs {
  farmId: number;
  farmName: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  activeAnimals: number;
  activeWorkers: number;
  activePonds: number;
  activeAssets: number;
}

interface FarmComparisonViewProps {
  farms: Farm[] | undefined;
  kpiData: Record<number, FarmKPIs>;
  loading?: boolean;
}

/**
 * Farm Comparison View Component
 * Displays side-by-side KPI comparison across multiple farms
 */
export function FarmComparisonView({
  farms,
  kpiData,
  loading = false,
}: FarmComparisonViewProps) {
  const [selectedFarms, setSelectedFarms] = useState<number[]>(
    farms?.slice(0, 2).map((f) => f.id) || []
  );

  const toggleFarmSelection = (farmId: number) => {
    setSelectedFarms((prev) =>
      prev.includes(farmId)
        ? prev.filter((id) => id !== farmId)
        : [...prev, farmId].slice(0, 3) // Max 3 farms for comparison
    );
  };

  const comparisonFarms = selectedFarms
    .map((id) => kpiData[id])
    .filter(Boolean);

  if (!farms || farms.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">No farms available for comparison</p>
        </CardContent>
      </Card>
    );
  }

  const calculateTrend = (value: number, otherValues: number[]) => {
    if (otherValues.length === 0) return null;
    const average = otherValues.reduce((a, b) => a + b, 0) / otherValues.length;
    return value > average ? "up" : value < average ? "down" : "neutral";
  };

  return (
    <div className="space-y-6">
      {/* Farm Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Farms to Compare</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {farms.map((farm) => (
              <div key={farm.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`farm-${farm.id}`}
                  checked={selectedFarms.includes(farm.id)}
                  onCheckedChange={() => toggleFarmSelection(farm.id)}
                  disabled={
                    !selectedFarms.includes(farm.id) && selectedFarms.length >= 3
                  }
                />
                <label
                  htmlFor={`farm-${farm.id}`}
                  className="text-sm font-medium cursor-pointer"
                >
                  {farm.farmName}
                </label>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Select up to 3 farms to compare
          </p>
        </CardContent>
      </Card>

      {/* Comparison Tables */}
      {comparisonFarms.length > 0 && (
        <div className="space-y-4">
          {/* Revenue Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {comparisonFarms.map((farm) => {
                  const otherValues = comparisonFarms
                    .filter((f) => f.farmId !== farm.farmId)
                    .map((f) => f.totalRevenue);
                  const trend = calculateTrend(farm.totalRevenue, otherValues);

                  return (
                    <div
                      key={farm.farmId}
                      className="p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <p className="text-sm font-medium text-muted-foreground">
                        {farm.farmName}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-2xl font-bold">
                          GH₵ {farm.totalRevenue.toLocaleString()}
                        </p>
                        {trend === "up" && (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        )}
                        {trend === "down" && (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Expenses Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Expenses Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {comparisonFarms.map((farm) => {
                  const otherValues = comparisonFarms
                    .filter((f) => f.farmId !== farm.farmId)
                    .map((f) => f.totalExpenses);
                  const trend = calculateTrend(farm.totalExpenses, otherValues);

                  return (
                    <div
                      key={farm.farmId}
                      className="p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <p className="text-sm font-medium text-muted-foreground">
                        {farm.farmName}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-2xl font-bold text-red-600">
                          GH₵ {farm.totalExpenses.toLocaleString()}
                        </p>
                        {trend === "up" && (
                          <TrendingUp className="w-5 h-5 text-red-600" />
                        )}
                        {trend === "down" && (
                          <TrendingDown className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Net Profit Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Net Profit Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {comparisonFarms.map((farm) => {
                  const otherValues = comparisonFarms
                    .filter((f) => f.farmId !== farm.farmId)
                    .map((f) => f.netProfit);
                  const trend = calculateTrend(farm.netProfit, otherValues);

                  return (
                    <div
                      key={farm.farmId}
                      className={`p-4 border rounded-lg hover:bg-gray-50 ${
                        farm.netProfit >= 0 ? "border-green-200" : "border-red-200"
                      }`}
                    >
                      <p className="text-sm font-medium text-muted-foreground">
                        {farm.farmName}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p
                          className={`text-2xl font-bold ${
                            farm.netProfit >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          GH₵ {farm.netProfit.toLocaleString()}
                        </p>
                        {trend === "up" && (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        )}
                        {trend === "down" && (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Resources Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resources Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-2 px-4 font-medium">Farm</th>
                      <th className="text-center py-2 px-4 font-medium">Animals</th>
                      <th className="text-center py-2 px-4 font-medium">Workers</th>
                      <th className="text-center py-2 px-4 font-medium">Ponds</th>
                      <th className="text-center py-2 px-4 font-medium">Assets</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFarms.map((farm) => (
                      <tr key={farm.farmId} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4 font-medium">{farm.farmName}</td>
                        <td className="text-center py-2 px-4">
                          {farm.activeAnimals}
                        </td>
                        <td className="text-center py-2 px-4">
                          {farm.activeWorkers}
                        </td>
                        <td className="text-center py-2 px-4">
                          {farm.activePonds}
                        </td>
                        <td className="text-center py-2 px-4">
                          {farm.activeAssets}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedFarms.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              Select farms above to see comparison data
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
