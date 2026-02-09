import { getDb } from "../db";

/**
 * Certification Renewal Alert Service
 * Handles automatic notifications for expiring certifications
 * and manages the renewal workflow
 */

export interface CertificationRenewalAlert {
  workerId: number;
  workerName: string;
  certificationName: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  status: "alert_sent" | "renewal_requested" | "renewed" | "expired";
  alertSentDate?: Date;
}

export interface CertificationRenewalRequest {
  requestId: number;
  workerId: number;
  certificationId: number;
  requestDate: Date;
  status: "pending" | "approved" | "rejected" | "completed";
  renewalDate?: Date;
  notes?: string;
}

/**
 * Check for certifications expiring within 30 days
 * and send alerts to workers
 */
export async function checkAndSendCertificationAlerts(): Promise<CertificationRenewalAlert[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const alerts: CertificationRenewalAlert[] = [];
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Mock data - in production, this would query the database
    const expiringCertifications = [
      {
        workerId: 1,
        workerName: "John Smith",
        certificationName: "Agricultural Safety Certification",
        expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      },
      {
        workerId: 2,
        workerName: "Sarah Johnson",
        certificationName: "Pesticide Handling Certification",
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      },
      {
        workerId: 3,
        workerName: "Michael Brown",
        certificationName: "First Aid Certification",
        expiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const cert of expiringCertifications) {
      const daysUntilExpiry = Math.ceil((cert.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
        alerts.push({
          workerId: cert.workerId,
          workerName: cert.workerName,
          certificationName: cert.certificationName,
          expiryDate: cert.expiryDate,
          daysUntilExpiry,
          status: "alert_sent",
          alertSentDate: new Date(),
        });

        // In production, send SMS/email notification here
        console.log(
          `[ALERT] ${cert.workerName}'s ${cert.certificationName} expires in ${daysUntilExpiry} days`
        );
      }
    }

    return alerts;
  } catch (error) {
    console.error("Error checking certification expiry:", error);
    return [];
  }
}

/**
 * Create renewal request for a certification
 */
export async function createRenewalRequest(
  workerId: number,
  certificationId: number,
  notes?: string
): Promise<CertificationRenewalRequest | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const requestId = Math.floor(Math.random() * 1000000);

    const renewalRequest: CertificationRenewalRequest = {
      requestId,
      workerId,
      certificationId,
      requestDate: new Date(),
      status: "pending",
      notes,
    };

    // In production, save to database
    console.log(`Renewal request created: ${requestId}`);

    return renewalRequest;
  } catch (error) {
    console.error("Error creating renewal request:", error);
    return null;
  }
}

/**
 * Approve renewal request and schedule certification
 */
export async function approveRenewalRequest(
  requestId: number,
  renewalDate: Date,
  approverNotes?: string
): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Database not available" };

  try {
    // In production, update database
    console.log(`Renewal request ${requestId} approved for ${renewalDate.toLocaleDateString()}`);

    return {
      success: true,
      message: "Renewal request approved. Worker will be notified to complete renewal.",
    };
  } catch (error) {
    console.error("Error approving renewal request:", error);
    return { success: false, message: "Failed to approve renewal request" };
  }
}

/**
 * Record certification renewal completion
 */
export async function recordCertificationRenewal(
  requestId: number,
  renewalDate: Date,
  certificateNumber: string,
  expiryDate: Date
): Promise<{ success: boolean; message: string; certificateUrl?: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Database not available" };

  try {
    // In production, update database and generate certificate
    const certificateUrl = `/certificates/${certificateNumber}.pdf`;

    console.log(`Certification renewed: ${certificateNumber}`);

    return {
      success: true,
      message: "Certification renewed successfully",
      certificateUrl,
    };
  } catch (error) {
    console.error("Error recording renewal:", error);
    return { success: false, message: "Failed to record certification renewal" };
  }
}

/**
 * Get renewal requests for a worker
 */
export async function getWorkerRenewalRequests(workerId: number): Promise<CertificationRenewalRequest[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    // Mock data - in production, query database
    return [
      {
        requestId: 1,
        workerId,
        certificationId: 1,
        requestDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: "pending",
        notes: "Waiting for approval",
      },
      {
        requestId: 2,
        workerId,
        certificationId: 2,
        requestDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        status: "approved",
        renewalDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      },
    ];
  } catch (error) {
    console.error("Error fetching renewal requests:", error);
    return [];
  }
}

/**
 * Generate automatic certificate PDF
 */
export async function generateCertificate(
  workerName: string,
  certificationName: string,
  renewalDate: Date,
  expiryDate: Date,
  certificateNumber: string
): Promise<{ success: boolean; pdfUrl?: string; message: string }> {
  try {
    // In production, use a PDF generation library
    const pdfUrl = `/certificates/${certificateNumber}.pdf`;

    console.log(`Certificate generated: ${certificateNumber}`);

    return {
      success: true,
      pdfUrl,
      message: "Certificate generated successfully",
    };
  } catch (error) {
    console.error("Error generating certificate:", error);
    return {
      success: false,
      message: "Failed to generate certificate",
    };
  }
}

/**
 * Get certification renewal statistics
 */
export async function getCertificationRenewalStats(farmId: number): Promise<{
  totalWorkers: number;
  certificationsDueThisMonth: number;
  certificationsDueNextMonth: number;
  overdueRenewals: number;
  pendingRequests: number;
  completedThisMonth: number;
}> {
  const db = await getDb();
  if (!db)
    return {
      totalWorkers: 0,
      certificationsDueThisMonth: 0,
      certificationsDueNextMonth: 0,
      overdueRenewals: 0,
      pendingRequests: 0,
      completedThisMonth: 0,
    };

  try {
    // Mock data - in production, query database
    return {
      totalWorkers: 25,
      certificationsDueThisMonth: 3,
      certificationsDueNextMonth: 5,
      overdueRenewals: 1,
      pendingRequests: 2,
      completedThisMonth: 4,
    };
  } catch (error) {
    console.error("Error fetching renewal stats:", error);
    return {
      totalWorkers: 0,
      certificationsDueThisMonth: 0,
      certificationsDueNextMonth: 0,
      overdueRenewals: 0,
      pendingRequests: 0,
      completedThisMonth: 0,
    };
  }
}
