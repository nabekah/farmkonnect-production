import { EventEmitter } from 'events';
import type { Database } from 'drizzle-orm';

/**
 * Database Change Listener
 * Emits events whenever data is added, updated, or deleted
 * Allows WebSocket server to broadcast real-time updates to clients
 */

export type DatabaseChangeEvent = {
  type: 'insert' | 'update' | 'delete';
  table: string;
  farmId: number;
  data: Record<string, any>;
  timestamp: Date;
  userId?: number;
};

export class DatabaseChangeListener extends EventEmitter {
  private static instance: DatabaseChangeListener;
  private db: Database | null = null;

  private constructor() {
    super();
    this.setMaxListeners(100);
  }

  static getInstance(): DatabaseChangeListener {
    if (!DatabaseChangeListener.instance) {
      DatabaseChangeListener.instance = new DatabaseChangeListener();
    }
    return DatabaseChangeListener.instance;
  }

  setDatabase(db: Database) {
    this.db = db;
  }

  /**
   * Emit a database change event
   * Called by tRPC procedures when data is modified
   */
  emitChange(event: DatabaseChangeEvent) {
    console.log(`[DatabaseChangeListener] ${event.type} on ${event.table} for farm ${event.farmId}`);
    
    // Emit specific table event
    this.emit(`${event.table}:${event.type}`, event);
    
    // Emit farm-specific event
    this.emit(`farm:${event.farmId}:${event.type}`, event);
    
    // Emit general change event
    this.emit('change', event);
  }

  /**
   * Subscribe to changes on a specific table
   */
  onTableChange(table: string, callback: (event: DatabaseChangeEvent) => void) {
    this.on(`${table}:insert`, callback);
    this.on(`${table}:update`, callback);
    this.on(`${table}:delete`, callback);
  }

  /**
   * Subscribe to insert events on a table
   */
  onInsert(table: string, callback: (event: DatabaseChangeEvent) => void) {
    this.on(`${table}:insert`, callback);
  }

  /**
   * Subscribe to update events on a table
   */
  onUpdate(table: string, callback: (event: DatabaseChangeEvent) => void) {
    this.on(`${table}:update`, callback);
  }

  /**
   * Subscribe to delete events on a table
   */
  onDelete(table: string, callback: (event: DatabaseChangeEvent) => void) {
    this.on(`${table}:delete`, callback);
  }

  /**
   * Subscribe to all changes for a specific farm
   */
  onFarmChange(farmId: number, callback: (event: DatabaseChangeEvent) => void) {
    this.on(`farm:${farmId}:insert`, callback);
    this.on(`farm:${farmId}:update`, callback);
    this.on(`farm:${farmId}:delete`, callback);
  }

  /**
   * Subscribe to all changes
   */
  onChange(callback: (event: DatabaseChangeEvent) => void) {
    this.on('change', callback);
  }

  /**
   * Get all active listeners count
   */
  getListenerCount(): number {
    return this.listenerCount();
  }
}

export const databaseChangeListener = DatabaseChangeListener.getInstance();
