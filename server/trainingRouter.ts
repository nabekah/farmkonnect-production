import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { trainingPrograms, trainingSessions, enrollments } from "../drizzle/schema";
import { eq, and, sql, desc } from "drizzle-orm";

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

  // Analytics and Impact Measurement
  analytics: router({
    /**
     * Get training program statistics
     */
    programStats: protectedProcedure
      .input(z.object({ programId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;

        // Get program details
        const program = await db.select().from(trainingPrograms)
          .where(eq(trainingPrograms.id, input.programId));
        
        if (program.length === 0) return null;

        // Get sessions count
        const sessions = await db.select().from(trainingSessions)
          .where(eq(trainingSessions.programId, input.programId));
        
        // Get enrollments for all sessions
        const sessionIds = sessions.map(s => s.id);
        let enrollmentData: any[] = [];
        
        if (sessionIds.length > 0) {
          enrollmentData = await db.select().from(enrollments)
            .where(sql`${enrollments.sessionId} IN (${sql.join(sessionIds.map(id => sql`${id}`), sql`, `)})`);        }

        // Calculate stats
        const totalEnrollments = enrollmentData.length;
        const attended = enrollmentData.filter(e => e.attendanceStatus === 'attended').length;
        const absent = enrollmentData.filter(e => e.attendanceStatus === 'absent').length;
        const dropped = enrollmentData.filter(e => e.attendanceStatus === 'dropped').length;
        
        // Calculate average feedback score
        const feedbackScores = enrollmentData
          .filter(e => e.feedbackScore !== null)
          .map(e => e.feedbackScore as number);
        const avgFeedback = feedbackScores.length > 0
          ? feedbackScores.reduce((a: number, b: number) => a + b, 0) / feedbackScores.length
          : 0;

        return {
          program: program[0],
          totalSessions: sessions.length,
          completedSessions: sessions.filter(s => s.status === 'completed').length,
          totalEnrollments,
          attendanceRate: totalEnrollments > 0 ? (attended / totalEnrollments) * 100 : 0,
          attended,
          absent,
          dropped,
          averageFeedbackScore: avgFeedback,
          feedbackCount: feedbackScores.length,
        };
      }),

    /**
     * Get overall training impact metrics
     */
    overallImpact: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return null;

      const allPrograms = await db.select().from(trainingPrograms);
      const allSessions = await db.select().from(trainingSessions);
      const allEnrollments = await db.select().from(enrollments);

      const totalParticipants = new Set(allEnrollments.map(e => e.userId)).size;
      const attended = allEnrollments.filter(e => e.attendanceStatus === 'attended').length;
      
      const feedbackScores = allEnrollments
        .filter(e => e.feedbackScore !== null)
        .map(e => e.feedbackScore as number);
      const avgFeedback = feedbackScores.length > 0
        ? feedbackScores.reduce((a: number, b: number) => a + b, 0) / feedbackScores.length
        : 0;

      return {
        totalPrograms: allPrograms.length,
        totalSessions: allSessions.length,
        completedSessions: allSessions.filter(s => s.status === 'completed').length,
        totalParticipants,
        totalEnrollments: allEnrollments.length,
        attendanceRate: allEnrollments.length > 0 ? (attended / allEnrollments.length) * 100 : 0,
        averageFeedbackScore: avgFeedback,
      };
    }),

    /**
     * Get participant training history
     */
    participantHistory: protectedProcedure
      .input(z.object({ userId: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];

        const userId = input.userId || ctx.user.id;
        
        const userEnrollments = await db.select().from(enrollments)
          .where(eq(enrollments.userId, userId));
        
        // Get session details for each enrollment
        const sessionIds = userEnrollments.map(e => e.sessionId);
        if (sessionIds.length === 0) return [];
        
        const sessions = await db.select().from(trainingSessions)
          .where(sql`${trainingSessions.id} IN (${sql.join(sessionIds.map(id => sql`${id}`), sql`, `)})`);
        
        const programIds = sessions.map(s => s.programId);
        const programs = await db.select().from(trainingPrograms)
          .where(sql`${trainingPrograms.id} IN (${sql.join(programIds.map(id => sql`${id}`), sql`, `)})`);
        
        // Merge data
        return userEnrollments.map(enrollment => {
          const session = sessions.find(s => s.id === enrollment.sessionId);
          const program = programs.find(p => p.id === session?.programId);
          return {
            ...enrollment,
            session,
            program,
          };
        });
      }),
  }),
});

