import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { iotDevices, sensorReadings, alerts } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db";
import { TRPCError } from "@trpc/server";

export const iotRouter = router({
  registerDevice: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        deviceSerial: z.string(),
        deviceType: z.enum(["soil_sensor", "weather_station", "animal_monitor", "water_meter", "other"]),
        installationDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.insert(iotDevices).values({
        farmId: input.farmId,
        deviceSerial: input.deviceSerial,
        deviceType: input.deviceType,
        installationDate: input.installationDate ? new Date(input.installationDate) : undefined,
      });
      return { success: true };
    }),

  listDevices: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(iotDevices)
        .where(eq(iotDevices.farmId, input.farmId));
    }),

  getDevice: protectedProcedure
    .input(z.object({ deviceId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      const devices = await db
        .select()
        .from(iotDevices)
        .where(eq(iotDevices.id, input.deviceId));
      return devices[0] || null;
    }),

  updateDeviceStatus: protectedProcedure
    .input(z.object({ deviceId: z.number(), status: z.enum(["active", "inactive", "maintenance", "retired"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      return await db
        .update(iotDevices)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(iotDevices.id, input.deviceId));
    }),

  recordSensorReading: protectedProcedure
    .input(
      z.object({
        deviceId: z.number(),
        value: z.number(),
        unit: z.string(),
        readingType: z.string().default("sensor_reading"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.insert(sensorReadings).values({
        deviceId: input.deviceId,
        value: input.value.toString(),
        unit: input.unit,
        readingType: input.readingType,
        readingTimestamp: new Date(),
      });

      // Threshold checking will be implemented via notification preferences
      return { success: true };
    }),

  getSensorReadings: protectedProcedure
    .input(z.object({ deviceId: z.number(), limit: z.number().default(100) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(sensorReadings)
        .where(eq(sensorReadings.deviceId, input.deviceId))
        .orderBy(desc(sensorReadings.readingTimestamp))
        .limit(input.limit);
    }),



  getAlerts: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(alerts)
        .where(eq(alerts.farmId, input.farmId))
        .orderBy(desc(alerts.createdAt));
    }),

  getDeviceAlerts: protectedProcedure
    .input(z.object({ deviceId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db
        .select()
        .from(alerts)
        .where(eq(alerts.deviceId, input.deviceId))
        .orderBy(desc(alerts.createdAt));
    }),

  resolveAlert: protectedProcedure
    .input(z.object({ alertId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      return await db
        .update(alerts)
        .set({ isResolved: true, resolvedAt: new Date() })
        .where(eq(alerts.id, input.alertId));
    }),

  getUnresolvedAlerts: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      
      return await db
        .select()
        .from(alerts)
        .where(and(
          eq(alerts.farmId, input.farmId),
          eq(alerts.isResolved, false)
        ))
        .orderBy(desc(alerts.createdAt));
    }),
});
