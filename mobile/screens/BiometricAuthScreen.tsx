import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons";

interface BiometricAuthScreenProps {
  navigation: any;
}

export default function BiometricAuthScreen({ navigation }: BiometricAuthScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [useManualAuth, setUseManualAuth] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (compatible && enrolled) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType("Face ID");
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType("Fingerprint");
        }
      }
    } catch (error) {
      console.error("Error checking biometric availability:", error);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      setIsLoading(true);
      const result = await LocalAuthentication.authenticateAsync({
        disableDeviceFallback: false,
        reason: "Authenticate to access FarmKonnect",
      });

      if (result.success) {
        // Biometric authentication successful
        // In a real app, you would verify the biometric against a stored credential
        const token = await SecureStore.getItemAsync("authToken");
        if (token) {
          // Token exists, proceed to main app
          navigation.replace("Main");
        } else {
          // First time user, show manual auth
          setUseManualAuth(true);
        }
      }
    } catch (error) {
      Alert.alert("Authentication Failed", "Please try again");
      console.error("Biometric auth error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualAuth = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    try {
      setIsLoading(true);

      // In a real app, you would call your authentication API here
      // For now, we'll simulate a successful login
      const mockToken = `token-${Date.now()}`;
      await SecureStore.setItemAsync("authToken", mockToken);
      await SecureStore.setItemAsync("userEmail", email);

      // Store credentials for biometric auth (in a real app, use secure storage)
      if (biometricType) {
        await SecureStore.setItemAsync("biometricEnabled", "true");
      }

      navigation.replace("Main");
    } catch (error) {
      Alert.alert("Login Failed", "Please check your credentials and try again");
      console.error("Manual auth error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (useManualAuth) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Welcome to FarmKonnect</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.input}>
              <Ionicons name="mail-outline" size={20} color="#9ca3af" />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.input}>
              <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#9ca3af"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={handleManualAuth}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Back to Biometric */}
          {biometricType && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setUseManualAuth(false)}
              disabled={isLoading}
            >
              <Text style={styles.secondaryButtonText}>Use {biometricType}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🌾</Text>
          <Text style={styles.appName}>FarmKonnect</Text>
        </View>

        {/* Biometric Option */}
        {biometricType ? (
          <>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Use {biometricType} to sign in</Text>

            <View style={styles.biometricContainer}>
              <Ionicons
                name={biometricType === "Face ID" ? "face-recognition" : "finger-print"}
                size={80}
                color="#3b82f6"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleBiometricAuth}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="finger-print" size={24} color="white" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Authenticate with {biometricType}</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setUseManualAuth(true)}
              disabled={isLoading}
            >
              <Text style={styles.secondaryButtonText}>Sign in with Email</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>Sign In</Text>
            <Text style={styles.subtitle}>Enter your credentials</Text>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setUseManualAuth(true)}
            >
              <Text style={styles.secondaryButtonText}>Continue with Email</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Info Text */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#3b82f6" />
          <Text style={styles.infoText}>
            Your login credentials are securely stored on your device
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    fontSize: 60,
    marginBottom: 10,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 30,
    textAlign: "center",
  },
  biometricContainer: {
    alignItems: "center",
    marginVertical: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 16,
    color: "#1f2937",
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
    flexDirection: "row",
  },
  primaryButton: {
    backgroundColor: "#3b82f6",
  },
  secondaryButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3b82f6",
  },
  infoContainer: {
    flexDirection: "row",
    backgroundColor: "#dbeafe",
    borderRadius: 8,
    padding: 12,
    marginTop: 30,
    alignItems: "center",
  },
  infoText: {
    fontSize: 13,
    color: "#1e40af",
    marginLeft: 10,
    flex: 1,
  },
});

import { TextInput } from "react-native";
