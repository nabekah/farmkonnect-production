/**
 * Request Queue Manager
 * Queues API requests when offline and syncs them when online
 */

export interface QueuedRequest {
  id: string;
  method: string;
  url: string;
  data?: unknown;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

class RequestQueueManager {
  private queue: QueuedRequest[] = [];
  private isProcessing = false;
  private maxQueueSize = 100;

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Add a request to the queue
   */
  addRequest(
    method: string,
    url: string,
    data?: unknown,
    maxRetries = 3
  ): string {
    if (this.queue.length >= this.maxQueueSize) {
      throw new Error('Request queue is full');
    }

    const id = `req-${Date.now()}-${Math.random()}`;
    const request: QueuedRequest = {
      id,
      method,
      url,
      data,
      timestamp: Date.now(),
      retries: 0,
      maxRetries,
    };

    this.queue.push(request);
    this.saveToStorage();

    console.log(`[RequestQueue] Added request: ${method} ${url}`);
    return id;
  }

  /**
   * Get all queued requests
   */
  getQueue(): QueuedRequest[] {
    return [...this.queue];
  }

  /**
   * Remove a request from the queue
   */
  removeRequest(id: string): void {
    this.queue = this.queue.filter((req) => req.id !== id);
    this.saveToStorage();
  }

  /**
   * Clear all queued requests
   */
  clearQueue(): void {
    this.queue = [];
    this.saveToStorage();
  }

  /**
   * Process all queued requests
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`[RequestQueue] Processing ${this.queue.length} queued requests`);

    const failedRequests: QueuedRequest[] = [];

    for (const request of this.queue) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: request.data ? JSON.stringify(request.data) : undefined,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        console.log(`[RequestQueue] Processed: ${request.method} ${request.url}`);
      } catch (error) {
        request.retries++;

        if (request.retries < request.maxRetries) {
          failedRequests.push(request);
          console.warn(
            `[RequestQueue] Failed (retry ${request.retries}/${request.maxRetries}): ${request.method} ${request.url}`,
            error
          );
        } else {
          console.error(
            `[RequestQueue] Failed (max retries exceeded): ${request.method} ${request.url}`,
            error
          );
        }
      }
    }

    // Keep only failed requests in the queue
    this.queue = failedRequests;
    this.saveToStorage();
    this.isProcessing = false;

    console.log(
      `[RequestQueue] Sync complete. ${this.queue.length} requests remaining.`
    );
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Save queue to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem('__farmkonnect_request_queue', JSON.stringify(this.queue));
    } catch (error) {
      console.error('[RequestQueue] Failed to save to storage:', error);
    }
  }

  /**
   * Load queue from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('__farmkonnect_request_queue');
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`[RequestQueue] Loaded ${this.queue.length} requests from storage`);
      }
    } catch (error) {
      console.error('[RequestQueue] Failed to load from storage:', error);
      this.queue = [];
    }
  }
}

// Singleton instance
export const requestQueue = new RequestQueueManager();
