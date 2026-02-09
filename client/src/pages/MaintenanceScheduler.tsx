import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, DollarSign, CheckCircle, AlertCircle, Plus } from 'lucide-react';

export default function MaintenanceScheduler() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const upcomingMaintenance = [
    {
      id: 1,
      equipment: 'John Deere Tractor',
      type: 'Oil Change',
      dueDate: '2026-02-12',
      priority: 'high',
      estimatedCost: 150,
      status: 'pending',
    },
    {
      id: 2,
      equipment: 'Kubota Harvester',
      type: 'Annual Inspection',
      dueDate: '2026-02-04',
      priority: 'critical',
      estimatedCost: 500,
      status: 'overdue',
    },
    {
      id: 3,
      equipment: 'AGCO Cultivator',
      type: 'Belt Replacement',
      dueDate: '2026-02-20',
      priority: 'medium',
      estimatedCost: 250,
      status: 'pending',
    },
  ];

  const maintenanceHistory = [
    {
      id: 1,
      equipment: 'John Deere Tractor',
      type: 'Oil Change',
      date: '2026-01-15',
      cost: 150,
      technician: 'John Mensah',
      hours: 1.5,
      status: 'completed',
    },
    {
      id: 2,
      equipment: 'Kubota Harvester',
      type: 'Tire Replacement',
      date: '2025-12-20',
      cost: 450,
      technician: 'Kwame Asante',
      hours: 3,
      status: 'completed',
    },
    {
      id: 3,
      equipment: 'AGCO Cultivator',
      type: 'Bearing Replacement',
      date: '2025-11-10',
      cost: 320,
      technician: 'Ama Osei',
      hours: 2.5,
      status: 'completed',
    },
  ];

  const calendarData = [
    { date: '2026-02-04', count: 1, type: 'critical' },
    { date: '2026-02-12', count: 1, type: 'high' },
    { date: '2026-02-20', count: 1, type: 'medium' },
  ];

  const maintenanceCosts = [
    { month: 'Jan', cost: 1200 },
    { month: 'Feb', cost: 1850 },
    { month: 'Mar', cost: 950 },
    { month: 'Apr', cost: 2100 },
    { month: 'May', cost: 1650 },
    { month: 'Jun', cost: 1400 },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Maintenance Scheduler</h1>
          <p className="text-gray-600">Schedule, track, and manage equipment maintenance</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Schedule Maintenance
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">5</div>
            <p className="text-xs text-gray-600">Next 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">1</div>
            <p className="text-xs text-gray-600">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">3</div>
            <p className="text-xs text-gray-600">On schedule</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">GHS 900</div>
            <p className="text-xs text-gray-600">Next 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
        </TabsList>

        {/* Upcoming Tab */}
        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Maintenance Tasks</CardTitle>
              <CardDescription>Scheduled maintenance for the next 30 days</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingMaintenance.map((task) => (
                <div key={task.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{task.equipment}</h3>
                      <p className="text-sm text-gray-600">{task.type}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      task.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      task.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {task.status === 'overdue' ? 'OVERDUE' : task.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span>GHS {task.estimatedCost}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>Est. 2-3 hours</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Schedule
                    </Button>
                    <Button size="sm" variant="outline" className="text-blue-600">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance History</CardTitle>
              <CardDescription>All completed maintenance records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {maintenanceHistory.map((record) => (
                  <div key={record.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{record.equipment}</h3>
                        <p className="text-sm text-gray-600">{record.type}</p>
                      </div>
                      <span className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                        <CheckCircle className="w-4 h-4" />
                        Completed
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm mb-2">
                      <div>
                        <p className="text-gray-600">Date</p>
                        <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Cost</p>
                        <p className="font-medium">GHS {record.cost}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Technician</p>
                        <p className="font-medium">{record.technician}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Hours</p>
                        <p className="font-medium">{record.hours}h</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Calendar</CardTitle>
              <CardDescription>Visual overview of scheduled maintenance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {calendarData.map((day) => (
                  <div key={day.date} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p className="text-sm text-gray-600">{day.count} task(s) scheduled</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        day.type === 'critical' ? 'bg-red-100 text-red-800' :
                        day.type === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {day.type.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Costs Trend</CardTitle>
              <CardDescription>Monthly maintenance spending analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {maintenanceCosts.map((item) => (
                  <div key={item.month} className="flex items-center justify-between">
                    <span className="font-medium w-12">{item.month}</span>
                    <div className="flex-1 mx-4 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(item.cost / 2100) * 100}%` }}
                      />
                    </div>
                    <span className="text-right font-semibold w-24">GHS {item.cost.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Maintenance Cost (6 months)</p>
                <p className="text-2xl font-bold text-blue-600">GHS 9,150</p>
                <p className="text-xs text-gray-600 mt-1">Average: GHS 1,525/month</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
