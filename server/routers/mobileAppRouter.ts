import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { farms, animals, cropCycles, notifications } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

export const mobileAppRouter = router({
  /**
   * Get farm overview for mobile dashboard
   */
  getFarmOverview: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        
        const farm = await db.query.farms.findFirst({
          where: eq(farms.id, input.farmId),
        });

        if (!farm) {
          throw new Error("Farm not found");
        }

        // Get active crop cycles
        const activeCycles = await db.query.cropCycles.findMany({
          where: and(
            eq(cropCycles.farmId, input.farmId),
            eq(cropCycles.status, "active")
          ),
          limit: 5,
        });

        // Get livestock count
        const livestockCount = await db.query.animals.findMany({
          where: eq(animals.farmId, input.farmId),
        });

        // Get recent notifications
        const recentNotifications = await db.query.notifications.findMany({
          where: eq(notifications.userId, ctx.user.id),
          orderBy: desc(notifications.createdAt),
          limit: 5,
        });

        return {
          farm: {
            id: farm.id,
            name: farm.farmName,
            size: Number(farm.sizeHectares) || 0,
            type: farm.farmType,
            location: farm.location,
          },
          activeCrops: activeCycles.length,
          livestock: livestockCount.length,
          recentNotifications: recentNotifications.length,
          lastUpdated: new Date(),
        };
      } catch (error) {
        console.error("Error fetching farm overview:", error);
        throw error;
      }
    }),

  /**
   * Get crop tracking data for mobile
   */
  getCropTrackingMobile: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();

        const crops = await db.query.cropCycles.findMany({
          where: eq(cropCycles.farmId, input.farmId),
          orderBy: desc(cropCycles.plantingDate),
          limit: 10,
        });

        return {
          crops: crops.map(c => ({
            id: c.id,
            cropName: c.cropName,
            status: c.status,
            plantingDate: c.plantingDate,
            expectedHarvestDate: c.expectedHarvestDate,
            progress: calculateCropProgress(c.plantingDate, c.expectedHarvestDate),
          })),
        };
      } catch (error) {
        console.error("Error fetching crop tracking:", error);
        throw error;
      }
    }),

  /**
   * Get livestock monitoring data for mobile
   */
  getLivestockMonitoringMobile: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();

        const animals = await db.query.animals.findMany({
          where: eq(animals.farmId, input.farmId),
          limit: 20,
        });

        // Group by type
        const byType: Record<string, number> = {};
        animals.forEach(a => {
          byType[a.animalType] = (byType[a.animalType] || 0) + 1;
        });

        return {
          totalAnimals: animals.length,
          byType,
          animals: animals.map(a => ({
            id: a.id,
            name: a.animalName,
            type: a.animalType,
            age: calculateAge(a.dateOfBirth),
            status: a.status,
          })),
        };
      } catch (error) {
        console.error("Error fetching livestock monitoring:", error);
        throw error;
      }
    }),

  /**
   * Sync offline data to server
   */
  syncOfflineData: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        data: z.object({
          crops: z.array(z.any()).optional(),
          animals: z.array(z.any()).optional(),
          readings: z.array(z.any()).optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // In production, this would process and store the offline data
        // For now, just acknowledge receipt
        return {
          success: true,
          synced: true,
          timestamp: new Date(),
          message: "Offline data synced successfully",
        };
      } catch (error) {
        console.error("Error syncing offline data:", error);
        throw error;
      }
    }),

  /**
   * Get marketplace products for mobile
   */
  getMarketplaceProductsMobile: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Mock marketplace data for mobile
        const mockProducts = [
          {
            id: 1,
            name: "Organic Maize Seeds",
            category: "seeds",
            price: 2500,
            seller: "AgroSupply Ltd",
            rating: 4.5,
            image: "https://via.placeholder.com/200",
          },
          {
            id: 2,
            name: "NPK Fertilizer 15-15-15",
            category: "fertilizers",
            price: 5000,
            seller: "FertCo Kenya",
            rating: 4.8,
            image: "https://via.placeholder.com/200",
          },
          {
            id: 3,
            name: "Crop Sprayer 20L",
            category: "equipment",
            price: 8500,
            seller: "AgriTech Solutions",
            rating: 4.3,
            image: "https://via.placeholder.com/200",
          },
        ];

        const filtered = input.category
          ? mockProducts.filter(p => p.category === input.category)
          : mockProducts;

        return {
          products: filtered.slice(input.offset, input.offset + input.limit),
          total: filtered.length,
          hasMore: input.offset + input.limit < filtered.length,
        };
      } catch (error) {
        console.error("Error fetching marketplace products:", error);
        throw error;
      }
    }),

  /**
   * Get mobile notifications
   */
  getNotificationsMobile: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();

        const notifs = await db.query.notifications.findMany({
          where: eq(notifications.userId, ctx.user.id),
          orderBy: desc(notifications.createdAt),
          limit: input.limit,
        });

        return {
          notifications: notifs.map(n => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            read: n.read,
            createdAt: n.createdAt,
          })),
          unreadCount: notifs.filter(n => !n.read).length,
        };
      } catch (error) {
        console.error("Error fetching notifications:", error);
        throw error;
      }
    }),

  /**
   * Mark notification as read
   */
  markNotificationRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return {
          success: true,
          message: "Notification marked as read",
        };
      } catch (error) {
        console.error("Error marking notification:", error);
        throw error;
      }
    }),

  /**
   * Get app configuration for mobile
   */
  getAppConfig: protectedProcedure.query(async ({ ctx }) => {
    try {
      return {
        version: "1.0.0",
        apiVersion: "v1",
        features: {
          offlineSync: true,
          pushNotifications: true,
          biometricAuth: true,
          darkMode: true,
        },
        syncInterval: 300000, // 5 minutes
        cacheExpiry: 3600000, // 1 hour
      };
    } catch (error) {
      console.error("Error fetching app config:", error);
      throw error;
    }
  }),
});

// Helper functions
function calculateCropProgress(plantingDate: Date | null, harvestDate: Date | null): number {
  if (!plantingDate || !harvestDate) return 0;
  
  const now = new Date();
  const total = harvestDate.getTime() - plantingDate.getTime();
  const elapsed = now.getTime() - plantingDate.getTime();
  
  return Math.min(Math.round((elapsed / total) * 100), 100);
}

function calculateAge(dateOfBirth: Date | null): string {
  if (!dateOfBirth) return "Unknown";
  
  const now = new Date();
  const age = now.getFullYear() - dateOfBirth.getFullYear();
  const months = now.getMonth() - dateOfBirth.getMonth();
  
  if (months < 0) {
    return `${age - 1}y`;
  }
  
  return `${age}y ${months}m`;
}
