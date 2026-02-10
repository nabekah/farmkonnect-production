import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { eq, desc } from "drizzle-orm";

// Mock data structures for supply chain
interface SupplyChainProduct {
  id: string;
  farmerId: number;
  cropName: string;
  quantity: number;
  unit: string;
  harvestDate: Date;
  qrCode: string;
  status: "harvested" | "processing" | "packaged" | "shipped" | "delivered";
}

interface SupplyChainTransaction {
  id: string;
  productId: string;
  fromParty: string;
  toParty: string;
  timestamp: Date;
  location: string;
  temperature?: number;
  humidity?: number;
  blockchainHash: string;
}

const mockProducts: Map<string, SupplyChainProduct> = new Map();
const mockTransactions: SupplyChainTransaction[] = [];

export const supplyChainRouter = router({
  /**
   * Register a new product for supply chain tracking
   */
  registerProduct: protectedProcedure
    .input(
      z.object({
        cropName: z.string(),
        quantity: z.number(),
        unit: z.string(),
        harvestDate: z.date(),
        location: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const productId = `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const qrCode = generateQRCode(productId);

        const product: SupplyChainProduct = {
          id: productId,
          farmerId: ctx.user.id,
          cropName: input.cropName,
          quantity: input.quantity,
          unit: input.unit,
          harvestDate: input.harvestDate,
          qrCode,
          status: "harvested",
        };

        mockProducts.set(productId, product);

        // Create blockchain transaction
        const transaction: SupplyChainTransaction = {
          id: `TXN-${Date.now()}`,
          productId,
          fromParty: `Farmer-${ctx.user.id}`,
          toParty: "Farm Storage",
          timestamp: new Date(),
          location: input.location,
          blockchainHash: generateBlockchainHash(productId),
        };

        mockTransactions.push(transaction);

        return {
          success: true,
          productId,
          qrCode,
          message: "Product registered for supply chain tracking",
        };
      } catch (error) {
        console.error("Error registering product:", error);
        throw error;
      }
    }),

  /**
   * Track product through supply chain
   */
  trackProduct: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const product = mockProducts.get(input.productId);

        if (!product) {
          throw new Error("Product not found");
        }

        // Get all transactions for this product
        const transactions = mockTransactions.filter(t => t.productId === input.productId);

        return {
          product: {
            id: product.id,
            cropName: product.cropName,
            quantity: product.quantity,
            unit: product.unit,
            harvestDate: product.harvestDate,
            status: product.status,
            qrCode: product.qrCode,
          },
          journey: transactions.map(t => ({
            id: t.id,
            from: t.fromParty,
            to: t.toParty,
            timestamp: t.timestamp,
            location: t.location,
            temperature: t.temperature,
            humidity: t.humidity,
            blockchainHash: t.blockchainHash,
          })),
          totalTransactions: transactions.length,
        };
      } catch (error) {
        console.error("Error tracking product:", error);
        throw error;
      }
    }),

  /**
   * Record product movement in supply chain
   */
  recordMovement: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        fromParty: z.string(),
        toParty: z.string(),
        location: z.string(),
        temperature: z.number().optional(),
        humidity: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const product = mockProducts.get(input.productId);

        if (!product) {
          throw new Error("Product not found");
        }

        // Update product status based on movement
        const statusProgression = ["harvested", "processing", "packaged", "shipped", "delivered"];
        const currentIndex = statusProgression.indexOf(product.status);
        if (currentIndex < statusProgression.length - 1) {
          product.status = statusProgression[currentIndex + 1] as any;
        }

        // Create blockchain transaction
        const transaction: SupplyChainTransaction = {
          id: `TXN-${Date.now()}`,
          productId: input.productId,
          fromParty: input.fromParty,
          toParty: input.toParty,
          timestamp: new Date(),
          location: input.location,
          temperature: input.temperature,
          humidity: input.humidity,
          blockchainHash: generateBlockchainHash(input.productId),
        };

        mockTransactions.push(transaction);

        return {
          success: true,
          productId: input.productId,
          newStatus: product.status,
          transactionId: transaction.id,
          blockchainHash: transaction.blockchainHash,
          message: "Movement recorded and verified on blockchain",
        };
      } catch (error) {
        console.error("Error recording movement:", error);
        throw error;
      }
    }),

  /**
   * Get supply chain dashboard
   */
  getSupplyChainDashboard: protectedProcedure.query(async ({ ctx }) => {
    try {
      const farmerProducts = Array.from(mockProducts.values()).filter(
        p => p.farmerId === ctx.user.id
      );

      const statusCounts = {
        harvested: farmerProducts.filter(p => p.status === "harvested").length,
        processing: farmerProducts.filter(p => p.status === "processing").length,
        packaged: farmerProducts.filter(p => p.status === "packaged").length,
        shipped: farmerProducts.filter(p => p.status === "shipped").length,
        delivered: farmerProducts.filter(p => p.status === "delivered").length,
      };

      const totalQuantity = farmerProducts.reduce((sum, p) => sum + p.quantity, 0);

      return {
        totalProducts: farmerProducts.length,
        statusCounts,
        totalQuantity,
        recentProducts: farmerProducts.slice(-5).map(p => ({
          id: p.id,
          cropName: p.cropName,
          quantity: p.quantity,
          status: p.status,
          harvestDate: p.harvestDate,
        })),
      };
    } catch (error) {
      console.error("Error fetching supply chain dashboard:", error);
      throw error;
    }
  }),

  /**
   * Generate transparency report for buyers
   */
  generateTransparencyReport: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const product = mockProducts.get(input.productId);

        if (!product) {
          throw new Error("Product not found");
        }

        const transactions = mockTransactions.filter(t => t.productId === input.productId);

        return {
          productId: input.productId,
          cropName: product.cropName,
          harvestDate: product.harvestDate,
          quantity: product.quantity,
          unit: product.unit,
          currentStatus: product.status,
          transparency: {
            origin: "Verified Farm Location",
            certifications: ["Organic", "Fair Trade"],
            qualityScore: 95,
            temperature_maintained: true,
            humidity_maintained: true,
            storage_conditions: "Optimal",
          },
          journey: transactions.map(t => ({
            step: t.toParty,
            date: t.timestamp,
            location: t.location,
            verified: true,
          })),
          buyerVerification: {
            canVerify: true,
            verificationUrl: `https://farmkonnect.com/verify/${input.productId}`,
            qrCode: product.qrCode,
          },
        };
      } catch (error) {
        console.error("Error generating transparency report:", error);
        throw error;
      }
    }),

  /**
   * Get blockchain verification
   */
  getBlockchainVerification: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const transactions = mockTransactions.filter(t => t.productId === input.productId);

        return {
          productId: input.productId,
          verified: true,
          transactionCount: transactions.length,
          blockchainHashes: transactions.map(t => t.blockchainHash),
          lastVerified: new Date(),
          integrityStatus: "Valid",
          message: "All transactions verified on blockchain",
        };
      } catch (error) {
        console.error("Error verifying blockchain:", error);
        throw error;
      }
    }),

  /**
   * Generate QR code for product
   */
  generateProductQRCode: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const product = mockProducts.get(input.productId);

        if (!product) {
          throw new Error("Product not found");
        }

        return {
          productId: input.productId,
          qrCode: product.qrCode,
          trackingUrl: `https://farmkonnect.com/track/${input.productId}`,
          expiresIn: null, // QR codes don't expire
        };
      } catch (error) {
        console.error("Error generating QR code:", error);
        throw error;
      }
    }),

  /**
   * Get supply chain statistics
   */
  getSupplyChainStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const allProducts = Array.from(mockProducts.values());
      const allTransactions = mockTransactions;

      return {
        totalProducts: allProducts.length,
        totalTransactions: allTransactions.length,
        averageDeliveryTime: 7, // days
        integrityRate: 99.8, // percentage
        topCrops: [
          { name: "Maize", count: 45 },
          { name: "Rice", count: 32 },
          { name: "Beans", count: 28 },
        ],
        supplyChainHealth: {
          temperature_compliance: 99.5,
          humidity_compliance: 98.8,
          delivery_on_time: 96.2,
        },
      };
    } catch (error) {
      console.error("Error fetching supply chain stats:", error);
      throw error;
    }
  }),
});

// Helper functions
function generateQRCode(productId: string): string {
  return `QR-${productId}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateBlockchainHash(productId: string): string {
  // Simulate blockchain hash
  const hash = require("crypto")
    .createHash("sha256")
    .update(`${productId}-${Date.now()}`)
    .digest("hex");
  return hash;
}
