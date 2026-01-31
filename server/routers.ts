import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { notificationRouter } from "./notificationRouter";
import { feedingRouter } from "./feedingRouter";
import { marketplaceRouter } from "./marketplaceRouter";
import { iotRouter } from "./iotRouter";
import { weatherRouter } from "./weatherRouter";
import { weatherNotificationRouter } from "./weatherNotificationRouter";
import { cropPlanningRouter } from "./cropPlanningRouter";
import { inventoryRouter } from "./inventoryRouter";
import { roleManagementRouter } from "./roleManagementRouter";
import { trainingRouter } from "./trainingRouter";
import { merlRouter } from "./merlRouter";
import { transportRouter } from "./transportRouter";
import { businessRouter } from "./businessRouter";
import { paymentRouter } from "./paymentRouter";
import { smsRouter } from "./smsRouter";
import { securityRouter } from "./securityRouter";
import { passwordResetRouter } from "./passwordResetRouter";
import { z } from "zod";
import { getDb } from "./db";
import { TRPCError } from "@trpc/server";
import {
  farms,
  crops,
  cropCycles,
  soilTests,
  fertilizerApplications,
  yieldRecords,
  animals,
  animalTypes,
  animalHealthRecords,
  breedingRecords,
  feedingRecords,
  performanceMetrics,
  themeConfigs,
  notifications,
} from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============================================================================
  // FARM MANAGEMENT
  // ============================================================================
  farms: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(farms).where(eq(farms.farmerUserId, ctx.user.id));
    }),

    create: protectedProcedure
      .input(z.object({
        farmName: z.string().min(1),
        location: z.string().optional(),
        sizeHectares: z.string().optional(),
        farmType: z.enum(["crop", "livestock", "mixed"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        return await db.insert(farms).values({
          farmerUserId: ctx.user.id,
          farmName: input.farmName,
          location: input.location,
          sizeHectares: input.sizeHectares as any,
          farmType: input.farmType || "mixed",
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        farmName: z.string().min(1),
        location: z.string().optional(),
        sizeHectares: z.string().optional(),
        farmType: z.enum(["crop", "livestock", "mixed"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Verify ownership
        const [farm] = await db.select().from(farms).where(eq(farms.id, input.id));
        if (!farm || farm.farmerUserId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You can only edit your own farms" });
        }

        return await db.update(farms)
          .set({
            farmName: input.farmName,
            location: input.location,
            sizeHectares: input.sizeHectares as any,
            farmType: input.farmType || "mixed",
          })
          .where(eq(farms.id, input.id));
      }),
  }),

  // ============================================================================
  // CROP MANAGEMENT
  // ============================================================================
  crops: router({
    list: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(crops);
    }),

    cycles: router({
      list: protectedProcedure
        .input(z.object({ farmId: z.number() }))
        .query(async ({ input }) => {
          const db = await getDb();
          if (!db) return [];
          const cycles = await db.select().from(cropCycles).where(eq(cropCycles.farmId, input.farmId));
          // Join with crops to get variety and cultivar parameters
          const cyclesWithCropInfo = await Promise.all(
            cycles.map(async (cycle) => {
              const [crop] = await db.select().from(crops).where(eq(crops.id, cycle.cropId));
              return { ...cycle, crop };
            })
          );
          return cyclesWithCropInfo;
        }),

      create: protectedProcedure
        .input(z.object({
          farmId: z.number(),
          cropId: z.number(),
          varietyName: z.string().optional(),
          plantingDate: z.date(),
          expectedHarvestDate: z.date().optional(),
          areaPlantedHectares: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

          return await db.insert(cropCycles).values({
            farmId: input.farmId,
            cropId: input.cropId,
            varietyName: input.varietyName,
            plantingDate: input.plantingDate,
            expectedHarvestDate: input.expectedHarvestDate,
            areaPlantedHectares: input.areaPlantedHectares as any,
            status: "planted",
          });
        }),
    }),

    soilTests: router({
      list: protectedProcedure
        .input(z.object({ farmId: z.number() }))
        .query(async ({ input }) => {
          const db = await getDb();
          if (!db) return [];
          return await db.select().from(soilTests).where(eq(soilTests.farmId, input.farmId));
        }),

      create: protectedProcedure
        .input(z.object({
          farmId: z.number(),
          testDate: z.date(),
          phLevel: z.string().optional(),
          nitrogenLevel: z.string().optional(),
          phosphorusLevel: z.string().optional(),
          potassiumLevel: z.string().optional(),
          organicMatter: z.string().optional(),
          recommendations: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

          return await db.insert(soilTests).values({
            farmId: input.farmId,
            testDate: input.testDate,
            phLevel: input.phLevel as any,
            nitrogenLevel: input.nitrogenLevel as any,
            phosphorusLevel: input.phosphorusLevel as any,
            potassiumLevel: input.potassiumLevel as any,
            organicMatter: input.organicMatter as any,
            recommendations: input.recommendations,
          });
        }),
    }),

    fertilizers: router({
      list: protectedProcedure
        .input(z.object({ cycleId: z.number() }))
        .query(async ({ input }) => {
          const db = await getDb();
          if (!db) return [];
          return await db.select().from(fertilizerApplications).where(eq(fertilizerApplications.cycleId, input.cycleId));
        }),

      create: protectedProcedure
        .input(z.object({
          cycleId: z.number(),
          applicationDate: z.date(),
          fertilizerType: z.string(),
          quantityKg: z.string().optional(),
          notes: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

          return await db.insert(fertilizerApplications).values({
            cycleId: input.cycleId,
            applicationDate: input.applicationDate,
            fertilizerType: input.fertilizerType,
            quantityKg: input.quantityKg as any,
            notes: input.notes,
          });
        }),
    }),

    yields: router({
      list: protectedProcedure
        .input(z.object({ cycleId: z.number() }))
        .query(async ({ input }) => {
          const db = await getDb();
          if (!db) return [];

          return await db.select().from(yieldRecords).where(eq(yieldRecords.cycleId, input.cycleId));
        }),

      create: protectedProcedure
        .input(z.object({
          cycleId: z.number(),
          yieldQuantityKg: z.string(),
          qualityGrade: z.string().optional(),
          notes: z.string().optional(),
          recordedDate: z.date(),
        }))
        .mutation(async ({ input }) => {
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

          return await db.insert(yieldRecords).values({
            cycleId: input.cycleId,
            recordedDate: input.recordedDate,
            yieldQuantityKg: input.yieldQuantityKg as any,
            qualityGrade: input.qualityGrade,
            notes: input.notes,
          });
        }),
    }),
  }),

  // ============================================================================
  // LIVESTOCK MANAGEMENT
  // ============================================================================
  animals: router({
    list: protectedProcedure
      .input(z.object({ farmId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(animals).where(eq(animals.farmId, input.farmId));
      }),

    create: protectedProcedure
      .input(z.object({
        farmId: z.number(),
        typeId: z.number(),
        uniqueTagId: z.string().optional(),
        birthDate: z.date().optional(),
        gender: z.enum(["male", "female", "unknown"]).optional(),
        breed: z.string().optional(),
        status: z.enum(["active", "sold", "culled", "deceased"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        return await db.insert(animals).values({
          farmId: input.farmId,
          typeId: input.typeId,
          uniqueTagId: input.uniqueTagId,
          birthDate: input.birthDate,
          gender: input.gender || "unknown",
          breed: input.breed,
          status: input.status || "active",
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["active", "sold", "culled", "deceased"]).optional(),
        breed: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const updates: any = {};
        if (input.status) updates.status = input.status;
        if (input.breed) updates.breed = input.breed;

        return await db.update(animals).set(updates).where(eq(animals.id, input.id));
      }),
  }),

  healthRecords: router({
    list: protectedProcedure
      .input(z.object({ animalId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(animalHealthRecords).where(eq(animalHealthRecords.animalId, input.animalId));
      }),

    create: protectedProcedure
      .input(z.object({
        animalId: z.number(),
        recordDate: z.date(),
        eventType: z.enum(["vaccination", "treatment", "illness", "checkup", "other"]),
        details: z.string().optional(),
        veterinarianUserId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        return await db.insert(animalHealthRecords).values({
          animalId: input.animalId,
          recordDate: input.recordDate,
          eventType: input.eventType,
          details: input.details,
          veterinarianUserId: input.veterinarianUserId,
        });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        return await db.delete(animalHealthRecords).where(eq(animalHealthRecords.id, input.id));
      }),
  }),

  vaccinations: router({
    listByAnimal: protectedProcedure
      .input(z.object({ animalId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db
          .select()
          .from(animalHealthRecords)
          .where(eq(animalHealthRecords.animalId, input.animalId));
      }),

    record: protectedProcedure
      .input(z.object({
        animalId: z.number(),
        vaccineType: z.string(),
        recordDate: z.date(),
        nextDueDate: z.date().optional(),
        details: z.string().optional(),
        veterinarianUserId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const detailsText = `${input.vaccineType}${input.nextDueDate ? ` - Next due: ${input.nextDueDate.toISOString().split('T')[0]}` : ''}${input.details ? ` - ${input.details}` : ''}`;

        return await db.insert(animalHealthRecords).values({
          animalId: input.animalId,
          recordDate: input.recordDate,
          eventType: "vaccination",
          details: detailsText,
          veterinarianUserId: input.veterinarianUserId,
        });
      }),
  }),

  performanceMetrics: router({
    listByAnimal: protectedProcedure
      .input(z.object({ animalId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(performanceMetrics).where(eq(performanceMetrics.animalId, input.animalId));
      }),

    record: protectedProcedure
      .input(z.object({
        animalId: z.number(),
        metricDate: z.date(),
        weightKg: z.string().optional(),
        milkYieldLiters: z.string().optional(),
        eggCount: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        return await db.insert(performanceMetrics).values({
          animalId: input.animalId,
          metricDate: input.metricDate,
          weightKg: input.weightKg as any,
          milkYieldLiters: input.milkYieldLiters as any,
          eggCount: input.eggCount,
        });
      }),
  }),

  breeding: router({
    listByAnimal: protectedProcedure
      .input(z.object({ animalId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(breedingRecords).where(eq(breedingRecords.animalId, input.animalId));
      }),

    create: protectedProcedure
      .input(z.object({
        animalId: z.number(),
        breedingDate: z.date(),
        sireId: z.number().optional(),
        damId: z.number().optional(),
        expectedDueDate: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        return await db.insert(breedingRecords).values({
          animalId: input.animalId,
          breedingDate: input.breedingDate,
          sireId: input.sireId,
          damId: input.damId,
          expectedDueDate: input.expectedDueDate,
          notes: input.notes,
          outcome: "pending",
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        outcome: z.enum(["pending", "successful", "unsuccessful", "aborted"]).optional(),
        expectedDueDate: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const updates: any = {};
        if (input.outcome) updates.outcome = input.outcome;
        if (input.expectedDueDate) updates.expectedDueDate = input.expectedDueDate;
        if (input.notes) updates.notes = input.notes;

        return await db.update(breedingRecords).set(updates).where(eq(breedingRecords.id, input.id));
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        return await db.delete(breedingRecords).where(eq(breedingRecords.id, input.id));
      }),
  }),

  theme: router({
    getTheme: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) return null;
        const theme = await db.select().from(themeConfigs).where(eq(themeConfigs.userId, ctx.user.id)).limit(1);
        return theme[0] || null;
      }),

    updateTheme: protectedProcedure
      .input(z.object({
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        accentColor: z.string().optional(),
        backgroundColor: z.string().optional(),
        textColor: z.string().optional(),
        borderColor: z.string().optional(),
        fontFamily: z.string().optional(),
        fontSize: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const existing = await db.select().from(themeConfigs).where(eq(themeConfigs.userId, ctx.user.id)).limit(1);

        if (existing.length > 0) {
          return await db.update(themeConfigs).set(input).where(eq(themeConfigs.userId, ctx.user.id));
        } else {
          return await db.insert(themeConfigs).values({
            userId: ctx.user.id,
            ...input,
          });
        }
      }),

    resetTheme: protectedProcedure
      .mutation(async ({ ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        return await db.delete(themeConfigs).where(eq(themeConfigs.userId, ctx.user.id));
      }),
  }),

  notifications: notificationRouter,
  feeding: feedingRouter,
  marketplace: marketplaceRouter,
  iot: iotRouter,
  weather: weatherRouter,
  weatherNotifications: weatherNotificationRouter,
  cropPlanning: cropPlanningRouter,
  inventory: inventoryRouter,
  training: trainingRouter,
  roleManagement: roleManagementRouter,
  merl: merlRouter,
  transport: transportRouter,
  business: businessRouter,
  payment: paymentRouter,
  sms: smsRouter,
  security: securityRouter,
  passwordReset: passwordResetRouter,
});

export type AppRouter = typeof appRouter;
