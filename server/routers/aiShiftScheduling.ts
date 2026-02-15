import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";
import {
  workerShifts,
  shiftTemplates,
  workerPerformance,
  workerAvailability,
  farmWorkers,
} from "../../drizzle/schema";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";

/**
 * AI Shift Scheduling Router
 * Uses LLM to intelligently schedule shifts based on worker availability, skills, and performance
 */
export const aiShiftSchedulingRouter = router({
  /**
   * Generate optimal shift schedule using AI
   * Considers worker availability, skills, performance, and workload balance
   */
  generateOptimalSchedule: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        startDate: z.string(), // YYYY-MM-DD
        endDate: z.string(), // YYYY-MM-DD
        requiredShifts: z.array(
          z.object({
            date: z.string(),
            shiftId: z.number(),
            requiredWorkers: z.number(),
            skillsRequired: z.array(z.string()).optional(),
            priority: z.enum(["high", "medium", "low"]).default("medium"),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();

      // Fetch worker data
      const workers = await db
        .select()
        .from(farmWorkers)
        .where(and(eq(farmWorkers.farmId, input.farmId), eq(farmWorkers.status, "active")));

      // Fetch worker availability
      const availability = await db
        .select()
        .from(workerAvailability)
        .where(
          and(
            eq(workerAvailability.farmId, input.farmId),
            gte(workerAvailability.date, input.startDate),
            lte(workerAvailability.date, input.endDate)
          )
        );

      // Fetch worker performance data
      const performance = await db
        .select()
        .from(workerPerformance)
        .where(eq(workerPerformance.farmId, input.farmId));

      // Prepare data for LLM
      const workerProfiles = workers.map((w: any) => ({
        id: w.id,
        name: w.name,
        skills: w.skills || [],
        performanceScore: performance.find((p: any) => p.workerId === w.id)?.performanceScore || 0,
        availability: availability.filter((a: any) => a.workerId === w.id),
      }));

      // Call LLM to generate optimal schedule
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert shift scheduling AI. Your task is to create an optimal work schedule that:
1. Respects worker availability
2. Balances workload fairly among workers
3. Prioritizes high-performance workers for critical shifts
4. Considers skill requirements for each shift
5. Prevents worker fatigue by avoiding consecutive long shifts
6. Ensures fair distribution of desirable and undesirable shifts

Return a JSON array of assignments with workerId, shiftId, and date.`,
          },
          {
            role: "user",
            content: `Please generate an optimal shift schedule with the following constraints:

Workers: ${JSON.stringify(workerProfiles, null, 2)}

Required Shifts: ${JSON.stringify(input.requiredShifts, null, 2)}

Constraints:
- Each worker can work maximum 8 hours per day
- Respect availability windows
- Balance workload across all workers
- Prioritize skill matches for specialized shifts`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "shift_schedule",
            strict: true,
            schema: {
              type: "object",
              properties: {
                assignments: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      workerId: { type: "number" },
                      shiftId: { type: "number" },
                      date: { type: "string" },
                      reason: { type: "string" },
                    },
                    required: ["workerId", "shiftId", "date"],
                  },
                },
                summary: {
                  type: "object",
                  properties: {
                    totalAssignments: { type: "number" },
                    workersScheduled: { type: "number" },
                    balanceScore: { type: "number" },
                    notes: { type: "string" },
                  },
                },
              },
              required: ["assignments", "summary"],
            },
          },
        },
      });

      const schedule = JSON.parse(response.choices[0].message.content);

      return {
        success: true,
        schedule: schedule.assignments,
        summary: schedule.summary,
        timestamp: new Date(),
      };
    }),

  /**
   * Get shift scheduling recommendations
   * Analyzes current schedule and suggests improvements
   */
  getSchedulingRecommendations: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        analysisType: z.enum(["workload_balance", "skill_optimization", "fatigue_prevention"]),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();

      // Fetch current schedule and worker data
      const currentSchedule = await db
        .select()
        .from(workerShifts)
        .where(eq(workerShifts.farmId, input.farmId));

      const workers = await db
        .select()
        .from(farmWorkers)
        .where(eq(farmWorkers.farmId, input.farmId));

      const performance = await db
        .select()
        .from(workerPerformance)
        .where(eq(workerPerformance.farmId, input.farmId));

      // Call LLM for analysis
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert in workforce scheduling optimization. Analyze the provided schedule and provide specific, actionable recommendations for improvement.`,
          },
          {
            role: "user",
            content: `Please analyze this work schedule for ${input.analysisType} and provide recommendations:

Current Schedule: ${JSON.stringify(currentSchedule, null, 2)}
Workers: ${JSON.stringify(workers, null, 2)}
Performance Data: ${JSON.stringify(performance, null, 2)}

Focus on: ${input.analysisType}`,
          },
        ],
      });

      return {
        analysisType: input.analysisType,
        recommendations: response.choices[0].message.content,
        timestamp: new Date(),
      };
    }),

  /**
   * Predict scheduling conflicts
   * Uses historical data to predict potential scheduling issues
   */
  predictSchedulingConflicts: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        proposedSchedule: z.array(
          z.object({
            workerId: z.number(),
            shiftId: z.number(),
            date: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();

      // Fetch historical data
      const workers = await db
        .select()
        .from(farmWorkers)
        .where(eq(farmWorkers.farmId, input.farmId));

      const performance = await db
        .select()
        .from(workerPerformance)
        .where(eq(workerPerformance.farmId, input.farmId));

      // Call LLM to predict conflicts
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert in identifying potential scheduling conflicts. Analyze the proposed schedule and identify:
1. Worker fatigue risks
2. Skill mismatch issues
3. Availability conflicts
4. Workload imbalances
5. Potential no-shows based on historical patterns`,
          },
          {
            role: "user",
            content: `Analyze this proposed schedule for potential conflicts:

Proposed Schedule: ${JSON.stringify(input.proposedSchedule, null, 2)}
Worker Data: ${JSON.stringify(workers, null, 2)}
Performance History: ${JSON.stringify(performance, null, 2)}`,
          },
        ],
      });

      return {
        conflicts: response.choices[0].message.content,
        riskLevel: "medium",
        timestamp: new Date(),
      };
    }),

  /**
   * Optimize shift assignments for a specific worker
   * Considers their preferences, skills, and performance
   */
  optimizeWorkerSchedule: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        workerId: z.number(),
        preferredDays: z.array(z.number()).optional(), // 0-6 (Sun-Sat)
        maxHoursPerWeek: z.number().default(40),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();

      // Fetch worker data
      const worker = await db
        .select()
        .from(farmWorkers)
        .where(eq(farmWorkers.id, input.workerId));

      if (worker.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Worker not found",
        });
      }

      // Fetch worker's performance and availability
      const availability = await db
        .select()
        .from(workerAvailability)
        .where(eq(workerAvailability.workerId, input.workerId));

      const performance = await db
        .select()
        .from(workerPerformance)
        .where(eq(workerPerformance.workerId, input.workerId));

      // Call LLM to optimize schedule
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert in creating personalized work schedules. Create an optimized schedule that maximizes worker satisfaction while meeting business needs.`,
          },
          {
            role: "user",
            content: `Create an optimized schedule for this worker:

Worker: ${JSON.stringify(worker[0], null, 2)}
Availability: ${JSON.stringify(availability, null, 2)}
Performance: ${JSON.stringify(performance, null, 2)}
Preferences: Preferred days: ${input.preferredDays || "any"}, Max hours/week: ${input.maxHoursPerWeek}`,
          },
        ],
      });

      return {
        workerId: input.workerId,
        optimizedSchedule: response.choices[0].message.content,
        timestamp: new Date(),
      };
    }),
});
