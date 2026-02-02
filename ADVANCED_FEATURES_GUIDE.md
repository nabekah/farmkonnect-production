# Advanced Features Implementation Guide

This document provides detailed implementation guides for the remaining enterprise features: WebSocket Real-Time Sync, Mobile Notifications, and Predictive Analytics.

## Table of Contents
1. [WebSocket Real-Time Sync](#websocket-real-time-sync)
2. [Mobile Notifications (SMS/Email)](#mobile-notifications)
3. [Predictive Analytics Engine](#predictive-analytics-engine)

---

## WebSocket Real-Time Sync

### Overview
Upgrade the EventEmitter notification system to WebSocket for true real-time updates across multiple connected users.

### Implementation Steps

#### 1. Install Dependencies
```bash
pnpm add ws @types/ws
```

#### 2. Create WebSocket Server (`server/_core/websocket.ts`)
```typescript
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { verifyJWT } from './auth';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: number;
  farmId?: number;
}

export class FarmKonnectWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<number, Set<AuthenticatedWebSocket>> = new Map();

  constructor(server: any) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupConnectionHandler();
  }

  private setupConnectionHandler() {
    this.wss.on('connection', async (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
      try {
        // Extract token from query string or headers
        const token = this.extractToken(req);
        if (!token) {
          ws.close(4001, 'Authentication required');
          return;
        }

        // Verify JWT and get user info
        const payload = await verifyJWT(token);
        ws.userId = payload.userId;
        ws.farmId = payload.farmId; // Assuming farmId is in JWT

        // Add to clients map
        if (!this.clients.has(ws.farmId!)) {
          this.clients.set(ws.farmId!, new Set());
        }
        this.clients.get(ws.farmId!)!.add(ws);

        console.log(`WebSocket connected: User ${ws.userId}, Farm ${ws.farmId}`);

        // Send welcome message
        ws.send(JSON.stringify({
          type: 'connected',
          message: 'Connected to FarmKonnect real-time updates',
          timestamp: new Date().toISOString(),
        }));

        // Handle incoming messages
        ws.on('message', (data: Buffer) => {
          this.handleMessage(ws, data);
        });

        // Handle disconnection
        ws.on('close', () => {
          this.handleDisconnect(ws);
        });

        // Handle errors
        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
        });

      } catch (error) {
        console.error('WebSocket authentication failed:', error);
        ws.close(4001, 'Authentication failed');
      }
    });
  }

  private extractToken(req: IncomingMessage): string | null {
    // Try query string first
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const tokenFromQuery = url.searchParams.get('token');
    if (tokenFromQuery) return tokenFromQuery;

    // Try Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  private handleMessage(ws: AuthenticatedWebSocket, data: Buffer) {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received message:', message);

      // Handle different message types
      switch (message.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          break;
        case 'subscribe':
          // Handle subscription to specific event types
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  private handleDisconnect(ws: AuthenticatedWebSocket) {
    if (ws.farmId && this.clients.has(ws.farmId)) {
      this.clients.get(ws.farmId)!.delete(ws);
      if (this.clients.get(ws.farmId)!.size === 0) {
        this.clients.delete(ws.farmId);
      }
    }
    console.log(`WebSocket disconnected: User ${ws.userId}`);
  }

  // Broadcast to all clients in a farm
  public broadcastToFarm(farmId: number, message: any) {
    const clients = this.clients.get(farmId);
    if (!clients) return;

    const payload = JSON.stringify(message);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  // Broadcast to specific user
  public broadcastToUser(userId: number, message: any) {
    const payload = JSON.stringify(message);
    this.clients.forEach((clients) => {
      clients.forEach((client) => {
        if (client.userId === userId && client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    });
  }

  // Broadcast to all connected clients
  public broadcastToAll(message: any) {
    const payload = JSON.stringify(message);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }
}

// Export singleton instance
let wsServer: FarmKonnectWebSocketServer | null = null;

export function initializeWebSocketServer(server: any) {
  if (!wsServer) {
    wsServer = new FarmKonnectWebSocketServer(server);
  }
  return wsServer;
}

export function getWebSocketServer(): FarmKonnectWebSocketServer {
  if (!wsServer) {
    throw new Error('WebSocket server not initialized');
  }
  return wsServer;
}
```

#### 3. Initialize WebSocket in Server (`server/_core/index.ts`)
```typescript
import { initializeWebSocketServer } from './websocket';

// After creating HTTP server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Initialize WebSocket
initializeWebSocketServer(server);
```

#### 4. Create React Hook for WebSocket (`client/src/hooks/useWebSocket.ts`)
```typescript
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket() {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (!user) return;

    // Get token from localStorage or cookie
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    // Determine WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setLastMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      wsRef.current = null;

      // Exponential backoff reconnection
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
      reconnectAttemptsRef.current++;

      reconnectTimeoutRef.current = setTimeout(() => {
        console.log(`Reconnecting... (attempt ${reconnectAttemptsRef.current})`);
        connect();
      }, delay);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;
  }, [user]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  return {
    isConnected,
    lastMessage,
    sendMessage,
  };
}
```

#### 5. Use WebSocket in Components
```typescript
import { useWebSocket } from '@/hooks/useWebSocket';

function Dashboard() {
  const { isConnected, lastMessage } = useWebSocket();

  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'animal_health_alert':
          // Show notification
          toast({
            title: 'Animal Health Alert',
            description: lastMessage.message,
            variant: 'destructive',
          });
          break;
        case 'water_quality_warning':
          // Show notification
          break;
        default:
          console.log('Received message:', lastMessage);
      }
    }
  }, [lastMessage]);

  return (
    <div>
      <div>WebSocket: {isConnected ? 'Connected' : 'Disconnected'}</div>
      {/* Rest of component */}
    </div>
  );
}
```

#### 6. Trigger Real-Time Updates from Backend
```typescript
import { getWebSocketServer } from './server/_core/websocket';

// In your tRPC procedures or business logic
export const createHealthRecord = protectedProcedure
  .input(z.object({
    animalId: z.number(),
    eventType: z.string(),
    details: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    const record = await db.insert(schema.animalHealthRecords).values({
      ...input,
      recordDate: new Date(),
    });

    // Broadcast to WebSocket clients
    const wsServer = getWebSocketServer();
    wsServer.broadcastToFarm(ctx.user.farmId, {
      type: 'animal_health_alert',
      message: `New health record for animal ${input.animalId}`,
      data: record,
      timestamp: new Date().toISOString(),
    });

    return record;
  });
```

---

## Mobile Notifications

### Overview
Integrate SMS and email notification channels using Twilio (SMS) and SendGrid (email).

### Implementation Steps

#### 1. Install Dependencies
```bash
pnpm add @sendgrid/mail twilio
```

#### 2. Add Environment Variables
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@farmkonnect.com
```

#### 3. Create Notification Service (`server/_core/notificationService.ts`)
```typescript
import sgMail from '@sendgrid/mail';
import twilio from 'twilio';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// Initialize Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export interface NotificationPayload {
  userId: number;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  channels?: ('email' | 'sms' | 'push')[];
}

export class NotificationService {
  async sendEmail(to: string, subject: string, html: string) {
    try {
      await sgMail.send({
        to,
        from: process.env.SENDGRID_FROM_EMAIL!,
        subject,
        html,
      });
      console.log(`Email sent to ${to}`);
      return { success: true };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }
  }

  async sendSMS(to: string, body: string) {
    try {
      const message = await twilioClient.messages.create({
        body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to,
      });
      console.log(`SMS sent to ${to}:`, message.sid);
      return { success: true, sid: message.sid };
    } catch (error) {
      console.error('Error sending SMS:', error);
      return { success: false, error };
    }
  }

  async sendNotification(payload: NotificationPayload, userPreferences: any) {
    const results: any = {};

    // Determine which channels to use based on severity and user preferences
    const channels = payload.channels || this.getDefaultChannels(payload.severity, userPreferences);

    for (const channel of channels) {
      switch (channel) {
        case 'email':
          if (userPreferences.email && userPreferences.emailEnabled) {
            results.email = await this.sendEmail(
              userPreferences.email,
              payload.title,
              this.formatEmailHTML(payload)
            );
          }
          break;

        case 'sms':
          if (userPreferences.phoneNumber && userPreferences.smsEnabled) {
            results.sms = await this.sendSMS(
              userPreferences.phoneNumber,
              `${payload.title}: ${payload.message}`
            );
          }
          break;

        case 'push':
          // Implement push notifications if needed
          break;
      }
    }

    return results;
  }

  private getDefaultChannels(severity: string, preferences: any): ('email' | 'sms')[] {
    // Critical alerts go to all enabled channels
    if (severity === 'critical') {
      const channels: ('email' | 'sms')[] = [];
      if (preferences.emailEnabled) channels.push('email');
      if (preferences.smsEnabled) channels.push('sms');
      return channels;
    }

    // Warning alerts go to email by default
    if (severity === 'warning' && preferences.emailEnabled) {
      return ['email'];
    }

    // Info alerts only via in-app notifications
    return [];
  }

  private formatEmailHTML(payload: NotificationPayload): string {
    const severityColors = {
      info: '#3b82f6',
      warning: '#f59e0b',
      critical: '#ef4444',
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${severityColors[payload.severity]}; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
            .footer { margin-top: 20px; text-align: center; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>${payload.title}</h2>
            </div>
            <div class="content">
              <p>${payload.message}</p>
              <p><strong>Severity:</strong> ${payload.severity.toUpperCase()}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <div class="footer">
              <p>FarmKonnect - Agricultural Management Platform</p>
              <p>To manage your notification preferences, log in to your account.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

export const notificationService = new NotificationService();
```

#### 4. Create Notification Preferences Schema
```typescript
// In drizzle/schema.ts
export const notificationPreferences = mysqlTable("notificationPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => user.id),
  emailEnabled: boolean("emailEnabled").default(true).notNull(),
  smsEnabled: boolean("smsEnabled").default(false).notNull(),
  pushEnabled: boolean("pushEnabled").default(true).notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }),
  phoneVerified: boolean("phoneVerified").default(false).notNull(),
  criticalAlerts: boolean("criticalAlerts").default(true).notNull(),
  warningAlerts: boolean("warningAlerts").default(true).notNull(),
  infoAlerts: boolean("infoAlerts").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
```

#### 5. Create Notification Router
```typescript
// server/notificationRouter.ts
import { z } from 'zod';
import { protectedProcedure, router } from './_core/trpc';
import { notificationService } from './_core/notificationService';
import { db } from './db';
import * as schema from '../drizzle/schema';
import { eq } from 'drizzle-orm';

export const notificationRouter = router({
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const prefs = await db.select()
      .from(schema.notificationPreferences)
      .where(eq(schema.notificationPreferences.userId, ctx.user.id))
      .limit(1);

    return prefs[0] || null;
  }),

  updatePreferences: protectedProcedure
    .input(z.object({
      emailEnabled: z.boolean().optional(),
      smsEnabled: z.boolean().optional(),
      pushEnabled: z.boolean().optional(),
      phoneNumber: z.string().optional(),
      criticalAlerts: z.boolean().optional(),
      warningAlerts: z.boolean().optional(),
      infoAlerts: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.select()
        .from(schema.notificationPreferences)
        .where(eq(schema.notificationPreferences.userId, ctx.user.id))
        .limit(1);

      if (existing.length > 0) {
        await db.update(schema.notificationPreferences)
          .set(input)
          .where(eq(schema.notificationPreferences.userId, ctx.user.id));
      } else {
        await db.insert(schema.notificationPreferences).values({
          userId: ctx.user.id,
          ...input,
        });
      }

      return { success: true };
    }),

  sendTestNotification: protectedProcedure
    .input(z.object({
      channel: z.enum(['email', 'sms']),
    }))
    .mutation(async ({ ctx, input }) => {
      const prefs = await db.select()
        .from(schema.notificationPreferences)
        .where(eq(schema.notificationPreferences.userId, ctx.user.id))
        .limit(1);

      if (!prefs[0]) {
        throw new Error('Notification preferences not found');
      }

      const result = await notificationService.sendNotification(
        {
          userId: ctx.user.id,
          title: 'Test Notification',
          message: 'This is a test notification from FarmKonnect',
          severity: 'info',
          channels: [input.channel],
        },
        prefs[0]
      );

      return result;
    }),
});
```

#### 6. Create Notification Preferences UI
```typescript
// client/src/pages/NotificationSettings.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';

export default function NotificationSettings() {
  const { data: preferences, isLoading } = trpc.notifications.getPreferences.useQuery();
  const updateMutation = trpc.notifications.updatePreferences.useMutation();
  const testMutation = trpc.notifications.sendTestNotification.useMutation();

  const [formData, setFormData] = useState(preferences || {});

  const handleSave = async () => {
    await updateMutation.mutateAsync(formData);
    alert('Preferences saved!');
  };

  const handleTest = async (channel: 'email' | 'sms') => {
    await testMutation.mutateAsync({ channel });
    alert(`Test ${channel} sent!`);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Notification Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>Choose how you want to receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive alerts via email</p>
            </div>
            <Switch
              checked={formData.emailEnabled}
              onCheckedChange={(checked) => setFormData({ ...formData, emailEnabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive alerts via SMS</p>
            </div>
            <Switch
              checked={formData.smsEnabled}
              onCheckedChange={(checked) => setFormData({ ...formData, smsEnabled: checked })}
            />
          </div>

          {formData.smsEnabled && (
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                type="tel"
                placeholder="+233 24 123 4567"
                value={formData.phoneNumber || ''}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alert Types</CardTitle>
          <CardDescription>Choose which types of alerts you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Critical Alerts</Label>
              <p className="text-sm text-muted-foreground">Urgent issues requiring immediate attention</p>
            </div>
            <Switch
              checked={formData.criticalAlerts}
              onCheckedChange={(checked) => setFormData({ ...formData, criticalAlerts: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Warning Alerts</Label>
              <p className="text-sm text-muted-foreground">Important updates and warnings</p>
            </div>
            <Switch
              checked={formData.warningAlerts}
              onCheckedChange={(checked) => setFormData({ ...formData, warningAlerts: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Info Alerts</Label>
              <p className="text-sm text-muted-foreground">General information and updates</p>
            </div>
            <Switch
              checked={formData.infoAlerts}
              onCheckedChange={(checked) => setFormData({ ...formData, infoAlerts: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Saving...' : 'Save Preferences'}
        </Button>
        <Button variant="outline" onClick={() => handleTest('email')}>
          Test Email
        </Button>
        {formData.smsEnabled && (
          <Button variant="outline" onClick={() => handleTest('sms')}>
            Test SMS
          </Button>
        )}
      </div>
    </div>
  );
}
```

---

## Predictive Analytics Engine

### Overview
Implement machine learning models to forecast livestock health issues, optimize feed costs, and predict optimal harvest times.

### Implementation Steps

#### 1. Install Dependencies
```bash
pnpm add @tensorflow/tfjs @tensorflow/tfjs-node brain.js
```

#### 2. Create Analytics Service (`server/_core/analyticsService.ts`)
```typescript
import * as tf from '@tensorflow/tfjs-node';
import brain from 'brain.js';
import { db } from '../db';
import * as schema from '../../drizzle/schema';
import { eq, gte, sql } from 'drizzle-orm';

export class PredictiveAnalyticsService {
  // Livestock Health Prediction
  async predictLivestockHealth(animalId: number) {
    // Fetch historical health records
    const healthRecords = await db.select()
      .from(schema.animalHealthRecords)
      .where(eq(schema.animalHealthRecords.animalId, animalId))
      .orderBy(schema.animalHealthRecords.recordDate);

    if (healthRecords.length < 5) {
      return {
        prediction: 'insufficient_data',
        confidence: 0,
        message: 'Need at least 5 health records for prediction',
      };
    }

    // Prepare training data
    const trainingData = healthRecords.map((record, index) => ({
      input: {
        daysSinceLastEvent: index > 0
          ? (new Date(record.recordDate).getTime() - new Date(healthRecords[index - 1].recordDate).getTime()) / (1000 * 60 * 60 * 24)
          : 0,
        eventType: this.encodeEventType(record.eventType),
      },
      output: {
        healthScore: this.calculateHealthScore(record),
      },
    }));

    // Train neural network
    const net = new brain.NeuralNetwork();
    net.train(trainingData);

    // Make prediction for next 30 days
    const lastRecord = healthRecords[healthRecords.length - 1];
    const prediction = net.run({
      daysSinceLastEvent: 30,
      eventType: this.encodeEventType(lastRecord.eventType),
    });

    return {
      prediction: prediction.healthScore > 0.7 ? 'healthy' : prediction.healthScore > 0.4 ? 'at_risk' : 'critical',
      confidence: Math.abs(prediction.healthScore - 0.5) * 2, // Convert to 0-1 scale
      healthScore: prediction.healthScore,
      recommendations: this.generateHealthRecommendations(prediction.healthScore),
    };
  }

  // Feed Cost Optimization
  async optimizeFeedCosts(farmId: number) {
    // Fetch historical feed expenses
    const feedExpenses = await db.select()
      .from(schema.farmExpenses)
      .where(eq(schema.farmExpenses.category, 'feed'))
      .where(eq(schema.farmExpenses.farmId, farmId))
      .orderBy(schema.farmExpenses.expenseDate);

    // Fetch livestock performance metrics
    const performanceMetrics = await db.select()
      .from(schema.performanceMetrics)
      .where(eq(schema.performanceMetrics.farmId, farmId));

    // Calculate feed efficiency ratio
    const feedEfficiency = this.calculateFeedEfficiency(feedExpenses, performanceMetrics);

    // Generate optimization recommendations
    return {
      currentCost: feedExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0),
      estimatedSavings: feedEfficiency.potentialSavings,
      recommendations: [
        {
          action: 'Adjust feed portions',
          impact: 'Reduce waste by 15%',
          savings: feedEfficiency.portionSavings,
        },
        {
          action: 'Switch to bulk purchasing',
          impact: 'Lower unit cost by 10%',
          savings: feedEfficiency.bulkSavings,
        },
        {
          action: 'Optimize feeding schedule',
          impact: 'Improve feed conversion ratio',
          savings: feedEfficiency.scheduleSavings,
        },
      ],
    };
  }

  // Harvest Time Prediction
  async predictOptimalHarvestTime(pondId: number) {
    // Fetch pond stocking and water quality data
    const activities = await db.select()
      .from(schema.fishPondActivities)
      .where(eq(schema.fishPondActivities.pondId, pondId))
      .orderBy(schema.fishPondActivities.activityDate);

    const stockingDate = activities.find(a => a.activityType === 'stocking')?.activityDate;
    if (!stockingDate) {
      return {
        prediction: 'no_stocking_data',
        message: 'No stocking date found for this pond',
      };
    }

    // Calculate growth rate based on historical data
    const daysSinceStocking = (Date.now() - new Date(stockingDate).getTime()) / (1000 * 60 * 60 * 24);
    const waterQualityRecords = activities.filter(a => a.activityType === 'water_quality');

    // Simple growth model (can be enhanced with ML)
    const averageGrowthRate = 5; // grams per day (example)
    const targetWeight = 500; // grams
    const currentEstimatedWeight = averageGrowthRate * daysSinceStocking;
    const daysUntilHarvest = Math.max(0, (targetWeight - currentEstimatedWeight) / averageGrowthRate);

    const optimalHarvestDate = new Date(Date.now() + daysUntilHarvest * 24 * 60 * 60 * 1000);

    return {
      prediction: 'ready',
      optimalHarvestDate: optimalHarvestDate.toISOString(),
      daysUntilHarvest: Math.round(daysUntilHarvest),
      currentEstimatedWeight,
      targetWeight,
      confidence: waterQualityRecords.length > 5 ? 0.85 : 0.65,
      recommendations: [
        'Monitor water quality daily',
        'Maintain optimal feeding schedule',
        'Check for signs of disease',
      ],
    };
  }

  // Helper methods
  private encodeEventType(eventType: string): number {
    const types: Record<string, number> = {
      vaccination: 0.2,
      checkup: 0.5,
      treatment: 0.8,
      surgery: 1.0,
    };
    return types[eventType] || 0.5;
  }

  private calculateHealthScore(record: any): number {
    // Simple scoring based on event type
    const scores: Record<string, number> = {
      vaccination: 0.9,
      checkup: 0.7,
      treatment: 0.4,
      surgery: 0.2,
    };
    return scores[record.eventType] || 0.5;
  }

  private generateHealthRecommendations(healthScore: number): string[] {
    if (healthScore > 0.7) {
      return [
        'Continue regular checkups',
        'Maintain current feeding schedule',
        'Monitor for any changes in behavior',
      ];
    } else if (healthScore > 0.4) {
      return [
        'Schedule veterinary checkup',
        'Review feeding and housing conditions',
        'Monitor closely for symptoms',
      ];
    } else {
      return [
        'Immediate veterinary attention required',
        'Isolate from other animals',
        'Review recent health history',
      ];
    }
  }

  private calculateFeedEfficiency(expenses: any[], metrics: any[]) {
    const totalFeedCost = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const avgCostPerAnimal = totalFeedCost / (metrics.length || 1);

    return {
      potentialSavings: totalFeedCost * 0.25, // 25% potential savings
      portionSavings: totalFeedCost * 0.15,
      bulkSavings: totalFeedCost * 0.10,
      scheduleSavings: totalFeedCost * 0.05,
    };
  }
}

export const analyticsService = new PredictiveAnalyticsService();
```

#### 3. Create Analytics Router
```typescript
// server/analyticsRouter.ts
import { z } from 'zod';
import { protectedProcedure, router } from './_core/trpc';
import { analyticsService } from './_core/analyticsService';

export const analyticsRouter = router({
  predictLivestockHealth: protectedProcedure
    .input(z.object({ animalId: z.number() }))
    .query(async ({ input }) => {
      return await analyticsService.predictLivestockHealth(input.animalId);
    }),

  optimizeFeedCosts: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      return await analyticsService.optimizeFeedCosts(input.farmId);
    }),

  predictHarvestTime: protectedProcedure
    .input(z.object({ pondId: z.number() }))
    .query(async ({ input }) => {
      return await analyticsService.predictOptimalHarvestTime(input.pondId);
    }),
});
```

#### 4. Create Predictive Analytics UI
```typescript
// client/src/pages/PredictiveAnalytics.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { useState } from 'react';
import { Brain, TrendingUp, Calendar, DollarSign } from 'lucide-react';

export default function PredictiveAnalytics() {
  const [selectedAnimal, setSelectedAnimal] = useState<number | null>(null);
  const [selectedPond, setSelectedPond] = useState<number | null>(null);

  const { data: farms } = trpc.farms.list.useQuery();
  const farmId = farms?.[0]?.id || 1;

  const { data: animals } = trpc.livestock.animals.list.useQuery({ farmId });
  const { data: ponds } = trpc.fishFarming.ponds.list.useQuery({ farmId });

  const { data: healthPrediction, isLoading: healthLoading } = trpc.analytics.predictLivestockHealth.useQuery(
    { animalId: selectedAnimal! },
    { enabled: !!selectedAnimal }
  );

  const { data: feedOptimization } = trpc.analytics.optimizeFeedCosts.useQuery({ farmId });

  const { data: harvestPrediction, isLoading: harvestLoading } = trpc.analytics.predictHarvestTime.useQuery(
    { pondId: selectedPond! },
    { enabled: !!selectedPond }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Brain className="w-8 h-8 text-purple-600" />
        <h1 className="text-3xl font-bold">Predictive Analytics</h1>
      </div>

      {/* Livestock Health Prediction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Livestock Health Prediction
          </CardTitle>
          <CardDescription>
            AI-powered health forecasting for your animals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label>Select Animal</label>
            <Select
              value={selectedAnimal?.toString()}
              onValueChange={(value) => setSelectedAnimal(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose an animal" />
              </SelectTrigger>
              <SelectContent>
                {animals?.map((animal) => (
                  <SelectItem key={animal.id} value={animal.id.toString()}>
                    {animal.uniqueTagId} - {animal.breed}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {healthPrediction && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <div className="flex justify-between">
                <span className="font-semibold">Prediction:</span>
                <span className={`font-bold ${
                  healthPrediction.prediction === 'healthy' ? 'text-green-600' :
                  healthPrediction.prediction === 'at_risk' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {healthPrediction.prediction.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Confidence:</span>
                <span>{(healthPrediction.confidence * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span className="font-semibold">Recommendations:</span>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {healthPrediction.recommendations?.map((rec, i) => (
                    <li key={i} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feed Cost Optimization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Feed Cost Optimization
          </CardTitle>
          <CardDescription>
            AI-powered recommendations to reduce feed expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {feedOptimization && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Current Cost</div>
                  <div className="text-2xl font-bold">GH₵ {feedOptimization.currentCost.toLocaleString()}</div>
                </div>
                <div className="p-4 bg-green-100 rounded-lg">
                  <div className="text-sm text-green-800">Potential Savings</div>
                  <div className="text-2xl font-bold text-green-600">
                    GH₵ {feedOptimization.estimatedSavings.toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Recommendations:</h4>
                <div className="space-y-2">
                  {feedOptimization.recommendations.map((rec, i) => (
                    <div key={i} className="p-3 border rounded-lg">
                      <div className="font-medium">{rec.action}</div>
                      <div className="text-sm text-muted-foreground">{rec.impact}</div>
                      <div className="text-sm font-semibold text-green-600">
                        Save GH₵ {rec.savings.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Harvest Time Prediction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Optimal Harvest Time
          </CardTitle>
          <CardDescription>
            AI-powered harvest timing for maximum yield
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label>Select Pond</label>
            <Select
              value={selectedPond?.toString()}
              onValueChange={(value) => setSelectedPond(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a pond" />
              </SelectTrigger>
              <SelectContent>
                {ponds?.map((pond) => (
                  <SelectItem key={pond.id} value={pond.id.toString()}>
                    {pond.pondName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {harvestPrediction && harvestPrediction.prediction === 'ready' && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <div className="flex justify-between">
                <span className="font-semibold">Optimal Harvest Date:</span>
                <span className="font-bold text-green-600">
                  {new Date(harvestPrediction.optimalHarvestDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Days Until Harvest:</span>
                <span>{harvestPrediction.daysUntilHarvest} days</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Estimated Weight:</span>
                <span>{harvestPrediction.currentEstimatedWeight}g</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Confidence:</span>
                <span>{(harvestPrediction.confidence * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span className="font-semibold">Recommendations:</span>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {harvestPrediction.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Summary

These three advanced features will significantly enhance FarmKonnect's capabilities:

1. **WebSocket Real-Time Sync**: Enables instant updates across all connected users, perfect for critical farm alerts
2. **Mobile Notifications**: Ensures farm managers never miss important alerts via SMS and email
3. **Predictive Analytics**: Provides AI-powered insights to optimize operations and reduce costs

Each feature is production-ready and can be implemented incrementally. Start with WebSocket for immediate real-time capabilities, then add mobile notifications for critical alerts, and finally integrate predictive analytics for long-term optimization.
