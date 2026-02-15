import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { ChevronRight, Bell, MessageSquare, Clock, Save } from 'lucide-react-native'

/**
 * Mobile Notification Preferences Screen
 * Allows workers to customize notification settings
 */

interface NotificationPreferences {
  shifts: boolean
  tasks: boolean
  approvals: boolean
  alerts: boolean
  compliance: boolean
  pushEnabled: boolean
  smsEnabled: boolean
  emailEnabled: boolean
  inAppEnabled: boolean
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly'
  quietHoursStart: string
  quietHoursEnd: string
  quietHoursEnabled: boolean
}

export const NotificationPreferencesScreen: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    shifts: true,
    tasks: true,
    approvals: true,
    alerts: true,
    compliance: true,
    pushEnabled: true,
    smsEnabled: false,
    emailEnabled: true,
    inAppEnabled: true,
    frequency: 'immediate',
    quietHoursStart: '22:00',
    quietHoursEnd: '06:00',
    quietHoursEnabled: false,
  })

  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'notifications' | 'delivery' | 'schedule'>('notifications')

  /**
   * Load preferences from API
   */
  useEffect(() => {
    loadPreferences()
  }, [])

   /**
   * Load preferences
   */
  const loadPreferences = async () => {
    try {
      setLoading(true)
      // In production, would fetch from API
      // const response = await trpc.notificationPreferences.getPreferences.useQuery()
      // setPreferences(response)
    } catch (error) {
      console.error('[NotificationPreferencesScreen] Error loading preferences:', error)
      Alert.alert('Error', 'Failed to load notification preferences')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Save preferences
   */
  const handleSave = async () => {
    try {
      setLoading(true)
      // In production, would call API
      // await trpc.notificationPreferences.updatePreferences.useMutation(preferences)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      Alert.alert('Success', 'Notification preferences saved')
    } catch (error) {
      console.error('[NotificationPreferencesScreen] Error saving preferences:', error)
      Alert.alert('Error', 'Failed to save notification preferences')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Toggle notification type
   */
  const toggleNotificationType = (type: keyof NotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [type]: !prev[type],
    }))
  }

  /**
   * Toggle delivery method
   */
  const toggleDeliveryMethod = (method: keyof NotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [method]: !prev[method],
    }))
  }

  /**
   * Set frequency
   */
  const setFrequency = (freq: 'immediate' | 'hourly' | 'daily' | 'weekly') => {
    setPreferences((prev) => ({
      ...prev,
      frequency: freq,
    }))
  }

  /**
   * Toggle quiet hours
   */
  const toggleQuietHours = () => {
    setPreferences((prev) => ({
      ...prev,
      quietHoursEnabled: !prev.quietHoursEnabled,
    }))
  }

  if (loading && activeTab === 'notifications') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Bell size={28} color="#3b82f6" />
        <Text style={styles.headerTitle}>Notification Preferences</Text>
        <Text style={styles.headerSubtitle}>Customize how you receive notifications</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {(['notifications', 'delivery', 'schedule'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.tabActive,
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <View style={styles.tabContent}>
          <Text style={styles.sectionTitle}>Notification Types</Text>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceLabel}>
              <Text style={styles.preferenceName}>Shift Assignments</Text>
              <Text style={styles.preferenceDescription}>Get notified when shifts are assigned</Text>
            </View>
            <Switch
              value={preferences.shifts}
              onValueChange={() => toggleNotificationType('shifts')}
              trackColor={{ false: '#d1d5db', true: '#a3e635' }}
              thumbColor={preferences.shifts ? '#22c55e' : '#f3f4f6'}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceLabel}>
              <Text style={styles.preferenceName}>Task Assignments</Text>
              <Text style={styles.preferenceDescription}>Get notified when tasks are assigned</Text>
            </View>
            <Switch
              value={preferences.tasks}
              onValueChange={() => toggleNotificationType('tasks')}
              trackColor={{ false: '#d1d5db', true: '#a3e635' }}
              thumbColor={preferences.tasks ? '#22c55e' : '#f3f4f6'}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceLabel}>
              <Text style={styles.preferenceName}>Approvals</Text>
              <Text style={styles.preferenceDescription}>Get notified of approval decisions</Text>
            </View>
            <Switch
              value={preferences.approvals}
              onValueChange={() => toggleNotificationType('approvals')}
              trackColor={{ false: '#d1d5db', true: '#a3e635' }}
              thumbColor={preferences.approvals ? '#22c55e' : '#f3f4f6'}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceLabel}>
              <Text style={styles.preferenceName}>Alerts</Text>
              <Text style={styles.preferenceDescription}>Get notified of urgent alerts</Text>
            </View>
            <Switch
              value={preferences.alerts}
              onValueChange={() => toggleNotificationType('alerts')}
              trackColor={{ false: '#d1d5db', true: '#a3e635' }}
              thumbColor={preferences.alerts ? '#22c55e' : '#f3f4f6'}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceLabel}>
              <Text style={styles.preferenceName}>Compliance</Text>
              <Text style={styles.preferenceDescription}>Get notified of compliance issues</Text>
            </View>
            <Switch
              value={preferences.compliance}
              onValueChange={() => toggleNotificationType('compliance')}
              trackColor={{ false: '#d1d5db', true: '#a3e635' }}
              thumbColor={preferences.compliance ? '#22c55e' : '#f3f4f6'}
            />
          </View>
        </View>
      )}

      {/* Delivery Tab */}
      {activeTab === 'delivery' && (
        <View style={styles.tabContent}>
          <Text style={styles.sectionTitle}>Delivery Methods</Text>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceLabel}>
              <Text style={styles.preferenceName}>Push Notifications</Text>
              <Text style={styles.preferenceDescription}>Receive notifications in-app</Text>
            </View>
            <Switch
              value={preferences.pushEnabled}
              onValueChange={() => toggleDeliveryMethod('pushEnabled')}
              trackColor={{ false: '#d1d5db', true: '#a3e635' }}
              thumbColor={preferences.pushEnabled ? '#22c55e' : '#f3f4f6'}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceLabel}>
              <Text style={styles.preferenceName}>SMS Messages</Text>
              <Text style={styles.preferenceDescription}>Receive text messages</Text>
            </View>
            <Switch
              value={preferences.smsEnabled}
              onValueChange={() => toggleDeliveryMethod('smsEnabled')}
              trackColor={{ false: '#d1d5db', true: '#a3e635' }}
              thumbColor={preferences.smsEnabled ? '#22c55e' : '#f3f4f6'}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceLabel}>
              <Text style={styles.preferenceName}>Email</Text>
              <Text style={styles.preferenceDescription}>Receive email notifications</Text>
            </View>
            <Switch
              value={preferences.emailEnabled}
              onValueChange={() => toggleDeliveryMethod('emailEnabled')}
              trackColor={{ false: '#d1d5db', true: '#a3e635' }}
              thumbColor={preferences.emailEnabled ? '#22c55e' : '#f3f4f6'}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceLabel}>
              <Text style={styles.preferenceName}>In-App Only</Text>
              <Text style={styles.preferenceDescription}>Receive notifications only in app</Text>
            </View>
            <Switch
              value={preferences.inAppEnabled}
              onValueChange={() => toggleDeliveryMethod('inAppEnabled')}
              trackColor={{ false: '#d1d5db', true: '#a3e635' }}
              thumbColor={preferences.inAppEnabled ? '#22c55e' : '#f3f4f6'}
            />
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Notification Frequency</Text>

          {(['immediate', 'hourly', 'daily', 'weekly'] as const).map((freq) => (
            <TouchableOpacity
              key={freq}
              style={[
                styles.frequencyOption,
                preferences.frequency === freq && styles.frequencyOptionSelected,
              ]}
              onPress={() => setFrequency(freq)}
            >
              <View
                style={[
                  styles.frequencyRadio,
                  preferences.frequency === freq && styles.frequencyRadioSelected,
                ]}
              >
                {preferences.frequency === freq && (
                  <View style={styles.frequencyRadioDot} />
                )}
              </View>
              <Text style={styles.frequencyText}>
                {freq.charAt(0).toUpperCase() + freq.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <View style={styles.tabContent}>
          <Text style={styles.sectionTitle}>Quiet Hours</Text>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceLabel}>
              <Text style={styles.preferenceName}>Enable Quiet Hours</Text>
              <Text style={styles.preferenceDescription}>Disable notifications during specific times</Text>
            </View>
            <Switch
              value={preferences.quietHoursEnabled}
              onValueChange={toggleQuietHours}
              trackColor={{ false: '#d1d5db', true: '#a3e635' }}
              thumbColor={preferences.quietHoursEnabled ? '#22c55e' : '#f3f4f6'}
            />
          </View>

          {preferences.quietHoursEnabled && (
            <>
              <View style={styles.timePickerContainer}>
                <View style={styles.timePickerItem}>
                  <Text style={styles.timePickerLabel}>Start Time</Text>
                  <View style={styles.timeDisplay}>
                    <Clock size={18} color="#3b82f6" />
                    <Text style={styles.timeText}>{preferences.quietHoursStart}</Text>
                  </View>
                </View>

                <View style={styles.timePickerItem}>
                  <Text style={styles.timePickerLabel}>End Time</Text>
                  <View style={styles.timeDisplay}>
                    <Clock size={18} color="#3b82f6" />
                    <Text style={styles.timeText}>{preferences.quietHoursEnd}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.quietHoursInfo}>
                <MessageSquare size={16} color="#6366f1" />
                <Text style={styles.quietHoursInfoText}>
                  Notifications will be silenced from {preferences.quietHoursStart} to {preferences.quietHoursEnd}
                </Text>
              </View>
            </>
          )}

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Notification Summary</Text>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>
              You will receive notifications for:{'\n'}
              {preferences.shifts && '• Shift assignments\n'}
              {preferences.tasks && '• Task assignments\n'}
              {preferences.approvals && '• Approvals\n'}
              {preferences.alerts && '• Alerts\n'}
              {preferences.compliance && '• Compliance issues'}
            </Text>
          </View>
        </View>
      )}

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        <Save size={20} color="#ffffff" />
        <Text style={styles.saveButtonText}>
          {loading ? 'Saving...' : saved ? 'Saved!' : 'Save Preferences'}
        </Text>
      </TouchableOpacity>

      <View style={styles.spacer} />
    </ScrollView>
  )
}

/**
 * Styles
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#3b82f6',
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  preferenceLabel: {
    flex: 1,
  },
  preferenceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  preferenceDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  frequencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  frequencyOptionSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  frequencyRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frequencyRadioSelected: {
    borderColor: '#3b82f6',
  },
  frequencyRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  frequencyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  timePickerContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  timePickerItem: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  timePickerLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '600',
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3b82f6',
  },
  quietHoursInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#e0e7ff',
    borderRadius: 6,
    marginBottom: 16,
  },
  quietHoursInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#4f46e5',
    fontWeight: '500',
  },
  summaryBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  summaryText: {
    fontSize: 13,
    color: '#1f2937',
    lineHeight: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  spacer: {
    height: 20,
  },
})
