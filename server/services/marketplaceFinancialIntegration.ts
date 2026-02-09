import { TRPCError } from '@trpc/server';
import { getDb } from '../db';
import { marketplaceOrders, marketplaceOrderItems, marketplaceProducts, revenue, expenses } from '../../drizzle/schema';
import { eq, and, gte, lte, sum } from 'drizzle-orm';

interface MarketplaceFinancialSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCommissions: number;
  netRevenue: number;
  platformFee: number;
  paymentProcessingFee: number;
}

interface MarketplaceTransaction {
  id: number;
  orderId: number;
  type: 'sale' | 'commission' | 'fee' | 'refund';
  amount: number;
  description: string;
  date: Date;
  status: 'completed' | 'pending' | 'failed';
}

interface MarketplaceFinancialReport {
  period: string;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  commissionRate: number;
  totalCommissions: number;
  platformFees: number;
  paymentProcessingFees: number;
  netRevenue: number;
  topProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
  orderTrend: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
}

/**
 * Get marketplace financial summary for a seller
 */
export async function getMarketplaceFinancialSummary(
  sellerId: number,
  startDate?: Date,
  endDate?: Date
): Promise<MarketplaceFinancialSummary> {
  try {
    const db = getDb();

    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get seller's products
    const products = await db
      .select()
      .from(marketplaceProducts)
      .where(eq(marketplaceProducts.sellerId, sellerId));

    const productIds = products.map((p) => p.id);

    if (productIds.length === 0) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        totalCommissions: 0,
        netRevenue: 0,
        platformFee: 0,
        paymentProcessingFee: 0,
      };
    }

    // Get orders for seller's products
    const orders = await db
      .select()
      .from(marketplaceOrders)
      .where(
        and(
          gte(marketplaceOrders.createdAt, start),
          lte(marketplaceOrders.createdAt, end)
        )
      );

    // Get order items
    const orderItems = await db
      .select()
      .from(marketplaceOrderItems);

    // Calculate totals
    let totalRevenue = 0;
    let totalOrders = 0;
    const processedOrders = new Set<number>();

    for (const item of orderItems) {
      if (productIds.includes(item.productId)) {
        const itemRevenue = parseFloat(item.price) * parseInt(item.quantity);
        totalRevenue += itemRevenue;

        if (!processedOrders.has(item.orderId)) {
          processedOrders.add(item.orderId);
          totalOrders++;
        }
      }
    }

    // Calculate fees (3% commission, 2.9% + $0.30 payment processing)
    const commissionRate = 0.03;
    const totalCommissions = totalRevenue * commissionRate;
    const paymentProcessingFeeRate = 0.029;
    const paymentProcessingFee = totalRevenue * paymentProcessingFeeRate + totalOrders * 0.3;
    const platformFee = totalCommissions;
    const netRevenue = totalRevenue - totalCommissions - paymentProcessingFee;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      totalCommissions,
      netRevenue,
      platformFee,
      paymentProcessingFee,
    };
  } catch (error) {
    console.error('Error getting marketplace financial summary:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to get marketplace financial summary',
    });
  }
}

/**
 * Sync marketplace revenue to financial dashboard
 */
export async function syncMarketplaceRevenueToFinancial(
  sellerId: number,
  farmId: number,
  startDate?: Date,
  endDate?: Date
): Promise<boolean> {
  try {
    const db = getDb();

    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get marketplace financial summary
    const summary = await getMarketplaceFinancialSummary(sellerId, start, end);

    if (summary.totalRevenue > 0) {
      // Create revenue entry in financial dashboard
      await db.insert(revenue).values({
        farmId,
        revenueType: 'marketplace_sales',
        description: `Marketplace sales - ${summary.totalOrders} orders`,
        amount: summary.netRevenue,
        revenueDate: new Date().toISOString().split('T')[0],
        buyer: 'Marketplace',
        quantity: summary.totalOrders,
        unitPrice: summary.averageOrderValue,
        notes: `Gross revenue: ${summary.totalRevenue}, Commission: ${summary.totalCommissions}, Processing fees: ${summary.paymentProcessingFee}`,
      });

      // Create expense entries for commissions and fees
      if (summary.totalCommissions > 0) {
        await db.insert(expenses).values({
          farmId,
          expenseType: 'other',
          description: 'Marketplace commission fees',
          amount: summary.totalCommissions,
          expenseDate: new Date().toISOString().split('T')[0],
          vendor: 'FarmKonnect Marketplace',
          notes: `Commission on ${summary.totalOrders} orders`,
        });
      }

      if (summary.paymentProcessingFee > 0) {
        await db.insert(expenses).values({
          farmId,
          expenseType: 'other',
          description: 'Payment processing fees',
          amount: summary.paymentProcessingFee,
          expenseDate: new Date().toISOString().split('T')[0],
          vendor: 'Payment Processor',
          notes: `Processing fees for ${summary.totalOrders} marketplace orders`,
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Error syncing marketplace revenue:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to sync marketplace revenue',
    });
  }
}

/**
 * Get marketplace transactions
 */
export async function getMarketplaceTransactions(
  sellerId: number,
  startDate?: Date,
  endDate?: Date,
  limit: number = 50,
  offset: number = 0
): Promise<MarketplaceTransaction[]> {
  try {
    const db = getDb();

    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get seller's products
    const products = await db
      .select()
      .from(marketplaceProducts)
      .where(eq(marketplaceProducts.sellerId, sellerId));

    const productIds = products.map((p) => p.id);

    if (productIds.length === 0) {
      return [];
    }

    // Get orders
    const orders = await db
      .select()
      .from(marketplaceOrders)
      .where(
        and(
          gte(marketplaceOrders.createdAt, start),
          lte(marketplaceOrders.createdAt, end)
        )
      );

    // Get order items
    const orderItems = await db
      .select()
      .from(marketplaceOrderItems);

    const transactions: MarketplaceTransaction[] = [];
    const commissionRate = 0.03;
    const paymentProcessingFeeRate = 0.029;

    for (const order of orders) {
      const items = orderItems.filter((oi) => oi.orderId === order.id);
      let orderTotal = 0;

      for (const item of items) {
        if (productIds.includes(item.productId)) {
          const itemTotal = parseFloat(item.price) * parseInt(item.quantity);
          orderTotal += itemTotal;

          // Sale transaction
          transactions.push({
            id: item.id,
            orderId: order.id,
            type: 'sale',
            amount: itemTotal,
            description: `Sale of product`,
            date: order.createdAt,
            status: order.status as 'completed' | 'pending' | 'failed',
          });
        }
      }

      if (orderTotal > 0) {
        // Commission transaction
        const commission = orderTotal * commissionRate;
        transactions.push({
          id: order.id * 1000 + 1,
          orderId: order.id,
          type: 'commission',
          amount: commission,
          description: 'Marketplace commission (3%)',
          date: order.createdAt,
          status: 'completed',
        });

        // Payment processing fee
        const processingFee = orderTotal * paymentProcessingFeeRate + 0.3;
        transactions.push({
          id: order.id * 1000 + 2,
          orderId: order.id,
          type: 'fee',
          amount: processingFee,
          description: 'Payment processing fee',
          date: order.createdAt,
          status: 'completed',
        });
      }
    }

    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(offset, offset + limit);
  } catch (error) {
    console.error('Error getting marketplace transactions:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to get marketplace transactions',
    });
  }
}

/**
 * Generate marketplace financial report
 */
export async function generateMarketplaceFinancialReport(
  sellerId: number,
  period: 'week' | 'month' | 'quarter' | 'year'
): Promise<MarketplaceFinancialReport> {
  try {
    const db = getDb();

    // Calculate date range
    const end = new Date();
    const start = new Date();

    if (period === 'week') {
      start.setDate(end.getDate() - 7);
    } else if (period === 'month') {
      start.setMonth(end.getMonth() - 1);
    } else if (period === 'quarter') {
      start.setMonth(end.getMonth() - 3);
    } else {
      start.setFullYear(end.getFullYear() - 1);
    }

    const summary = await getMarketplaceFinancialSummary(sellerId, start, end);

    // Get seller's products
    const products = await db
      .select()
      .from(marketplaceProducts)
      .where(eq(marketplaceProducts.sellerId, sellerId));

    const productIds = products.map((p) => p.id);

    // Get top products
    const orderItems = await db
      .select()
      .from(marketplaceOrderItems);

    const productStats: Record<number, { name: string; sales: number; revenue: number }> = {};

    for (const item of orderItems) {
      if (productIds.includes(item.productId)) {
        const product = products.find((p) => p.id === item.productId);
        if (product) {
          if (!productStats[item.productId]) {
            productStats[item.productId] = {
              name: product.name,
              sales: 0,
              revenue: 0,
            };
          }
          productStats[item.productId].sales += parseInt(item.quantity);
          productStats[item.productId].revenue += parseFloat(item.price) * parseInt(item.quantity);
        }
      }
    }

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Generate order trend
    const orderTrend: Array<{ date: string; orders: number; revenue: number }> = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      orderTrend.push({
        date: dateStr,
        orders: 0,
        revenue: 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      period: `${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`,
      totalSales: summary.totalRevenue,
      totalOrders: summary.totalOrders,
      averageOrderValue: summary.averageOrderValue,
      commissionRate: 3,
      totalCommissions: summary.totalCommissions,
      platformFees: summary.platformFee,
      paymentProcessingFees: summary.paymentProcessingFee,
      netRevenue: summary.netRevenue,
      topProducts,
      orderTrend,
    };
  } catch (error) {
    console.error('Error generating marketplace financial report:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to generate marketplace financial report',
    });
  }
}
