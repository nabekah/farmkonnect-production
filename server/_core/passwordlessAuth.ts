import crypto from "crypto";

/**
 * Magic Link Token
 */
export interface MagicLinkToken {
  token: string;
  email: string;
  userId?: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  usedAt?: Date;
}

/**
 * Biometric Credential
 */
export interface BiometricCredential {
  id: string;
  userId: string;
  type: "fingerprint" | "face" | "iris";
  publicKey: string;
  credentialId: string;
  counter: number;
  transports?: string[];
  createdAt: Date;
  lastUsedAt: Date;
  isActive: boolean;
}

/**
 * Passwordless Authentication Service
 * Supports magic links and biometric authentication
 */
class PasswordlessAuthService {
  private magicLinkTokens: Map<string, MagicLinkToken> = new Map();
  private biometricCredentials: Map<string, BiometricCredential> = new Map();
  private readonly tokenExpiration = 15 * 60 * 1000; // 15 minutes
  private readonly tokenLength = 32;

  /**
   * Generate magic link token
   * @param email - User email address
   * @param userId - Optional user ID
   * @returns Magic link token
   */
  generateMagicLinkToken(email: string, userId?: string): MagicLinkToken {
    const token = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + this.tokenExpiration);

    const magicLink: MagicLinkToken = {
      token,
      email,
      userId,
      expiresAt,
      used: false,
      createdAt: new Date(),
    };

    this.magicLinkTokens.set(token, magicLink);

    return magicLink;
  }

  /**
   * Verify magic link token
   * @param token - Magic link token
   * @returns Magic link data if valid, null otherwise
   */
  verifyMagicLinkToken(token: string): MagicLinkToken | null {
    const magicLink = this.magicLinkTokens.get(token);

    if (!magicLink) {
      return null;
    }

    // Check if token has expired
    if (new Date() > magicLink.expiresAt) {
      this.magicLinkTokens.delete(token);
      return null;
    }

    // Check if token has already been used
    if (magicLink.used) {
      return null;
    }

    return magicLink;
  }

  /**
   * Use magic link token
   * @param token - Magic link token
   * @returns Success status
   */
  useMagicLinkToken(token: string): boolean {
    const magicLink = this.verifyMagicLinkToken(token);

    if (!magicLink) {
      return false;
    }

    magicLink.used = true;
    magicLink.usedAt = new Date();

    return true;
  }

  /**
   * Get magic link token for email
   * @param email - User email
   * @returns Magic link token or null
   */
  getMagicLinkTokenForEmail(email: string): MagicLinkToken | null {
    for (const [, token] of this.magicLinkTokens.entries()) {
      if (token.email === email && !token.used && new Date() <= token.expiresAt) {
        return token;
      }
    }

    return null;
  }

  /**
   * Register biometric credential
   * @param userId - User ID
   * @param type - Biometric type (fingerprint, face, iris)
   * @param credentialId - Credential ID from authenticator
   * @param publicKey - Public key from authenticator
   * @param transports - Optional transports (usb, nfc, ble, internal)
   * @returns Registered credential
   */
  registerBiometricCredential(
    userId: string,
    type: "fingerprint" | "face" | "iris",
    credentialId: string,
    publicKey: string,
    transports?: string[]
  ): BiometricCredential {
    const id = this.generateSecureToken();

    const credential: BiometricCredential = {
      id,
      userId,
      type,
      publicKey,
      credentialId,
      counter: 0,
      transports,
      createdAt: new Date(),
      lastUsedAt: new Date(),
      isActive: true,
    };

    this.biometricCredentials.set(id, credential);

    return credential;
  }

  /**
   * Get biometric credentials for user
   * @param userId - User ID
   * @returns Array of biometric credentials
   */
  getUserBiometricCredentials(userId: string): BiometricCredential[] {
    const credentials: BiometricCredential[] = [];

    for (const [, credential] of this.biometricCredentials.entries()) {
      if (credential.userId === userId && credential.isActive) {
        credentials.push(credential);
      }
    }

    return credentials;
  }

  /**
   * Verify biometric credential
   * @param userId - User ID
   * @param credentialId - Credential ID
   * @param counter - Counter from authenticator
   * @returns Verification result
   */
  verifyBiometricCredential(userId: string, credentialId: string, counter: number): { valid: boolean; message: string } {
    const credentials = this.getUserBiometricCredentials(userId);

    const credential = credentials.find((c) => c.credentialId === credentialId);

    if (!credential) {
      return {
        valid: false,
        message: "Credential not found",
      };
    }

    // Check counter to prevent cloning attacks
    if (counter <= credential.counter) {
      return {
        valid: false,
        message: "Invalid counter value - possible cloning attack",
      };
    }

    // Update counter and last used time
    credential.counter = counter;
    credential.lastUsedAt = new Date();

    return {
      valid: true,
      message: "Credential verified successfully",
    };
  }

  /**
   * Remove biometric credential
   * @param userId - User ID
   * @param credentialId - Credential ID
   * @returns Success status
   */
  removeBiometricCredential(userId: string, credentialId: string): boolean {
    for (const [id, credential] of this.biometricCredentials.entries()) {
      if (credential.userId === userId && credential.credentialId === credentialId) {
        credential.isActive = false;
        return true;
      }
    }

    return false;
  }

  /**
   * Check if user has biometric credentials
   * @param userId - User ID
   * @returns True if user has active biometric credentials
   */
  hasBiometricCredentials(userId: string): boolean {
    return this.getUserBiometricCredentials(userId).length > 0;
  }

  /**
   * Generate magic link URL
   * @param token - Magic link token
   * @param baseUrl - Base URL of the application
   * @returns Magic link URL
   */
  generateMagicLinkUrl(token: string, baseUrl: string): string {
    return `${baseUrl}/auth/magic-link?token=${token}`;
  }

  /**
   * Generate magic link email content
   * @param email - User email
   * @param magicLinkUrl - Magic link URL
   * @returns Email content
   */
  generateMagicLinkEmailContent(email: string, magicLinkUrl: string): { subject: string; html: string; text: string } {
    const subject = "Your FarmKonnect Login Link";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2D5016; color: white; padding: 20px; text-align: center;">
          <h1>FarmKonnect</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p>Hi,</p>
          
          <p>Click the link below to securely log in to your FarmKonnect account. This link will expire in 15 minutes.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${magicLinkUrl}" style="background-color: #2D5016; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
              Sign In to FarmKonnect
            </a>
          </div>
          
          <p style="color: #666; font-size: 12px;">
            Or copy and paste this link in your browser:<br>
            <code>${magicLinkUrl}</code>
          </p>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #856404; font-size: 12px;">
              <strong>Security Tip:</strong> Never share this link with anyone. FarmKonnect will never ask you for this link via email.
            </p>
          </div>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated email from FarmKonnect. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    const text = `
      FarmKonnect Login Link
      
      Click the link below to securely log in to your FarmKonnect account. This link will expire in 15 minutes.
      
      ${magicLinkUrl}
      
      Security Tip: Never share this link with anyone. FarmKonnect will never ask you for this link via email.
      
      This is an automated email from FarmKonnect.
    `;

    return { subject, html, text };
  }

  /**
   * Generate secure random token
   * @returns Secure random token
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(this.tokenLength).toString("hex");
  }

  /**
   * Clean up expired tokens
   */
  cleanupExpiredTokens() {
    const now = new Date();

    for (const [token, magicLink] of this.magicLinkTokens.entries()) {
      if (now > magicLink.expiresAt) {
        this.magicLinkTokens.delete(token);
      }
    }
  }

  /**
   * Get passwordless auth statistics
   * @returns Statistics object
   */
  getStatistics() {
    return {
      activeMagicLinks: Array.from(this.magicLinkTokens.values()).filter(
        (t) => !t.used && new Date() <= t.expiresAt
      ).length,
      usedMagicLinks: Array.from(this.magicLinkTokens.values()).filter((t) => t.used).length,
      totalBiometricCredentials: this.biometricCredentials.size,
      activeBiometricCredentials: Array.from(this.biometricCredentials.values()).filter((c) => c.isActive).length,
    };
  }
}

export const passwordlessAuth = new PasswordlessAuthService();
