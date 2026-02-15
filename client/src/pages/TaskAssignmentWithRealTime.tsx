import React, { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { AlertCircle, Plus, RefreshCw, Wifi, WifiOff, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { useTaskUpdates } from '@/hooks/useWebSocketUpdates'
import { useAuth } from '@/hooks/useAuth'

/**
 * Task Assignment Page with Real-Time WebSocket Updates
 * Auto-refreshes when tasks are created, assigned, or status changes
 */

interface Task {
  id: number
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignedWorker: string
  dueDate: Date
  estimatedHours: number
  actualHours: number
  createdAt: Date
  updatedAt: Date
}

export const TaskAssignmentWithRealTime: React.FC = () => {
  const { user } = useAuth()
  const farmId = user?.farmId || 1

  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // WebSocket hook for real-time task updates
  const { isConnected: wsConnected, subscribe, unsubscribe } = useTaskUpdates(
    farmId,
    user?.id || 1,
    handleTaskUpdate
  )

  /**
   * Handle task update from WebSocket
   */
  function handleTaskUpdate(data: any) {
    console.log('[TaskAssignmentPage] Task update received:', data)

    if (data.action === 'assigned' || data.action === 'reassigned') {
      // Add or update task
      setTasks((prev) => {
        const existing = prev.findIndex((t) => t.id === data.task.id)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = { ...updated[existing], ...data.task, updatedAt: new Date() }
          return updated
        }
        return [...prev, { ...data.task, updatedAt: new Date() }]
      })
    } else if (data.action === 'status_changed') {
      // Update task status
      setTasks((prev) =>
        prev.map((t) =>
          t.id === data.task.id
            ? { ...t, status: data.task.status, updatedAt: new Date() }
            : t
        )
      )
    } else if (data.action === 'unassigned') {
      // Remove task
      setTasks((prev) => prev.filter((t) => t.id !== data.taskId))
    }

    setLastUpdate(new Date())
  }

  /**
   * Load initial tasks
   */
  useEffect(() => {
    loadTasks()
  }, [])

  /**
   * Filter tasks based on status and search
   */
  useEffect(() => {
    let filtered = tasks

    if (selectedStatus !== 'all') {
      filtered = filtered.filter((t) => t.status === selectedStatus)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.assignedWorker.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredTasks(filtered)
  }, [tasks, selectedStatus, searchTerm])

  /**
   * Load tasks from API
   */
  const loadTasks = async () => {
    try {
      // Mock data - in production would fetch from API
      const mockTasks: Task[] = [
        {
          id: 1,
          title: 'Prepare Field A for Planting',
          description: 'Clear weeds and level soil in Field A',
          status: 'in_progress',
          priority: 'high',
          assignedWorker: 'John Smith',
          dueDate: new Date('2026-02-20'),
          estimatedHours: 8,
          actualHours: 6,
          createdAt: new Date('2026-02-15'),
          updatedAt: new Date('2026-02-15'),
        },
        {
          id: 2,
          title: 'Irrigation System Check',
          description: 'Inspect and test all irrigation lines',
          status: 'pending',
          priority: 'medium',
          assignedWorker: 'Maria Garcia',
          dueDate: new Date('2026-02-18'),
          estimatedHours: 4,
          actualHours: 0,
          createdAt: new Date('2026-02-15'),
          updatedAt: new Date('2026-02-15'),
        },
        {
          id: 3,
          title: 'Harvest Tomatoes',
          description: 'Pick ripe tomatoes from greenhouse',
          status: 'completed',
          priority: 'high',
          assignedWorker: 'James Wilson',
          dueDate: new Date('2026-02-16'),
          estimatedHours: 6,
          actualHours: 5.5,
          createdAt: new Date('2026-02-14'),
          updatedAt: new Date('2026-02-15'),
        },
      ]

      setTasks(mockTasks)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('[TaskAssignmentPage] Error loading tasks:', error)
    }
  }

  /**
   * Manual refresh
   */
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await loadTasks()
    } finally {
      setIsRefreshing(false)
    }
  }

  /**
   * Get status badge color
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  /**
   * Get priority badge color
   */
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
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

  /**
   * Get status icon
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'in_progress':
        return <AlertTriangle className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  const pendingCount = tasks.filter((t) => t.status === 'pending').length
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length
  const completedCount = tasks.filter((t) => t.status === 'completed').length

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Task Assignment & Tracking</h1>
          <p className="text-muted-foreground mt-2">Real-time task management with live updates</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-muted">
            {wsConnected ? (
              <>
                <Wifi className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-600 font-medium">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-600" />
                <span className="text-xs text-red-600 font-medium">Offline</span>
              </>
            )}
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Assign New Task
          </Button>
        </div>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{inProgressCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{completedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <Input
          placeholder="Search tasks or workers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-2">
          {(['all', 'pending', 'in_progress', 'completed'] as const).map((status) => (
            <Button
              key={status}
              variant={selectedStatus === status ? 'default' : 'outline'}
              onClick={() => setSelectedStatus(status)}
              className="capitalize"
            >
              {status === 'all' ? 'All Tasks' : status.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No tasks found
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(task.status)}
                      <h3 className="font-semibold text-lg">{task.title}</h3>
                      <Badge className={getPriorityColor(task.priority)} variant="secondary">
                        {task.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{task.description}</p>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Assigned To</p>
                        <p className="font-medium">{task.assignedWorker}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Due Date</p>
                        <p className="font-medium">{task.dueDate.toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Estimated Hours</p>
                        <p className="font-medium">{task.estimatedHours}h ({task.actualHours}h actual)</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      More
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-3">
                  Updated: {task.updatedAt.toLocaleTimeString()}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Last Update Info */}
      <div className="text-xs text-muted-foreground text-center">
        Last update: {lastUpdate.toLocaleTimeString()}
        {wsConnected && ' (Real-time sync enabled)'}
      </div>
    </div>
  )
}
