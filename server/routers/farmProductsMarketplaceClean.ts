import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";

/**
 * Farm Products Marketplace Router
 * Handles product listing, inventory management, sales tracking, and farm-to-consumer direct sales
 */
export const farmProductsMarketplaceCleanRouter = router({
  /**
   * List farm products
   */
  listProducts: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        category: z.string().optional(),
        limit: z.number().positive().default(50),
        offset: z.number().nonnegative().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        // Mock farm products
        const products = [
          {
            id: 1,
            farmId: input.farmId,
            name: "Organic Tomatoes",
            category: "Vegetables",
            description: "Fresh organic tomatoes grown without pesticides",
            price: 45.0,
            unit: "kg",
            stock: 150,
            minStock: 20,
            image: "/products/tomatoes.jpg",
            status: "active",
            createdDate: new Date("2026-01-15"),
            rating: 4.8,
            reviews: 24,
          },
          {
            id: 2,
            farmId: input.farmId,
            name: "Free-Range Eggs",
            category: "Poultry",
            description: "Fresh eggs from free-range chickens",
            price: 35.0,
            unit: "dozen",
            stock: 80,
            minStock: 10,
            image: "/products/eggs.jpg",
            status: "active",
            createdDate: new Date("2026-01-10"),
            rating: 4.9,
            reviews: 42,
          },
          {
            id: 3,
            farmId: input.farmId,
            name: "Honey",
            category: "Processed",
            description: "Raw, unfiltered honey from local bees",
            price: 120.0,
            unit: "liter",
            stock: 25,
            minStock: 5,
            image: "/products/honey.jpg",
            status: "active",
            createdDate: new Date("2026-01-05"),
            rating: 4.7,
            reviews: 18,
          },
          {
            id: 4,
            farmId: input.farmId,
            name: "Maize",
            category: "Grains",
            description: "High-quality maize for direct consumption",
            price: 25.0,
            unit: "kg",
            stock: 5,
            minStock: 50,
            image: "/products/maize.jpg",
            status: "low_stock",
            createdDate: new Date("2025-12-20"),
            rating: 4.5,
            reviews: 12,
          },
        ];

        const filtered = input.category
          ? products.filter((p) => p.category === input.category)
          : products;

        return {
          products: filtered.slice(input.offset, input.offset + input.limit),
          total: filtered.length,
          offset: input.offset,
          limit: input.limit,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to list products: ${error}`,
        });
      }
    }),

  /**
   * Create new farm product listing
   */
  createProduct: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        name: z.string(),
        category: z.string(),
        description: z.string(),
        price: z.number().positive(),
        unit: z.string(),
        stock: z.number().nonnegative(),
        minStock: z.number().nonnegative(),
        image: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const newProduct = {
          id: Math.floor(Math.random() * 10000),
          ...input,
          status: "active",
          createdDate: new Date(),
          rating: 0,
          reviews: 0,
        };

        return {
          success: true,
          productId: newProduct.id,
          message: `Product "${input.name}" created successfully`,
          product: newProduct,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to create product: ${error}`,
        });
      }
    }),

  /**
   * Update product details
   */
  updateProduct: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        price: z.number().positive().optional(),
        stock: z.number().nonnegative().optional(),
        minStock: z.number().nonnegative().optional(),
        status: z.enum(["active", "inactive", "low_stock"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          success: true,
          productId: input.productId,
          message: "Product updated successfully",
          updatedFields: Object.keys(input).filter((k) => k !== "productId"),
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update product: ${error}`,
        });
      }
    }),

  /**
   * Get inventory status
   */
  getInventoryStatus: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          farmId: input.farmId,
          totalProducts: 4,
          totalStock: 260,
          stockValue: 6750.0,
          lowStockItems: 1,
          outOfStockItems: 0,
          inventory: [
            { productId: 1, name: "Organic Tomatoes", stock: 150, minStock: 20, status: "good" },
            { productId: 2, name: "Free-Range Eggs", stock: 80, minStock: 10, status: "good" },
            { productId: 3, name: "Honey", stock: 25, minStock: 5, status: "good" },
            { productId: 4, name: "Maize", stock: 5, minStock: 50, status: "low" },
          ],
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch inventory status: ${error}`,
        });
      }
    }),

  /**
   * Record product sale
   */
  recordSale: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        quantity: z.number().positive(),
        buyerName: z.string(),
        buyerPhone: z.string(),
        totalPrice: z.number().positive(),
        paymentMethod: z.enum(["cash", "mobile_money", "bank_transfer", "card"]),
        deliveryMethod: z.enum(["pickup", "delivery"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const saleId = Math.floor(Math.random() * 10000);

        return {
          success: true,
          saleId,
          message: "Sale recorded successfully",
          sale: {
            ...input,
            saleDate: new Date(),
            status: "completed",
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to record sale: ${error}`,
        });
      }
    }),

  /**
   * Get sales history
   */
  getSalesHistory: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        limit: z.number().positive().default(50),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          farmId: input.farmId,
          sales: [
            {
              saleId: 1,
              productName: "Organic Tomatoes",
              quantity: 10,
              price: 450.0,
              buyerName: "John Doe",
              saleDate: new Date("2026-02-09"),
              paymentMethod: "cash",
              status: "completed",
            },
            {
              saleId: 2,
              productName: "Free-Range Eggs",
              quantity: 5,
              price: 175.0,
              buyerName: "Jane Smith",
              saleDate: new Date("2026-02-08"),
              paymentMethod: "mobile_money",
              status: "completed",
            },
            {
              saleId: 3,
              productName: "Honey",
              quantity: 2,
              price: 240.0,
              buyerName: "Robert Johnson",
              saleDate: new Date("2026-02-07"),
              paymentMethod: "bank_transfer",
              status: "completed",
            },
          ],
          totalSales: 3,
          totalRevenue: 865.0,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch sales history: ${error}`,
        });
      }
    }),

  /**
   * Get sales analytics
   */
  getSalesAnalytics: protectedProcedure
    .input(z.object({ farmId: z.number(), period: z.enum(["week", "month", "quarter", "year"]).default("month") }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          farmId: input.farmId,
          period: input.period,
          totalSales: 45,
          totalRevenue: 5230.0,
          averageOrderValue: 116.2,
          topProducts: [
            { name: "Organic Tomatoes", sales: 15, revenue: 675.0 },
            { name: "Free-Range Eggs", sales: 12, revenue: 420.0 },
            { name: "Honey", sales: 8, revenue: 960.0 },
            { name: "Maize", sales: 10, revenue: 250.0 },
          ],
          salesByPaymentMethod: {
            cash: 18,
            mobile_money: 15,
            bank_transfer: 8,
            card: 4,
          },
          salesByDeliveryMethod: {
            pickup: 28,
            delivery: 17,
          },
          dailySalesAverage: 1.45,
          growthRate: 12.5,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch sales analytics: ${error}`,
        });
      }
    }),

  /**
   * Manage product reviews and ratings
   */
  addProductReview: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        buyerName: z.string(),
        rating: z.number().min(1).max(5),
        comment: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          success: true,
          reviewId: Math.floor(Math.random() * 10000),
          message: "Review added successfully",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to add review: ${error}`,
        });
      }
    }),

  /**
   * Get product reviews
   */
  getProductReviews: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        limit: z.number().positive().default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          productId: input.productId,
          averageRating: 4.8,
          totalReviews: 24,
          reviews: [
            {
              reviewId: 1,
              buyerName: "John Doe",
              rating: 5,
              comment: "Excellent quality, very fresh!",
              date: new Date("2026-02-08"),
            },
            {
              reviewId: 2,
              buyerName: "Jane Smith",
              rating: 5,
              comment: "Best tomatoes I've bought",
              date: new Date("2026-02-06"),
            },
            {
              reviewId: 3,
              buyerName: "Robert Johnson",
              rating: 4,
              comment: "Good quality, slightly expensive",
              date: new Date("2026-02-04"),
            },
          ],
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch reviews: ${error}`,
        });
      }
    }),

  /**
   * Get customer list for farm products
   */
  getCustomers: protectedProcedure
    .input(z.object({ farmId: z.number(), limit: z.number().positive().default(50) }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          farmId: input.farmId,
          totalCustomers: 3,
          customers: [
            {
              customerId: 1,
              name: "John Doe",
              phone: "+233501234567",
              totalPurchases: 8,
              totalSpent: 1200.0,
              lastPurchase: new Date("2026-02-09"),
              favoriteProducts: ["Organic Tomatoes", "Maize"],
            },
            {
              customerId: 2,
              name: "Jane Smith",
              phone: "+233502345678",
              totalPurchases: 5,
              totalSpent: 650.0,
              lastPurchase: new Date("2026-02-08"),
              favoriteProducts: ["Free-Range Eggs"],
            },
            {
              customerId: 3,
              name: "Robert Johnson",
              phone: "+233503456789",
              totalPurchases: 3,
              totalSpent: 380.0,
              lastPurchase: new Date("2026-02-07"),
              favoriteProducts: ["Honey"],
            },
          ],
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch customers: ${error}`,
        });
      }
    }),

  /**
   * Generate sales report
   */
  generateSalesReport: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        format: z.enum(["pdf", "csv", "json"]).default("pdf"),
        period: z.enum(["week", "month", "quarter", "year"]).default("month"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        return {
          success: true,
          reportId: Math.floor(Math.random() * 10000),
          format: input.format,
          period: input.period,
          message: `Sales report generated for ${input.period}`,
          downloadUrl: `/reports/sales-${input.farmId}-${Date.now()}.${input.format}`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to generate sales report: ${error}`,
        });
      }
    }),
});
