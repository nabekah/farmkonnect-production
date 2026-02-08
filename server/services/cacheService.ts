/**
 * Simple in-memory cache service for search results
 * In production, consider using Redis for distributed caching
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup interval (every 5 minutes)
    this.startCleanupInterval();
  }

  /**
   * Generate cache key from query and filters
   */
  generateKey(query: string, filters?: Record<string, any>, prefix: string = "search"): string {
    const filterStr = filters ? JSON.stringify(filters) : "";
    return `${prefix}:${query}:${filterStr}`;
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set value in cache with TTL (in seconds)
   */
  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expiresAt });
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries matching a pattern
   */
  deletePattern(pattern: string): number {
    let deleted = 0;
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    
    return deleted;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    let validEntries = 0;
    let expiredEntries = 0;
    const now = Date.now();

    for (const entry of this.cache.values()) {
      if (entry.expiresAt > now) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Estimate memory usage (rough estimate)
   */
  private estimateMemoryUsage(): string {
    let bytes = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      bytes += key.length * 2; // UTF-16 encoding
      bytes += JSON.stringify(entry.data).length * 2;
    }

    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  /**
   * Start automatic cleanup interval
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Every 5 minutes

    // Don't keep the process alive just for this interval
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[Cache] Cleaned up ${cleaned} expired entries`);
    }
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton instance
export const cacheService = new CacheService();
