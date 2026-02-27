/**
 * WebSocket Fallback Service
 * Provides polling-based real-time updates when WebSocket is unavailable
 * Used as fallback when WebSocket connections fail (error code 1006)
 */

export interface PollingConfig {
  interval?: number; // milliseconds between polls (default: 5000)
  maxAttempts?: number; // max failed attempts before giving up (default: 10)
  timeout?: number; // request timeout in milliseconds (default: 10000)
}

export interface PollMessage {
  type: string;
  data: any;
  timestamp: string;
}

class WebSocketFallbackService {
  private pollingInterval: NodeJS.Timeout | null = null;
  private failedAttempts = 0;
  private maxAttempts: number;
  private pollInterval: number;
  private timeout: number;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private isPolling = false;
  private lastPollTime = 0;

  constructor(config: PollingConfig = {}) {
    this.pollInterval = config.interval || 5000;
    this.maxAttempts = config.maxAttempts || 10;
    this.timeout = config.timeout || 10000;
  }

  /**
   * Start polling for updates
   */
  public startPolling(): void {
    if (this.isPolling) {
      console.warn('Polling already started');
      return;
    }

    console.log('[WebSocket Fallback] Starting polling service...');
    this.isPolling = true;
    this.failedAttempts = 0;

    // Emit fallback mode event
    this.emit('fallback_mode_enabled', {
      message: 'WebSocket unavailable, using polling mode',
      interval: this.pollInterval,
    });

    // Start polling immediately
    this.poll();

    // Set up interval
    this.pollingInterval = setInterval(() => this.poll(), this.pollInterval);
  }

  /**
   * Stop polling
   */
  public stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
    console.log('[WebSocket Fallback] Polling stopped');
  }

  /**
   * Perform a single poll
   */
  private async poll(): Promise<void> {
    try {
      const now = Date.now();
      // Avoid polling too frequently
      if (now - this.lastPollTime < this.pollInterval / 2) {
        return;
      }
      this.lastPollTime = now;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch('/api/trpc/updates.getRealtimeUpdates', {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Reset failed attempts on success
      this.failedAttempts = 0;

      // Process updates
      if (data && Array.isArray(data.result)) {
        data.result.forEach((update: PollMessage) => {
          this.emit(update.type, update.data);
        });
      }
    } catch (error) {
      this.failedAttempts++;
      console.warn(
        `[WebSocket Fallback] Poll attempt ${this.failedAttempts}/${this.maxAttempts} failed:`,
        error
      );

      // Stop polling if too many failures
      if (this.failedAttempts >= this.maxAttempts) {
        console.error(
          '[WebSocket Fallback] Max polling attempts reached, stopping polling'
        );
        this.stopPolling();
        this.emit('fallback_mode_failed', {
          message: 'Polling service failed after multiple attempts',
          attempts: this.failedAttempts,
        });
      }
    }
  }

  /**
   * Register event listener
   */
  public on(eventType: string, callback: (data: any) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
  }

  /**
   * Unregister event listener
   */
  public off(eventType: string, callback: (data: any) => void): void {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType)!.delete(callback);
    }
  }

  /**
   * Emit event to all listeners
   */
  private emit(eventType: string, data: any): void {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType)!.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in listener for event ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Check if polling is active
   */
  public isActive(): boolean {
    return this.isPolling;
  }

  /**
   * Get current status
   */
  public getStatus() {
    return {
      isPolling: this.isPolling,
      failedAttempts: this.failedAttempts,
      maxAttempts: this.maxAttempts,
      pollInterval: this.pollInterval,
    };
  }
}

// Export singleton instance
export const websocketFallback = new WebSocketFallbackService();
