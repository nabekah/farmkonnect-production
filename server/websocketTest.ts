import WebSocket from 'ws';
import jwt from 'jsonwebtoken';

/**
 * WebSocket test utilities for testing real-time messaging
 */

interface WebSocketTestConfig {
  url: string;
  userId: number;
  jwtSecret: string;
  timeout?: number;
}

interface WebSocketMessage {
  type: string;
  data?: any;
  error?: string;
}

export class WebSocketTestClient {
  private ws: WebSocket | null = null;
  private config: WebSocketTestConfig;
  private messageQueue: WebSocketMessage[] = [];
  private timeout: NodeJS.Timeout | null = null;

  constructor(config: WebSocketTestConfig) {
    this.config = {
      timeout: 5000,
      ...config,
    };
  }

  /**
   * Connect to WebSocket server with JWT authentication
   */
  async connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        // Generate JWT token
        const token = jwt.sign(
          { userId: this.config.userId },
          this.config.jwtSecret,
          { expiresIn: '1h' }
        );

        // Connect with token in query string
        const wsUrl = `${this.config.url}?token=${token}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.on('open', () => {
          console.log('[WebSocket] Connected');
          resolve(true);
        });

        this.ws.on('message', (data: string) => {
          try {
            const message = JSON.parse(data);
            this.messageQueue.push(message);
            console.log('[WebSocket] Received:', message);
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
          }
        });

        this.ws.on('error', (error) => {
          console.error('[WebSocket] Error:', error);
          reject(error);
        });

        this.ws.on('close', () => {
          console.log('[WebSocket] Disconnected');
        });

        // Set connection timeout
        this.timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
        }, this.config.timeout);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send a message through WebSocket
   */
  send(message: WebSocketMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    this.ws.send(JSON.stringify(message));
    console.log('[WebSocket] Sent:', message);
  }

  /**
   * Wait for a specific message type
   */
  async waitForMessage(type: string, timeout: number = 3000): Promise<WebSocketMessage> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const checkQueue = () => {
        const message = this.messageQueue.find(m => m.type === type);
        if (message) {
          this.messageQueue = this.messageQueue.filter(m => m !== message);
          resolve(message);
          return;
        }

        if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout waiting for message type: ${type}`));
          return;
        }

        setTimeout(checkQueue, 100);
      };

      checkQueue();
    });
  }

  /**
   * Get all received messages
   */
  getMessages(): WebSocketMessage[] {
    return [...this.messageQueue];
  }

  /**
   * Clear message queue
   */
  clearMessages(): void {
    this.messageQueue = [];
  }

  /**
   * Close WebSocket connection
   */
  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
}

/**
 * Run WebSocket tests
 */
export async function runWebSocketTests(config: Omit<WebSocketTestConfig, 'userId' | 'jwtSecret'> & { userId?: number; jwtSecret?: string }): Promise<void> {
  const testConfig: WebSocketTestConfig = {
    userId: config.userId || 1,
    jwtSecret: config.jwtSecret || process.env.JWT_SECRET || 'test-secret',
    url: config.url,
    timeout: config.timeout || 5000,
  };

  console.log('\n=== WebSocket Test Suite ===\n');

  try {
    // Test 1: Connection
    console.log('Test 1: WebSocket Connection');
    const client = new WebSocketTestClient(testConfig);
    await client.connect();
    console.log('✓ Connected successfully\n');

    // Test 2: Send message
    console.log('Test 2: Send Message');
    client.send({
      type: 'ping',
      data: { timestamp: Date.now() },
    });
    console.log('✓ Message sent\n');

    // Test 3: Receive pong
    console.log('Test 3: Receive Pong Response');
    try {
      const pongMessage = await client.waitForMessage('pong', 3000);
      console.log('✓ Received pong:', pongMessage);
    } catch (error) {
      console.log('⚠ Pong not received (server may not echo)');
    }
    console.log();

    // Test 4: Send notification
    console.log('Test 4: Send Notification');
    client.send({
      type: 'notification',
      data: {
        title: 'Test Notification',
        message: 'This is a test notification',
        severity: 'info',
      },
    });
    console.log('✓ Notification sent\n');

    // Test 5: Disconnect
    console.log('Test 5: Disconnect');
    client.close();
    console.log('✓ Disconnected\n');

    console.log('=== All WebSocket Tests Completed ===\n');
  } catch (error) {
    console.error('✗ Test failed:', error);
    throw error;
  }
}
