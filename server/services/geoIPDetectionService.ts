import { getDb } from "../db";
import { userLoginLocations } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export interface GeoIPData {
  ipAddress: string;
  country: string;
  countryCode: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string;
  isVPN: boolean;
  isProxy: boolean;
}

export interface LocationEntry {
  userId: number;
  ipAddress: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  deviceName?: string;
}

// In-memory cache for IP lookups (to avoid repeated API calls)
const geoIPCache = new Map<string, { data: GeoIPData; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export class GeoIPDetectionService {
  /**
   * Get GeoIP data for an IP address (using mock data for demo)
   * In production, integrate with MaxMind GeoIP2 or IP2Location API
   */
  static async getGeoIPData(ipAddress: string): Promise<GeoIPData> {
    // Check cache first
    const cached = geoIPCache.get(ipAddress);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    // Mock GeoIP data - replace with actual API call
    const geoData = this.getMockGeoIPData(ipAddress);

    // Cache the result
    geoIPCache.set(ipAddress, { data: geoData, timestamp: Date.now() });

    return geoData;
  }

  /**
   * Mock GeoIP data for demonstration
   * Replace with actual MaxMind or IP2Location API call
   */
  private static getMockGeoIPData(ipAddress: string): GeoIPData {
    // Simulate different locations based on IP patterns
    const ipNum = parseInt(ipAddress.split(".")[0]);

    const locations: Record<number, Partial<GeoIPData>> = {
      192: {
        country: "United States",
        countryCode: "US",
        city: "New York",
        latitude: 40.7128,
        longitude: -74.006,
        timezone: "America/New_York",
        isp: "Verizon Communications",
      },
      172: {
        country: "United Kingdom",
        countryCode: "GB",
        city: "London",
        latitude: 51.5074,
        longitude: -0.1278,
        timezone: "Europe/London",
        isp: "BT Group",
      },
      10: {
        country: "Germany",
        countryCode: "DE",
        city: "Berlin",
        latitude: 52.52,
        longitude: 13.405,
        timezone: "Europe/Berlin",
        isp: "Deutsche Telekom",
      },
      203: {
        country: "Australia",
        countryCode: "AU",
        city: "Sydney",
        latitude: -33.8688,
        longitude: 151.2093,
        timezone: "Australia/Sydney",
        isp: "Telstra Corporation",
      },
    };

    const baseLocation = locations[ipNum] || {
      country: "Unknown",
      countryCode: "XX",
      city: "Unknown",
      latitude: 0,
      longitude: 0,
      timezone: "UTC",
      isp: "Unknown ISP",
    };

    return {
      ipAddress,
      country: baseLocation.country || "Unknown",
      countryCode: baseLocation.countryCode || "XX",
      city: baseLocation.city || "Unknown",
      latitude: baseLocation.latitude || 0,
      longitude: baseLocation.longitude || 0,
      timezone: baseLocation.timezone || "UTC",
      isp: baseLocation.isp || "Unknown ISP",
      isVPN: ipAddress.startsWith("10.") || ipAddress.startsWith("172."),
      isProxy: ipAddress.startsWith("203."),
    };
  }

  /**
   * Record user login location
   */
  static async recordLoginLocation(
    userId: number,
    ipAddress: string,
    deviceName?: string
  ): Promise<void> {
    const geoData = await this.getGeoIPData(ipAddress);
    const db = getDb();

    await db.insert(userLoginLocations).values({
      userId,
      ipAddress,
      country: geoData.country,
      city: geoData.city,
      latitude: geoData.latitude,
      longitude: geoData.longitude,
      deviceName,
      timestamp: new Date(),
    });
  }

  /**
   * Get user's login history
   */
  static async getUserLoginHistory(userId: number, limit: number = 50): Promise<LocationEntry[]> {
    const db = getDb();

    const history = await db
      .select()
      .from(userLoginLocations)
      .where(eq(userLoginLocations.userId, userId))
      .orderBy(desc(userLoginLocations.timestamp))
      .limit(limit);

    return history.map((h) => ({
      userId: h.userId,
      ipAddress: h.ipAddress,
      country: h.country,
      city: h.city,
      latitude: h.latitude,
      longitude: h.longitude,
      timestamp: h.timestamp,
      deviceName: h.deviceName,
    }));
  }

  /**
   * Detect suspicious login based on location change
   */
  static async detectSuspiciousLogin(
    userId: number,
    currentIP: string
  ): Promise<{
    isSuspicious: boolean;
    reason?: string;
    previousLocation?: LocationEntry;
    distance?: number;
  }> {
    const db = getDb();

    // Get last login location
    const lastLogin = await db
      .select()
      .from(userLoginLocations)
      .where(eq(userLoginLocations.userId, userId))
      .orderBy(desc(userLoginLocations.timestamp))
      .limit(1);

    if (lastLogin.length === 0) {
      return { isSuspicious: false, reason: "First login" };
    }

    const previousLocation = lastLogin[0];
    const currentGeoData = await this.getGeoIPData(currentIP);

    // Check if country changed
    if (previousLocation.country !== currentGeoData.country) {
      // Calculate distance between locations
      const distance = this.calculateDistance(
        previousLocation.latitude,
        previousLocation.longitude,
        currentGeoData.latitude,
        currentGeoData.longitude
      );

      // Get time difference in hours
      const timeDiff = (Date.now() - previousLocation.timestamp.getTime()) / (1000 * 60 * 60);

      // Calculate required speed (km/h)
      const requiredSpeed = distance / timeDiff;

      // If distance is too far for the time elapsed, it's suspicious
      // Assuming max travel speed of 900 km/h (commercial flight)
      if (requiredSpeed > 900) {
        return {
          isSuspicious: true,
          reason: `Impossible travel detected: ${distance.toFixed(0)}km in ${timeDiff.toFixed(1)}h (${requiredSpeed.toFixed(0)}km/h)`,
          previousLocation: {
            userId: previousLocation.userId,
            ipAddress: previousLocation.ipAddress,
            country: previousLocation.country,
            city: previousLocation.city,
            latitude: previousLocation.latitude,
            longitude: previousLocation.longitude,
            timestamp: previousLocation.timestamp,
            deviceName: previousLocation.deviceName,
          },
          distance,
        };
      }

      // Country changed but travel is possible
      return {
        isSuspicious: true,
        reason: `Login from new country: ${previousLocation.country} → ${currentGeoData.country}`,
        previousLocation: {
          userId: previousLocation.userId,
          ipAddress: previousLocation.ipAddress,
          country: previousLocation.country,
          city: previousLocation.city,
          latitude: previousLocation.latitude,
          longitude: previousLocation.longitude,
          timestamp: previousLocation.timestamp,
          deviceName: previousLocation.deviceName,
        },
        distance,
      };
    }

    // Check if VPN/Proxy detected
    if (currentGeoData.isVPN || currentGeoData.isProxy) {
      return {
        isSuspicious: true,
        reason: `Login via ${currentGeoData.isVPN ? "VPN" : "Proxy"}`,
        previousLocation: {
          userId: previousLocation.userId,
          ipAddress: previousLocation.ipAddress,
          country: previousLocation.country,
          city: previousLocation.city,
          latitude: previousLocation.latitude,
          longitude: previousLocation.longitude,
          timestamp: previousLocation.timestamp,
          deviceName: previousLocation.deviceName,
        },
      };
    }

    return { isSuspicious: false, reason: "Normal login pattern" };
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Get unique locations for user
   */
  static async getUniqueLocations(userId: number): Promise<Array<{ country: string; city: string; count: number }>> {
    const db = getDb();

    const locations = await db
      .select()
      .from(userLoginLocations)
      .where(eq(userLoginLocations.userId, userId));

    const locationMap = new Map<string, number>();

    locations.forEach((loc) => {
      const key = `${loc.country}|${loc.city}`;
      locationMap.set(key, (locationMap.get(key) || 0) + 1);
    });

    return Array.from(locationMap.entries()).map(([key, count]) => {
      const [country, city] = key.split("|");
      return { country, city, count };
    });
  }

  /**
   * Clear cache (for testing)
   */
  static clearCache(): void {
    geoIPCache.clear();
  }

  /**
   * Get statistics
   */
  static async getStatistics(): Promise<{
    totalLocations: number;
    uniqueCountries: number;
    suspiciousPatterns: number;
  }> {
    const db = getDb();

    const allLocations = await db.select().from(userLoginLocations);

    const uniqueCountries = new Set(allLocations.map((l) => l.country)).size;

    return {
      totalLocations: allLocations.length,
      uniqueCountries,
      suspiciousPatterns: 0, // This would be calculated from audit logs
    };
  }
}
