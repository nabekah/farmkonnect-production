import React, { useState } from 'react'
import { Link } from 'wouter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { trpc } from '@/lib/trpc'
import { useAuth } from '@/_core/hooks/useAuth'
import { Clock, AlertCircle, CheckCircle2, Filter, ArrowLeft } from 'lucide-react'

export default function FieldWorkerTaskList() {
  const { user } = useAuth()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  const farmId = user?.farmId || 1

  // Fetch all tasks
  const tasksQuery = trpc.taskAssignmentDatabase.getTasksFromDatabase.useQuery(
    { farmId },
    { enabled: !!user }
  )

  // Filter tasks
  let filteredTasks = tasksQuery.data || []

  if (statusFilter !== 'all') {
    filteredTasks = filteredTasks.filter((task: any) => task.status === statusFilter)
  }

  if (priorityFilter !== 'all') {
    filteredTasks = filteredTasks.filter((task: any) => task.priority === priorityFilter)
  }

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="w-4 h-4" />
      case 'in_progress':
        return <Clock className="w-4 h-4" />
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
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href="/field-worker">
            <Button variant="ghost" size="sm" className="p-0 h-auto">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">All Tasks</h1>
            <p className="text-xs text-gray-600">{filteredTasks.length} tasks</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 bg-white border-b sticky top-14 z-9 space-y-2">
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="flex-1 h-9 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="flex-1 h-9 text-sm">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="px-4 py-4 space-y-3">
        {tasksQuery.isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Loading tasks...</p>
          </div>
        ) : filteredTasks.length > 0 ? (
          filteredTasks.map((task: any) => (
            <Link key={task.id} href={`/field-worker/tasks/${task.id}`}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 flex-1">{task.title}</h3>
                    <Badge className={`${getStatusColor(task.status)} text-xs ml-2 flex items-center gap-1`}>
                      {getStatusIcon(task.status)}
                      {task.status}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>

                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Clock className="w-3 h-3" />
                      <span>{task.estimatedHours}h</span>
                    </div>

                    {task.priority && (
                      <Badge className={`${getPriorityColor(task.priority)} text-xs`}>
                        {task.priority}
                      </Badge>
                    )}

                    {task.dueDate && (
                      <div className="text-xs text-gray-600">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No tasks found</h3>
              <p className="text-sm text-gray-600">
                {statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No tasks assigned yet'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Task Stats */}
      {!tasksQuery.isLoading && tasksQuery.data && tasksQuery.data.length > 0 && (
        <div className="px-4 py-4 bg-white border-t mt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Task Summary</h3>
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-3 text-center">
                <div className="text-xl font-bold text-yellow-900">
                  {tasksQuery.data.filter((t: any) => t.status === 'pending').length}
                </div>
                <p className="text-xs text-yellow-700">Pending</p>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3 text-center">
                <div className="text-xl font-bold text-blue-900">
                  {tasksQuery.data.filter((t: any) => t.status === 'in_progress').length}
                </div>
                <p className="text-xs text-blue-700">In Progress</p>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-3 text-center">
                <div className="text-xl font-bold text-green-900">
                  {tasksQuery.data.filter((t: any) => t.status === 'completed').length}
                </div>
                <p className="text-xs text-green-700">Completed</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
