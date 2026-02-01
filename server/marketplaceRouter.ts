import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { TRPCError } from "@trpc/server";
import {
  marketplaceProducts,
  marketplaceCart,
  marketplaceOrders,
  marketplaceOrderItems,
  marketplaceTransactions,
  marketplaceProductImages,
  marketplaceProductReviews,
  marketplaceReviews,
  marketplaceBulkPricingTiers,
  marketplaceDeliveryZones,
  users,
} from "../drizzle/schema";
import { eq, and, desc, like, inArray } from "drizzle-orm";
import { storagePut } from "./storage";
import { sendOrderNotificationToBuyer, sendOrderNotificationToSeller, validateGhanaPhone, sendSMS } from "./_core/sms";

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
    
    const cartItems = await db.select().from(marketplaceCart)
      .where(eq(marketplaceCart.userId, ctx.user.id));
    
    // Fetch product details for each cart item
    const items = [];
    for (const cartItem of cartItems) {
      const product = await db.select().from(marketplaceProducts)
        .where(eq(marketplaceProducts.id, cartItem.productId))
        .limit(1);
      
      if (product.length > 0) {
        items.push({
          productId: product[0].id,
          productName: product[0].name,
          price: product[0].price,
          quantity: parseFloat(cartItem.quantity), // Convert decimal to number
          unit: product[0].unit,
          imageUrl: product[0].imageUrl || undefined,
        });
      }
    }
    
    return items;
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
        // Sellers see orders containing their products
        const sellerProducts = await db.select({ id: marketplaceProducts.id })
          .from(marketplaceProducts)
          .where(eq(marketplaceProducts.sellerId, ctx.user.id));
        
        const productIds = sellerProducts.map(p => p.id);
        if (productIds.length === 0) return [];
        
        // Find orders containing seller's products
        const orderItems = await db.select({ orderId: marketplaceOrderItems.orderId })
          .from(marketplaceOrderItems)
          .where(inArray(marketplaceOrderItems.productId, productIds));
        
        const orderIds = Array.from(new Set(orderItems.map(item => item.orderId)));
        if (orderIds.length === 0) return [];
        
        return await db.select().from(marketplaceOrders)
          .where(inArray(marketplaceOrders.id, orderIds))
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
      
      // Send SMS notifications
      // Get buyer and seller phone numbers
      const buyer = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      const seller = await db.select().from(users).where(eq(users.id, input.sellerId)).limit(1);

      if (buyer[0]?.phone) {
        const phoneValidation = validateGhanaPhone(buyer[0].phone);
        if (phoneValidation.valid) {
          await sendOrderNotificationToBuyer(
            phoneValidation.formatted!,
            orderNumber,
            "pending"
          );
        }
      }

      if (seller[0]?.phone) {
        const phoneValidation = validateGhanaPhone(seller[0].phone);
        if (phoneValidation.valid) {
          await sendOrderNotificationToSeller(
            phoneValidation.formatted!,
            orderNumber,
            ctx.user.name || "Customer",
            totalAmount.toString()
          );
        }
      }

      return { orderId, orderNumber, totalAmount };
    }),

  updateOrderStatus: protectedProcedure
    .input(z.object({ orderId: z.number(), status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled", "refunded"]) }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      const result = await db.update(marketplaceOrders)
        .set({ status: input.status })
        .where(and(eq(marketplaceOrders.id, input.orderId), eq(marketplaceOrders.sellerId, ctx.user.id)));

      // Send SMS notification to buyer about status change
      const order = await db.select().from(marketplaceOrders).where(eq(marketplaceOrders.id, input.orderId)).limit(1);
      if (order[0]) {
        const buyer = await db.select().from(users).where(eq(users.id, order[0].buyerId)).limit(1);
        if (buyer[0]?.phone) {
          const phoneValidation = validateGhanaPhone(buyer[0].phone);
          if (phoneValidation.valid) {
            await sendOrderNotificationToBuyer(
              phoneValidation.formatted!,
              order[0].orderNumber,
              input.status,
              order[0].trackingNumber || undefined
            );
          }
        }
      }

      return result;
    }),

  cancelOrder: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      // Verify order belongs to buyer and is pending
      const order = await db.select().from(marketplaceOrders)
        .where(and(
          eq(marketplaceOrders.id, input.orderId),
          eq(marketplaceOrders.buyerId, ctx.user.id),
          eq(marketplaceOrders.status, "pending")
        ))
        .limit(1);
      
      if (!order[0]) {
        throw new TRPCError({ 
          code: "NOT_FOUND", 
          message: "Order not found or cannot be cancelled" 
        });
      }
      
      // Update order status to cancelled
      const result = await db.update(marketplaceOrders)
        .set({ status: "cancelled" })
        .where(eq(marketplaceOrders.id, input.orderId));
      
      // Send SMS notification to seller about cancellation
      const seller = await db.select().from(users)
        .where(eq(users.id, order[0].sellerId))
        .limit(1);
      
      if (seller[0]?.phone) {
        const phoneValidation = validateGhanaPhone(seller[0].phone);
        if (phoneValidation.valid) {
          // Send cancellation notification
          await sendSMS({
            to: phoneValidation.formatted!,
            message: `Order ${order[0].orderNumber} has been cancelled by ${ctx.user.name || "Customer"}.`
          });
        }
      }
      
      return { success: true, orderNumber: order[0].orderNumber };
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
  // Old reviews table (deprecated - use getProductReviews instead)
  getOldReviews: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      return await db.select().from(marketplaceProductReviews)
        .where(eq(marketplaceProductReviews.productId, input.productId))
        .orderBy(desc(marketplaceProductReviews.createdAt));
    }),

  createOldReview: protectedProcedure
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

  // ========== PRODUCT REVIEWS ==========
  getProductReviews: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      return await db.select().from(marketplaceProductReviews)
        .where(eq(marketplaceProductReviews.productId, input.productId))
        .orderBy(desc(marketplaceProductReviews.createdAt));
    }),

  createProductReview: protectedProcedure
    .input(z.object({
      productId: z.number(),
      rating: z.number().min(1).max(5),
      comment: z.string().optional(),
      verifiedPurchase: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      // Insert review
      const [review] = await db.insert(marketplaceProductReviews).values({
        productId: input.productId,
        userId: ctx.user.id,
        rating: input.rating,
        comment: input.comment || null,
        verifiedPurchase: input.verifiedPurchase || false,
      });
      
      // Update product average rating and review count
      const reviews = await db.select().from(marketplaceProductReviews)
        .where(eq(marketplaceProductReviews.productId, input.productId));
      
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      
      await db.update(marketplaceProducts)
        .set({ 
          rating: avgRating.toFixed(2),
          reviewCount: reviews.length 
        })
        .where(eq(marketplaceProducts.id, input.productId));
      
      return review;
    }),

  markReviewHelpful: protectedProcedure
    .input(z.object({ reviewId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      const [review] = await db.select().from(marketplaceProductReviews)
        .where(eq(marketplaceProductReviews.id, input.reviewId));
      
      if (!review) throw new TRPCError({ code: "NOT_FOUND", message: "Review not found" });
      
      return await db.update(marketplaceProductReviews)
        .set({ helpfulCount: review.helpfulCount + 1 })
        .where(eq(marketplaceProductReviews.id, input.reviewId));
    }),

  // ========== BULK PRICING TIERS ==========
  getBulkPricingTiers: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      return await db.select().from(marketplaceBulkPricingTiers)
        .where(eq(marketplaceBulkPricingTiers.productId, input.productId))
        .orderBy(marketplaceBulkPricingTiers.minQuantity);
    }),

  createBulkPricingTier: protectedProcedure
    .input(z.object({
      productId: z.number(),
      minQuantity: z.string(),
      maxQuantity: z.string().optional(),
      discountPercentage: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      // Verify product ownership
      const [product] = await db.select().from(marketplaceProducts)
        .where(eq(marketplaceProducts.id, input.productId));
      
      if (!product || product.sellerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }
      
      // Calculate discounted price
      const basePrice = parseFloat(product.price);
      const discount = parseFloat(input.discountPercentage);
      const discountedPrice = (basePrice * (1 - discount / 100)).toFixed(2);
      
      return await db.insert(marketplaceBulkPricingTiers).values({
        productId: input.productId,
        minQuantity: input.minQuantity,
        maxQuantity: input.maxQuantity || null,
        discountPercentage: input.discountPercentage,
        discountedPrice,
      });
    }),

  deleteBulkPricingTier: protectedProcedure
    .input(z.object({ tierId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      // Verify ownership through product
      const [tier] = await db.select().from(marketplaceBulkPricingTiers)
        .where(eq(marketplaceBulkPricingTiers.id, input.tierId));
      
      if (!tier) throw new TRPCError({ code: "NOT_FOUND" });
      
      const [product] = await db.select().from(marketplaceProducts)
        .where(eq(marketplaceProducts.id, tier.productId));
      
      if (!product || product.sellerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      
      return await db.delete(marketplaceBulkPricingTiers)
        .where(eq(marketplaceBulkPricingTiers.id, input.tierId));
    }),

  // ========== DELIVERY ZONES ==========
  getDeliveryZones: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    return await db.select().from(marketplaceDeliveryZones)
      .where(eq(marketplaceDeliveryZones.isActive, true));
  }),

  createDeliveryZone: protectedProcedure
    .input(z.object({
      name: z.string(),
      region: z.string(),
      shippingCost: z.string(),
      estimatedDays: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      // Only admin can create delivery zones
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      
      return await db.insert(marketplaceDeliveryZones).values({
        name: input.name,
        region: input.region,
        shippingCost: input.shippingCost,
        estimatedDays: input.estimatedDays,
        isActive: true,
      });
    }),

  updateDeliveryZone: protectedProcedure
    .input(z.object({
      zoneId: z.number(),
      name: z.string().optional(),
      region: z.string().optional(),
      shippingCost: z.string().optional(),
      estimatedDays: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      
      const updates: any = {};
      if (input.name) updates.name = input.name;
      if (input.region) updates.region = input.region;
      if (input.shippingCost) updates.shippingCost = input.shippingCost;
      if (input.estimatedDays !== undefined) updates.estimatedDays = input.estimatedDays;
      if (input.isActive !== undefined) updates.isActive = input.isActive;
      
      return await db.update(marketplaceDeliveryZones)
        .set(updates)
        .where(eq(marketplaceDeliveryZones.id, input.zoneId));
    }),

  deleteDeliveryZone: protectedProcedure
    .input(z.object({ zoneId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      
      return await db.delete(marketplaceDeliveryZones)
        .where(eq(marketplaceDeliveryZones.id, input.zoneId));
    }),

  // ========== CART MANAGEMENT ==========
  syncCart: protectedProcedure
    .input(z.object({
      items: z.array(z.object({
        productId: z.number(),
        productName: z.string(),
        price: z.string(),
        quantity: z.number(),
        unit: z.string(),
        imageUrl: z.string().optional(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      // Clear existing cart
      await db.delete(marketplaceCart).where(eq(marketplaceCart.userId, ctx.user.id));
      
      // Insert new cart items
      if (input.items.length > 0) {
        await db.insert(marketplaceCart).values(
          input.items.map(item => ({
            userId: ctx.user.id,
            productId: item.productId,
            quantity: item.quantity.toString(),
          }))
        );
      }
      
      return { success: true };
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
