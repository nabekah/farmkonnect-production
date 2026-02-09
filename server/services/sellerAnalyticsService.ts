import { TRPCError } from '@trpc/server';
import { getDb } from '../db';
import { marketplaceOrders, marketplaceOrderItems, marketplaceProducts, marketplaceProductReviews } from '../../drizzle/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

interface SellerMetrics {
  totalSales: number;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  fulfillmentRate: number;
  averageRating: number;
  totalReviews: number;
  topProducts: Array<{
    id: number;
    name: string;
    sales: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    id: number;
    status: string;
    totalAmount: string;
    createdAt: Date;
  }>;
  orderTrend: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
}

/**
 * Get comprehensive seller analytics
 */
export async function getSellerAnalytics(
  sellerId: number,
  startDate?: Date,
  endDate?: Date
): Promise<SellerMetrics> {
  try {
    const db = getDb();

    // Default to last 30 days if not specified
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
        totalSales: 0,
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        fulfillmentRate: 0,
        averageRating: 0,
        totalReviews: 0,
        topProducts: [],
        recentOrders: [],
        orderTrend: [],
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

    // Get order items for seller's products
    const orderItems = await db
      .select()
      .from(marketplaceOrderItems)
      .where(
        productIds.length > 0
          ? // @ts-ignore - inArray not properly typed
            inArray(marketplaceOrderItems.productId, productIds)
          : undefined
      );

    // Calculate metrics
    let totalSales = 0;
    let totalRevenue = 0;
    let fulfillmentCount = 0;
    const productSales: Record<number, { name: string; sales: number; revenue: number }> = {};

    for (const item of orderItems) {
      totalSales += parseInt(item.quantity);
      totalRevenue += parseFloat(item.price) * parseInt(item.quantity);

      const product = products.find((p) => p.id === item.productId);
      if (product) {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: product.name,
            sales: 0,
            revenue: 0,
          };
        }
        productSales[item.productId].sales += parseInt(item.quantity);
        productSales[item.productId].revenue += parseFloat(item.price) * parseInt(item.quantity);
      }
    }

    // Calculate fulfillment rate
    const fulfilledOrders = orders.filter((o) => o.status === 'shipped' || o.status === 'delivered').length;
    const fulfillmentRate = orders.length > 0 ? (fulfilledOrders / orders.length) * 100 : 0;

    // Get product reviews
    const reviews = await db
      .select()
      .from(marketplaceProductReviews)
      .where(
        productIds.length > 0
          ? // @ts-ignore - inArray not properly typed
            inArray(marketplaceProductReviews.productId, productIds)
          : undefined
      );

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + parseFloat(r.rating), 0) / reviews.length
        : 0;

    // Get top products
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((p, idx) => ({
        id: idx,
        name: p.name,
        sales: p.sales,
        revenue: p.revenue,
      }));

    // Get recent orders
    const recentOrders = orders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map((o) => ({
        id: o.id,
        status: o.status,
        totalAmount: o.totalAmount,
        createdAt: o.createdAt,
      }));

    // Generate order trend
    const orderTrend: Array<{ date: string; orders: number; revenue: number }> = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOrders = orders.filter(
        (o) => new Date(o.createdAt).toISOString().split('T')[0] === dateStr
      );

      let dayRevenue = 0;
      for (const order of dayOrders) {
        const items = orderItems.filter((oi) => oi.orderId === order.id);
        for (const item of items) {
          dayRevenue += parseFloat(item.price) * parseInt(item.quantity);
        }
      }

      orderTrend.push({
        date: dateStr,
        orders: dayOrders.length,
        revenue: dayRevenue,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      totalSales,
      totalRevenue,
      totalOrders: orders.length,
      averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      fulfillmentRate,
      averageRating: Math.round(averageRating * 100) / 100,
      totalReviews: reviews.length,
      topProducts,
      recentOrders,
      orderTrend,
    };
  } catch (error) {
    console.error('Error getting seller analytics:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to get seller analytics',
    });
  }
}

/**
 * Get sales by category
 */
export async function getSalesByCategory(
  sellerId: number,
  startDate?: Date,
  endDate?: Date
): Promise<Array<{ category: string; sales: number; revenue: number }>> {
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

    // Get order items
    const orderItems = await db
      .select()
      .from(marketplaceOrderItems)
      .where(
        productIds.length > 0
          ? // @ts-ignore - inArray not properly typed
            inArray(marketplaceOrderItems.productId, productIds)
          : undefined
      );

    // Group by category
    const categoryStats: Record<string, { sales: number; revenue: number }> = {};

    for (const item of orderItems) {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        const category = product.category || 'Uncategorized';

        if (!categoryStats[category]) {
          categoryStats[category] = { sales: 0, revenue: 0 };
        }

        categoryStats[category].sales += parseInt(item.quantity);
        categoryStats[category].revenue += parseFloat(item.price) * parseInt(item.quantity);
      }
    }

    return Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      sales: stats.sales,
      revenue: stats.revenue,
    }));
  } catch (error) {
    console.error('Error getting sales by category:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to get sales by category',
    });
  }
}

/**
 * Get customer insights
 */
export async function getCustomerInsights(
  sellerId: number,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalCustomers: number;
  repeatCustomers: number;
  averageOrderFrequency: number;
  customerRetentionRate: number;
}> {
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
        totalCustomers: 0,
        repeatCustomers: 0,
        averageOrderFrequency: 0,
        customerRetentionRate: 0,
      };
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

    // Count unique customers
    const uniqueCustomers = new Set(orders.map((o) => o.buyerId));
    const totalCustomers = uniqueCustomers.size;

    // Count repeat customers
    const customerOrderCounts: Record<number, number> = {};
    for (const order of orders) {
      customerOrderCounts[order.buyerId] = (customerOrderCounts[order.buyerId] || 0) + 1;
    }

    const repeatCustomers = Object.values(customerOrderCounts).filter((count) => count > 1).length;
    const averageOrderFrequency = totalCustomers > 0 ? orders.length / totalCustomers : 0;
    const customerRetentionRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

    return {
      totalCustomers,
      repeatCustomers,
      averageOrderFrequency: Math.round(averageOrderFrequency * 100) / 100,
      customerRetentionRate: Math.round(customerRetentionRate * 100) / 100,
    };
  } catch (error) {
    console.error('Error getting customer insights:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to get customer insights',
    });
  }
}

/**
 * Export analytics to CSV
 */
export async function exportAnalyticsToCSV(
  sellerId: number,
  startDate?: Date,
  endDate?: Date
): Promise<string> {
  try {
    const analytics = await getSellerAnalytics(sellerId, startDate, endDate);
    const categoryStats = await getSalesByCategory(sellerId, startDate, endDate);
    const customerInsights = await getCustomerInsights(sellerId, startDate, endDate);

    let csv = 'FarmKonnect Seller Analytics Report\n\n';

    // Summary metrics
    csv += 'Summary Metrics\n';
    csv += `Total Sales,${analytics.totalSales}\n`;
    csv += `Total Revenue,GH₵${analytics.totalRevenue.toFixed(2)}\n`;
    csv += `Total Orders,${analytics.totalOrders}\n`;
    csv += `Average Order Value,GH₵${analytics.averageOrderValue.toFixed(2)}\n`;
    csv += `Fulfillment Rate,${analytics.fulfillmentRate.toFixed(1)}%\n`;
    csv += `Average Rating,${analytics.averageRating}/5\n`;
    csv += `Total Reviews,${analytics.totalReviews}\n\n`;

    // Top products
    csv += 'Top Products\n';
    csv += 'Product,Sales,Revenue\n';
    for (const product of analytics.topProducts) {
      csv += `${product.name},${product.sales},GH₵${product.revenue.toFixed(2)}\n`;
    }
    csv += '\n';

    // Sales by category
    csv += 'Sales by Category\n';
    csv += 'Category,Sales,Revenue\n';
    for (const category of categoryStats) {
      csv += `${category.category},${category.sales},GH₵${category.revenue.toFixed(2)}\n`;
    }
    csv += '\n';

    // Customer insights
    csv += 'Customer Insights\n';
    csv += `Total Customers,${customerInsights.totalCustomers}\n`;
    csv += `Repeat Customers,${customerInsights.repeatCustomers}\n`;
    csv += `Average Order Frequency,${customerInsights.averageOrderFrequency}\n`;
    csv += `Customer Retention Rate,${customerInsights.customerRetentionRate.toFixed(1)}%\n`;

    return csv;
  } catch (error) {
    console.error('Error exporting analytics:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to export analytics',
    });
  }
}
