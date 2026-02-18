/**
 * IP Address Management Service
 * Manages IP whitelists and blacklists for security
 */
class IpManagementService {
  private whitelistedIps: Map<string, { userId: string; addedAt: Date; reason: string }> = new Map();
  private blacklistedIps: Map<string, { reason: string; addedAt: Date; expiresAt?: Date }> = new Map();
  private suspiciousIps: Map<string, { failedAttempts: number; lastAttempt: Date }> = new Map();

  /**
   * Add IP to whitelist
   * @param ipAddress - IP address to whitelist
   * @param userId - User ID
   * @param reason - Reason for whitelisting
   * @returns Success status
   */
  whitelistIp(ipAddress: string, userId: string, reason: string): boolean {
    if (!this.isValidIp(ipAddress)) {
      return false;
    }

    this.whitelistedIps.set(ipAddress, {
      userId,
      addedAt: new Date(),
      reason,
    });

    // Remove from blacklist if present
    this.blacklistedIps.delete(ipAddress);

    return true;
  }

  /**
   * Remove IP from whitelist
   * @param ipAddress - IP address to remove
   * @returns Success status
   */
  removeFromWhitelist(ipAddress: string): boolean {
    return this.whitelistedIps.delete(ipAddress);
  }

  /**
   * Check if IP is whitelisted
   * @param ipAddress - IP address to check
   * @returns True if whitelisted, false otherwise
   */
  isWhitelisted(ipAddress: string): boolean {
    return this.whitelistedIps.has(ipAddress);
  }

  /**
   * Get whitelist for a user
   * @param userId - User ID
   * @returns Array of whitelisted IPs
   */
  getUserWhitelist(userId: string): Array<{ ip: string; addedAt: Date; reason: string }> {
    const whitelist: Array<{ ip: string; addedAt: Date; reason: string }> = [];

    for (const [ip, data] of this.whitelistedIps.entries()) {
      if (data.userId === userId) {
        whitelist.push({
          ip,
          addedAt: data.addedAt,
          reason: data.reason,
        });
      }
    }

    return whitelist;
  }

  /**
   * Add IP to blacklist
   * @param ipAddress - IP address to blacklist
   * @param reason - Reason for blacklisting
   * @param durationMs - Duration of blacklist in milliseconds (optional, permanent if not set)
   * @returns Success status
   */
  blacklistIp(ipAddress: string, reason: string, durationMs?: number): boolean {
    if (!this.isValidIp(ipAddress)) {
      return false;
    }

    const expiresAt = durationMs ? new Date(Date.now() + durationMs) : undefined;

    this.blacklistedIps.set(ipAddress, {
      reason,
      addedAt: new Date(),
      expiresAt,
    });

    // Remove from whitelist if present
    this.whitelistedIps.delete(ipAddress);

    return true;
  }

  /**
   * Remove IP from blacklist
   * @param ipAddress - IP address to remove
   * @returns Success status
   */
  removeFromBlacklist(ipAddress: string): boolean {
    return this.blacklistedIps.delete(ipAddress);
  }

  /**
   * Check if IP is blacklisted
   * @param ipAddress - IP address to check
   * @returns True if blacklisted, false otherwise
   */
  isBlacklisted(ipAddress: string): boolean {
    const entry = this.blacklistedIps.get(ipAddress);

    if (!entry) {
      return false;
    }

    // Check if blacklist has expired
    if (entry.expiresAt && new Date() > entry.expiresAt) {
      this.blacklistedIps.delete(ipAddress);
      return false;
    }

    return true;
  }

  /**
   * Get blacklist
   * @returns Array of blacklisted IPs
   */
  getBlacklist(): Array<{ ip: string; reason: string; addedAt: Date; expiresAt?: Date }> {
    const blacklist: Array<{ ip: string; reason: string; addedAt: Date; expiresAt?: Date }> = [];

    for (const [ip, data] of this.blacklistedIps.entries()) {
      // Skip expired entries
      if (data.expiresAt && new Date() > data.expiresAt) {
        this.blacklistedIps.delete(ip);
        continue;
      }

      blacklist.push({
        ip,
        reason: data.reason,
        addedAt: data.addedAt,
        expiresAt: data.expiresAt,
      });
    }

    return blacklist;
  }

  /**
   * Record suspicious activity from an IP
   * @param ipAddress - IP address
   * @returns Number of suspicious activities recorded
   */
  recordSuspiciousActivity(ipAddress: string): number {
    if (!this.isValidIp(ipAddress)) {
      return 0;
    }

    const entry = this.suspiciousIps.get(ipAddress);

    if (!entry) {
      this.suspiciousIps.set(ipAddress, {
        failedAttempts: 1,
        lastAttempt: new Date(),
      });
      return 1;
    }

    entry.failedAttempts++;
    entry.lastAttempt = new Date();

    // Auto-blacklist if too many suspicious activities
    if (entry.failedAttempts >= 10) {
      this.blacklistIp(ipAddress, "Automatic blacklist due to suspicious activity", 24 * 60 * 60 * 1000); // 24 hours
    }

    return entry.failedAttempts;
  }

  /**
   * Get suspicious activity count for an IP
   * @param ipAddress - IP address
   * @returns Number of suspicious activities
   */
  getSuspiciousActivityCount(ipAddress: string): number {
    const entry = this.suspiciousIps.get(ipAddress);
    return entry ? entry.failedAttempts : 0;
  }

  /**
   * Clear suspicious activity for an IP
   * @param ipAddress - IP address
   * @returns Success status
   */
  clearSuspiciousActivity(ipAddress: string): boolean {
    return this.suspiciousIps.delete(ipAddress);
  }

  /**
   * Check if IP should be allowed
   * @param ipAddress - IP address to check
   * @returns Object with allowed status and reason
   */
  checkIpAccess(ipAddress: string): { allowed: boolean; reason: string } {
    // Check if blacklisted
    if (this.isBlacklisted(ipAddress)) {
      return {
        allowed: false,
        reason: "IP address is blacklisted",
      };
    }

    // Check suspicious activity
    const suspiciousCount = this.getSuspiciousActivityCount(ipAddress);
    if (suspiciousCount > 5) {
      return {
        allowed: false,
        reason: "IP address has too many suspicious activities",
      };
    }

    return {
      allowed: true,
      reason: "IP address is allowed",
    };
  }

  /**
   * Validate IP address format
   * @param ipAddress - IP address to validate
   * @returns True if valid IPv4 or IPv6, false otherwise
   */
  private isValidIp(ipAddress: string): boolean {
    // IPv4 pattern
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    // IPv6 pattern (simplified)
    const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

    if (ipv4Pattern.test(ipAddress)) {
      // Validate IPv4 octets
      const octets = ipAddress.split(".");
      return octets.every((octet) => {
        const num = parseInt(octet, 10);
        return num >= 0 && num <= 255;
      });
    }

    return ipv6Pattern.test(ipAddress);
  }

  /**
   * Get IP management statistics
   * @returns Statistics object
   */
  getStatistics() {
    return {
      whitelistedCount: this.whitelistedIps.size,
      blacklistedCount: this.blacklistedIps.size,
      suspiciousCount: this.suspiciousIps.size,
    };
  }

  /**
   * Export IP lists as JSON
   * @returns JSON string
   */
  exportAsJson() {
    return JSON.stringify(
      {
        whitelist: Array.from(this.whitelistedIps.entries()).map(([ip, data]) => ({
          ip,
          ...data,
        })),
        blacklist: Array.from(this.blacklistedIps.entries()).map(([ip, data]) => ({
          ip,
          ...data,
        })),
        suspicious: Array.from(this.suspiciousIps.entries()).map(([ip, data]) => ({
          ip,
          ...data,
        })),
      },
      null,
      2
    );
  }
}

export const ipManagement = new IpManagementService();
