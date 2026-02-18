import crypto from "crypto";

/**
 * API Key Permission
 */
export type ApiKeyPermission =
  | "read:farms"
  | "write:farms"
  | "read:crops"
  | "write:crops"
  | "read:livestock"
  | "write:livestock"
  | "read:marketplace"
  | "write:marketplace"
  | "read:analytics"
  | "write:analytics"
  | "read:iot"
  | "write:iot"
  | "admin:all";

/**
 * API Key
 */
export interface ApiKey {
  id: string;
  key: string;
  name: string;
  userId: string;
  permissions: ApiKeyPermission[];
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  isActive: boolean;
  rateLimit: number; // requests per minute
  ipWhitelist?: string[];
  metadata?: Record<string, any>;
}

/**
 * API Key Usage
 */
export interface ApiKeyUsage {
  keyId: string;
  timestamp: Date;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  ipAddress: string;
}

/**
 * API Key Management Service
 */
class ApiKeyManagementService {
  private apiKeys: Map<string, ApiKey> = new Map();
  private keyHashes: Map<string, string> = new Map(); // Hash -> Key ID mapping
  private usage: ApiKeyUsage[] = [];
  private readonly keyLength = 32;

  /**
   * Create API key
   * @param userId - User ID
   * @param name - Key name
   * @param permissions - Permissions for the key
   * @param expiresAt - Optional expiration date
   * @param ipWhitelist - Optional IP whitelist
   * @param rateLimit - Rate limit in requests per minute
   * @returns Created API key
   */
  createApiKey(
    userId: string,
    name: string,
    permissions: ApiKeyPermission[],
    expiresAt?: Date,
    ipWhitelist?: string[],
    rateLimit: number = 100
  ): ApiKey {
    const id = this.generateId();
    const key = this.generateSecureKey();
    const hash = this.hashKey(key);

    const apiKey: ApiKey = {
      id,
      key,
      name,
      userId,
      permissions,
      createdAt: new Date(),
      expiresAt,
      isActive: true,
      rateLimit,
      ipWhitelist,
    };

    this.apiKeys.set(id, apiKey);
    this.keyHashes.set(hash, id);

    return apiKey;
  }

  /**
   * Get API key by ID
   * @param keyId - Key ID
   * @returns API key or null
   */
  getApiKey(keyId: string): ApiKey | null {
    return this.apiKeys.get(keyId) || null;
  }

  /**
   * Get API key by hash (for validation)
   * @param keyHash - Key hash
   * @returns API key or null
   */
  getApiKeyByHash(keyHash: string): ApiKey | null {
    const keyId = this.keyHashes.get(keyHash);
    return keyId ? this.apiKeys.get(keyId) || null : null;
  }

  /**
   * Get API keys for user
   * @param userId - User ID
   * @returns Array of API keys (without key value)
   */
  getUserApiKeys(userId: string): Omit<ApiKey, "key">[] {
    const keys: Omit<ApiKey, "key">[] = [];

    for (const [, apiKey] of this.apiKeys.entries()) {
      if (apiKey.userId === userId) {
        const { key, ...keyWithoutSecret } = apiKey;
        keys.push(keyWithoutSecret);
      }
    }

    return keys;
  }

  /**
   * Validate API key
   * @param keyHash - Key hash
   * @param permission - Required permission
   * @param ipAddress - Request IP address
   * @returns Validation result
   */
  validateApiKey(
    keyHash: string,
    permission: ApiKeyPermission,
    ipAddress: string
  ): { valid: boolean; message: string } {
    const apiKey = this.getApiKeyByHash(keyHash);

    if (!apiKey) {
      return {
        valid: false,
        message: "Invalid API key",
      };
    }

    // Check if key is active
    if (!apiKey.isActive) {
      return {
        valid: false,
        message: "API key is inactive",
      };
    }

    // Check if key has expired
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      return {
        valid: false,
        message: "API key has expired",
      };
    }

    // Check IP whitelist
    if (apiKey.ipWhitelist && !apiKey.ipWhitelist.includes(ipAddress)) {
      return {
        valid: false,
        message: "IP address not whitelisted",
      };
    }

    // Check permission
    if (!this.hasPermission(apiKey, permission)) {
      return {
        valid: false,
        message: "Insufficient permissions",
      };
    }

    // Update last used time
    apiKey.lastUsedAt = new Date();

    return {
      valid: true,
      message: "API key is valid",
    };
  }

  /**
   * Check if API key has permission
   * @param apiKey - API key
   * @param permission - Permission to check
   * @returns True if has permission
   */
  private hasPermission(apiKey: ApiKey, permission: ApiKeyPermission): boolean {
    // Admin permission grants all access
    if (apiKey.permissions.includes("admin:all")) {
      return true;
    }

    return apiKey.permissions.includes(permission);
  }

  /**
   * Update API key permissions
   * @param keyId - Key ID
   * @param permissions - New permissions
   * @returns Success status
   */
  updateApiKeyPermissions(keyId: string, permissions: ApiKeyPermission[]): boolean {
    const apiKey = this.apiKeys.get(keyId);

    if (!apiKey) {
      return false;
    }

    apiKey.permissions = permissions;
    return true;
  }

  /**
   * Rotate API key
   * @param keyId - Key ID
   * @returns New API key or null
   */
  rotateApiKey(keyId: string): ApiKey | null {
    const oldKey = this.apiKeys.get(keyId);

    if (!oldKey) {
      return null;
    }

    // Remove old key hash
    const oldHash = this.hashKey(oldKey.key);
    this.keyHashes.delete(oldHash);

    // Generate new key
    const newKey = this.generateSecureKey();
    const newHash = this.hashKey(newKey);

    oldKey.key = newKey;
    this.keyHashes.set(newHash, keyId);

    return oldKey;
  }

  /**
   * Revoke API key
   * @param keyId - Key ID
   * @returns Success status
   */
  revokeApiKey(keyId: string): boolean {
    const apiKey = this.apiKeys.get(keyId);

    if (!apiKey) {
      return false;
    }

    apiKey.isActive = false;

    // Remove key hash
    const hash = this.hashKey(apiKey.key);
    this.keyHashes.delete(hash);

    return true;
  }

  /**
   * Delete API key
   * @param keyId - Key ID
   * @returns Success status
   */
  deleteApiKey(keyId: string): boolean {
    const apiKey = this.apiKeys.get(keyId);

    if (!apiKey) {
      return false;
    }

    // Remove key hash
    const hash = this.hashKey(apiKey.key);
    this.keyHashes.delete(hash);

    // Delete key
    this.apiKeys.delete(keyId);

    return true;
  }

  /**
   * Record API key usage
   * @param keyId - Key ID
   * @param endpoint - API endpoint
   * @param method - HTTP method
   * @param statusCode - Response status code
   * @param responseTime - Response time in ms
   * @param ipAddress - Request IP address
   */
  recordUsage(
    keyId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    ipAddress: string
  ) {
    this.usage.push({
      keyId,
      timestamp: new Date(),
      endpoint,
      method,
      statusCode,
      responseTime,
      ipAddress,
    });

    // Keep only last 10000 usage records
    if (this.usage.length > 10000) {
      this.usage = this.usage.slice(-10000);
    }
  }

  /**
   * Get API key usage
   * @param keyId - Key ID
   * @param limit - Maximum number of records
   * @returns Array of usage records
   */
  getApiKeyUsage(keyId: string, limit: number = 100): ApiKeyUsage[] {
    return this.usage.filter((u) => u.keyId === keyId).slice(-limit);
  }

  /**
   * Get API key statistics
   * @param keyId - Key ID
   * @returns Statistics object
   */
  getApiKeyStatistics(keyId: string) {
    const usage = this.usage.filter((u) => u.keyId === keyId);

    if (usage.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        successRate: 0,
        lastUsed: null,
      };
    }

    const successfulRequests = usage.filter((u) => u.statusCode < 400).length;
    const totalResponseTime = usage.reduce((sum, u) => sum + u.responseTime, 0);

    return {
      totalRequests: usage.length,
      averageResponseTime: Math.round(totalResponseTime / usage.length),
      successRate: Math.round((successfulRequests / usage.length) * 100),
      lastUsed: usage[usage.length - 1].timestamp,
    };
  }

  /**
   * Check rate limit
   * @param keyId - Key ID
   * @returns Remaining requests in current minute
   */
  checkRateLimit(keyId: string): number {
    const apiKey = this.apiKeys.get(keyId);

    if (!apiKey) {
      return 0;
    }

    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);

    const recentUsage = this.usage.filter((u) => u.keyId === keyId && u.timestamp > oneMinuteAgo).length;

    return Math.max(0, apiKey.rateLimit - recentUsage);
  }

  /**
   * Generate secure API key
   * @returns Secure API key
   */
  private generateSecureKey(): string {
    return `fk_${crypto.randomBytes(this.keyLength).toString("hex")}`;
  }

  /**
   * Hash API key
   * @param key - API key
   * @returns Hash
   */
  private hashKey(key: string): string {
    return crypto.createHash("sha256").update(key).digest("hex");
  }

  /**
   * Generate unique ID
   * @returns Unique ID
   */
  private generateId(): string {
    return `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get API key management statistics
   * @returns Statistics object
   */
  getStatistics() {
    const activeKeys = Array.from(this.apiKeys.values()).filter((k) => k.isActive).length;
    const expiredKeys = Array.from(this.apiKeys.values()).filter(
      (k) => k.expiresAt && new Date() > k.expiresAt
    ).length;

    return {
      totalKeys: this.apiKeys.size,
      activeKeys,
      expiredKeys,
      totalUsageRecords: this.usage.length,
    };
  }
}

export const apiKeyManagement = new ApiKeyManagementService();
