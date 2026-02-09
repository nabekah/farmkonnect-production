import { getDb } from "../db";

/**
 * Real-time Maintenance Alerts Service
 * Handles automatic SMS/email notifications for equipment maintenance
 * Includes technician assignment and completion tracking
 */

export interface MaintenanceAlert {
  alertId: number;
  equipmentId: number;
  equipmentName: string;
  maintenanceType: string;
  scheduledDate: Date;
  daysUntilDue: number;
  status: "due_soon" | "overdue" | "assigned" | "in_progress" | "completed";
  assignedTechnician?: string;
  notificationSent: boolean;
  notificationDate?: Date;
}

export interface TechnicianAssignment {
  assignmentId: number;
  maintenanceId: number;
  technicianId: number;
  technicianName: string;
  assignedDate: Date;
  status: "assigned" | "in_progress" | "completed" | "cancelled";
  completionDate?: Date;
  notes?: string;
}

/**
 * Check for maintenance due within 7 days and send alerts
 */
export async function checkAndSendMaintenanceAlerts(): Promise<MaintenanceAlert[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const alerts: MaintenanceAlert[] = [];
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Mock data - in production, query database
    const upcomingMaintenance = [
      {
        equipmentId: 1,
        equipmentName: "John Deere Tractor",
        maintenanceType: "Oil Change",
        scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      {
        equipmentId: 2,
        equipmentName: "Water Pump",
        maintenanceType: "Filter Replacement",
        scheduledDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        equipmentId: 3,
        equipmentName: "Generator",
        maintenanceType: "Routine Inspection",
        scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const maintenance of upcomingMaintenance) {
      const daysUntilDue = Math.ceil((maintenance.scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      let status: MaintenanceAlert["status"] = "due_soon";
      if (daysUntilDue < 0) {
        status = "overdue";
      } else if (daysUntilDue <= 7) {
        status = "due_soon";
      }

      alerts.push({
        alertId: Math.floor(Math.random() * 1000000),
        equipmentId: maintenance.equipmentId,
        equipmentName: maintenance.equipmentName,
        maintenanceType: maintenance.maintenanceType,
        scheduledDate: maintenance.scheduledDate,
        daysUntilDue,
        status,
        notificationSent: true,
        notificationDate: new Date(),
      });

      // In production, send SMS/email here
      console.log(
        `[ALERT] ${maintenance.equipmentName} - ${maintenance.maintenanceType} ${daysUntilDue < 0 ? "OVERDUE" : "due in " + daysUntilDue + " days"}`
      );
    }

    return alerts;
  } catch (error) {
    console.error("Error checking maintenance alerts:", error);
    return [];
  }
}

/**
 * Send SMS alert to technician
 */
export async function sendTechnicianSMSAlert(
  technicianPhone: string,
  equipmentName: string,
  maintenanceType: string,
  scheduledDate: Date
): Promise<{ success: boolean; messageId?: string }> {
  try {
    // In production, use Twilio to send SMS
    const message = `Maintenance Alert: ${equipmentName} requires ${maintenanceType} on ${scheduledDate.toLocaleDateString()}. Please confirm receipt.`;

    console.log(`[SMS] To: ${technicianPhone} - ${message}`);

    return {
      success: true,
      messageId: `MSG-${Math.floor(Math.random() * 1000000)}`,
    };
  } catch (error) {
    console.error("Error sending SMS alert:", error);
    return { success: false };
  }
}

/**
 * Send email alert to technician
 */
export async function sendTechnicianEmailAlert(
  technicianEmail: string,
  equipmentName: string,
  maintenanceType: string,
  scheduledDate: Date,
  estimatedCost: number
): Promise<{ success: boolean; messageId?: string }> {
  try {
    // In production, use SendGrid to send email
    const emailContent = `
      <h2>Maintenance Assignment</h2>
      <p><strong>Equipment:</strong> ${equipmentName}</p>
      <p><strong>Maintenance Type:</strong> ${maintenanceType}</p>
      <p><strong>Scheduled Date:</strong> ${scheduledDate.toLocaleDateString()}</p>
      <p><strong>Estimated Cost:</strong> GH₵${estimatedCost}</p>
      <p>Please confirm your availability and update the status in the system.</p>
    `;

    console.log(`[EMAIL] To: ${technicianEmail} - Maintenance assignment`);

    return {
      success: true,
      messageId: `EMAIL-${Math.floor(Math.random() * 1000000)}`,
    };
  } catch (error) {
    console.error("Error sending email alert:", error);
    return { success: false };
  }
}

/**
 * Assign technician to maintenance task
 */
export async function assignTechnician(
  maintenanceId: number,
  technicianId: number,
  technicianName: string,
  technicianPhone?: string,
  technicianEmail?: string
): Promise<TechnicianAssignment | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const assignment: TechnicianAssignment = {
      assignmentId: Math.floor(Math.random() * 1000000),
      maintenanceId,
      technicianId,
      technicianName,
      assignedDate: new Date(),
      status: "assigned",
    };

    // Send notifications
    if (technicianPhone) {
      await sendTechnicianSMSAlert(technicianPhone, "Equipment", "Maintenance", new Date());
    }
    if (technicianEmail) {
      await sendTechnicianEmailAlert(technicianEmail, "Equipment", "Maintenance", new Date(), 500);
    }

    console.log(`Technician assigned: ${technicianName} to maintenance ${maintenanceId}`);

    return assignment;
  } catch (error) {
    console.error("Error assigning technician:", error);
    return null;
  }
}

/**
 * Update maintenance progress
 */
export async function updateMaintenanceProgress(
  assignmentId: number,
  status: "in_progress" | "completed" | "cancelled",
  notes?: string
): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Database not available" };

  try {
    console.log(`Maintenance ${assignmentId} status updated to ${status}`);

    return {
      success: true,
      message: `Maintenance status updated to ${status}`,
    };
  } catch (error) {
    console.error("Error updating maintenance progress:", error);
    return { success: false, message: "Failed to update maintenance progress" };
  }
}

/**
 * Get active maintenance assignments for technician
 */
export async function getTechnicianAssignments(technicianId: number): Promise<TechnicianAssignment[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    // Mock data - in production, query database
    return [
      {
        assignmentId: 1,
        maintenanceId: 101,
        technicianId,
        technicianName: "John Smith",
        assignedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: "in_progress",
        notes: "Oil change in progress",
      },
      {
        assignmentId: 2,
        maintenanceId: 102,
        technicianId,
        technicianName: "John Smith",
        assignedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: "assigned",
      },
    ];
  } catch (error) {
    console.error("Error fetching technician assignments:", error);
    return [];
  }
}

/**
 * Get maintenance alert statistics
 */
export async function getMaintenanceAlertStats(farmId: number): Promise<{
  totalDue: number;
  overdue: number;
  dueSoon: number;
  assigned: number;
  inProgress: number;
  completed: number;
}> {
  const db = await getDb();
  if (!db)
    return {
      totalDue: 0,
      overdue: 0,
      dueSoon: 0,
      assigned: 0,
      inProgress: 0,
      completed: 0,
    };

  try {
    // Mock data - in production, query database
    return {
      totalDue: 8,
      overdue: 2,
      dueSoon: 3,
      assigned: 2,
      inProgress: 1,
      completed: 12,
    };
  } catch (error) {
    console.error("Error fetching alert stats:", error);
    return {
      totalDue: 0,
      overdue: 0,
      dueSoon: 0,
      assigned: 0,
      inProgress: 0,
      completed: 0,
    };
  }
}

/**
 * Send escalation alert for overdue maintenance
 */
export async function sendEscalationAlert(
  maintenanceId: number,
  equipmentName: string,
  daysOverdue: number,
  supervisorEmail: string
): Promise<{ success: boolean; message: string }> {
  try {
    // In production, send email via SendGrid
    const message = `URGENT: ${equipmentName} maintenance is ${daysOverdue} days overdue. Immediate action required.`;

    console.log(`[ESCALATION] ${message} - Sent to ${supervisorEmail}`);

    return {
      success: true,
      message: "Escalation alert sent to supervisor",
    };
  } catch (error) {
    console.error("Error sending escalation alert:", error);
    return { success: false, message: "Failed to send escalation alert" };
  }
}
