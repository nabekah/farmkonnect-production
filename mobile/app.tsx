import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TRPCProvider } from "./lib/trpc";
import { OfflineSyncProvider } from "./lib/offlineSync";

// Screens
import BiometricAuthScreen from "./screens/BiometricAuthScreen";
import DashboardScreen from "./screens/DashboardScreen";
import AppointmentsScreen from "./screens/AppointmentsScreen";
import FinancialScreen from "./screens/FinancialScreen";
import NotificationsScreen from "./screens/NotificationsScreen";
import SettingsScreen from "./screens/SettingsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const queryClient = new QueryClient();

interface AppState {
  isAuthenticated: boolean;
  isBiometricAvailable: boolean;
  isLoading: boolean;
}

const DashboardTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#9ca3af",
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: "Dashboard",
          tabBarLabel: "Home",
          tabBarIcon: ({ color }) => <DashboardIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{
          title: "Appointments",
          tabBarLabel: "Appointments",
          tabBarIcon: ({ color }) => <AppointmentIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="Financial"
        component={FinancialScreen}
        options={{
          title: "Financial",
          tabBarLabel: "Finance",
          tabBarIcon: ({ color }) => <FinancialIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: "Notifications",
          tabBarLabel: "Alerts",
          tabBarIcon: ({ color }) => <NotificationIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Settings",
          tabBarLabel: "Settings",
          tabBarIcon: ({ color }) => <SettingsIcon color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default function App() {
  const [appState, setAppState] = useState<AppState>({
    isAuthenticated: false,
    isBiometricAvailable: false,
    isLoading: true,
  });

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Check if biometric authentication is available
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const isBiometricAvailable = compatible && enrolled;

      // Check if user is already authenticated
      const token = await SecureStore.getItemAsync("authToken");
      const isAuthenticated = !!token;

      setAppState({
        isAuthenticated,
        isBiometricAvailable,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error initializing app:", error);
      setAppState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  if (appState.isLoading) {
    return null; // Show splash screen
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider>
        <OfflineSyncProvider>
          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                animationEnabled: true,
              }}
            >
              {!appState.isAuthenticated ? (
                <Stack.Screen
                  name="Auth"
                  component={BiometricAuthScreen}
                  options={{
                    animationEnabled: false,
                  }}
                />
              ) : (
                <Stack.Screen
                  name="Main"
                  component={DashboardTabs}
                  options={{
                    animationEnabled: false,
                  }}
                />
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </OfflineSyncProvider>
      </TRPCProvider>
    </QueryClientProvider>
  );
}

// Icon components (simplified)
const DashboardIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 20, color }}>📊</Text>
);
const AppointmentIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 20, color }}>📅</Text>
);
const FinancialIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 20, color }}>💰</Text>
);
const NotificationIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 20, color }}>🔔</Text>
);
const SettingsIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 20, color }}>⚙️</Text>
);

import { Text } from "react-native";
