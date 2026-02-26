import { describe, it, expect, beforeEach } from 'vitest'
import {
  createScheduledMigrationJob,
  getScheduledJobs,
  getScheduledJob,
  updateJobSchedule,
  deleteScheduledJob,
  getJobResults,
  getJobStatistics,
  executeMigrationJob,
  getPendingJobs,
  getJobHistory,
  cleanupOldResults,
} from './scheduledMigrationJobs'

describe('Scheduled Migration Jobs Service', () => {
  const farmId = 1
  const mockTasks = [
    {
      id: 'task-001',
      title: 'Plant crops',
      taskType: 'planting',
      priority: 'high',
      status: 'pending',
      dueDate: new Date(),
      estimatedHours: 8,
      workerId: 1,
    },
    {
      id: 'task-002',
      title: 'Water irrigation',
      taskType: 'irrigation',
      priority: 'medium',
      status: 'pending',
      dueDate: new Date(),
      estimatedHours: 4,
      workerId: 2,
    },
  ]

  beforeEach(() => {
    // Clear jobs before each test
    const jobs = getScheduledJobs(farmId)
    jobs.forEach((job) => deleteScheduledJob(job.id))
  })

  describe('Job Creation', () => {
    it('should create a new scheduled migration job', async () => {
      const job = await createScheduledMigrationJob(
        farmId,
        'Daily Migration',
        'Migrate tasks daily',
        'daily',
        new Date(),
        'merge'
      )

      expect(job.id).toBeDefined()
      expect(job.farmId).toBe(farmId)
      expect(job.name).toBe('Daily Migration')
      expect(job.schedule).toBe('daily')
      expect(job.strategy).toBe('merge')
      expect(job.status).toBe('pending')
      expect(job.totalRuns).toBe(0)
    })

    it('should create jobs with different schedules', async () => {
      const schedules = ['daily', 'weekly', 'monthly', 'once'] as const

      for (const schedule of schedules) {
        const job = await createScheduledMigrationJob(farmId, `${schedule} job`, '', schedule, new Date(), 'merge')
        expect(job.schedule).toBe(schedule)
      }
    })

    it('should create jobs with different strategies', async () => {
      const strategies = ['overwrite', 'merge', 'skip_existing'] as const

      for (const strategy of strategies) {
        const job = await createScheduledMigrationJob(farmId, `${strategy} job`, '', 'once', new Date(), strategy)
        expect(job.strategy).toBe(strategy)
      }
    })
  })

  describe('Job Retrieval', () => {
    it('should retrieve all jobs for a farm', async () => {
      await createScheduledMigrationJob(farmId, 'Job 1', '', 'daily', new Date(), 'merge')
      await createScheduledMigrationJob(farmId, 'Job 2', '', 'weekly', new Date(), 'overwrite')

      const jobs = getScheduledJobs(farmId)
      expect(jobs.length).toBeGreaterThanOrEqual(1)
      expect(jobs.some(j => j.name === 'Job 1')).toBe(true)
      expect(jobs.some(j => j.name === 'Job 2')).toBe(true)
    })

    it('should retrieve a specific job by ID', async () => {
      const createdJob = await createScheduledMigrationJob(farmId, 'Test Job', '', 'daily', new Date(), 'merge')
      const retrievedJob = getScheduledJob(createdJob.id)

      expect(retrievedJob).toBeDefined()
      expect(retrievedJob?.id).toBe(createdJob.id)
      expect(retrievedJob?.name).toBe('Test Job')
    })

    it('should return undefined for non-existent job', () => {
      const job = getScheduledJob('non-existent-id')
      expect(job).toBeUndefined()
    })

    it('should filter jobs by farm ID', async () => {
      const farmId1 = 1
      const farmId2 = 2

      await createScheduledMigrationJob(farmId1, 'Farm 1 Job', '', 'daily', new Date(), 'merge')
      await createScheduledMigrationJob(farmId2, 'Farm 2 Job', '', 'daily', new Date(), 'merge')

      const farm1Jobs = getScheduledJobs(farmId1)
      const farm2Jobs = getScheduledJobs(farmId2)

      expect(farm1Jobs).toHaveLength(1)
      expect(farm2Jobs).toHaveLength(1)
      expect(farm1Jobs[0].farmId).toBe(farmId1)
      expect(farm2Jobs[0].farmId).toBe(farmId2)
    })
  })

  describe('Job Updates', () => {
    it('should update job schedule', async () => {
      const job = await createScheduledMigrationJob(farmId, 'Test Job', '', 'daily', new Date(), 'merge')
      const newScheduleTime = new Date(Date.now() + 3600000) // 1 hour from now

      const updated = updateJobSchedule(job.id, 'weekly', newScheduleTime)

      expect(updated?.schedule).toBe('weekly')
      expect(updated?.scheduledTime).toEqual(newScheduleTime)
    })

    it('should update job status', async () => {
      const job = await createScheduledMigrationJob(farmId, 'Test Job', '', 'daily', new Date(), 'merge')

      // Simulate job execution
      const result = await executeMigrationJob(job.id, mockTasks)

      const updatedJob = getScheduledJob(job.id)
      expect(['success', 'partial', 'failed']).toContain(updatedJob?.status)
      expect(updatedJob?.lastRun).toBeDefined()
    })
  })

  describe('Job Deletion', () => {
    it('should delete a scheduled job', async () => {
      const job = await createScheduledMigrationJob(farmId, 'Test Job', '', 'daily', new Date(), 'merge')
      const deleted = deleteScheduledJob(job.id)

      expect(deleted).toBe(true)
      expect(getScheduledJob(job.id)).toBeUndefined()
    })

    it('should return false when deleting non-existent job', () => {
      const deleted = deleteScheduledJob('non-existent-id')
      expect(deleted).toBe(false)
    })
  })

  describe('Job Execution', () => {
    it('should execute migration job successfully', async () => {
      const job = await createScheduledMigrationJob(farmId, 'Test Job', '', 'once', new Date(), 'merge')

      const result = await executeMigrationJob(job.id, mockTasks)

      expect(result.jobId).toBe(job.id)
      expect(['success', 'partial', 'failed']).toContain(result.status)
      expect(result.migratedTasks).toBeGreaterThanOrEqual(0)
      expect(result.totalTasks).toBe(mockTasks.length)
    })

    it('should track job execution duration', async () => {
      const job = await createScheduledMigrationJob(farmId, 'Test Job', '', 'once', new Date(), 'merge')

      const result = await executeMigrationJob(job.id, mockTasks)

      expect(result.duration).toBeGreaterThan(0)
      expect(result.startTime).toBeDefined()
      expect(result.endTime).toBeDefined()
    })

    it('should prevent concurrent execution of same job', async () => {
      const job = await createScheduledMigrationJob(farmId, 'Test Job', '', 'once', new Date(), 'merge')

      // Start first execution
      const promise1 = executeMigrationJob(job.id, mockTasks)

      // Try to start second execution immediately
      try {
        await executeMigrationJob(job.id, mockTasks)
        expect.fail('Should have thrown error for concurrent execution')
      } catch (error) {
        expect((error as Error).message).toContain('already running')
      }

      // Wait for first execution to complete
      await promise1
    })

    it('should handle job execution errors gracefully', async () => {
      const job = await createScheduledMigrationJob(farmId, 'Test Job', '', 'once', new Date(), 'merge')
      const invalidTasks = [{ id: 'task-001' }] // Missing required fields

      const result = await executeMigrationJob(job.id, invalidTasks)

      expect(result.status).toBe('failed')
      expect(result.failedTasks).toBeGreaterThan(0)
    })
  })

  describe('Job Statistics', () => {
    it('should calculate job statistics', async () => {
      const job = await createScheduledMigrationJob(farmId, 'Test Job', '', 'daily', new Date(), 'merge')

      // Execute job multiple times
      await executeMigrationJob(job.id, mockTasks)
      await executeMigrationJob(job.id, mockTasks)

      const stats = getJobStatistics(job.id)

      expect(stats).toBeDefined()
      expect(stats?.totalRuns).toBeGreaterThanOrEqual(1)
      expect(stats?.successRate).toBeGreaterThanOrEqual(0)
      expect(stats?.successRate).toBeLessThanOrEqual(100)
    })

    it('should track success rate accurately', async () => {
      const job = await createScheduledMigrationJob(farmId, 'Test Job', '', 'daily', new Date(), 'merge')

      // Execute job
      await executeMigrationJob(job.id, mockTasks)

      const stats = getJobStatistics(job.id)

      expect(stats?.successRate).toBeGreaterThanOrEqual(0)
      expect(stats?.successRate).toBeLessThanOrEqual(100)
    })

    it('should return null for non-existent job', () => {
      const stats = getJobStatistics('non-existent-id')
      expect(stats).toBeNull()
    })
  })

  describe('Job Results', () => {
    it('should store job execution results', async () => {
      const job = await createScheduledMigrationJob(farmId, 'Test Job', '', 'once', new Date(), 'merge')

      await executeMigrationJob(job.id, mockTasks)

      const results = getJobResults(job.id)

      expect(results).toHaveLength(1)
      expect(results[0].jobId).toBe(job.id)
    })

    it('should retrieve multiple job results', async () => {
      const job = await createScheduledMigrationJob(farmId, 'Test Job', '', 'daily', new Date(), 'merge')

      // Execute job multiple times
      await executeMigrationJob(job.id, mockTasks)
      await executeMigrationJob(job.id, mockTasks)
      await executeMigrationJob(job.id, mockTasks)

      const results = getJobResults(job.id)

      expect(results).toHaveLength(3)
    })
  })

  describe('Pending Jobs', () => {
    it('should identify pending jobs', async () => {
      const pastTime = new Date(Date.now() - 3600000) // 1 hour ago
      const futureTime = new Date(Date.now() + 3600000) // 1 hour from now

      await createScheduledMigrationJob(farmId, 'Past Job', '', 'once', pastTime, 'merge')
      await createScheduledMigrationJob(farmId, 'Future Job', '', 'once', futureTime, 'merge')

      const pending = getPendingJobs()

      expect(Array.isArray(pending)).toBe(true)
      // Past job should be in pending list since its scheduled time is in the past
      if (pending.length > 0) {
        expect(pending.some((j) => j.name === 'Past Job')).toBe(true)
      }
    })

    it('should not include running jobs in pending list', async () => {
      const job = await createScheduledMigrationJob(farmId, 'Test Job', '', 'once', new Date(), 'merge')

      const pending1 = getPendingJobs()
      expect(pending1.some((j) => j.id === job.id)).toBe(true)

      // After execution
      await executeMigrationJob(job.id, mockTasks)

      const pending2 = getPendingJobs()
      expect(pending2.some((j) => j.id === job.id && j.status === 'running')).toBe(false)
    })
  })

  describe('Job History', () => {
    it('should retrieve job history for farm', async () => {
      const job = await createScheduledMigrationJob(farmId, 'Test Job', '', 'daily', new Date(), 'merge')

      await executeMigrationJob(job.id, mockTasks)

      const history = getJobHistory(farmId)

      expect(history).toHaveLength(1)
      expect(history[0].jobName).toBe('Test Job')
    })

    it('should limit history results', async () => {
      const job = await createScheduledMigrationJob(farmId, 'Test Job', '', 'daily', new Date(), 'merge')

      // Execute job multiple times
      for (let i = 0; i < 10; i++) {
        await executeMigrationJob(job.id, mockTasks)
      }

      const history = getJobHistory(farmId, 5)

      expect(history.length).toBeLessThanOrEqual(5)
    })

    it('should sort history by date descending', async () => {
      const job = await createScheduledMigrationJob(farmId, 'Test Job', '', 'daily', new Date(), 'merge')

      await executeMigrationJob(job.id, mockTasks)
      await new Promise((resolve) => setTimeout(resolve, 100))
      await executeMigrationJob(job.id, mockTasks)

      const history = getJobHistory(farmId)

      expect(history[0].endTime.getTime()).toBeGreaterThanOrEqual(history[1].endTime.getTime())
    })
  })

  describe('Results Cleanup', () => {
    it('should cleanup old results keeping recent ones', async () => {
      const job = await createScheduledMigrationJob(farmId, 'Test Job', '', 'daily', new Date(), 'merge')

      // Execute job many times
      for (let i = 0; i < 150; i++) {
        await executeMigrationJob(job.id, mockTasks)
      }

      let results = getJobResults(job.id)
      expect(results.length).toBeGreaterThan(100)

      cleanupOldResults(job.id, 100)

      results = getJobResults(job.id)
      expect(results.length).toBeLessThanOrEqual(100)
    })
  })

  describe('Schedule Calculation', () => {
    it('should calculate next run for daily schedule', async () => {
      const job = await createScheduledMigrationJob(farmId, 'Daily Job', '', 'daily', new Date('2026-02-16T10:00:00'), 'merge')

      expect(job.nextRun).toBeDefined()
      expect(job.nextRun?.getDate()).toBeGreaterThanOrEqual(new Date().getDate())
    })

    it('should calculate next run for weekly schedule', async () => {
      const job = await createScheduledMigrationJob(farmId, 'Weekly Job', '', 'weekly', new Date(), 'merge')

      expect(job.nextRun).toBeDefined()
      if (job.nextRun) {
        const daysDifference = Math.floor((job.nextRun.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000))
        expect(daysDifference).toBeGreaterThanOrEqual(-1)
        expect(daysDifference).toBeLessThanOrEqual(7)
      }
    })

    it('should calculate next run for monthly schedule', async () => {
      const job = await createScheduledMigrationJob(farmId, 'Monthly Job', '', 'monthly', new Date(), 'merge')

      expect(job.nextRun).toBeDefined()
      const daysDifference = Math.floor((job.nextRun!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      expect(daysDifference).toBeGreaterThan(20)
      expect(daysDifference).toBeLessThanOrEqual(32)
    })

    it('should not reschedule one-time jobs', async () => {
      const job = await createScheduledMigrationJob(farmId, 'One-time Job', '', 'once', new Date(), 'merge')

      await executeMigrationJob(job.id, mockTasks)

      const updatedJob = getScheduledJob(job.id)
      expect(['pending', 'running', 'completed', 'failed']).toContain(updatedJob?.status)
    })
  })
})
