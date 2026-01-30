import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { trainingPrograms, trainingSessions, enrollments } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const trainingRouter = router({
  // Training Programs
  programs: router({
    list: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(trainingPrograms);
    }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        targetAudience: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        return await db.insert(trainingPrograms).values({
          title: input.title,
          description: input.description,
          targetAudience: input.targetAudience,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        targetAudience: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        const { id, ...updateData } = input;
        return await db.update(trainingPrograms)
          .set(updateData)
          .where(eq(trainingPrograms.id, id));
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        return await db.delete(trainingPrograms)
          .where(eq(trainingPrograms.id, input.id));
      }),
  }),

  // Training Sessions
  sessions: router({
    list: protectedProcedure
      .input(z.object({ programId: z.number().optional() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        if (input.programId) {
          return await db.select().from(trainingSessions)
            .where(eq(trainingSessions.programId, input.programId));
        }
        return await db.select().from(trainingSessions);
      }),

    create: protectedProcedure
      .input(z.object({
        programId: z.number(),
        sessionDate: z.date(),
        location: z.string().optional(),
        trainerUserId: z.number().optional(),
        maxParticipants: z.number().optional(),
        status: z.enum(["scheduled", "ongoing", "completed", "cancelled"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        return await db.insert(trainingSessions).values({
          programId: input.programId,
          sessionDate: input.sessionDate,
          location: input.location,
          trainerUserId: input.trainerUserId || ctx.user.id,
          maxParticipants: input.maxParticipants,
          status: input.status || "scheduled",
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        sessionDate: z.date().optional(),
        location: z.string().optional(),
        maxParticipants: z.number().optional(),
        status: z.enum(["scheduled", "ongoing", "completed", "cancelled"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        const { id, ...updateData } = input;
        return await db.update(trainingSessions)
          .set(updateData)
          .where(eq(trainingSessions.id, id));
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        return await db.delete(trainingSessions)
          .where(eq(trainingSessions.id, input.id));
      }),
  }),

  // Enrollments
  enrollments: router({
    list: protectedProcedure
      .input(z.object({ sessionId: z.number().optional(), userId: z.number().optional() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        if (input.sessionId && input.userId) {
          return await db.select().from(enrollments)
            .where(and(
              eq(enrollments.sessionId, input.sessionId),
              eq(enrollments.userId, input.userId)
            ));
        } else if (input.sessionId) {
          return await db.select().from(enrollments)
            .where(eq(enrollments.sessionId, input.sessionId));
        } else if (input.userId) {
          return await db.select().from(enrollments)
            .where(eq(enrollments.userId, input.userId));
        }
        return await db.select().from(enrollments);
      }),

    enroll: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        userId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        return await db.insert(enrollments).values({
          sessionId: input.sessionId,
          userId: input.userId || ctx.user.id,
          attendanceStatus: "enrolled",
        });
      }),

    updateAttendance: protectedProcedure
      .input(z.object({
        id: z.number(),
        attendanceStatus: z.enum(["enrolled", "attended", "absent", "dropped"]),
        feedbackScore: z.number().optional(),
        feedbackNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        const { id, ...updateData } = input;
        return await db.update(enrollments)
          .set(updateData)
          .where(eq(enrollments.id, id));
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        
        return await db.delete(enrollments)
          .where(eq(enrollments.id, input.id));
      }),
  }),
});
