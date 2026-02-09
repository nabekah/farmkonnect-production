import { TRPCError } from '@trpc/server';
import { getDb } from '../db';
import { veterinaryDirectory } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

export interface VerificationDocument {
  id: string;
  type: 'license' | 'certificate' | 'insurance' | 'identification';
  url: string;
  uploadedAt: Date;
  verified: boolean;
  verificationNotes?: string;
}

export interface VeterinarianVerificationRequest {
  id: string;
  veterinarianId: number;
  veterinarianName: string;
  veterinarianEmail: string;
  specialty: string;
  region: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  documents: VerificationDocument[];
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
  notes?: string;
}

/**
 * Create a new verification request
 */
export async function createVerificationRequest(
  veterinarianId: number,
  veterinarianName: string,
  veterinarianEmail: string,
  specialty: string,
  region: string,
  documents: VerificationDocument[]
): Promise<VeterinarianVerificationRequest> {
  try {
    const requestId = `VER-${Date.now()}`;

    const request: VeterinarianVerificationRequest = {
      id: requestId,
      veterinarianId,
      veterinarianName,
      veterinarianEmail,
      specialty,
      region,
      status: 'pending',
      documents,
      submittedAt: new Date(),
    };

    // In production, save to database
    console.log('Verification request created:', request);

    return request;
  } catch (error) {
    console.error('Error creating verification request:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create verification request',
    });
  }
}

/**
 * Get pending verification requests
 */
export async function getPendingRequests(
  limit: number = 20,
  offset: number = 0
): Promise<{ requests: VeterinarianVerificationRequest[]; total: number }> {
  try {
    // In production, fetch from database
    const mockRequests: VeterinarianVerificationRequest[] = [
      {
        id: 'VER-1',
        veterinarianId: 1,
        veterinarianName: 'Dr. John Osei',
        veterinarianEmail: 'john@example.com',
        specialty: 'Large Animal Medicine',
        region: 'Ashanti',
        status: 'pending',
        documents: [
          {
            id: 'DOC-1',
            type: 'license',
            url: '/documents/license-1.pdf',
            uploadedAt: new Date(),
            verified: false,
          },
          {
            id: 'DOC-2',
            type: 'certificate',
            url: '/documents/certificate-1.pdf',
            uploadedAt: new Date(),
            verified: false,
          },
        ],
        submittedAt: new Date(Date.now() - 86400000),
      },
      {
        id: 'VER-2',
        veterinarianId: 2,
        veterinarianName: 'Dr. Ama Boateng',
        veterinarianEmail: 'ama@example.com',
        specialty: 'Poultry Health',
        region: 'Greater Accra',
        status: 'under_review',
        documents: [
          {
            id: 'DOC-3',
            type: 'license',
            url: '/documents/license-2.pdf',
            uploadedAt: new Date(),
            verified: true,
          },
        ],
        submittedAt: new Date(Date.now() - 172800000),
      },
    ];

    return {
      requests: mockRequests.slice(offset, offset + limit),
      total: mockRequests.length,
    };
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch pending requests',
    });
  }
}

/**
 * Get verification request by ID
 */
export async function getVerificationRequest(
  requestId: string
): Promise<VeterinarianVerificationRequest> {
  try {
    // In production, fetch from database
    const mockRequest: VeterinarianVerificationRequest = {
      id: requestId,
      veterinarianId: 1,
      veterinarianName: 'Dr. John Osei',
      veterinarianEmail: 'john@example.com',
      specialty: 'Large Animal Medicine',
      region: 'Ashanti',
      status: 'pending',
      documents: [
        {
          id: 'DOC-1',
          type: 'license',
          url: '/documents/license-1.pdf',
          uploadedAt: new Date(),
          verified: false,
        },
      ],
      submittedAt: new Date(),
    };

    return mockRequest;
  } catch (error) {
    console.error('Error fetching verification request:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch verification request',
    });
  }
}

/**
 * Verify a document
 */
export async function verifyDocument(
  requestId: string,
  documentId: string,
  verified: boolean,
  notes?: string
): Promise<{ success: boolean; message: string }> {
  try {
    // In production, update database
    console.log(`Document ${documentId} verification: ${verified}`, notes);

    return {
      success: true,
      message: `Document ${verified ? 'verified' : 'rejected'} successfully`,
    };
  } catch (error) {
    console.error('Error verifying document:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to verify document',
    });
  }
}

/**
 * Approve verification request
 */
export async function approveVerificationRequest(
  requestId: string,
  approvedBy: string,
  notes?: string
): Promise<{ success: boolean; message: string; veterinarianId?: number }> {
  try {
    // In production, update database and mark veterinarian as verified
    console.log(`Verification request ${requestId} approved by ${approvedBy}`, notes);

    return {
      success: true,
      message: 'Veterinarian verified and added to directory',
      veterinarianId: 1,
    };
  } catch (error) {
    console.error('Error approving verification request:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to approve verification request',
    });
  }
}

/**
 * Reject verification request
 */
export async function rejectVerificationRequest(
  requestId: string,
  rejectionReason: string,
  rejectedBy: string
): Promise<{ success: boolean; message: string }> {
  try {
    // In production, update database
    console.log(
      `Verification request ${requestId} rejected by ${rejectedBy}: ${rejectionReason}`
    );

    return {
      success: true,
      message: 'Verification request rejected',
    };
  } catch (error) {
    console.error('Error rejecting verification request:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to reject verification request',
    });
  }
}

/**
 * Request additional information
 */
export async function requestAdditionalInfo(
  requestId: string,
  requiredDocuments: string[],
  message: string,
  requestedBy: string
): Promise<{ success: boolean; message: string }> {
  try {
    // In production, update database and send notification
    console.log(
      `Additional info requested for ${requestId}:`,
      requiredDocuments,
      message
    );

    return {
      success: true,
      message: 'Additional information requested from veterinarian',
    };
  } catch (error) {
    console.error('Error requesting additional information:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to request additional information',
    });
  }
}

/**
 * Get verification statistics
 */
export async function getVerificationStats(): Promise<{
  total: number;
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
  averageReviewTime: number;
}> {
  try {
    // In production, calculate from database
    return {
      total: 150,
      pending: 25,
      underReview: 12,
      approved: 105,
      rejected: 8,
      averageReviewTime: 3.5, // days
    };
  } catch (error) {
    console.error('Error fetching verification statistics:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch verification statistics',
    });
  }
}

/**
 * Revoke veterinarian verification
 */
export async function revokeVerification(
  veterinarianId: number,
  reason: string,
  revokedBy: string
): Promise<{ success: boolean; message: string }> {
  try {
    const db = getDb();

    // Update veterinarian status
    // In production, update database
    console.log(
      `Verification revoked for veterinarian ${veterinarianId} by ${revokedBy}: ${reason}`
    );

    return {
      success: true,
      message: 'Veterinarian verification revoked',
    };
  } catch (error) {
    console.error('Error revoking verification:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to revoke verification',
    });
  }
}

/**
 * Get verification history for a veterinarian
 */
export async function getVerificationHistory(
  veterinarianId: number
): Promise<Array<{
  id: string;
  status: string;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  notes?: string;
}>> {
  try {
    // In production, fetch from database
    const mockHistory = [
      {
        id: 'VER-1',
        status: 'approved',
        submittedAt: new Date(Date.now() - 2592000000), // 30 days ago
        reviewedAt: new Date(Date.now() - 2505600000), // 29 days ago
        reviewedBy: 'Admin User',
        notes: 'All documents verified',
      },
    ];

    return mockHistory;
  } catch (error) {
    console.error('Error fetching verification history:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch verification history',
    });
  }
}
