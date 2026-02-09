import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { and, eq, desc } from "drizzle-orm";
import { insuranceClaims } from "../../drizzle/schema";

export const insuranceClaimTrackingRouter = router({
  /**
   * Create a new insurance claim
   */
  createClaim: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        appointmentId: z.number().optional(),
        insuranceProvider: z.string().min(1),
        policyNumber: z.string().min(1),
        claimType: z.enum(["veterinary_service", "medication", "emergency", "preventive", "other"]),
        claimAmount: z.string(),
        claimDate: z.date(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Generate claim number
      const claimNumber = `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const [result] = await db.insert(insuranceClaims).values({
        farmId: input.farmId,
        appointmentId: input.appointmentId,
        claimNumber,
        insuranceProvider: input.insuranceProvider,
        policyNumber: input.policyNumber,
        claimType: input.claimType,
        claimAmount: parseFloat(input.claimAmount),
        claimDate: input.claimDate,
        status: "draft",
      });

      return {
        success: true,
        claimId: result.insertId,
        claimNumber,
        message: "Insurance claim created",
      };
    }),

  /**
   * Submit insurance claim
   */
  submitClaim: protectedProcedure
    .input(
      z.object({
        claimId: z.number(),
        supportingDocuments: z.array(z.string()).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      await db
        .update(insuranceClaims)
        .set({
          status: "submitted",
          submissionDate: new Date(),
          supportingDocuments: input.supportingDocuments ? JSON.stringify(input.supportingDocuments) : null,
          notes: input.notes,
        })
        .where(eq(insuranceClaims.id, input.claimId));

      return { success: true, message: "Claim submitted successfully" };
    }),

  /**
   * Update claim status
   */
  updateClaimStatus: protectedProcedure
    .input(
      z.object({
        claimId: z.number(),
        status: z.enum(["draft", "submitted", "under_review", "approved", "rejected", "paid"]),
        approvalAmount: z.string().optional(),
        rejectionReason: z.string().optional(),
        paymentAmount: z.string().optional(),
        paymentDate: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const updates: any = { status: input.status };

      if (input.approvalAmount) {
        updates.approvalAmount = parseFloat(input.approvalAmount);
      }
      if (input.rejectionReason) {
        updates.rejectionReason = input.rejectionReason;
      }
      if (input.paymentAmount) {
        updates.paymentAmount = parseFloat(input.paymentAmount);
      }
      if (input.paymentDate) {
        updates.paymentDate = input.paymentDate;
      }

      await db
        .update(insuranceClaims)
        .set(updates)
        .where(eq(insuranceClaims.id, input.claimId));

      return { success: true, message: "Claim status updated" };
    }),

  /**
   * Get claims for a farm
   */
  getFarmClaims: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        status: z.enum(["draft", "submitted", "under_review", "approved", "rejected", "paid"]).optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      let query = db
        .select()
        .from(insuranceClaims)
        .where(eq(insuranceClaims.farmId, input.farmId));

      if (input.status) {
        query = db
          .select()
          .from(insuranceClaims)
          .where(
            and(
              eq(insuranceClaims.farmId, input.farmId),
              eq(insuranceClaims.status, input.status)
            )
          );
      }

      const results = await query
        .orderBy(desc(insuranceClaims.claimDate))
        .limit(input.limit);

      return results.map((claim) => ({
        id: claim.id,
        claimNumber: claim.claimNumber,
        insuranceProvider: claim.insuranceProvider,
        policyNumber: claim.policyNumber,
        claimType: claim.claimType,
        claimAmount: parseFloat(claim.claimAmount.toString()),
        claimDate: claim.claimDate,
        status: claim.status,
        approvalAmount: claim.approvalAmount ? parseFloat(claim.approvalAmount.toString()) : null,
        paymentAmount: claim.paymentAmount ? parseFloat(claim.paymentAmount.toString()) : null,
        paymentDate: claim.paymentDate,
      }));
    }),

  /**
   * Get claim details
   */
  getClaimDetails: protectedProcedure
    .input(z.object({ claimId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      const claim = await db
        .select()
        .from(insuranceClaims)
        .where(eq(insuranceClaims.id, input.claimId))
        .limit(1);

      if (!claim || claim.length === 0) {
        return { error: "Claim not found" };
      }

      const c = claim[0];

      return {
        id: c.id,
        claimNumber: c.claimNumber,
        insuranceProvider: c.insuranceProvider,
        policyNumber: c.policyNumber,
        claimType: c.claimType,
        claimAmount: parseFloat(c.claimAmount.toString()),
        claimDate: c.claimDate,
        submissionDate: c.submissionDate,
        status: c.status,
        approvalAmount: c.approvalAmount ? parseFloat(c.approvalAmount.toString()) : null,
        rejectionReason: c.rejectionReason,
        paymentAmount: c.paymentAmount ? parseFloat(c.paymentAmount.toString()) : null,
        paymentDate: c.paymentDate,
        supportingDocuments: c.supportingDocuments ? JSON.parse(c.supportingDocuments) : [],
        notes: c.notes,
      };
    }),

  /**
   * Get claim statistics
   */
  getClaimStats: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      const claims = await db
        .select()
        .from(insuranceClaims)
        .where(eq(insuranceClaims.farmId, input.farmId));

      const totalClaimed = claims.reduce(
        (sum, c) => sum + parseFloat(c.claimAmount.toString()),
        0
      );

      const totalApproved = claims.reduce(
        (sum, c) => sum + (c.approvalAmount ? parseFloat(c.approvalAmount.toString()) : 0),
        0
      );

      const totalPaid = claims.reduce(
        (sum, c) => sum + (c.paymentAmount ? parseFloat(c.paymentAmount.toString()) : 0),
        0
      );

      const approved = claims.filter((c) => c.status === "approved").length;
      const rejected = claims.filter((c) => c.status === "rejected").length;
      const paid = claims.filter((c) => c.status === "paid").length;
      const pending = claims.filter(
        (c) => c.status === "draft" || c.status === "submitted" || c.status === "under_review"
      ).length;

      return {
        totalClaims: claims.length,
        totalClaimed: parseFloat(totalClaimed.toFixed(2)),
        totalApproved: parseFloat(totalApproved.toFixed(2)),
        totalPaid: parseFloat(totalPaid.toFixed(2)),
        approvalRate: claims.length > 0 ? parseFloat(((approved / claims.length) * 100).toFixed(1)) : 0,
        approvedClaims: approved,
        rejectedClaims: rejected,
        paidClaims: paid,
        pendingClaims: pending,
      };
    }),

  /**
   * Get claims by provider
   */
  getClaimsByProvider: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      const claims = await db
        .select()
        .from(insuranceClaims)
        .where(eq(insuranceClaims.farmId, input.farmId));

      const grouped: Record<string, any> = {};

      claims.forEach((claim) => {
        if (!grouped[claim.insuranceProvider]) {
          grouped[claim.insuranceProvider] = {
            provider: claim.insuranceProvider,
            totalClaims: 0,
            totalClaimed: 0,
            totalApproved: 0,
            totalPaid: 0,
            approvedCount: 0,
            rejectedCount: 0,
          };
        }

        grouped[claim.insuranceProvider].totalClaims += 1;
        grouped[claim.insuranceProvider].totalClaimed += parseFloat(claim.claimAmount.toString());

        if (claim.approvalAmount) {
          grouped[claim.insuranceProvider].totalApproved += parseFloat(claim.approvalAmount.toString());
        }

        if (claim.paymentAmount) {
          grouped[claim.insuranceProvider].totalPaid += parseFloat(claim.paymentAmount.toString());
        }

        if (claim.status === "approved") {
          grouped[claim.insuranceProvider].approvedCount += 1;
        } else if (claim.status === "rejected") {
          grouped[claim.insuranceProvider].rejectedCount += 1;
        }
      });

      return Object.values(grouped).map((provider: any) => ({
        ...provider,
        totalClaimed: parseFloat(provider.totalClaimed.toFixed(2)),
        totalApproved: parseFloat(provider.totalApproved.toFixed(2)),
        totalPaid: parseFloat(provider.totalPaid.toFixed(2)),
        approvalRate:
          provider.totalClaims > 0
            ? parseFloat(((provider.approvedCount / provider.totalClaims) * 100).toFixed(1))
            : 0,
      }));
    }),

  /**
   * Export claims for accounting
   */
  exportClaimsForAccounting: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      let query = db
        .select()
        .from(insuranceClaims)
        .where(eq(insuranceClaims.farmId, input.farmId));

      if (input.startDate && input.endDate) {
        query = db
          .select()
          .from(insuranceClaims)
          .where(
            and(
              eq(insuranceClaims.farmId, input.farmId)
            )
          );
      }

      const claims = await query;

      return {
        exportDate: new Date(),
        farmId: input.farmId,
        claims: claims.map((c) => ({
          claimNumber: c.claimNumber,
          date: c.claimDate,
          provider: c.insuranceProvider,
          type: c.claimType,
          amount: parseFloat(c.claimAmount.toString()),
          status: c.status,
          approvedAmount: c.approvalAmount ? parseFloat(c.approvalAmount.toString()) : 0,
          paidAmount: c.paymentAmount ? parseFloat(c.paymentAmount.toString()) : 0,
        })),
      };
    }),
});
