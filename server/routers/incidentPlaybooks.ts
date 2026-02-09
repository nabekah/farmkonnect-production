import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";

export const incidentPlaybooksRouter = router({
  // Create incident playbook
  createPlaybook: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      playbookName: z.string(),
      description: z.string().optional(),
      incidentType: z.string(),
      severity: z.enum(["low", "medium", "high", "critical"]),
      triggerConditions: z.array(z.object({
        condition: z.string(),
        threshold: z.number().optional()
      })),
      responseSteps: z.array(z.object({
        step: z.number(),
        action: z.string(),
        assignedRole: z.string(),
        timeLimit: z.number().optional()
      })),
      escalationLevels: z.array(z.object({
        level: z.number(),
        escalateAfterMinutes: z.number(),
        escalateTo: z.array(z.string()),
        notificationTemplate: z.string()
      })),
      notificationRecipients: z.array(z.string())
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify user is admin
        const isAdmin = await db.query.raw(
          `SELECT fw.role FROM farm_workers fw
           WHERE fw.userId = ? AND fw.farmId = ? AND fw.role = 'admin'`,
          [ctx.user.id, parseInt(input.farmId)]
        );

        if (!isAdmin || isAdmin.length === 0) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can create incident playbooks"
          });
        }

        await db.query.raw(
          `INSERT INTO incident_playbooks 
           (farmId, playbookName, description, incidentType, severity, triggerConditions, responseSteps, escalationLevels, notificationRecipients, createdBy)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            parseInt(input.farmId),
            input.playbookName,
            input.description || null,
            input.incidentType,
            input.severity,
            JSON.stringify(input.triggerConditions),
            JSON.stringify(input.responseSteps),
            JSON.stringify(input.escalationLevels),
            JSON.stringify(input.notificationRecipients),
            ctx.user.id
          ]
        );

        return { success: true, message: "Playbook created successfully" };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error creating playbook:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create playbook"
        });
      }
    }),

  // Get playbooks for farm
  getPlaybooks: protectedProcedure
    .input(z.object({ farmId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const playbooks = await db.query.raw(
          `SELECT id, playbookName, description, incidentType, severity, isActive, createdAt
           FROM incident_playbooks
           WHERE farmId = ?
           ORDER BY createdAt DESC`,
          [parseInt(input.farmId)]
        );

        return playbooks || [];
      } catch (error) {
        console.error("Error fetching playbooks:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch playbooks"
        });
      }
    }),

  // Trigger incident response
  triggerIncident: protectedProcedure
    .input(z.object({
      farmId: z.string(),
      playbookId: z.number(),
      incidentType: z.string(),
      severity: z.enum(["low", "medium", "high", "critical"]),
      triggerReason: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Get playbook details
        const playbook = await db.query.raw(
          `SELECT id, escalationLevels, notificationRecipients, responseSteps FROM incident_playbooks WHERE id = ? AND farmId = ?`,
          [input.playbookId, parseInt(input.farmId)]
        );

        if (!playbook || playbook.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Playbook not found"
          });
        }

        // Create incident response record
        const result = await db.query.raw(
          `INSERT INTO incident_responses 
           (farmId, playbookId, incidentType, severity, triggerReason, status, currentEscalationLevel)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            parseInt(input.farmId),
            input.playbookId,
            input.incidentType,
            input.severity,
            input.triggerReason,
            "triggered",
            1
          ]
        );

        const escalationLevels = JSON.parse(playbook[0].escalationLevels || "[]");
        const notificationRecipients = JSON.parse(playbook[0].notificationRecipients || "[]");

        // Send initial notifications
        const notifications = [];
        for (const recipient of notificationRecipients) {
          notifications.push({
            recipient,
            level: 1,
            timestamp: new Date(),
            status: "sent"
          });
        }

        // Log incident
        await db.query.raw(
          `INSERT INTO compliance_logs (userId, farmId, eventType, eventCategory, description, severity)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            ctx.user.id,
            parseInt(input.farmId),
            "incident_triggered",
            "incident",
            `Incident triggered: ${input.incidentType} - ${input.triggerReason}`,
            input.severity
          ]
        );

        return {
          success: true,
          incidentId: result.insertId,
          escalationLevels: escalationLevels.length,
          notificationsSent: notifications.length,
          message: "Incident response initiated"
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error triggering incident:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to trigger incident response"
        });
      }
    }),

  // Escalate incident
  escalateIncident: protectedProcedure
    .input(z.object({
      incidentId: z.number(),
      escalationReason: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Get incident details
        const incident = await db.query.raw(
          `SELECT ir.*, ip.escalationLevels FROM incident_responses ir
           JOIN incident_playbooks ip ON ir.playbookId = ip.id
           WHERE ir.id = ?`,
          [input.incidentId]
        );

        if (!incident || incident.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Incident not found"
          });
        }

        const escalationLevels = JSON.parse(incident[0].escalationLevels || "[]");
        const currentLevel = incident[0].currentEscalationLevel;
        const nextLevel = Math.min(currentLevel + 1, escalationLevels.length);

        if (nextLevel > escalationLevels.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Incident already at maximum escalation level"
          });
        }

        // Update incident status
        await db.query.raw(
          `UPDATE incident_responses 
           SET status = ?, currentEscalationLevel = ?, updatedAt = NOW()
           WHERE id = ?`,
          [nextLevel === escalationLevels.length ? "escalated" : "in_progress", nextLevel, input.incidentId]
        );

        // Get next escalation level details
        const nextEscalation = escalationLevels[nextLevel - 1];

        // Log escalation
        await db.query.raw(
          `INSERT INTO compliance_logs (userId, eventType, eventCategory, description, severity)
           VALUES (?, ?, ?, ?, ?)`,
          [
            ctx.user.id,
            "incident_escalated",
            "incident",
            `Incident escalated to level ${nextLevel}: ${escalationReason}`,
            "high"
          ]
        );

        return {
          success: true,
          newEscalationLevel: nextLevel,
          escalateTo: nextEscalation?.escalateTo || [],
          message: `Incident escalated to level ${nextLevel}`
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error escalating incident:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to escalate incident"
        });
      }
    }),

  // Resolve incident
  resolveIncident: protectedProcedure
    .input(z.object({
      incidentId: z.number(),
      resolutionNotes: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        await db.query.raw(
          `UPDATE incident_responses 
           SET status = ?, resolvedAt = NOW(), updatedAt = NOW()
           WHERE id = ?`,
          ["resolved", input.incidentId]
        );

        // Log resolution
        await db.query.raw(
          `INSERT INTO compliance_logs (userId, eventType, eventCategory, description, severity)
           VALUES (?, ?, ?, ?, ?)`,
          [
            ctx.user.id,
            "incident_resolved",
            "incident",
            `Incident resolved: ${input.resolutionNotes}`,
            "low"
          ]
        );

        return { success: true, message: "Incident resolved successfully" };
      } catch (error) {
        console.error("Error resolving incident:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to resolve incident"
        });
      }
    }),

  // Get active incidents
  getActiveIncidents: protectedProcedure
    .input(z.object({ farmId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const incidents = await db.query.raw(
          `SELECT ir.*, ip.playbookName FROM incident_responses ir
           JOIN incident_playbooks ip ON ir.playbookId = ip.id
           WHERE ir.farmId = ? AND ir.status IN ('triggered', 'in_progress', 'escalated')
           ORDER BY ir.severity DESC, ir.createdAt DESC`,
          [parseInt(input.farmId)]
        );

        return incidents || [];
      } catch (error) {
        console.error("Error fetching active incidents:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch active incidents"
        });
      }
    })
});
