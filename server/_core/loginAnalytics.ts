/**
 * Login Analytics Service
 * Tracks authentication methods, device types, and user behavior patterns
 */

export interface LoginEvent {
  userId: number;
  authProvider: "manus" | "google";
  ipAddress?: string;
  userAgent?: string;
  deviceType: "mobile" | "tablet" | "desktop";
  country?: string;
  city?: string;
  successfulLogin: boolean;
  failureReason?: string;
}

export interface AuthProviderStats {
  date: Date;
  manusLogins: number;
  googleLogins: number;
  totalLogins: number;
  manusSuccessRate: number;
  googleSuccessRate: number;
}

export interface UserAuthPreference {
  userId: number;
  preferredProvider: "manus" | "google";
  lastUsedProvider: "manus" | "google";
  totalManusLogins: number;
  totalGoogleLogins: number;
  lastLoginDate: Date;
}

/**
 * Calculate success rate for authentication provider
 */
export function calculateSuccessRate(
  successfulLogins: number,
  totalLogins: number
): number {
  if (totalLogins === 0) return 100;
  return Math.round((successfulLogins / totalLogins) * 100 * 100) / 100;
}

/**
 * Get user's preferred authentication method based on usage history
 */
export function getPreferredAuthMethod(
  manusLogins: number,
  googleLogins: number
): "manus" | "google" {
  return manusLogins >= googleLogins ? "manus" : "google";
}

/**
 * Analyze login patterns to detect anomalies
 */
export interface LoginAnomaly {
  type: "unusual_time" | "unusual_location" | "unusual_device" | "rapid_logins";
  severity: "low" | "medium" | "high";
  message: string;
}

export function detectLoginAnomalies(
  currentLogin: LoginEvent,
  loginHistory: LoginEvent[]
): LoginAnomaly[] {
  const anomalies: LoginAnomaly[] = [];

  if (loginHistory.length === 0) return anomalies;

  // Check for rapid consecutive logins (within 5 minutes)
  const recentLogins = loginHistory.filter(
    (l) => new Date().getTime() - l.timestamp.getTime() < 5 * 60 * 1000
  );

  if (recentLogins.length > 3) {
    anomalies.push({
      type: "rapid_logins",
      severity: "high",
      message: "Multiple login attempts detected in a short time",
    });
  }

  // Check for unusual location
  const usualLocations = loginHistory
    .filter((l) => l.country)
    .map((l) => l.country)
    .slice(-10);

  if (currentLogin.country && !usualLocations.includes(currentLogin.country)) {
    anomalies.push({
      type: "unusual_location",
      severity: "medium",
      message: `Login from unusual location: ${currentLogin.country}`,
    });
  }

  // Check for unusual device type
  const usualDevices = loginHistory
    .map((l) => l.deviceType)
    .slice(-10);

  if (!usualDevices.includes(currentLogin.deviceType)) {
    anomalies.push({
      type: "unusual_device",
      severity: "low",
      message: `Login from unusual device type: ${currentLogin.deviceType}`,
    });
  }

  return anomalies;
}

/**
 * Generate analytics report for authentication methods
 */
export interface AnalyticsReport {
  period: "daily" | "weekly" | "monthly";
  startDate: Date;
  endDate: Date;
  totalLogins: number;
  manusLogins: number;
  googleLogins: number;
  manusSuccessRate: number;
  googleSuccessRate: number;
  topDevices: Array<{ deviceType: string; count: number }>;
  topCountries: Array<{ country: string; count: number }>;
  averageLoginsPerUser: number;
  uniqueUsers: number;
}

/**
 * Format analytics data for dashboard display
 */
export function formatAnalyticsReport(stats: AuthProviderStats[]): AnalyticsReport {
  const totalStats = stats.reduce(
    (acc, stat) => ({
      totalLogins: acc.totalLogins + stat.totalLogins,
      manusLogins: acc.manusLogins + stat.manusLogins,
      googleLogins: acc.googleLogins + stat.googleLogins,
      manusSuccessRate: acc.manusSuccessRate + stat.manusSuccessRate,
      googleSuccessRate: acc.googleSuccessRate + stat.googleSuccessRate,
    }),
    {
      totalLogins: 0,
      manusLogins: 0,
      googleLogins: 0,
      manusSuccessRate: 0,
      googleSuccessRate: 0,
    }
  );

  const avgCount = stats.length || 1;

  return {
    period: "daily",
    startDate: stats[0]?.date || new Date(),
    endDate: stats[stats.length - 1]?.date || new Date(),
    totalLogins: totalStats.totalLogins,
    manusLogins: totalStats.manusLogins,
    googleLogins: totalStats.googleLogins,
    manusSuccessRate: Math.round((totalStats.manusSuccessRate / avgCount) * 100) / 100,
    googleSuccessRate: Math.round((totalStats.googleSuccessRate / avgCount) * 100) / 100,
    topDevices: [],
    topCountries: [],
    averageLoginsPerUser: 0,
    uniqueUsers: 0,
  };
}

/**
 * Determine if login should require additional verification
 */
export function shouldRequireAdditionalVerification(
  loginEvent: LoginEvent,
  loginHistory: LoginEvent[],
  userHas2FAEnabled: boolean
): boolean {
  if (!userHas2FAEnabled) return false;

  const anomalies = detectLoginAnomalies(loginEvent, loginHistory);
  const hasHighSeverityAnomaly = anomalies.some((a) => a.severity === "high");

  return hasHighSeverityAnomaly;
}
