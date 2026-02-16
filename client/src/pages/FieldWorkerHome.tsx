import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/lib/trpc'
import { useAuth } from '@/_core/hooks/useAuth'
import { MapPin, Camera, Clock, AlertCircle, CheckCircle2, Navigation } from 'lucide-react'
import { Link } from 'wouter'

export default function FieldWorkerHome() {
  const { user } = useAuth()
  const [selectedTask, setSelectedTask] = useState<number | null>(null)

  const farmId = user?.farmId || 1

  // Fetch assigned tasks for the field worker
  const assignedTasks = trpc.taskAssignmentDatabase.getTasksFromDatabase.useQuery(
    { farmId },
    { enabled: !!user }
  )

  // Filter tasks assigned to current worker
  const myTasks = assignedTasks.data?.filter(
    (task: any) => task.workerId === user?.id || task.status !== 'completed'
  ) || []

  const pendingTasks = myTasks.filter((task: any) => task.status === 'pending')
  const inProgressTasks = myTasks.filter((task: any) => task.status === 'in_progress')
  const completedTasks = myTasks.filter((task: any) => task.status === 'completed')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'in_progress':
        return <Navigation className="w-4 h-4" />
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Mobile Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-sm text-gray-600 mt-1">Field Worker Dashboard</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 py-4 grid grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-yellow-900">{pendingTasks.length}</div>
            <p className="text-xs text-yellow-700 mt-1">Pending</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-blue-900">{inProgressTasks.length}</div>
            <p className="text-xs text-blue-700 mt-1">In Progress</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-green-900">{completedTasks.length}</div>
            <p className="text-xs text-green-700 mt-1">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Tasks Section */}
      <div className="px-4 py-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Active Tasks</h2>

        {inProgressTasks.length > 0 ? (
          <div className="space-y-3">
            {inProgressTasks.map((task: any) => (
              <Link key={task.id} href={`/field-worker/tasks/${task.id}`}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{task.title}</h3>
                          <Badge className={`${getStatusColor(task.status)} text-xs flex items-center gap-1`}>
                            {getStatusIcon(task.status)}
                            {task.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.estimatedHours}h
                          </div>
                          {task.dueDate && (
                            <div className="flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-2 text-right">
                        <Badge className="bg-blue-600 text-white text-xs">In Progress</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-gray-600">No tasks in progress</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pending Tasks Section */}
      <div className="px-4 py-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Pending Tasks</h2>

        {pendingTasks.length > 0 ? (
          <div className="space-y-3">
            {pendingTasks.map((task: any) => (
              <Link key={task.id} href={`/field-worker/tasks/${task.id}`}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{task.title}</h3>
                          <Badge className={`${getStatusColor(task.status)} text-xs flex items-center gap-1`}>
                            {getStatusIcon(task.status)}
                            {task.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.estimatedHours}h
                          </div>
                          {task.priority && (
                            <Badge className="bg-orange-100 text-orange-800 text-xs">
                              {task.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-gray-600">No pending tasks</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Completed Tasks Section */}
      {completedTasks.length > 0 && (
        <div className="px-4 py-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Completed Tasks</h2>

          <div className="space-y-3">
            {completedTasks.slice(0, 3).map((task: any) => (
              <Link key={task.id} href={`/field-worker/tasks/${task.id}`}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 line-through">{task.title}</h3>
                          <Badge className={`${getStatusColor(task.status)} text-xs flex items-center gap-1`}>
                            {getStatusIcon(task.status)}
                            {task.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            Completed
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {completedTasks.length > 3 && (
            <Link href="/field-worker/tasks">
              <Button variant="outline" className="w-full mt-3">
                View All Completed ({completedTasks.length})
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Loading State */}
      {assignedTasks.isLoading && (
        <div className="px-4 py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Loading tasks...</p>
        </div>
      )}

      {/* Empty State */}
      {!assignedTasks.isLoading && myTasks.length === 0 && (
        <div className="px-4 py-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No tasks assigned</h3>
          <p className="text-sm text-gray-600">Check back later for new tasks</p>
        </div>
      )}

      {/* Mobile Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3 flex gap-2 shadow-lg">
        <Link href="/field-worker/tasks" className="flex-1">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            All Tasks
          </Button>
        </Link>
        <Button variant="outline" className="flex-1">
          <MapPin className="w-4 h-4 mr-2" />
          Map View
        </Button>
      </div>
    </div>
  )
}
