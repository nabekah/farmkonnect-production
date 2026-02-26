import { describe, it, expect, beforeEach } from 'vitest'
import { advancedPushNotificationService } from '@/lib/advancedPushNotifications'

/**
 * Comprehensive tests for Advanced Push Notifications
 */

describe('Advanced Push Notifications', () => {
  beforeEach(() => {
    advancedPushNotificationService.clearHistory()
  })

  describe('Emergency Alerts', () => {
    it('should send critical emergency alert', async () => {
      const alertId = await advancedPushNotificationService.sendEmergencyAlert({
        alertId: 'alert-001',
        severity: 'critical',
        description: 'Severe weather approaching - all workers must seek shelter',
        actionRequired: true,
        affectedWorkers: [1, 2, 3],
      })

      expect(alertId).toBeTruthy()
      expect(alertId).toContain('emergency')
    })

    it('should send warning level emergency alert', async () => {
      const alertId = await advancedPushNotificationService.sendEmergencyAlert({
        alertId: 'alert-002',
        severity: 'warning',
        description: 'Minor equipment malfunction detected',
        actionRequired: false,
      })

      expect(alertId).toBeTruthy()
    })

    it('should include location in emergency alert', async () => {
      const alertId = await advancedPushNotificationService.sendEmergencyAlert({
        alertId: 'alert-003',
        severity: 'critical',
        description: 'Fire detected in field 5',
        location: { lat: 6.6, lng: -0.2 },
        actionRequired: true,
      })

      const history = advancedPushNotificationService.getNotificationHistory('emergency')
      const alert = history.find((n) => n.id === alertId)

      expect(alert?.data?.location).toEqual({ lat: 6.6, lng: -0.2 })
    })

    it('should set correct priority for critical alerts', async () => {
      const alertId = await advancedPushNotificationService.sendEmergencyAlert({
        alertId: 'alert-004',
        severity: 'critical',
        description: 'Critical emergency',
        actionRequired: true,
      })

      const history = advancedPushNotificationService.getNotificationHistory('emergency')
      const alert = history.find((n) => n.id === alertId)

      expect(alert?.priority).toBe('critical')
    })
  })

  describe('Weather Warnings', () => {
    it('should send rain warning', async () => {
      const warningId = await advancedPushNotificationService.sendWeatherWarning({
        warningId: 'weather-001',
        weatherType: 'rain',
        severity: 'moderate',
        affectedArea: { lat: 6.6, lng: -0.2, radius: 5 },
        startTime: Date.now(),
        endTime: Date.now() + 3600000,
        recommendations: ['Postpone outdoor work', 'Secure equipment'],
      })

      expect(warningId).toBeTruthy()
      expect(warningId).toContain('weather')
    })

    it('should send severe storm warning', async () => {
      const warningId = await advancedPushNotificationService.sendWeatherWarning({
        warningId: 'weather-002',
        weatherType: 'storm',
        severity: 'severe',
        affectedArea: { lat: 6.6, lng: -0.2, radius: 10 },
        startTime: Date.now(),
        endTime: Date.now() + 7200000,
        recommendations: ['Evacuate field', 'Seek shelter immediately'],
      })

      const history = advancedPushNotificationService.getNotificationHistory('weather')
      const warning = history.find((n) => n.id === warningId)

      expect(warning?.priority).toBe('high')
    })

    it('should include weather recommendations', async () => {
      const warningId = await advancedPushNotificationService.sendWeatherWarning({
        warningId: 'weather-003',
        weatherType: 'heat',
        severity: 'moderate',
        affectedArea: { lat: 6.6, lng: -0.2, radius: 5 },
        startTime: Date.now(),
        endTime: Date.now() + 3600000,
        recommendations: ['Increase water intake', 'Take frequent breaks', 'Wear protective clothing'],
      })

      const history = advancedPushNotificationService.getNotificationHistory('weather')
      const warning = history.find((n) => n.id === warningId)

      expect(warning?.data?.recommendations).toHaveLength(3)
    })

    it('should set expiration time for weather warnings', async () => {
      const endTime = Date.now() + 7200000
      const warningId = await advancedPushNotificationService.sendWeatherWarning({
        warningId: 'weather-004',
        weatherType: 'cold',
        severity: 'minor',
        affectedArea: { lat: 6.6, lng: -0.2, radius: 5 },
        startTime: Date.now(),
        endTime,
        recommendations: ['Provide warm clothing'],
      })

      const history = advancedPushNotificationService.getNotificationHistory('weather')
      const warning = history.find((n) => n.id === warningId)

      expect(warning?.expiresAt).toBe(endTime)
    })
  })

  describe('Equipment Failures', () => {
    it('should send critical equipment failure', async () => {
      const failureId = await advancedPushNotificationService.sendEquipmentFailure({
        failureId: 'equip-001',
        equipmentId: 'pump-001',
        equipmentName: 'Irrigation Pump',
        failureType: 'breakdown',
        severity: 'critical',
        actionRequired: true,
      })

      expect(failureId).toBeTruthy()
      expect(failureId).toContain('equipment')
    })

    it('should send maintenance reminder', async () => {
      const failureId = await advancedPushNotificationService.sendEquipmentFailure({
        failureId: 'equip-002',
        equipmentId: 'tractor-001',
        equipmentName: 'Tractor',
        failureType: 'maintenance',
        severity: 'minor',
        actionRequired: false,
      })

      const history = advancedPushNotificationService.getNotificationHistory('equipment')
      const failure = history.find((n) => n.id === failureId)

      expect(failure?.priority).toBe('medium')
    })

    it('should include location for equipment failure', async () => {
      const failureId = await advancedPushNotificationService.sendEquipmentFailure({
        failureId: 'equip-003',
        equipmentId: 'pump-002',
        equipmentName: 'Water Pump',
        failureType: 'low_fuel',
        severity: 'major',
        location: { lat: 6.65, lng: -0.25 },
        actionRequired: true,
      })

      const history = advancedPushNotificationService.getNotificationHistory('equipment')
      const failure = history.find((n) => n.id === failureId)

      expect(failure?.data?.location).toEqual({ lat: 6.65, lng: -0.25 })
    })

    it('should set correct priority for critical equipment failure', async () => {
      const failureId = await advancedPushNotificationService.sendEquipmentFailure({
        failureId: 'equip-004',
        equipmentId: 'generator-001',
        equipmentName: 'Generator',
        failureType: 'malfunction',
        severity: 'critical',
        actionRequired: true,
      })

      const history = advancedPushNotificationService.getNotificationHistory('equipment')
      const failure = history.find((n) => n.id === failureId)

      expect(failure?.priority).toBe('critical')
    })
  })

  describe('Notification History & Statistics', () => {
    it('should track notification history', async () => {
      await advancedPushNotificationService.sendEmergencyAlert({
        alertId: 'alert-005',
        severity: 'warning',
        description: 'Test alert',
        actionRequired: false,
      })

      const history = advancedPushNotificationService.getNotificationHistory()

      expect(history.length).toBeGreaterThan(0)
    })

    it('should filter history by type', async () => {
      await advancedPushNotificationService.sendEmergencyAlert({
        alertId: 'alert-006',
        severity: 'warning',
        description: 'Test alert',
        actionRequired: false,
      })

      await advancedPushNotificationService.sendWeatherWarning({
        warningId: 'weather-005',
        weatherType: 'rain',
        severity: 'minor',
        affectedArea: { lat: 6.6, lng: -0.2, radius: 5 },
        startTime: Date.now(),
        endTime: Date.now() + 3600000,
        recommendations: ['Postpone work'],
      })

      const emergencyHistory = advancedPushNotificationService.getNotificationHistory('emergency')
      const weatherHistory = advancedPushNotificationService.getNotificationHistory('weather')

      expect(emergencyHistory.every((n) => n.type === 'emergency')).toBe(true)
      expect(weatherHistory.every((n) => n.type === 'weather')).toBe(true)
    })

    it('should get statistics', async () => {
      await advancedPushNotificationService.sendEmergencyAlert({
        alertId: 'alert-007',
        severity: 'critical',
        description: 'Test alert',
        actionRequired: true,
      })

      await advancedPushNotificationService.sendWeatherWarning({
        warningId: 'weather-006',
        weatherType: 'rain',
        severity: 'moderate',
        affectedArea: { lat: 6.6, lng: -0.2, radius: 5 },
        startTime: Date.now(),
        endTime: Date.now() + 3600000,
        recommendations: ['Postpone work'],
      })

      const stats = advancedPushNotificationService.getStatistics()

      expect(stats.total).toBeGreaterThan(0)
      expect(stats.byType.emergency).toBeGreaterThan(0)
      expect(stats.byType.weather).toBeGreaterThan(0)
    })

    it('should calculate delivery rate', async () => {
      await advancedPushNotificationService.sendEmergencyAlert({
        alertId: 'alert-008',
        severity: 'warning',
        description: 'Test alert',
        actionRequired: false,
      })

      const stats = advancedPushNotificationService.getStatistics()

      expect(stats.deliveryRate).toBeGreaterThanOrEqual(0)
      expect(stats.deliveryRate).toBeLessThanOrEqual(100)
    })
  })

  describe('Notification Delivery Status', () => {
    it('should track delivery status', async () => {
      const alertId = await advancedPushNotificationService.sendEmergencyAlert({
        alertId: 'alert-009',
        severity: 'warning',
        description: 'Test alert',
        actionRequired: false,
      })

      const status = advancedPushNotificationService.getDeliveryStatus(alertId)

      expect(status).toBeDefined()
      expect(status?.notificationId).toBe(alertId)
    })

    it('should mark notification as read', async () => {
      const alertId = await advancedPushNotificationService.sendEmergencyAlert({
        alertId: 'alert-010',
        severity: 'warning',
        description: 'Test alert',
        actionRequired: false,
      })

      advancedPushNotificationService.markAsRead(alertId)

      const status = advancedPushNotificationService.getDeliveryStatus(alertId)

      expect(status?.status).toBe('read')
      expect(status?.readAt).toBeDefined()
    })
  })

  describe('Notification Subscriptions', () => {
    it('should subscribe to notifications', async () => {
      return new Promise<void>((resolve) => {
        const unsubscribe = advancedPushNotificationService.subscribe((notification) => {
          expect(notification).toBeDefined()
          expect(notification.type).toBe('emergency')
          unsubscribe()
          resolve()
        })

        advancedPushNotificationService.sendEmergencyAlert({
          alertId: 'alert-011',
          severity: 'warning',
          description: 'Test alert',
          actionRequired: false,
        })
      })
    })

    it('should unsubscribe from notifications', async () => {
      let callCount = 0

      const unsubscribe = advancedPushNotificationService.subscribe(() => {
        callCount++
      })

      await advancedPushNotificationService.sendEmergencyAlert({
        alertId: 'alert-012',
        severity: 'warning',
        description: 'Test alert',
        actionRequired: false,
      })

      unsubscribe()

      await advancedPushNotificationService.sendEmergencyAlert({
        alertId: 'alert-013',
        severity: 'warning',
        description: 'Test alert 2',
        actionRequired: false,
      })

      expect(callCount).toBe(1)
    })
  })

  describe('Integration Tests', () => {
    it('should handle multiple notification types', async () => {
      const emergencyId = await advancedPushNotificationService.sendEmergencyAlert({
        alertId: 'alert-014',
        severity: 'critical',
        description: 'Critical emergency',
        actionRequired: true,
      })

      const weatherId = await advancedPushNotificationService.sendWeatherWarning({
        warningId: 'weather-007',
        weatherType: 'storm',
        severity: 'severe',
        affectedArea: { lat: 6.6, lng: -0.2, radius: 10 },
        startTime: Date.now(),
        endTime: Date.now() + 7200000,
        recommendations: ['Evacuate field'],
      })

      const equipmentId = await advancedPushNotificationService.sendEquipmentFailure({
        failureId: 'equip-005',
        equipmentId: 'pump-003',
        equipmentName: 'Pump',
        failureType: 'breakdown',
        severity: 'critical',
        actionRequired: true,
      })

      const history = advancedPushNotificationService.getNotificationHistory()

      expect(history.length).toBeGreaterThanOrEqual(3)
      expect(emergencyId).toBeTruthy()
      expect(weatherId).toBeTruthy()
      expect(equipmentId).toBeTruthy()
    })

    it('should prioritize critical notifications', async () => {
      await advancedPushNotificationService.sendEmergencyAlert({
        alertId: 'alert-015',
        severity: 'warning',
        description: 'Warning alert',
        actionRequired: false,
      })

      await advancedPushNotificationService.sendEmergencyAlert({
        alertId: 'alert-016',
        severity: 'critical',
        description: 'Critical alert',
        actionRequired: true,
      })

      const stats = advancedPushNotificationService.getStatistics()

      expect(stats.byPriority.critical).toBeGreaterThan(0)
    })
  })
})
