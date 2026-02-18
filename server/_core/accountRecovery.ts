import { randomBytes } from "crypto";

/**
 * Account Recovery Service
 * Handles backup codes, account recovery, and security questions
 */

export interface RecoveryMethod {
  type: "backup_code" | "email" | "phone" | "security_question";
  verified: boolean;
  lastUsed?: Date;
}

export interface BackupCode {
  code: string;
  used: boolean;
  usedAt?: Date;
  createdAt: Date;
}

/**
 * Generate backup codes for account recovery
 * Returns 10 codes that can be used to recover account if 2FA is lost
 */
export function generateBackupCodes(count: number = 10): BackupCode[] {
  const codes: BackupCode[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric codes in format: XXXX-XXXX
    const part1 = randomBytes(2).toString("hex").toUpperCase();
    const part2 = randomBytes(2).toString("hex").toUpperCase();
    const code = `${part1}-${part2}`;

    codes.push({
      code,
      used: false,
      createdAt: now,
    });
  }

  return codes;
}

/**
 * Verify and use a backup code
 */
export function verifyBackupCode(
  inputCode: string,
  backupCodes: BackupCode[]
): { valid: boolean; message: string; codeIndex?: number } {
  // Normalize the input code
  const normalizedInput = inputCode.toUpperCase().replace(/\s/g, "");

  // Find matching code
  const codeIndex = backupCodes.findIndex(
    (bc) => bc.code.replace("-", "") === normalizedInput && !bc.used
  );

  if (codeIndex === -1) {
    return {
      valid: false,
      message: "Invalid or already used backup code",
    };
  }

  return {
    valid: true,
    message: "Backup code verified successfully",
    codeIndex,
  };
}

/**
 * Mark backup code as used
 */
export function markBackupCodeAsUsed(backupCodes: BackupCode[], codeIndex: number): BackupCode[] {
  const updated = [...backupCodes];
  if (updated[codeIndex]) {
    updated[codeIndex].used = true;
    updated[codeIndex].usedAt = new Date();
  }
  return updated;
}

/**
 * Get count of remaining backup codes
 */
export function getRemainingBackupCodeCount(backupCodes: BackupCode[]): number {
  return backupCodes.filter((bc) => !bc.used).length;
}

/**
 * Check if user has enough backup codes remaining
 */
export function hasEnoughBackupCodes(backupCodes: BackupCode[], minimum: number = 3): boolean {
  return getRemainingBackupCodeCount(backupCodes) >= minimum;
}

/**
 * Recovery challenge for account recovery
 */
export interface RecoveryChallenge {
  id: string;
  userId: number;
  type: "email_verification" | "backup_code" | "security_question";
  createdAt: Date;
  expiresAt: Date;
  verified: boolean;
  attempts: number;
  maxAttempts: number;
}

/**
 * Create account recovery challenge
 */
export function createRecoveryChallenge(
  userId: number,
  type: RecoveryChallenge["type"],
  expirationMinutes: number = 30
): RecoveryChallenge {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expirationMinutes * 60 * 1000);

  return {
    id: randomBytes(16).toString("hex"),
    userId,
    type,
    createdAt: now,
    expiresAt,
    verified: false,
    attempts: 0,
    maxAttempts: type === "backup_code" ? 5 : 3,
  };
}

/**
 * Check if recovery challenge is still valid
 */
export function isRecoveryChallengeValid(challenge: RecoveryChallenge): boolean {
  const now = new Date();
  return !challenge.verified && now < challenge.expiresAt && challenge.attempts < challenge.maxAttempts;
}

/**
 * Security questions for account recovery
 */
export const SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "In what city were you born?",
  "What is your favorite book?",
  "What was the make of your first car?",
  "What is your favorite movie?",
  "What is the name of the street you grew up on?",
  "What is your favorite food?",
  "What was your childhood nickname?",
  "What is the name of your best friend in high school?",
];

/**
 * Verify security answer (case-insensitive, trimmed)
 */
export function verifySecurityAnswer(userAnswer: string, correctAnswer: string): boolean {
  return userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
}

/**
 * Generate recovery email content
 */
export function generateRecoveryEmailContent(
  userName: string,
  recoveryLink: string,
  expirationMinutes: number = 30
): { subject: string; html: string; text: string } {
  const subject = "FarmKonnect Account Recovery";

  const html = `
    <h2>Account Recovery Request</h2>
    <p>Hi ${userName},</p>
    <p>We received a request to recover your FarmKonnect account. Click the link below to proceed:</p>
    <p><a href="${recoveryLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Recover Account</a></p>
    <p>This link will expire in ${expirationMinutes} minutes.</p>
    <p>If you didn't request this, please ignore this email.</p>
    <p>Best regards,<br/>FarmKonnect Team</p>
  `;

  const text = `
    Account Recovery Request
    
    Hi ${userName},
    
    We received a request to recover your FarmKonnect account. Visit the link below to proceed:
    
    ${recoveryLink}
    
    This link will expire in ${expirationMinutes} minutes.
    
    If you didn't request this, please ignore this email.
    
    Best regards,
    FarmKonnect Team
  `;

  return { subject, html, text };
}

/**
 * Account recovery status
 */
export interface AccountRecoveryStatus {
  canRecoverWithEmail: boolean;
  canRecoverWithBackupCode: boolean;
  canRecoverWithSecurityQuestion: boolean;
  availableMethods: RecoveryMethod[];
  lastRecoveryAttempt?: Date;
  recoveryAttempts: number;
}

/**
 * Get available recovery methods for a user
 */
export function getAvailableRecoveryMethods(
  email: string | null,
  hasBackupCodes: boolean,
  hasSecurityQuestions: boolean
): AccountRecoveryStatus {
  return {
    canRecoverWithEmail: !!email,
    canRecoverWithBackupCode: hasBackupCodes,
    canRecoverWithSecurityQuestion: hasSecurityQuestions,
    availableMethods: [
      email ? { type: "email", verified: true } : null,
      hasBackupCodes ? { type: "backup_code", verified: true } : null,
      hasSecurityQuestions ? { type: "security_question", verified: true } : null,
    ].filter((m) => m !== null) as RecoveryMethod[],
    recoveryAttempts: 0,
  };
}
