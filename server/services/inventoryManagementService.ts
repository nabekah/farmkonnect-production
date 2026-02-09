import { TRPCError } from '@trpc/server';
import { getDb } from '../db';
import { marketplaceProducts, inventoryAlerts } from '../../drizzle/schema';
import { eq, and, lt, gte } from 'drizzle-orm';

interface InventoryItem {
  productId: number;
  productName: string;
  currentStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  lastRestockDate: Date;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  daysUntilStockout?: number;
}

interface InventoryAlert {
  id: number;
  productId: number;
  productName: string;
  alertType: 'low_stock' | 'out_of_stock' | 'overstock';
  currentStock: number;
  threshold: number;
  createdAt: Date;
  acknowledged: boolean;
}

interface SalesVelocity {
  productId: number;
  productName: string;
  dailyAverage: number;
  weeklyAverage: number;
  monthlyAverage: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

interface InventoryForecast {
  productId: number;
  productName: string;
  currentStock: number;
  forecastedStockout: Date | null;
  recommendedReorderQuantity: number;
  estimatedLeadTime: number;
  confidence: number;
}

/**
 * Get inventory status for a seller
 */
export async function getInventoryStatus(sellerId: number): Promise<InventoryItem[]> {
  try {
    const db = getDb();

    // Get seller's products
    const products = await db
      .select()
      .from(marketplaceProducts)
      .where(eq(marketplaceProducts.sellerId, sellerId));

    const inventory: InventoryItem[] = [];

    for (const product of products) {
      const currentStock = parseInt(product.quantity);
      const reorderPoint = 10; // Default reorder point
      const reorderQuantity = 50; // Default reorder quantity

      let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
      let daysUntilStockout: number | undefined;

      if (currentStock === 0) {
        status = 'out_of_stock';
      } else if (currentStock <= reorderPoint) {
        status = 'low_stock';
        // Estimate days until stockout (assuming average sales of 2 per day)
        daysUntilStockout = Math.ceil(currentStock / 2);
      }

      inventory.push({
        productId: product.id,
        productName: product.name,
        currentStock,
        reorderPoint,
        reorderQuantity,
        lastRestockDate: product.createdAt,
        status,
        daysUntilStockout,
      });
    }

    return inventory;
  } catch (error) {
    console.error('Error getting inventory status:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to get inventory status',
    });
  }
}

/**
 * Create inventory alert
 */
export async function createInventoryAlert(
  productId: number,
  alertType: 'low_stock' | 'out_of_stock' | 'overstock',
  currentStock: number,
  threshold: number
): Promise<InventoryAlert> {
  try {
    const db = getDb();

    // Get product details
    const product = await db
      .select()
      .from(marketplaceProducts)
      .where(eq(marketplaceProducts.id, productId))
      .limit(1);

    if (!product || product.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Product not found',
      });
    }

    // Create alert
    const alert = await db.insert(inventoryAlerts).values({
      productId,
      alertType,
      currentStock: currentStock.toString(),
      threshold: threshold.toString(),
      acknowledged: false,
    });

    return {
      id: parseInt(alert.insertId.toString()),
      productId,
      productName: product[0].name,
      alertType,
      currentStock,
      threshold,
      createdAt: new Date(),
      acknowledged: false,
    };
  } catch (error) {
    console.error('Error creating inventory alert:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create inventory alert',
    });
  }
}

/**
 * Get active inventory alerts
 */
export async function getActiveAlerts(sellerId: number): Promise<InventoryAlert[]> {
  try {
    const db = getDb();

    // Get seller's products
    const products = await db
      .select()
      .from(marketplaceProducts)
      .where(eq(marketplaceProducts.sellerId, sellerId));

    const productIds = products.map((p) => p.id);

    if (productIds.length === 0) {
      return [];
    }

    // Get unacknowledged alerts
    const alerts = await db
      .select()
      .from(inventoryAlerts)
      .where(
        and(
          // @ts-ignore - inArray not properly typed
          inArray(inventoryAlerts.productId, productIds),
          eq(inventoryAlerts.acknowledged, false)
        )
      );

    return alerts.map((alert) => {
      const product = products.find((p) => p.id === alert.productId);
      return {
        id: alert.id,
        productId: alert.productId,
        productName: product?.name || 'Unknown',
        alertType: alert.alertType as 'low_stock' | 'out_of_stock' | 'overstock',
        currentStock: parseInt(alert.currentStock),
        threshold: parseInt(alert.threshold),
        createdAt: alert.createdAt,
        acknowledged: alert.acknowledged,
      };
    });
  } catch (error) {
    console.error('Error getting active alerts:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to get active alerts',
    });
  }
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(alertId: number): Promise<boolean> {
  try {
    const db = getDb();

    await db
      .update(inventoryAlerts)
      .set({ acknowledged: true })
      .where(eq(inventoryAlerts.id, alertId));

    return true;
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to acknowledge alert',
    });
  }
}

/**
 * Calculate sales velocity
 */
export function calculateSalesVelocity(
  productName: string,
  dailySales: number[],
  weeklySales: number[],
  monthlySales: number[]
): SalesVelocity {
  const dailyAverage = dailySales.length > 0 ? dailySales.reduce((a, b) => a + b, 0) / dailySales.length : 0;
  const weeklyAverage = weeklySales.length > 0 ? weeklySales.reduce((a, b) => a + b, 0) / weeklySales.length : 0;
  const monthlyAverage = monthlySales.length > 0 ? monthlySales.reduce((a, b) => a + b, 0) / monthlySales.length : 0;

  // Determine trend
  let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
  if (dailyAverage > weeklyAverage * 1.1) {
    trend = 'increasing';
  } else if (dailyAverage < weeklyAverage * 0.9) {
    trend = 'decreasing';
  }

  return {
    productId: 0, // Will be set by caller
    productName,
    dailyAverage: Math.round(dailyAverage * 100) / 100,
    weeklyAverage: Math.round(weeklyAverage * 100) / 100,
    monthlyAverage: Math.round(monthlyAverage * 100) / 100,
    trend,
  };
}

/**
 * Generate inventory forecast
 */
export function generateInventoryForecast(
  productId: number,
  productName: string,
  currentStock: number,
  dailySalesAverage: number,
  leadTimeDays: number = 7
): InventoryForecast {
  // Calculate days until stockout
  const daysUntilStockout = currentStock / (dailySalesAverage || 1);

  // Calculate recommended reorder quantity
  const recommendedReorderQuantity = Math.ceil(dailySalesAverage * (leadTimeDays + 14)); // 2 weeks buffer

  // Estimate stockout date
  let forecastedStockout: Date | null = null;
  if (dailySalesAverage > 0) {
    const daysFromNow = Math.ceil(currentStock / dailySalesAverage);
    forecastedStockout = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  }

  // Calculate confidence (higher stock = higher confidence)
  const confidence = Math.min(100, Math.max(0, (currentStock / recommendedReorderQuantity) * 100));

  return {
    productId,
    productName,
    currentStock,
    forecastedStockout,
    recommendedReorderQuantity,
    estimatedLeadTime: leadTimeDays,
    confidence: Math.round(confidence),
  };
}

/**
 * Update product stock
 */
export async function updateProductStock(
  productId: number,
  newQuantity: number,
  reason: 'restock' | 'sale' | 'adjustment'
): Promise<boolean> {
  try {
    const db = getDb();

    // Update product quantity
    await db
      .update(marketplaceProducts)
      .set({ quantity: newQuantity.toString() })
      .where(eq(marketplaceProducts.id, productId));

    return true;
  } catch (error) {
    console.error('Error updating product stock:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update product stock',
    });
  }
}

/**
 * Get low stock products
 */
export async function getLowStockProducts(sellerId: number, threshold: number = 10): Promise<InventoryItem[]> {
  try {
    const db = getDb();

    // Get seller's products with low stock
    const products = await db
      .select()
      .from(marketplaceProducts)
      .where(
        and(
          eq(marketplaceProducts.sellerId, sellerId),
          lt(marketplaceProducts.quantity, threshold.toString())
        )
      );

    return products.map((product) => ({
      productId: product.id,
      productName: product.name,
      currentStock: parseInt(product.quantity),
      reorderPoint: threshold,
      reorderQuantity: 50,
      lastRestockDate: product.createdAt,
      status: parseInt(product.quantity) === 0 ? 'out_of_stock' : 'low_stock',
      daysUntilStockout: parseInt(product.quantity) > 0 ? Math.ceil(parseInt(product.quantity) / 2) : 0,
    }));
  } catch (error) {
    console.error('Error getting low stock products:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to get low stock products',
    });
  }
}
