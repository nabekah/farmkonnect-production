import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  checkAndSendCertificationAlerts,
  createRenewalRequest,
  approveRenewalRequest,
  recordCertificationRenewal,
  getWorkerRenewalRequests,
  generateCertificate,
  getCertificationRenewalStats,
} from "../services/certificationRenewalService";

/**
 * Certification Renewal Alerts Router
 * Handles automatic notifications for expiring certifications
 * and manages the renewal workflow
 */
export const certificationRenewalCleanRouter = router({
  /**
   * Check for expiring certifications and send alerts
   * Runs daily to identify certifications expiring within 30 days
   */
  checkAndSendAlerts: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const alerts = await checkAndSendCertificationAlerts();
      return {
        success: true,
        alertsSent: alerts.length,
        alerts,
        message: `${alerts.length} certification expiry alerts sent`,
      };
    } catch (error) {
      throw new Error(`Failed to send alerts: ${error}`);
    }
  }),

  /**
   * Get pending certification renewal alerts
   */
  getPendingAlerts: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      try {
        const alerts = await checkAndSendCertificationAlerts();
        return {
          alerts: alerts.filter((a) => a.status === "alert_sent"),
          totalAlerts: alerts.length,
        };
      } catch (error) {
        throw new Error(`Failed to fetch alerts: ${error}`);
      }
    }),

  /**
   * Create renewal request for a certification
   */
  createRenewalRequest: protectedProcedure
    .input(
      z.object({
        workerId: z.number(),
        certificationId: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const request = await createRenewalRequest(input.workerId, input.certificationId, input.notes);

        if (!request) {
          throw new Error("Failed to create renewal request");
        }

        return {
          success: true,
          requestId: request.requestId,
          message: "Renewal request created successfully",
        };
      } catch (error) {
        throw new Error(`Failed to create renewal request: ${error}`);
      }
    }),

  /**
   * Get renewal requests for a worker
   */
  getWorkerRenewalRequests: protectedProcedure
    .input(z.object({ workerId: z.number() }))
    .query(async ({ input }) => {
      try {
        const requests = await getWorkerRenewalRequests(input.workerId);
        return {
          requests,
          totalRequests: requests.length,
          pendingRequests: requests.filter((r) => r.status === "pending").length,
          approvedRequests: requests.filter((r) => r.status === "approved").length,
        };
      } catch (error) {
        throw new Error(`Failed to fetch renewal requests: ${error}`);
      }
    }),

  /**
   * Approve renewal request (admin only)
   */
  approveRenewalRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.number(),
        renewalDate: z.string().datetime(),
        approverNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await approveRenewalRequest(
          input.requestId,
          new Date(input.renewalDate),
          input.approverNotes
        );

        return result;
      } catch (error) {
        throw new Error(`Failed to approve renewal request: ${error}`);
      }
    }),

  /**
   * Reject renewal request (admin only)
   */
  rejectRenewalRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.number(),
        rejectionReason: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // In production, update database
        return {
          success: true,
          message: "Renewal request rejected. Worker will be notified.",
        };
      } catch (error) {
        throw new Error(`Failed to reject renewal request: ${error}`);
      }
    }),

  /**
   * Record certification renewal completion
   */
  recordRenewalCompletion: protectedProcedure
    .input(
      z.object({
        requestId: z.number(),
        renewalDate: z.string().datetime(),
        certificateNumber: z.string(),
        expiryDate: z.string().datetime(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await recordCertificationRenewal(
          input.requestId,
          new Date(input.renewalDate),
          input.certificateNumber,
          new Date(input.expiryDate)
        );

        return result;
      } catch (error) {
        throw new Error(`Failed to record renewal: ${error}`);
      }
    }),

  /**
   * Generate certificate PDF
   */
  generateCertificate: protectedProcedure
    .input(
      z.object({
        workerName: z.string(),
        certificationName: z.string(),
        renewalDate: z.string().datetime(),
        expiryDate: z.string().datetime(),
        certificateNumber: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await generateCertificate(
          input.workerName,
          input.certificationName,
          new Date(input.renewalDate),
          new Date(input.expiryDate),
          input.certificateNumber
        );

        return result;
      } catch (error) {
        throw new Error(`Failed to generate certificate: ${error}`);
      }
    }),

  /**
   * Get certification renewal statistics
   */
  getRenewalStatistics: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      try {
        const stats = await getCertificationRenewalStats(input.farmId);
        return {
          stats,
          alertLevel:
            stats.overdueRenewals > 0
              ? "critical"
              : stats.certificationsDueThisMonth > 0
                ? "warning"
                : "normal",
        };
      } catch (error) {
        throw new Error(`Failed to fetch renewal statistics: ${error}`);
      }
    }),

  /**
   * Get renewal timeline for a worker
   */
  getWorkerRenewalTimeline: protectedProcedure
    .input(z.object({ workerId: z.number() }))
    .query(async ({ input }) => {
      try {
        // Mock data - in production, query database
        return {
          timeline: [
            {
              certificationName: "Agricultural Safety",
              expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
              daysUntilExpiry: 20,
              status: "alert_sent",
            },
            {
              certificationName: "Pesticide Handling",
              expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
              daysUntilExpiry: 60,
              status: "upcoming",
            },
            {
              certificationName: "First Aid",
              expiryDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
              daysUntilExpiry: 120,
              status: "upcoming",
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to fetch renewal timeline: ${error}`);
      }
    }),

  /**
   * Send renewal reminder to worker
   */
  sendRenewalReminder: protectedProcedure
    .input(
      z.object({
        workerId: z.number(),
        certificationName: z.string(),
        daysUntilExpiry: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // In production, send SMS/email via Twilio/SendGrid
        console.log(
          `[REMINDER] Sent to worker ${input.workerId}: ${input.certificationName} expires in ${input.daysUntilExpiry} days`
        );

        return {
          success: true,
          message: "Renewal reminder sent to worker",
        };
      } catch (error) {
        throw new Error(`Failed to send reminder: ${error}`);
      }
    }),
});
