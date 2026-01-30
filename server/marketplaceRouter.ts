import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { TRPCError } from "@trpc/server";
import {
  marketplaceProducts,
  marketplaceProductImages,
  marketplaceOrders,
  marketplaceOrderItems,
  marketplaceTransactions,
  marketplaceCart,
  marketplaceReviews,
} from "../drizzle/schema";
import { eq, and, desc, like } from "drizzle-orm";
import { storagePut } from "./storage";

export const marketplaceRouter = router({
  // ========== IMAGE UPLOAD ==========
  uploadProductImage: protectedProcedure
    .input(z.object({ 
      productId: z.number().optional(),
      imageData: z.string(), // base64 encoded image
      fileName: z.string(),
      mimeType: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Decode base64 image
        const base64Data = input.imageData.split(',')[1] || input.imageData;
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Generate unique file key
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const fileExtension = input.fileName.split('.').pop() || 'jpg';
        const fileKey = `marketplace/products/${ctx.user.id}/${timestamp}-${randomSuffix}.${fileExtension}`;
        
        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        
        return { url, key: fileKey };
      } catch (error: any) {
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: error?.message || "Failed to upload image" 
        });
      }
    }),
  // ========== PRODUCTS ==========
  getProductImages: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      return await db.select().from(marketplaceProductImages)
        .where(eq(marketplaceProductImages.productId, input.productId))
        .orderBy(marketplaceProductImages.displayOrder);
    }),

  listProducts: protectedProcedure
    .input(z.object({ category: z.string().optional(), search: z.string().optional(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const conditions = [eq(marketplaceProducts.status, "active")];
      if (input.category) conditions.push(eq(marketplaceProducts.category, input.category));
      if (input.search) conditions.push(like(marketplaceProducts.name, `%${input.search}%`));
      
      return await db.select().from(marketplaceProducts)
        .where(and(...conditions))
        .limit(input.limit)
        .orderBy(desc(marketplaceProducts.createdAt));
    }),

  getProduct: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const result = await db.select().from(marketplaceProducts).where(eq(marketplaceProducts.id, input.id));
      return result[0] || null;
    }),

  createProduct: protectedProcedure
    .input(z.object({
      farmId: z.number().optional(),
      name: z.string(),
      description: z.string().optional(),
      category: z.string(),
      productType: z.string(),
      price: z.number().positive(),
      quantity: z.number().positive(),
      unit: z.string(),
      imageUrl: z.string().optional(),
      imageUrls: z.array(z.string()).optional(), // Multiple images
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      const result = await db.insert(marketplaceProducts).values({
        sellerId: ctx.user.id,
        farmId: input.farmId,
        name: input.name,
        description: input.description,
        category: input.category,
        productType: input.productType,
        price: input.price.toString(),
        quantity: input.quantity.toString(),
        unit: input.unit,
        imageUrl: input.imageUrl,
        status: "active",
      });
      
      const productId = Number((result as any).insertId);
      
      // Insert multiple images if provided
      if (input.imageUrls && input.imageUrls.length > 0) {
        const imageValues = input.imageUrls.map((url, index) => ({
          productId,
          imageUrl: url,
          displayOrder: index,
        }));
        await db.insert(marketplaceProductImages).values(imageValues);
      }
      
      return result;
    }),

  updateProduct: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      price: z.number().positive().optional(),
      quantity: z.number().positive().optional(),
      status: z.enum(["active", "inactive", "sold_out", "discontinued"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      const updates: any = {};
      if (input.name) updates.name = input.name;
      if (input.description) updates.description = input.description;
      if (input.price) updates.price = input.price.toString();
      if (input.quantity) updates.quantity = input.quantity.toString();
      if (input.status) updates.status = input.status;
      
      return await db.update(marketplaceProducts)
        .set(updates)
        .where(and(eq(marketplaceProducts.id, input.id), eq(marketplaceProducts.sellerId, ctx.user.id)));
    }),

  deleteProduct: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      return await db.delete(marketplaceProducts)
        .where(and(eq(marketplaceProducts.id, input.id), eq(marketplaceProducts.sellerId, ctx.user.id)));
    }),

  // ========== SHOPPING CART ==========
  getCart: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    
    return await db.select().from(marketplaceCart)
      .where(eq(marketplaceCart.userId, ctx.user.id));
  }),

  addToCart: protectedProcedure
    .input(z.object({ productId: z.number(), quantity: z.number().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      const existing = await db.select().from(marketplaceCart)
        .where(and(eq(marketplaceCart.userId, ctx.user.id), eq(marketplaceCart.productId, input.productId)));
      
      if (existing.length > 0) {
        return await db.update(marketplaceCart)
          .set({ quantity: (parseFloat(existing[0].quantity) + input.quantity).toString() })
          .where(eq(marketplaceCart.id, existing[0].id));
      }
      
      return await db.insert(marketplaceCart).values({
        userId: ctx.user.id,
        productId: input.productId,
        quantity: input.quantity.toString(),
      });
    }),

  removeFromCart: protectedProcedure
    .input(z.object({ cartId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      return await db.delete(marketplaceCart)
        .where(and(eq(marketplaceCart.id, input.cartId), eq(marketplaceCart.userId, ctx.user.id)));
    }),

  // ========== ORDERS ==========
  listOrders: protectedProcedure
    .input(z.object({ role: z.enum(["buyer", "seller"]).default("buyer") }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];
      
      if (input.role === "buyer") {
        return await db.select().from(marketplaceOrders)
          .where(eq(marketplaceOrders.buyerId, ctx.user.id))
          .orderBy(desc(marketplaceOrders.createdAt));
      } else {
        return await db.select().from(marketplaceOrders)
          .where(eq(marketplaceOrders.sellerId, ctx.user.id))
          .orderBy(desc(marketplaceOrders.createdAt));
      }
    }),

  getOrder: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const order = await db.select().from(marketplaceOrders).where(eq(marketplaceOrders.id, input.id));
      if (!order[0]) return null;
      
      const items = await db.select().from(marketplaceOrderItems).where(eq(marketplaceOrderItems.orderId, input.id));
      
      return { ...order[0], items };
    }),

  createOrder: protectedProcedure
    .input(z.object({
      sellerId: z.number(),
      items: z.array(z.object({ productId: z.number(), quantity: z.number() })),
      deliveryAddress: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      // Calculate total
      let totalAmount = 0;
      const orderItems = [];
      
      for (const item of input.items) {
        const product = await db.select().from(marketplaceProducts).where(eq(marketplaceProducts.id, item.productId));
        if (!product[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        
        const subtotal = parseFloat(product[0].price) * item.quantity;
        totalAmount += subtotal;
        orderItems.push({ productId: item.productId, quantity: item.quantity, unitPrice: parseFloat(product[0].price), subtotal });
      }
      
      const orderNumber = `ORD-${Date.now()}`;
      const orderResult = await db.insert(marketplaceOrders).values({
        buyerId: ctx.user.id,
        sellerId: input.sellerId,
        orderNumber,
        totalAmount: totalAmount.toString(),
        deliveryAddress: input.deliveryAddress,
        notes: input.notes,
        status: "pending",
        paymentStatus: "unpaid",
      });
      
      const orderId = (orderResult as any).insertId || 1;
      
      // Insert order items
      for (const item of orderItems) {
        await db.insert(marketplaceOrderItems).values({
          orderId: orderId,
          productId: item.productId,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          subtotal: item.subtotal.toString(),
        });
      }
      
      return { orderId, orderNumber, totalAmount };
    }),

  updateOrderStatus: protectedProcedure
    .input(z.object({ orderId: z.number(), status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled", "refunded"]) }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      return await db.update(marketplaceOrders)
        .set({ status: input.status })
        .where(and(eq(marketplaceOrders.id, input.orderId), eq(marketplaceOrders.sellerId, ctx.user.id)));
    }),

  // ========== TRANSACTIONS ==========
  recordTransaction: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      amount: z.number().positive(),
      paymentMethod: z.string(),
      reference: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      const result = await db.insert(marketplaceTransactions).values({
        orderId: input.orderId,
        amount: input.amount.toString(),
        paymentMethod: input.paymentMethod,
        reference: input.reference,
        status: "completed",
        completedAt: new Date(),
      });
      
      // Update order payment status
      await db.update(marketplaceOrders)
        .set({ paymentStatus: "paid" })
        .where(eq(marketplaceOrders.id, input.orderId));
      
      return result;
    }),

  // ========== REVIEWS ==========
  getProductReviews: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      return await db.select().from(marketplaceReviews)
        .where(eq(marketplaceReviews.productId, input.productId))
        .orderBy(desc(marketplaceReviews.createdAt));
    }),

  createReview: protectedProcedure
    .input(z.object({
      productId: z.number(),
      orderId: z.number().optional(),
      rating: z.number().min(1).max(5),
      title: z.string().optional(),
      comment: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      return await db.insert(marketplaceReviews).values({
        productId: input.productId,
        buyerId: ctx.user.id,
        orderId: input.orderId,
        rating: input.rating,
        title: input.title,
        comment: input.comment,
      });
    }),

  // ========== ANALYTICS ==========
  getSellerStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    
    const products = await db.select().from(marketplaceProducts).where(eq(marketplaceProducts.sellerId, ctx.user.id));
    const orders = await db.select().from(marketplaceOrders).where(eq(marketplaceOrders.sellerId, ctx.user.id));
    
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
    const completedOrders = orders.filter(o => o.status === "delivered").length;
    
    return {
      totalProducts: products.length,
      activeProducts: products.filter(p => p.status === "active").length,
      totalOrders: orders.length,
      completedOrders,
      totalRevenue,
      averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
    };
  }),
});
