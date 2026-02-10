import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface AppointmentStatsProps {
  farmId: number;
}

export function AppointmentStats({ farmId }: AppointmentStatsProps) {
  const { data: stats = [] } = trpc.vetAppointments.getAppointmentStats.useQuery({ farmId });

  // Transform stats for chart
  const chartData = stats.map((stat: any) => ({
    status: stat.status.charAt(0).toUpperCase() + stat.status.slice(1),
    count: stat.count,
    animals: stat.uniqueAnimals,
  }));

  const totalAppointments = stats.reduce((sum: number, stat: any) => sum + stat.count, 0);
  const totalAnimals = stats.reduce((sum: number, stat: any) => sum + stat.uniqueAnimals, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalAppointments}</div>
            <p className="text-xs text-muted-foreground mt-1">Across {totalAnimals} animals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average per Animal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {totalAnimals > 0 ? (totalAppointments / totalAnimals).toFixed(1) : "0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Appointments per animal</p>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appointments by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="Appointments" />
                <Bar dataKey="animals" fill="#10b981" name="Animals" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
