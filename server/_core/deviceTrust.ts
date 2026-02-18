import crypto from "crypto";

/**
 * Device Trust Management Service
 * Manages trusted devices to skip 2FA on repeat logins
 */
export class DeviceTrustManager {
  /**
   * Generate device fingerprint from device information
   * @param userAgent - Browser user agent string
   * @param ipAddress - IP address of the device
   * @param acceptLanguage - Accept-Language header
   * @returns Device fingerprint hash
   */
  static generateDeviceFingerprint(userAgent: string, ipAddress: string, acceptLanguage: string = ""): string {
    const fingerprint = `${userAgent}|${ipAddress}|${acceptLanguage}`;
    return crypto.createHash("sha256").update(fingerprint).digest("hex");
  }

  /**
   * Generate device identifier for display
   * @param userAgent - Browser user agent string
   * @returns Human-readable device identifier
   */
  static generateDeviceIdentifier(userAgent: string): string {
    // Parse user agent to extract browser and OS info
    const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/i);
    const osMatch = userAgent.match(/(Windows|Mac|Linux|Android|iOS)/i);

    const browser = browserMatch ? browserMatch[1] : "Unknown Browser";
    const os = osMatch ? osMatch[1] : "Unknown OS";

    return `${browser} on ${os}`;
  }

  /**
   * Extract device type from user agent
   * @param userAgent - Browser user agent string
   * @returns Device type (Desktop, Mobile, Tablet)
   */
  static getDeviceType(userAgent: string): "Desktop" | "Mobile" | "Tablet" {
    const ua = userAgent.toLowerCase();

    if (/tablet|ipad|playbook|silk|(android(?!.*mobi))/i.test(ua)) {
      return "Tablet";
    }

    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
      return "Mobile";
    }

    return "Desktop";
  }

  /**
   * Check if device fingerprints match
   * @param fingerprint1 - First device fingerprint
   * @param fingerprint2 - Second device fingerprint
   * @param tolerance - Tolerance level for matching (0-1, where 1 is exact match)
   * @returns True if fingerprints match within tolerance
   */
  static matchFingerprints(fingerprint1: string, fingerprint2: string, tolerance: number = 1): boolean {
    if (tolerance === 1) {
      return fingerprint1 === fingerprint2;
    }

    // For partial matching, compare character similarity
    let matches = 0;
    const maxLength = Math.max(fingerprint1.length, fingerprint2.length);

    for (let i = 0; i < maxLength; i++) {
      if (fingerprint1[i] === fingerprint2[i]) {
        matches++;
      }
    }

    const similarity = matches / maxLength;
    return similarity >= tolerance;
  }

  /**
   * Get geolocation from IP address (mock implementation)
   * In production, use a real GeoIP service like MaxMind
   * @param ipAddress - IP address to geolocate
   * @returns Location information
   */
  static async getLocationFromIp(ipAddress: string): Promise<{ city: string; country: string; latitude: number; longitude: number }> {
    // Mock implementation - replace with real GeoIP API
    // Example services: MaxMind GeoIP2, IP2Location, ipstack

    // For now, return mock data
    const mockLocations: Record<string, { city: string; country: string; latitude: number; longitude: number }> = {
      "127.0.0.1": { city: "Local", country: "Local", latitude: 0, longitude: 0 },
      "192.168.1.1": { city: "Local", country: "Local", latitude: 0, longitude: 0 },
    };

    if (mockLocations[ipAddress]) {
      return mockLocations[ipAddress];
    }

    // Return mock location for demo
    return {
      city: "Unknown City",
      country: "Unknown Country",
      latitude: 0,
      longitude: 0,
    };
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * @param lat1 - Latitude of first point
   * @param lon1 - Longitude of first point
   * @param lat2 - Latitude of second point
   * @param lon2 - Longitude of second point
   * @returns Distance in kilometers
   */
  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Check if login is suspicious based on device and location
   * @param lastLoginLocation - Last login location
   * @param currentLoginLocation - Current login location
   * @param timeSinceLastLogin - Time since last login in seconds
   * @returns True if login is suspicious
   */
  static isSuspiciousLogin(
    lastLoginLocation: { latitude: number; longitude: number },
    currentLoginLocation: { latitude: number; longitude: number },
    timeSinceLastLogin: number
  ): boolean {
    // Calculate distance between locations
    const distance = this.calculateDistance(
      lastLoginLocation.latitude,
      lastLoginLocation.longitude,
      currentLoginLocation.latitude,
      currentLoginLocation.longitude
    );

    // Maximum speed a person can travel (km/h)
    // Assuming max speed of 900 km/h (commercial flight)
    const maxSpeed = 900;
    const maxDistance = (maxSpeed / 3600) * timeSinceLastLogin; // Convert to km

    // If distance is greater than max possible distance, it's suspicious
    return distance > maxDistance;
  }
}

/**
 * Device Trust Data Structure
 */
export interface TrustedDevice {
  id: string;
  userId: string;
  deviceFingerprint: string;
  deviceIdentifier: string;
  deviceType: "Desktop" | "Mobile" | "Tablet";
  lastUsedAt: Date;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

/**
 * Login Session Data Structure
 */
export interface LoginSession {
  id: string;
  userId: string;
  deviceFingerprint: string;
  deviceIdentifier: string;
  deviceType: "Desktop" | "Mobile" | "Tablet";
  ipAddress: string;
  location: {
    city: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  userAgent: string;
  isTrusted: boolean;
  loginTime: Date;
  lastActivityTime: Date;
  expiresAt: Date;
}
