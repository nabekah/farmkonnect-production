import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { AlertCircle, Plus, RefreshCw, Wifi, WifiOff, Calendar, Users, Clock } from 'lucide-react'
import { useShiftUpdates } from '@/hooks/useWebSocketUpdates'
import { useAuth } from '@/hooks/useAuth'

/**
 * Shift Management Page with Real-Time WebSocket Updates
 * Auto-refreshes when shifts are created, assigned, or status changes
 */

interface Shift {
  id: number
  date: Date
  startTime: string
  endTime: string
  location: string
  requiredSkills: string[]
  assignedWorkers: Array<{ id: number; name: string }>
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

export const ShiftManagementWithRealTime: React.FC = () => {
  const { user } = useAuth()
  const farmId = user?.farmId || 1

  const [shifts, setShifts] = useState<Shift[]>([])
  const [filteredShifts, setFilteredShifts] = useState<Shift[]>([])
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'scheduled' | 'in_progress' | 'completed'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // WebSocket hook for real-time shift updates
  const { isConnected: wsConnected, subscribe, unsubscribe } = useShiftUpdates(
    farmId,
    user?.id || 1,
    handleShiftUpdate
  )

  /**
   * Handle shift update from WebSocket
   */
  function handleShiftUpdate(data: any) {
    console.log('[ShiftManagementPage] Shift update received:', data)

    if (data.action === 'assigned') {
      // Add or update shift
      setShifts((prev) => {
        const existing = prev.findIndex((s) => s.id === data.shift.id)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = { ...updated[existing], ...data.shift, updatedAt: new Date() }
          return updated
        }
        return [...prev, { ...data.shift, updatedAt: new Date() }]
      })
    } else if (data.action === 'status_changed') {
      // Update shift status
      setShifts((prev) =>
        prev.map((s) =>
          s.id === data.shift.id
            ? { ...s, status: data.shift.status, updatedAt: new Date() }
            : s
        )
      )
    } else if (data.action === 'removed') {
      // Remove shift
      setShifts((prev) => prev.filter((s) => s.id !== data.shiftId))
    }

    setLastUpdate(new Date())
  }

  /**
   * Load initial shifts
   */
  useEffect(() => {
    loadShifts()
  }, [])

  /**
   * Filter shifts based on status and search
   */
  useEffect(() => {
    let filtered = shifts

    if (selectedStatus !== 'all') {
      filtered = filtered.filter((s) => s.status === selectedStatus)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.requiredSkills.some((skill) =>
            skill.toLowerCase().includes(searchTerm.toLowerCase())
          ) ||
          s.assignedWorkers.some((w) =>
            w.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
      )
    }

    setFilteredShifts(filtered)
  }, [shifts, selectedStatus, searchTerm])

  /**
   * Load shifts from API
   */
  const loadShifts = async () => {
    try {
      // Mock data - in production would fetch from API
      const mockShifts: Shift[] = [
        {
          id: 1,
          date: new Date('2026-02-20'),
          startTime: '06:00',
          endTime: '14:00',
          location: 'Field A',
          requiredSkills: ['planting', 'soil_preparation'],
          assignedWorkers: [
            { id: 1, name: 'John Smith' },
            { id: 2, name: 'Maria Garcia' },
          ],
          status: 'scheduled',
          createdAt: new Date('2026-02-15'),
          updatedAt: new Date('2026-02-15'),
        },
        {
          id: 2,
          date: new Date('2026-02-19'),
          startTime: '08:00',
          endTime: '16:00',
          location: 'Greenhouse',
          requiredSkills: ['irrigation', 'maintenance'],
          assignedWorkers: [
            { id: 3, name: 'James Wilson' },
          ],
          status: 'in_progress',
          createdAt: new Date('2026-02-14'),
          updatedAt: new Date('2026-02-19'),
        },
        {
          id: 3,
          date: new Date('2026-02-18'),
          startTime: '07:00',
          endTime: '15:00',
          location: 'Field B',
          requiredSkills: ['harvesting'],
          assignedWorkers: [
            { id: 1, name: 'John Smith' },
            { id: 4, name: 'Sarah Johnson' },
          ],
          status: 'completed',
          createdAt: new Date('2026-02-13'),
          updatedAt: new Date('2026-02-18'),
        },
      ]

      setShifts(mockShifts)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('[ShiftManagementPage] Error loading shifts:', error)
    }
  }

  /**
   * Manual refresh
   */
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await loadShifts()
    } finally {
      setIsRefreshing(false)
    }
  }

  /**
   * Get status badge color
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const scheduledCount = shifts.filter((s) => s.status === 'scheduled').length
  const inProgressCount = shifts.filter((s) => s.status === 'in_progress').length
  const completedCount = shifts.filter((s) => s.status === 'completed').length

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shift Management</h1>
          <p className="text-muted-foreground mt-2">Real-time shift scheduling and tracking</p>
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
            Create Shift
          </Button>
        </div>
      </div>

      {/* Shift Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{scheduledCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{inProgressCount}</div>
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
          placeholder="Search by location, skills, or worker name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-2">
          {(['all', 'scheduled', 'in_progress', 'completed'] as const).map((status) => (
            <Button
              key={status}
              variant={selectedStatus === status ? 'default' : 'outline'}
              onClick={() => setSelectedStatus(status)}
              className="capitalize"
            >
              {status === 'all' ? 'All Shifts' : status.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Shifts List */}
      <div className="space-y-3">
        {filteredShifts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No shifts found
            </CardContent>
          </Card>
        ) : (
          filteredShifts.map((shift) => (
            <Card key={shift.id} className="hover:shadow-md transition">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <h3 className="font-semibold text-lg">{shift.date.toLocaleDateString()}</h3>
                      <Badge className={getStatusColor(shift.status)}>
                        {shift.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm mt-3">
                      <div>
                        <p className="text-muted-foreground">Time</p>
                        <div className="flex items-center gap-1 font-medium">
                          <Clock className="w-4 h-4" />
                          {shift.startTime} - {shift.endTime}
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Location</p>
                        <p className="font-medium">{shift.location}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Skills Required</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {shift.requiredSkills.map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Workers</p>
                        <div className="flex items-center gap-1 font-medium">
                          <Users className="w-4 h-4" />
                          {shift.assignedWorkers.length}
                        </div>
                      </div>
                    </div>

                    {/* Assigned Workers */}
                    {shift.assignedWorkers.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Assigned Workers:</p>
                        <div className="flex flex-wrap gap-2">
                          {shift.assignedWorkers.map((worker) => (
                            <Badge key={worker.id} variant="outline">
                              {worker.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
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
                  Updated: {shift.updatedAt.toLocaleTimeString()}
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
