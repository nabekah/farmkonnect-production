import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { 
  farms, 
  cropCycles, 
  fieldWorkerTasks, 
  animals, 
  weatherHistory
} from "../../drizzle/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { subDays } from "date-fns";

export const dashboardRouter = router({
  // Get quick stats for the dashboard
  getQuickStats: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    try {
      // Get total farms
      const farmCount = await db
        .select({ count: farms.id })
        .from(farms)
        .where(eq(farms.userId, userId));

      // Get total farm area
      const farmArea = await db
        .select({ totalArea: farms.totalArea })
        .from(farms)
        .where(eq(farms.userId, userId));

      // Get active crops count
      const activeCrops = await db
        .select({ count: cropCycles.id })
        .from(cropCycles)
        .where(
          and(
            eq(cropCycles.userId, userId),
            eq(cropCycles.status, "active")
          )
        );

      // Get pending tasks count
      const pendingTasks = await db
        .select({ count: fieldWorkerTasks.id })
        .from(fieldWorkerTasks)
        .where(
          and(
            eq(fieldWorkerTasks.userId, userId),
            eq(fieldWorkerTasks.status, "pending")
          )
        );

      // Get weather alerts count
      const alerts = await db
        .select({ count: weatherHistory.id })
        .from(weatherHistory)
        .where(
          eq(weatherHistory.userId, userId)
        );

      // Get livestock count
      const livestockCount = await db
        .select({ count: animals.id })
        .from(animals)
        .where(eq(animals.userId, userId));

      // Calculate total area from farms
      let totalArea = 0;
      if (farmArea && farmArea.length > 0) {
        totalArea = farmArea.reduce((sum, farm) => {
          const area = typeof farm.totalArea === "string" 
            ? parseFloat(farm.totalArea) 
            : farm.totalArea || 0;
          return sum + area;
        }, 0);
      }

      return {
        totalFarms: farmCount[0]?.count || 0,
        totalFarmArea: totalArea,
        activeCrops: activeCrops[0]?.count || 0,
        pendingTasks: pendingTasks[0]?.count || 0,
        weatherAlerts: alerts[0]?.count || 0,
        livestockCount: livestockCount[0]?.count || 0,
      };
    } catch (error) {
      console.error("Error fetching quick stats:", error);
      return {
        totalFarms: 0,
        totalFarmArea: 0,
        activeCrops: 0,
        pendingTasks: 0,
        weatherAlerts: 0,
        livestockCount: 0,
      };
    }
  }),

  // Get recent activities
  getRecentActivities: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;
    const thirtyDaysAgo = subDays(new Date(), 30);

    try {
      const activities: any[] = [];

      // Get recent farm registrations
      const recentFarms = await db
        .select({
          id: farms.id,
          name: farms.name,
          createdAt: farms.createdAt,
          type: farms.farmType,
        })
        .from(farms)
        .where(
          and(
            eq(farms.userId, userId),
            gte(farms.createdAt, thirtyDaysAgo)
          )
        )
        .orderBy(desc(farms.createdAt))
        .limit(5);

      activities.push(
        ...recentFarms.map((farm) => ({
          id: `farm-${farm.id}`,
          type: "farm_registration",
          title: `Farm registered: ${farm.name}`,
          description: `New ${farm.type} farm added`,
          timestamp: farm.createdAt,
          icon: "Tractor",
        }))
      );

      // Get recent crop plantings
      const recentCrops = await db
        .select({
          id: cropCycles.id,
          cropName: cropCycles.cropName,
          plantingDate: cropCycles.plantingDate,
          status: cropCycles.status,
        })
        .from(cropCycles)
        .where(
          and(
            eq(cropCycles.userId, userId),
            gte(cropCycles.plantingDate, thirtyDaysAgo)
          )
        )
        .orderBy(desc(cropCycles.plantingDate))
        .limit(5);

      activities.push(
        ...recentCrops.map((crop) => ({
          id: `crop-${crop.id}`,
          type: "crop_planting",
          title: `Crop planted: ${crop.cropName}`,
          description: `New crop cycle started (${crop.status})`,
          timestamp: crop.plantingDate,
          icon: "Sprout",
        }))
      );

      // Get recent task completions
      const completedTasks = await db
        .select({
          id: fieldWorkerTasks.id,
          title: fieldWorkerTasks.title,
          completedDate: fieldWorkerTasks.completedDate,
          status: fieldWorkerTasks.status,
        })
        .from(fieldWorkerTasks)
        .where(
          and(
            eq(fieldWorkerTasks.userId, userId),
            eq(fieldWorkerTasks.status, "completed"),
            gte(fieldWorkerTasks.completedDate, thirtyDaysAgo)
          )
        )
        .orderBy(desc(fieldWorkerTasks.completedDate))
        .limit(5);

      activities.push(
        ...completedTasks.map((task) => ({
          id: `task-${task.id}`,
          type: "task_completion",
          title: `Task completed: ${task.title}`,
          description: "Farm task marked as complete",
          timestamp: task.completedDate,
          icon: "CheckCircle2",
        }))
      );

      // Get recent weather alerts
      const recentAlerts = await db
        .select({
          id: weatherHistory.id,
          alertType: weatherHistory.alertType,
          severity: weatherHistory.severity,
          createdAt: weatherHistory.createdAt,
        })
        .from(weatherHistory)
        .where(
          and(
            eq(weatherHistory.userId, userId),
            gte(weatherHistory.createdAt, thirtyDaysAgo)
          )
        )
        .orderBy(desc(weatherHistory.createdAt))
        .limit(5);

      activities.push(
        ...recentAlerts.map((alert) => ({
          id: `alert-${alert.id}`,
          type: "weather_alert",
          title: `Weather alert: ${alert.alertType}`,
          description: `${alert.severity} severity alert issued`,
          timestamp: alert.createdAt,
          icon: "AlertCircle",
        }))
      );

      // Sort all activities by timestamp (most recent first)
      activities.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Return top 10 most recent activities
      return activities.slice(0, 10);
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      return [];
    }
  }),
});
