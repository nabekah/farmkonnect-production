import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { eq, and, desc } from "drizzle-orm";
import { expenseReceipts, expenses } from "../../drizzle/schema";
import { storagePut } from "../storage";

export const expenseReceiptsRouter = router({
  /**
   * Upload and process expense receipt
   */
  uploadReceipt: protectedProcedure
    .input(z.object({
      expenseId: z.number(),
      farmId: z.string(),
      fileName: z.string(),
      fileSize: z.number(),
      mimeType: z.string(),
      base64Data: z.string() // Base64 encoded file data
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const farmId = parseInt(input.farmId);

      // Convert base64 to buffer
      const buffer = Buffer.from(input.base64Data, 'base64');

      // Upload to S3
      const fileKey = `receipts/${farmId}/${input.expenseId}/${Date.now()}-${input.fileName}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      // Create receipt record
      const [result] = await db.insert(expenseReceipts).values({
        expenseId: input.expenseId,
        farmId,
        receiptUrl: url,
        fileName: input.fileName,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        uploadedBy: ctx.user.id,
        ocrProcessed: false
      });

      // Queue OCR processing (in real implementation, this would be async)
      // For now, we'll trigger it synchronously
      await processReceiptOCR(result.insertId, url, db);

      return {
        receiptId: result.insertId,
        url,
        success: true
      };
    }),

  /**
   * Get receipts for an expense
   */
  getReceiptsForExpense: protectedProcedure
    .input(z.object({
      expenseId: z.number()
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const receipts = await db
        .select()
        .from(expenseReceipts)
        .where(eq(expenseReceipts.expenseId, input.expenseId))
        .orderBy(desc(expenseReceipts.uploadedAt));

      return receipts;
    }),

  /**
   * Get all receipts for a farm
   */
  getReceiptsForFarm: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      limit: z.number().default(50),
      offset: z.number().default(0),
      ocrProcessedOnly: z.boolean().optional()
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const farmId = parseInt(input.farmId);
      const conditions = [eq(expenseReceipts.farmId, farmId)];

      if (input.ocrProcessedOnly) {
        conditions.push(eq(expenseReceipts.ocrProcessed, true));
      }

      const receipts = await db
        .select()
        .from(expenseReceipts)
        .where(and(...conditions))
        .orderBy(desc(expenseReceipts.uploadedAt))
        .limit(input.limit)
        .offset(input.offset);

      return receipts;
    }),

  /**
   * Update receipt with OCR data
   */
  updateReceiptOCRData: protectedProcedure
    .input(z.object({
      receiptId: z.number(),
      extractedAmount: z.number().optional(),
      extractedDate: z.date().optional(),
      extractedVendor: z.string().optional(),
      extractedDescription: z.string().optional(),
      ocrConfidence: z.number().min(0).max(100).optional(),
      autoUpdateExpense: z.boolean().default(false)
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const extractedDateStr = input.extractedDate instanceof Date 
        ? input.extractedDate.toISOString().split('T')[0]
        : input.extractedDate?.toString();

      // Update receipt with OCR data
      await db.update(expenseReceipts)
        .set({
          extractedAmount: input.extractedAmount,
          extractedDate: extractedDateStr,
          extractedVendor: input.extractedVendor,
          extractedDescription: input.extractedDescription,
          ocrConfidence: input.ocrConfidence,
          ocrProcessed: true
        })
        .where(eq(expenseReceipts.id, input.receiptId));

      // Optionally auto-update the linked expense
      if (input.autoUpdateExpense) {
        const receipt = await db
          .select()
          .from(expenseReceipts)
          .where(eq(expenseReceipts.id, input.receiptId));

        if (receipt.length > 0 && input.extractedAmount) {
          await db.update(expenses)
            .set({
              amount: input.extractedAmount,
              vendor: input.extractedVendor,
              description: input.extractedDescription || undefined
            })
            .where(eq(expenses.id, receipt[0].expenseId));
        }
      }

      return { success: true };
    }),

  /**
   * Delete receipt
   */
  deleteReceipt: protectedProcedure
    .input(z.object({
      receiptId: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(expenseReceipts)
        .where(eq(expenseReceipts.id, input.receiptId));

      return { success: true };
    }),

  /**
   * Get receipt OCR confidence stats for a farm
   */
  getOCRStats: protectedProcedure
    .input(z.object({
      farmId: z.string()
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const farmId = parseInt(input.farmId);

      const receipts = await db
        .select()
        .from(expenseReceipts)
        .where(and(
          eq(expenseReceipts.farmId, farmId),
          eq(expenseReceipts.ocrProcessed, true)
        ));

      const totalReceipts = receipts.length;
      const avgConfidence = receipts.length > 0
        ? receipts.reduce((sum, r) => sum + (Number(r.ocrConfidence) || 0), 0) / receipts.length
        : 0;

      const highConfidence = receipts.filter(r => Number(r.ocrConfidence || 0) >= 90).length;
      const mediumConfidence = receipts.filter(r => Number(r.ocrConfidence || 0) >= 70 && Number(r.ocrConfidence || 0) < 90).length;
      const lowConfidence = receipts.filter(r => Number(r.ocrConfidence || 0) < 70).length;

      return {
        totalReceipts,
        avgConfidence: Math.round(avgConfidence),
        highConfidence,
        mediumConfidence,
        lowConfidence
      };
    })
});

/**
 * Process receipt with OCR (mock implementation)
 * In production, this would call an actual OCR service like Google Vision API
 */
async function processReceiptOCR(receiptId: number, receiptUrl: string, db: any) {
  try {
    // Mock OCR processing - in production, call actual OCR service
    const mockOCRData = {
      amount: Math.random() * 1000 + 50,
      date: new Date(),
      vendor: "Sample Vendor",
      description: "Receipt from OCR",
      confidence: Math.random() * 30 + 70 // 70-100
    };

    // Update receipt with OCR data
    await db.update(expenseReceipts)
      .set({
        extractedAmount: mockOCRData.amount,
        extractedDate: mockOCRData.date.toISOString().split('T')[0],
        extractedVendor: mockOCRData.vendor,
        extractedDescription: mockOCRData.description,
        ocrConfidence: mockOCRData.confidence,
        ocrProcessed: true
      })
      .where(eq(expenseReceipts.id, receiptId));

    console.log(`OCR processing completed for receipt ${receiptId}`);
  } catch (error) {
    console.error(`OCR processing failed for receipt ${receiptId}:`, error);
  }
}
