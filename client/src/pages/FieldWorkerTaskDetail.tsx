import React, { useState } from 'react'
import { useParams, useLocation } from 'wouter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { trpc } from '@/lib/trpc'
import { useAuth } from '@/_core/hooks/useAuth'
import { MapPin, Camera, Clock, AlertCircle, CheckCircle2, Navigation, ArrowLeft, Phone, MessageSquare } from 'lucide-react'

export default function FieldWorkerTaskDetail() {
  const { id } = useParams<{ id: string }>()
  const [, navigate] = useLocation()
  const { user } = useAuth()
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)

  const farmId = user?.farmId || 1
  const taskId = parseInt(id || '0')

  // Fetch task details
  const taskQuery = trpc.taskAssignmentDatabase.getTasksFromDatabase.useQuery(
    { farmId },
    { enabled: !!user }
  )

  const task = taskQuery.data?.find((t: any) => t.id === taskId)

  // Update task status mutation
  const updateStatusMutation = trpc.taskAssignmentWithNotifications.updateTaskStatus.useMutation({
    onSuccess: () => {
      taskQuery.refetch()
      setIsUpdatingStatus(false)
      setSelectedStatus(null)
    },
  })

  const handleStatusUpdate = (newStatus: string) => {
    if (!task) return

    updateStatusMutation.mutate({
      taskId: task.id,
      workerId: user?.id || 1,
      workerName: user?.name || 'Field Worker',
      taskTitle: task.title,
      oldStatus: task.status,
      newStatus,
      farmId,
    })
  }

  if (taskQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Task not found</h3>
            <p className="text-sm text-gray-600 mb-4">The task you're looking for doesn't exist</p>
            <Button onClick={() => navigate('/field-worker')} variant="outline">
              Back to Tasks
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Mobile Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/field-worker')}
            className="p-0 h-auto"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">Task Details</h1>
          </div>
        </div>
      </div>

      {/* Task Header */}
      <div className="px-4 py-4 bg-white border-b">
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
          <Badge className={`${getStatusColor(task.status)} text-sm`}>
            {task.status}
          </Badge>
        </div>
        <p className="text-gray-600 mb-3">{task.description}</p>

        {/* Priority Badge */}
        {task.priority && (
          <div className="flex gap-2">
            <Badge className={
              task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
              task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
            </Badge>
          </div>
        )}
      </div>

      {/* Task Details Cards */}
      <div className="px-4 py-4 space-y-3">
        {/* Time & Duration */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time & Duration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Estimated Duration:</span>
              <span className="text-sm font-semibold">{task.estimatedHours} hours</span>
            </div>
            {task.actualHours > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Actual Duration:</span>
                <span className="text-sm font-semibold">{task.actualHours} hours</span>
              </div>
            )}
            {task.dueDate && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Due Date:</span>
                <span className="text-sm font-semibold">
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location */}
        {task.location && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">{task.location}</p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2">
                <Navigation className="w-4 h-4" />
                Navigate to Location
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Assigned To */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Assigned To</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold mb-3">{task.workerName || 'You'}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 flex items-center justify-center gap-2">
                <Phone className="w-4 h-4" />
                Call
              </Button>
              <Button variant="outline" size="sm" className="flex-1 flex items-center justify-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Message
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Task Type */}
        {task.taskType && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Task Type</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="bg-blue-100 text-blue-800">
                {task.taskType.charAt(0).toUpperCase() + task.taskType.slice(1)}
              </Badge>
            </CardContent>
          </Card>
        )}

        {/* Photo Evidence */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Photo Evidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            {task.photos && task.photos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {task.photos.map((photo: any, index: number) => (
                  <div key={index} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                    <img src={photo} alt={`Evidence ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600 mb-3">No photos uploaded yet</p>
            )}
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2">
                  <Camera className="w-4 h-4" />
                  {task.photos && task.photos.length > 0 ? 'Add More Photos' : 'Take Photo'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Capture Photo Evidence</DialogTitle>
                  <DialogDescription>
                    Take a photo to document task completion
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
                    <Camera className="w-12 h-12 text-gray-400" />
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Open Camera
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3 shadow-lg space-y-2">
        {task.status === 'pending' && (
          <Button
            onClick={() => handleStatusUpdate('in_progress')}
            disabled={isUpdatingStatus}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isUpdatingStatus ? 'Updating...' : 'Start Task'}
          </Button>
        )}

        {task.status === 'in_progress' && (
          <Button
            onClick={() => handleStatusUpdate('completed')}
            disabled={isUpdatingStatus}
            className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isUpdatingStatus ? 'Completing...' : 'Mark as Completed'}
          </Button>
        )}

        {task.status === 'completed' && (
          <div className="text-center py-2">
            <Badge className="bg-green-100 text-green-800 text-sm">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Task Completed
            </Badge>
          </div>
        )}

        <Button
          onClick={() => navigate('/field-worker')}
          variant="outline"
          className="w-full"
        >
          Back to Tasks
        </Button>
      </div>
    </div>
  )
}
