import { getDb } from '../db';
import { fertilizerInventory, fertilizerInventoryTransactions } from '../../drizzle/schema';
import { eq, and, lte } from 'drizzle-orm';
import { NotificationService } from './notificationService';

export interface InventoryItem {
  id: number;
  farmId: number;
  fertilizerType: string;
  currentStock: number;
  unit: string;
  reorderPoint: number;
  reorderQuantity: number;
  supplier?: string;
  supplierContact?: string;
  lastRestockDate?: Date;
  expiryDate?: Date;
  storageLocation?: string;
  isLowStock: boolean;
  daysUntilExpiry?: number;
}

export interface InventoryTransaction {
  id: number;
  inventoryId: number;
  transactionType: 'purchase' | 'usage' | 'adjustment' | 'damage' | 'expiry';
  quantity: number;
  unit: string;
  cost?: number;
  reason?: string;
  transactionDate: Date;
}

export class FertilizerInventoryService {
  private notificationService = new NotificationService();

  /**
   * Get all inventory items for a farm
   */
  async getInventoryByFarm(farmId: number): Promise<InventoryItem[]> {
    const dbPromise = getDb();
    const db = await dbPromise;
    if (!db) throw new Error('Database connection failed');

    const items = await db.select().from(fertilizerInventory).where(eq(fertilizerInventory.farmId, farmId));

    return items.map((item) => ({
      id: item.id,
      farmId: item.farmId,
      fertilizerType: item.fertilizerType,
      currentStock: Number(item.currentStock),
      unit: item.unit,
      reorderPoint: Number(item.reorderPoint),
      reorderQuantity: Number(item.reorderQuantity),
      supplier: item.supplier || undefined,
      supplierContact: item.supplierContact || undefined,
      lastRestockDate: item.lastRestockDate || undefined,
      expiryDate: item.expiryDate || undefined,
      storageLocation: item.storageLocation || undefined,
      isLowStock: Number(item.currentStock) <= Number(item.reorderPoint),
      daysUntilExpiry: item.expiryDate
        ? Math.floor((item.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : undefined,
    }));
  }

  /**
   * Create or update inventory item
   */
  async upsertInventoryItem(
    farmId: number,
    fertilizerType: string,
    data: Partial<InventoryItem>
  ): Promise<InventoryItem> {
    const dbPromise = getDb();
    const db = await dbPromise;
    if (!db) throw new Error('Database connection failed');

    const existing = await db
      .select()
      .from(fertilizerInventory)
      .where(and(eq(fertilizerInventory.farmId, farmId), eq(fertilizerInventory.fertilizerType, fertilizerType)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(fertilizerInventory)
        .set({
          currentStock: data.currentStock?.toString(),
          reorderPoint: data.reorderPoint?.toString(),
          reorderQuantity: data.reorderQuantity?.toString(),
          supplier: data.supplier,
          supplierContact: data.supplierContact,
          storageLocation: data.storageLocation,
          expiryDate: data.expiryDate,
        })
        .where(eq(fertilizerInventory.id, existing[0].id));

      return this.getInventoryItem(existing[0].id);
    }

    const result = await db.insert(fertilizerInventory).values({
      farmId,
      fertilizerType,
      currentStock: (data.currentStock || 0).toString(),
      unit: data.unit || 'kg',
      reorderPoint: (data.reorderPoint || 0).toString(),
      reorderQuantity: (data.reorderQuantity || 0).toString(),
      supplier: data.supplier,
      supplierContact: data.supplierContact,
      storageLocation: data.storageLocation,
      expiryDate: data.expiryDate,
    });

    return this.getInventoryItem(result[0].insertId);
  }

  /**
   * Get single inventory item
   */
  async getInventoryItem(id: number): Promise<InventoryItem> {
    const dbPromise = getDb();
    const db = await dbPromise;
    if (!db) throw new Error('Database connection failed');

    const items = await db.select().from(fertilizerInventory).where(eq(fertilizerInventory.id, id)).limit(1);

    if (!items.length) throw new Error(`Inventory item ${id} not found`);

    const item = items[0];
    return {
      id: item.id,
      farmId: item.farmId,
      fertilizerType: item.fertilizerType,
      currentStock: Number(item.currentStock),
      unit: item.unit,
      reorderPoint: Number(item.reorderPoint),
      reorderQuantity: Number(item.reorderQuantity),
      supplier: item.supplier || undefined,
      supplierContact: item.supplierContact || undefined,
      lastRestockDate: item.lastRestockDate || undefined,
      expiryDate: item.expiryDate || undefined,
      storageLocation: item.storageLocation || undefined,
      isLowStock: Number(item.currentStock) <= Number(item.reorderPoint),
      daysUntilExpiry: item.expiryDate
        ? Math.floor((item.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : undefined,
    };
  }

  /**
   * Record inventory transaction (purchase, usage, adjustment, etc.)
   */
  async recordTransaction(
    inventoryId: number,
    transactionType: 'purchase' | 'usage' | 'adjustment' | 'damage' | 'expiry',
    quantity: number,
    data?: { cost?: number; reason?: string; referenceId?: number }
  ): Promise<InventoryTransaction> {
    const dbPromise = getDb();
    const db = await dbPromise;
    if (!db) throw new Error('Database connection failed');

    // Get current inventory
    const item = await this.getInventoryItem(inventoryId);

    // Calculate new stock
    let newStock = item.currentStock;
    if (transactionType === 'purchase') {
      newStock += quantity;
    } else if (transactionType === 'usage' || transactionType === 'damage' || transactionType === 'expiry') {
      newStock -= quantity;
    } else if (transactionType === 'adjustment') {
      newStock = quantity; // Direct adjustment
    }

    // Update inventory stock
    await db
      .update(fertilizerInventory)
      .set({
        currentStock: newStock.toString(),
        lastRestockDate: transactionType === 'purchase' ? new Date() : undefined,
      })
      .where(eq(fertilizerInventory.id, inventoryId));

    // Record transaction
    const result = await db.insert(fertilizerInventoryTransactions).values({
      inventoryId,
      transactionType,
      quantity: quantity.toString(),
      unit: item.unit,
      cost: data?.cost?.toString(),
      reason: data?.reason,
      referenceId: data?.referenceId,
      transactionDate: new Date(),
    });

    // Check for low stock alert
    if (newStock <= item.reorderPoint && transactionType === 'usage') {
      await this.notifyLowStock(item);
    }

    return {
      id: result[0].insertId,
      inventoryId,
      transactionType,
      quantity,
      unit: item.unit,
      cost: data?.cost,
      reason: data?.reason,
      transactionDate: new Date(),
    };
  }

  /**
   * Get transaction history for an inventory item
   */
  async getTransactionHistory(inventoryId: number, limit: number = 50): Promise<InventoryTransaction[]> {
    const dbPromise = getDb();
    const db = await dbPromise;
    if (!db) throw new Error('Database connection failed');

    const item = await this.getInventoryItem(inventoryId);
    const transactions = await db
      .select()
      .from(fertilizerInventoryTransactions)
      .where(eq(fertilizerInventoryTransactions.inventoryId, inventoryId))
      .orderBy((t: any) => [t.transactionDate])
      .limit(limit);

    return transactions.map((t) => ({
      id: t.id,
      inventoryId: t.inventoryId,
      transactionType: t.transactionType as any,
      quantity: Number(t.quantity),
      unit: t.unit,
      cost: t.cost ? Number(t.cost) : undefined,
      reason: t.reason || undefined,
      transactionDate: t.transactionDate,
    }));
  }

  /**
   * Get low stock items for a farm
   */
  async getLowStockItems(farmId: number): Promise<InventoryItem[]> {
    const items = await this.getInventoryByFarm(farmId);
    return items.filter((item) => item.isLowStock);
  }

  /**
   * Get expiring items (within 30 days)
   */
  async getExpiringItems(farmId: number, daysThreshold: number = 30): Promise<InventoryItem[]> {
    const items = await this.getInventoryByFarm(farmId);
    return items.filter((item) => item.daysUntilExpiry !== undefined && item.daysUntilExpiry <= daysThreshold);
  }

  /**
   * Send low stock notification
   */
  private async notifyLowStock(item: InventoryItem): Promise<void> {
    try {
      const message = `Stock level for ${item.fertilizerType} has fallen below reorder point. Current: ${item.currentStock} ${item.unit}, Reorder Point: ${item.reorderPoint} ${item.unit}. Reorder Quantity: ${item.reorderQuantity} ${item.unit}. Supplier: ${item.supplier || 'Not specified'}`;
      await this.notificationService.sendEmail(
        'farm@example.com',
        `Low Stock Alert: ${item.fertilizerType}`,
        `<p>${message}</p>`
      );
    } catch (error) {
      console.error('[FertilizerInventoryService] Failed to send low stock notification:', error);
    }
  }

  /**
   * Calculate inventory value
   */
  async calculateInventoryValue(farmId: number): Promise<number> {
    const dbPromise = getDb();
    const db = await dbPromise;
    if (!db) throw new Error('Database connection failed');

    const items = await this.getInventoryByFarm(farmId);
    let totalValue = 0;

    for (const item of items) {
      // Get average cost from recent purchases
      const transactions = await db
        .select()
        .from(fertilizerInventoryTransactions)
        .where(
          and(
            eq(fertilizerInventoryTransactions.inventoryId, item.id),
            eq(fertilizerInventoryTransactions.transactionType, 'purchase')
          )
        )
        .orderBy((t: any) => [t.transactionDate])
        .limit(5);

      if (transactions.length > 0) {
        const avgCost =
          transactions.reduce((sum, t) => sum + (Number(t.cost) || 0), 0) / transactions.filter((t) => t.cost).length;
        totalValue += item.currentStock * avgCost;
      }
    }

    return totalValue;
  }
}

export const fertilizerInventoryService = new FertilizerInventoryService();
