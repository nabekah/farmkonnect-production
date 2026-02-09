import { router, protectedProcedure, adminProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  createVerificationRequest,
  getPendingRequests,
  getVerificationRequest,
  verifyDocument,
  approveVerificationRequest,
  rejectVerificationRequest,
  requestAdditionalInfo,
  getVerificationStats,
  revokeVerification,
  getVerificationHistory,
} from '../services/veterinarianVerificationService';

export const veterinarianVerificationRouter = router({
  /**
   * Submit verification request
   */
  submitRequest: protectedProcedure
    .input(
      z.object({
        veterinarianId: z.number(),
        veterinarianName: z.string(),
        veterinarianEmail: z.string().email(),
        specialty: z.string(),
        region: z.string(),
        licenseNumber: z.string(),
        licenseExpiry: z.date(),
        yearsOfExperience: z.number().min(0),
        documents: z.array(
          z.object({
            type: z.enum(['license', 'certificate', 'insurance', 'identification']),
            url: z.string().url(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const documents = input.documents.map((doc, idx) => ({
          id: `DOC-${Date.now()}-${idx}`,
          type: doc.type as 'license' | 'certificate' | 'insurance' | 'identification',
          url: doc.url,
          uploadedAt: new Date(),
          verified: false,
        }));

        const request = await createVerificationRequest(
          input.veterinarianId,
          input.veterinarianName,
          input.veterinarianEmail,
          input.specialty,
          input.region,
          documents
        );

        return {
          success: true,
          requestId: request.id,
          message: 'Verification request submitted successfully',
          status: request.status,
        };
      } catch (error) {
        console.error('Error submitting verification request:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to submit verification request',
        });
      }
    }),

  /**
   * Get pending verification requests (admin only)
   */
  getPendingRequests: adminProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        const result = await getPendingRequests(input.limit, input.offset);
        return {
          requests: result.requests,
          total: result.total,
          limit: input.limit,
          offset: input.offset,
          hasMore: input.offset + input.limit < result.total,
        };
      } catch (error) {
        console.error('Error fetching pending requests:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch pending requests',
        });
      }
    }),

  /**
   * Get verification request details (admin only)
   */
  getRequest: adminProcedure
    .input(z.object({ requestId: z.string() }))
    .query(async ({ input }) => {
      try {
        const request = await getVerificationRequest(input.requestId);
        return request;
      } catch (error) {
        console.error('Error fetching verification request:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch verification request',
        });
      }
    }),

  /**
   * Verify a document (admin only)
   */
  verifyDocument: adminProcedure
    .input(
      z.object({
        requestId: z.string(),
        documentId: z.string(),
        verified: z.boolean(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await verifyDocument(
          input.requestId,
          input.documentId,
          input.verified,
          input.notes
        );
        return {
          success: result.success,
          message: result.message,
        };
      } catch (error) {
        console.error('Error verifying document:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to verify document',
        });
      }
    }),

  /**
   * Approve verification request (admin only)
   */
  approveRequest: adminProcedure
    .input(
      z.object({
        requestId: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await approveVerificationRequest(
          input.requestId,
          ctx.user?.id || 'system',
          input.notes
        );
        return {
          success: result.success,
          message: result.message,
          veterinarianId: result.veterinarianId,
        };
      } catch (error) {
        console.error('Error approving verification request:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to approve verification request',
        });
      }
    }),

  /**
   * Reject verification request (admin only)
   */
  rejectRequest: adminProcedure
    .input(
      z.object({
        requestId: z.string(),
        rejectionReason: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await rejectVerificationRequest(
          input.requestId,
          input.rejectionReason,
          ctx.user?.id || 'system'
        );
        return {
          success: result.success,
          message: result.message,
        };
      } catch (error) {
        console.error('Error rejecting verification request:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to reject verification request',
        });
      }
    }),

  /**
   * Request additional information (admin only)
   */
  requestAdditionalInfo: adminProcedure
    .input(
      z.object({
        requestId: z.string(),
        requiredDocuments: z.array(z.string()),
        message: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await requestAdditionalInfo(
          input.requestId,
          input.requiredDocuments,
          input.message,
          ctx.user?.id || 'system'
        );
        return {
          success: result.success,
          message: result.message,
        };
      } catch (error) {
        console.error('Error requesting additional information:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to request additional information',
        });
      }
    }),

  /**
   * Get verification statistics (admin only)
   */
  getStatistics: adminProcedure.query(async () => {
    try {
      const stats = await getVerificationStats();
      return stats;
    } catch (error) {
      console.error('Error fetching verification statistics:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch verification statistics',
      });
    }
  }),

  /**
   * Revoke veterinarian verification (admin only)
   */
  revokeVerification: adminProcedure
    .input(
      z.object({
        veterinarianId: z.number(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await revokeVerification(
          input.veterinarianId,
          input.reason,
          ctx.user?.id || 'system'
        );
        return {
          success: result.success,
          message: result.message,
        };
      } catch (error) {
        console.error('Error revoking verification:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to revoke verification',
        });
      }
    }),

  /**
   * Get verification history for a veterinarian
   */
  getHistory: protectedProcedure
    .input(z.object({ veterinarianId: z.number() }))
    .query(async ({ input }) => {
      try {
        const history = await getVerificationHistory(input.veterinarianId);
        return {
          veterinarianId: input.veterinarianId,
          history,
        };
      } catch (error) {
        console.error('Error fetching verification history:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch verification history',
        });
      }
    }),
});
