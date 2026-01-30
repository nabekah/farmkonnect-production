import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { transportRequests, orders, orderItems, productListings } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const transportRouter = router({
  // Transport Requests
  requests: router({
    list: protectedProcedure
      .input(z.object({
        orderId: z.number().optional(),
        transporterUserId: z.number().optional(),
        status: z.enum(["requested", "accepted", "in_transit", "delivered", "cancelled"]).optional(),
      }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];
        
        const conditions = [];
        if (input.orderId) conditions.push(eq(transportRequests.orderId, input.orderId));
        if (input.transporterUserId) conditions.push(eq(transportRequests.transporterUserId, input.transporterUserId));
        if (input.status) conditions.push(eq(transportRequests.status, input.status));
        
        // If user is a transporter, show only their requests
        if (ctx.user.role === "transporter") {
          conditions.push(eq(transportRequests.transporterUserId, ctx.user.id));
        }
        
        if (conditions.length > 0) {
          return await db.select().from(transportRequests).where(and(...conditions));
        }
        return await db.select().from(transportRequests);
      }),

    create: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        pickupLocation: z.string(),
        deliveryLocation: z.string(),
        requestDate: z.date(),
        estimatedDeliveryDate: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        return await db.insert(transportRequests).values({
          orderId: input.orderId,
          pickupLocation: input.pickupLocation,
          deliveryLocation: input.deliveryLocation,
          requestDate: input.requestDate,
          estimatedDeliveryDate: input.estimatedDeliveryDate,
          status: "requested",
        });
      }),

    accept: protectedProcedure
      .input(z.object({
        id: z.number(),
        estimatedDeliveryDate: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        if (ctx.user.role !== "transporter" && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only transporters can accept requests" });
        }
        
        return await db.update(transportRequests)
          .set({
            transporterUserId: ctx.user.id,
            status: "accepted",
            estimatedDeliveryDate: input.estimatedDeliveryDate,
          })
          .where(eq(transportRequests.id, input.id));
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["requested", "accepted", "in_transit", "delivered", "cancelled"]),
        actualDeliveryDate: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        const updateData: any = { status: input.status };
        if (input.actualDeliveryDate) {
          updateData.actualDeliveryDate = input.actualDeliveryDate;
        }
        
        return await db.update(transportRequests)
          .set(updateData)
          .where(eq(transportRequests.id, input.id));
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        return await db.delete(transportRequests)
          .where(eq(transportRequests.id, input.id));
      }),
  }),

  // Orders (for logistics integration)
  orders: router({
    list: protectedProcedure
      .input(z.object({
        buyerUserId: z.number().optional(),
        status: z.enum(["pending", "confirmed", "fulfilled", "cancelled"]).optional(),
      }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];
        
        const conditions = [];
        if (input.buyerUserId) conditions.push(eq(orders.buyerUserId, input.buyerUserId));
        if (input.status) conditions.push(eq(orders.status, input.status));
        
        // If user is a buyer, show only their orders
        if (ctx.user.role === "buyer") {
          conditions.push(eq(orders.buyerUserId, ctx.user.id));
        }
        
        if (conditions.length > 0) {
          return await db.select().from(orders).where(and(...conditions));
        }
        return await db.select().from(orders);
      }),

    create: protectedProcedure
      .input(z.object({
        orderDate: z.date(),
        totalAmount: z.string(),
        items: z.array(z.object({
          listingId: z.number(),
          quantityOrdered: z.string(),
          priceAtOrder: z.string(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        // Create order
        const [orderResult] = await db.insert(orders).values({
          buyerUserId: ctx.user.id,
          orderDate: input.orderDate,
          totalAmount: input.totalAmount as any,
          status: "pending",
        });
        
        const orderId = (orderResult as any).insertId;
        
        // Create order items
        for (const item of input.items) {
          await db.insert(orderItems).values({
            orderId: orderId,
            listingId: item.listingId,
            quantityOrdered: item.quantityOrdered as any,
            priceAtOrder: item.priceAtOrder as any,
          });
        }
        
        return { orderId, success: true };
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "confirmed", "fulfilled", "cancelled"]),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        return await db.update(orders)
          .set({ status: input.status })
          .where(eq(orders.id, input.id));
      }),

    getOrderItems: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        return await db.select().from(orderItems)
          .where(eq(orderItems.orderId, input.orderId));
      }),
  }),

  // Product Listings (for logistics integration)
  listings: router({
    list: protectedProcedure
      .input(z.object({
        farmId: z.number().optional(),
        productType: z.enum(["crop", "livestock", "processed"]).optional(),
        status: z.enum(["active", "sold_out", "delisted"]).optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        const conditions = [];
        if (input.farmId) conditions.push(eq(productListings.farmId, input.farmId));
        if (input.productType) conditions.push(eq(productListings.productType, input.productType));
        if (input.status) conditions.push(eq(productListings.status, input.status));
        
        if (conditions.length > 0) {
          return await db.select().from(productListings).where(and(...conditions));
        }
        return await db.select().from(productListings);
      }),

    create: protectedProcedure
      .input(z.object({
        farmId: z.number(),
        productType: z.enum(["crop", "livestock", "processed"]),
        productName: z.string(),
        quantityAvailable: z.string(),
        unit: z.string(),
        unitPrice: z.string(),
        description: z.string().optional(),
        listingDate: z.date(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        return await db.insert(productListings).values({
          farmId: input.farmId,
          productType: input.productType,
          productName: input.productName,
          quantityAvailable: input.quantityAvailable as any,
          unit: input.unit,
          unitPrice: input.unitPrice as any,
          description: input.description,
          listingDate: input.listingDate,
          status: "active",
        });
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["active", "sold_out", "delisted"]),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        return await db.update(productListings)
          .set({ status: input.status })
          .where(eq(productListings.id, input.id));
      }),
  }),
});
