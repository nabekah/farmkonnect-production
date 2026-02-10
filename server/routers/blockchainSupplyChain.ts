import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { supplyChainRecords, blockchainTransactions, productCertifications, auditTrail } from "../../drizzle/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import crypto from "crypto";

/**
 * Blockchain Supply Chain Router
 * Handles product traceability, certification, and supply chain transparency
 */
export const blockchainSupplyChainRouter = router({
  /**
   * Create a new supply chain record for a product
   */
  createSupplyChainRecord: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        farmId: z.number(),
        productName: z.string(),
        productType: z.enum(["crop", "livestock", "processed"]),
        batchNumber: z.string(),
        quantity: z.number(),
        unit: z.string(),
        harvestDate: z.string(),
        productionMethod: z.string().optional(),
        certifications: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      
      // Generate blockchain hash
      const blockchainHash = crypto
        .createHash("sha256")
        .update(JSON.stringify(input) + Date.now())
        .digest("hex");

      const result = await db.insert(supplyChainRecords).values({
        productId: input.productId,
        farmId: input.farmId,
        productName: input.productName,
        productType: input.productType,
        batchNumber: input.batchNumber,
        quantity: input.quantity.toString(),
        unit: input.unit,
        harvestDate: new Date(input.harvestDate),
        productionMethod: input.productionMethod,
        certifications: input.certifications ? JSON.stringify(input.certifications) : null,
        blockchainHash,
        status: "pending",
      });

      // Create initial blockchain transaction
      await db.insert(blockchainTransactions).values({
        supplyChainId: result[0],
        transactionHash: blockchainHash,
        previousHash: null,
        eventType: "production",
        actor: "farmer",
        actorId: ctx.user.id,
        location: "Farm",
        notes: `Product batch ${input.batchNumber} created`,
        timestamp: new Date(),
      });

      return { id: result[0], blockchainHash };
    }),

  /**
   * Add a transaction event to the supply chain
   */
  addBlockchainTransaction: protectedProcedure
    .input(
      z.object({
        supplyChainId: z.number(),
        eventType: z.enum(["production", "processing", "transport", "storage", "sale", "certification"]),
        location: z.string(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        temperature: z.number().optional(),
        humidity: z.number().optional(),
        notes: z.string().optional(),
        documentHash: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();

      // Get previous transaction to create hash chain
      const previousTransaction = await db
        .select()
        .from(blockchainTransactions)
        .where(eq(blockchainTransactions.supplyChainId, input.supplyChainId))
        .orderBy(desc(blockchainTransactions.id))
        .limit(1);

      const previousHash = previousTransaction[0]?.transactionHash || null;

      // Generate new transaction hash
      const transactionData = JSON.stringify(input) + Date.now();
      const transactionHash = crypto
        .createHash("sha256")
        .update(transactionData + previousHash)
        .digest("hex");

      const result = await db.insert(blockchainTransactions).values({
        supplyChainId: input.supplyChainId,
        transactionHash,
        previousHash,
        eventType: input.eventType,
        actor: ctx.user.role || "user",
        actorId: ctx.user.id,
        location: input.location,
        latitude: input.latitude ? input.latitude.toString() : null,
        longitude: input.longitude ? input.longitude.toString() : null,
        temperature: input.temperature ? input.temperature.toString() : null,
        humidity: input.humidity ? input.humidity.toString() : null,
        notes: input.notes,
        documentHash: input.documentHash,
        timestamp: new Date(),
      });

      // Log audit trail
      await db.insert(auditTrail).values({
        supplyChainId: input.supplyChainId,
        userId: ctx.user.id,
        action: "add_transaction",
        entityType: "blockchainTransaction",
        entityId: result[0],
        newValues: JSON.stringify(input),
        timestamp: new Date(),
      });

      return { id: result[0], transactionHash };
    }),

  /**
   * Add certification to product
   */
  addCertification: protectedProcedure
    .input(
      z.object({
        supplyChainId: z.number(),
        certificationType: z.string(),
        certifyingBody: z.string(),
        certificateNumber: z.string(),
        issueDate: z.string(),
        expiryDate: z.string(),
        verificationUrl: z.string().optional(),
        documentHash: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();

      const result = await db.insert(productCertifications).values({
        supplyChainId: input.supplyChainId,
        certificationType: input.certificationType,
        certifyingBody: input.certifyingBody,
        certificateNumber: input.certificateNumber,
        issueDate: new Date(input.issueDate),
        expiryDate: new Date(input.expiryDate),
        verificationUrl: input.verificationUrl,
        documentHash: input.documentHash,
        status: "valid",
      });

      // Log audit trail
      await db.insert(auditTrail).values({
        supplyChainId: input.supplyChainId,
        userId: ctx.user.id,
        action: "add_certification",
        entityType: "productCertification",
        entityId: result[0],
        newValues: JSON.stringify(input),
        timestamp: new Date(),
      });

      return { id: result[0] };
    }),

  /**
   * Get supply chain record with full history
   */
  getSupplyChainRecord: publicProcedure
    .input(z.object({ supplyChainId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();

      const record = await db
        .select()
        .from(supplyChainRecords)
        .where(eq(supplyChainRecords.id, input.supplyChainId));

      if (!record.length) return null;

      // Get all transactions
      const transactions = await db
        .select()
        .from(blockchainTransactions)
        .where(eq(blockchainTransactions.supplyChainId, input.supplyChainId))
        .orderBy(blockchainTransactions.timestamp);

      // Get all certifications
      const certifications = await db
        .select()
        .from(productCertifications)
        .where(eq(productCertifications.supplyChainId, input.supplyChainId));

      return {
        ...record[0],
        transactions,
        certifications,
      };
    }),

  /**
   * Get all supply chain records for a farm
   */
  getFarmSupplyChainRecords: publicProcedure
    .input(
      z.object({
        farmId: z.number(),
        status: z.enum(["pending", "verified", "certified", "archived"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();

      const conditions = [eq(supplyChainRecords.farmId, input.farmId)];
      if (input.status) {
        conditions.push(eq(supplyChainRecords.status, input.status));
      }

      return await db
        .select()
        .from(supplyChainRecords)
        .where(and(...conditions))
        .orderBy(desc(supplyChainRecords.createdAt));
    }),

  /**
   * Verify supply chain record (mark as verified)
   */
  verifySupplyChainRecord: protectedProcedure
    .input(z.object({ supplyChainId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();

      await db
        .update(supplyChainRecords)
        .set({ status: "verified" })
        .where(eq(supplyChainRecords.id, input.supplyChainId));

      // Log audit trail
      await db.insert(auditTrail).values({
        supplyChainId: input.supplyChainId,
        userId: ctx.user.id,
        action: "verify_record",
        entityType: "supplyChainRecord",
        entityId: input.supplyChainId,
        newValues: JSON.stringify({ status: "verified" }),
        timestamp: new Date(),
      });

      return { success: true };
    }),

  /**
   * Get audit trail for a supply chain record
   */
  getAuditTrail: publicProcedure
    .input(z.object({ supplyChainId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();

      return await db
        .select()
        .from(auditTrail)
        .where(eq(auditTrail.supplyChainId, input.supplyChainId))
        .orderBy(desc(auditTrail.timestamp));
    }),

  /**
   * Get blockchain transaction history
   */
  getTransactionHistory: publicProcedure
    .input(z.object({ supplyChainId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();

      return await db
        .select()
        .from(blockchainTransactions)
        .where(eq(blockchainTransactions.supplyChainId, input.supplyChainId))
        .orderBy(blockchainTransactions.timestamp);
    }),

  /**
   * Search supply chain records by batch number
   */
  searchByBatchNumber: publicProcedure
    .input(z.object({ batchNumber: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();

      return await db
        .select()
        .from(supplyChainRecords)
        .where(eq(supplyChainRecords.batchNumber, input.batchNumber));
    }),

  /**
   * Get certification status
   */
  getCertificationStatus: publicProcedure
    .input(z.object({ supplyChainId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();

      const certifications = await db
        .select()
        .from(productCertifications)
        .where(eq(productCertifications.supplyChainId, input.supplyChainId));

      return {
        totalCertifications: certifications.length,
        validCertifications: certifications.filter((c) => c.status === "valid").length,
        expiredCertifications: certifications.filter((c) => c.status === "expired").length,
        certifications,
      };
    }),
});
