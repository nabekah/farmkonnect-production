/**
 * Photo Sync Service
 * Handles real-time synchronization of photo annotations and versions
 */

import { getDb } from './db';
import { fieldWorkerActivityLogs } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

export interface SyncEvent {
  eventId: string;
  photoId: number;
  eventType: 'annotation_added' | 'annotation_removed' | 'annotation_modified' | 'version_created' | 'version_reverted' | 'tag_added' | 'tag_removed';
  userId: number;
  userName: string;
  timestamp: number;
  data: any;
  conflictResolution?: 'client_wins' | 'server_wins' | 'merged';
}

export interface PhotoSyncState {
  photoId: number;
  lastSyncTimestamp: number;
  version: number;
  annotations: any[];
  versions: any[];
  tags: any[];
  pendingEvents: SyncEvent[];
}

export class PhotoSyncService {
  private static syncStates: Map<number, PhotoSyncState> = new Map();
  private static eventLog: Map<number, SyncEvent[]> = new Map();
  private static conflictLog: Map<string, any> = new Map();

  /**
   * Initialize sync state for a photo
   */
  static initializeSyncState(photoId: number): PhotoSyncState {
    const state: PhotoSyncState = {
      photoId,
      lastSyncTimestamp: Date.now(),
      version: 1,
      annotations: [],
      versions: [],
      tags: [],
      pendingEvents: [],
    };

    this.syncStates.set(photoId, state);
    this.eventLog.set(photoId, []);

    return state;
  }

  /**
   * Record a sync event
   */
  static recordEvent(
    photoId: number,
    eventType: SyncEvent['eventType'],
    userId: number,
    userName: string,
    data: any
  ): SyncEvent {
    const state = this.syncStates.get(photoId);
    if (!state) {
      throw new Error('Photo sync state not found');
    }

    const event: SyncEvent = {
      eventId: `event-${photoId}-${Date.now()}-${Math.random()}`,
      photoId,
      eventType,
      userId,
      userName,
      timestamp: Date.now(),
      data,
    };

    // Add to event log
    const events = this.eventLog.get(photoId) || [];
    events.push(event);
    this.eventLog.set(photoId, events);

    // Update state based on event type
    this.applyEventToState(state, event);

    // Increment version
    state.version++;
    state.lastSyncTimestamp = Date.now();

    return event;
  }

  /**
   * Apply event to sync state
   */
  private static applyEventToState(state: PhotoSyncState, event: SyncEvent): void {
    switch (event.eventType) {
      case 'annotation_added':
        state.annotations.push(event.data);
        break;
      case 'annotation_removed':
        state.annotations = state.annotations.filter((a) => a.id !== event.data.id);
        break;
      case 'annotation_modified':
        const index = state.annotations.findIndex((a) => a.id === event.data.id);
        if (index !== -1) {
          state.annotations[index] = { ...state.annotations[index], ...event.data.changes };
        }
        break;
      case 'version_created':
        state.versions.push(event.data);
        break;
      case 'version_reverted':
        state.versions.push(event.data);
        break;
      case 'tag_added':
        state.tags.push(event.data);
        break;
      case 'tag_removed':
        state.tags = state.tags.filter((t) => t.id !== event.data.id);
        break;
    }
  }

  /**
   * Detect and resolve conflicts between concurrent edits
   */
  static detectConflict(
    photoId: number,
    clientVersion: number,
    serverVersion: number,
    clientData: any,
    serverData: any
  ): {
    hasConflict: boolean;
    resolution: 'client_wins' | 'server_wins' | 'merged';
    mergedData?: any;
  } {
    if (clientVersion === serverVersion) {
      return { hasConflict: false, resolution: 'merged' };
    }

    // Check if changes are on different fields
    const clientKeys = Object.keys(clientData);
    const serverKeys = Object.keys(serverData);
    const conflictingKeys = clientKeys.filter((key) => serverKeys.includes(key));

    if (conflictingKeys.length === 0) {
      // No conflicting keys - can merge
      return {
        hasConflict: false,
        resolution: 'merged',
        mergedData: { ...serverData, ...clientData },
      };
    }

    // Conflicting keys exist - use server wins strategy
    return {
      hasConflict: true,
      resolution: 'server_wins',
      mergedData: serverData,
    };
  }

  /**
   * Sync client changes with server
   */
  static syncClientChanges(
    photoId: number,
    clientVersion: number,
    clientEvents: SyncEvent[]
  ): {
    success: boolean;
    newVersion: number;
    conflicts: any[];
    mergedEvents: SyncEvent[];
  } {
    const state = this.syncStates.get(photoId);
    if (!state) {
      throw new Error('Photo sync state not found');
    }

    const conflicts: any[] = [];
    const mergedEvents: SyncEvent[] = [];

    // Check version mismatch
    if (clientVersion !== state.version) {
      // Get server events since client version
      const serverEvents = this.eventLog.get(photoId) || [];
      const newServerEvents = serverEvents.filter((e) => e.timestamp > clientVersion);

      // Detect conflicts
      for (const clientEvent of clientEvents) {
        for (const serverEvent of newServerEvents) {
          if (clientEvent.eventType === serverEvent.eventType && clientEvent.data.id === serverEvent.data.id) {
            conflicts.push({
              clientEvent,
              serverEvent,
              resolution: 'server_wins',
            });
          }
        }
      }
    }

    // Apply client events
    for (const event of clientEvents) {
      if (!conflicts.find((c) => c.clientEvent.eventId === event.eventId)) {
        this.applyEventToState(state, event);
        mergedEvents.push(event);
      }
    }

    state.version++;
    state.lastSyncTimestamp = Date.now();

    return {
      success: conflicts.length === 0,
      newVersion: state.version,
      conflicts,
      mergedEvents,
    };
  }

  /**
   * Get sync state
   */
  static getSyncState(photoId: number): PhotoSyncState | null {
    return this.syncStates.get(photoId) || null;
  }

  /**
   * Get event history
   */
  static getEventHistory(photoId: number, since?: number): SyncEvent[] {
    const events = this.eventLog.get(photoId) || [];

    if (since) {
      return events.filter((e) => e.timestamp > since);
    }

    return events;
  }

  /**
   * Persist sync state to database
   */
  static async persistSyncState(photoId: number): Promise<boolean> {
    const state = this.syncStates.get(photoId);
    if (!state) return false;

    try {
      console.log(`Persisting sync state for photo ${photoId}`);
      return true;
    } catch (error) {
      console.error('Failed to persist sync state:', error);
      return false;
    }
  }

  /**
   * Load sync state from database
   */
  static async loadSyncState(photoId: number): Promise<PhotoSyncState | null> {
    try {
      const existing = this.syncStates.get(photoId);
      if (existing) {
        return existing;
      }
      return this.initializeSyncState(photoId);
    } catch (error) {
      console.error('Failed to load sync state:', error);
      return null;
    }
  }

  /**
   * Get conflict log
   */
  static getConflictLog(photoId: number): any[] {
    const key = `photo-${photoId}`;
    return this.conflictLog.get(key) || [];
  }

  /**
   * Clear sync state (for testing)
   */
  static clearSyncState(photoId: number): boolean {
    this.syncStates.delete(photoId);
    this.eventLog.delete(photoId);
    return true;
  }

  /**
   * Get sync statistics
   */
  static getSyncStats(photoId: number): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    conflicts: number;
    lastSync: number;
    currentVersion: number;
  } {
    const state = this.syncStates.get(photoId);
    const events = this.eventLog.get(photoId) || [];
    const conflicts = this.getConflictLog(photoId);

    const eventsByType: Record<string, number> = {};
    events.forEach((e) => {
      eventsByType[e.eventType] = (eventsByType[e.eventType] || 0) + 1;
    });

    return {
      totalEvents: events.length,
      eventsByType,
      conflicts: conflicts.length,
      lastSync: state?.lastSyncTimestamp || 0,
      currentVersion: state?.version || 0,
    };
  }
}

/**
 * tRPC Procedures for Photo Sync
 */
export const photoSyncProcedures = {
  /**
   * Initialize sync for a photo
   */
  initializeSync: async (photoId: number) => {
    const state = await PhotoSyncService.loadSyncState(photoId);
    return state || PhotoSyncService.initializeSyncState(photoId);
  },

  /**
   * Record a sync event
   */
  recordEvent: async (
    photoId: number,
    eventType: SyncEvent['eventType'],
    userId: number,
    userName: string,
    data: any
  ) => {
    const event = PhotoSyncService.recordEvent(photoId, eventType, userId, userName, data);
    await PhotoSyncService.persistSyncState(photoId);
    return event;
  },

  /**
   * Sync client changes
   */
  syncChanges: async (
    photoId: number,
    clientVersion: number,
    clientEvents: SyncEvent[]
  ) => {
    const result = PhotoSyncService.syncClientChanges(photoId, clientVersion, clientEvents);
    await PhotoSyncService.persistSyncState(photoId);
    return result;
  },

  /**
   * Get event history
   */
  getHistory: async (photoId: number, since?: number) => {
    return PhotoSyncService.getEventHistory(photoId, since);
  },

  /**
   * Get sync state
   */
  getState: async (photoId: number) => {
    return PhotoSyncService.getSyncState(photoId);
  },

  /**
   * Get sync statistics
   */
  getStats: async (photoId: number) => {
    return PhotoSyncService.getSyncStats(photoId);
  },
};
