import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useOfflineData } from "../lib/offlineSync";

interface DashboardScreenProps {
  navigation: any;
}

interface DashboardData {
  totalAnimals: number;
  upcomingAppointments: number;
  monthlyExpenses: number;
  monthlyRevenue: number;
  lowStockItems: number;
  alerts: Array<{
    id: string;
    title: string;
    message: string;
    severity: "low" | "medium" | "high";
  }>;
}

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  const { data, isLoading, refresh, isOnline } = useOfflineData<DashboardData>(
    "dashboard",
    async () => {
      // In a real app, fetch from API
      return {
        totalAnimals: 45,
        upcomingAppointments: 3,
        monthlyExpenses: 2500,
        monthlyRevenue: 8500,
        lowStockItems: 2,
        alerts: [
          {
            id: "1",
            title: "Vaccination Due",
            message: "5 animals need vaccination",
            severity: "high",
          },
          {
            id: "2",
            title: "Low Feed Stock",
            message: "Feed stock below 20%",
            severity: "medium",
          },
        ],
      };
    },
    {
      totalAnimals: 0,
      upcomingAppointments: 0,
      monthlyExpenses: 0,
      monthlyRevenue: 0,
      lowStockItems: 0,
      alerts: [],
    }
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "#ef4444";
      case "medium":
        return "#f97316";
      case "low":
        return "#eab308";
      default:
        return "#6b7280";
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome Back</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
        </View>
        <View style={[styles.badge, !isOnline && styles.offlineBadge]}>
          <Ionicons
            name={isOnline ? "wifi" : "wifi-off"}
            size={16}
            color={isOnline ? "#10b981" : "#ef4444"}
          />
          <Text style={[styles.badgeText, !isOnline && styles.offlineBadgeText]}>
            {isOnline ? "Online" : "Offline"}
          </Text>
        </View>
      </View>

      {/* KPI Cards */}
      <View style={styles.kpiGrid}>
        <TouchableOpacity
          style={styles.kpiCard}
          onPress={() => navigation.navigate("Livestock")}
        >
          <Ionicons name="paw" size={32} color="#3b82f6" />
          <Text style={styles.kpiValue}>{data.totalAnimals}</Text>
          <Text style={styles.kpiLabel}>Total Animals</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.kpiCard}
          onPress={() => navigation.navigate("Appointments")}
        >
          <Ionicons name="calendar" size={32} color="#8b5cf6" />
          <Text style={styles.kpiValue}>{data.upcomingAppointments}</Text>
          <Text style={styles.kpiLabel}>Appointments</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.kpiCard}
          onPress={() => navigation.navigate("Financial")}
        >
          <Ionicons name="trending-up" size={32} color="#10b981" />
          <Text style={styles.kpiValue}>${data.monthlyRevenue}</Text>
          <Text style={styles.kpiLabel}>Revenue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.kpiCard}
          onPress={() => navigation.navigate("Financial")}
        >
          <Ionicons name="trending-down" size={32} color="#ef4444" />
          <Text style={styles.kpiValue}>${data.monthlyExpenses}</Text>
          <Text style={styles.kpiLabel}>Expenses</Text>
        </TouchableOpacity>
      </View>

      {/* Alerts Section */}
      {data.alerts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Alerts</Text>
          {data.alerts.map((alert) => (
            <View
              key={alert.id}
              style={[
                styles.alertCard,
                { borderLeftColor: getSeverityColor(alert.severity) },
              ]}
            >
              <View style={styles.alertIcon}>
                <Ionicons
                  name="alert-circle"
                  size={24}
                  color={getSeverityColor(alert.severity)}
                />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertMessage}>{alert.message}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("Appointments")}
          >
            <Ionicons name="add-circle-outline" size={32} color="#3b82f6" />
            <Text style={styles.actionLabel}>New Appointment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("Financial")}
          >
            <Ionicons name="receipt-outline" size={32} color="#8b5cf6" />
            <Text style={styles.actionLabel}>Log Expense</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("Livestock")}
          >
            <Ionicons name="add-outline" size={32} color="#10b981" />
            <Text style={styles.actionLabel}>Add Animal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("Notifications")}
          >
            <Ionicons name="notifications-outline" size={32} color="#f59e0b" />
            <Text style={styles.actionLabel}>Notifications</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Info Footer */}
      {!isOnline && (
        <View style={styles.offlineInfo}>
          <Ionicons name="information-circle" size={20} color="#3b82f6" />
          <Text style={styles.offlineInfoText}>
            You're offline. Changes will sync when you're back online.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
  },
  date: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d1fae5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  offlineBadge: {
    backgroundColor: "#fee2e2",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#065f46",
  },
  offlineBadgeText: {
    color: "#7f1d1d",
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
    gap: 10,
  },
  kpiCard: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 8,
  },
  kpiLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    textAlign: "center",
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
  },
  alertCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  alertIcon: {
    marginRight: 12,
    justifyContent: "center",
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  alertMessage: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionButton: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  actionLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 8,
    textAlign: "center",
  },
  offlineInfo: {
    flexDirection: "row",
    backgroundColor: "#dbeafe",
    margin: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    gap: 10,
  },
  offlineInfoText: {
    fontSize: 12,
    color: "#1e40af",
    flex: 1,
  },
});
