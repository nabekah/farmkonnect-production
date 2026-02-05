/**
 * Photo Sharing and Permissions System
 * Manages granular sharing controls and access permissions for photos
 */

export type PermissionLevel = 'view' | 'comment' | 'edit' | 'admin';

export interface PhotoShare {
  shareId: string;
  photoId: number;
  ownerId: number;
  sharedWithUserId: number;
  sharedWithEmail: string;
  permissionLevel: PermissionLevel;
  sharedAt: number;
  expiresAt?: number;
  accessCount: number;
  lastAccessedAt?: number;
  notes?: string;
}

export interface ShareLink {
  linkId: string;
  photoId: number;
  ownerId: number;
  permissionLevel: PermissionLevel;
  isPublic: boolean;
  accessToken: string;
  createdAt: number;
  expiresAt?: number;
  maxAccessCount?: number;
  accessCount: number;
  enabled: boolean;
}

export interface PhotoAccessLog {
  logId: string;
  photoId: number;
  userId: number;
  userEmail: string;
  action: 'view' | 'download' | 'comment' | 'edit' | 'share';
  timestamp: number;
  ipAddress?: string;
}

export class PhotoSharingService {
  private static shares: Map<string, PhotoShare> = new Map();
  private static shareLinks: Map<string, ShareLink> = new Map();
  private static accessLogs: PhotoAccessLog[] = [];
  private static photoPermissions: Map<number, Set<number>> = new Map();

  /**
   * Share a photo with a specific user
   */
  static shareWithUser(
    photoId: number,
    ownerId: number,
    sharedWithUserId: number,
    sharedWithEmail: string,
    permissionLevel: PermissionLevel,
    expiresAt?: number,
    notes?: string
  ): PhotoShare {
    const share: PhotoShare = {
      shareId: `share-${photoId}-${sharedWithUserId}-${Date.now()}`,
      photoId,
      ownerId,
      sharedWithUserId,
      sharedWithEmail,
      permissionLevel,
      sharedAt: Date.now(),
      expiresAt,
      accessCount: 0,
      notes,
    };

    this.shares.set(share.shareId, share);

    // Track permissions
    if (!this.photoPermissions.has(photoId)) {
      this.photoPermissions.set(photoId, new Set());
    }
    this.photoPermissions.get(photoId)!.add(sharedWithUserId);

    return share;
  }

  /**
   * Create a shareable link
   */
  static createShareLink(
    photoId: number,
    ownerId: number,
    permissionLevel: PermissionLevel,
    isPublic: boolean = false,
    expiresAt?: number,
    maxAccessCount?: number
  ): ShareLink {
    const link: ShareLink = {
      linkId: `link-${photoId}-${Date.now()}`,
      photoId,
      ownerId,
      permissionLevel,
      isPublic,
      accessToken: this.generateAccessToken(),
      createdAt: Date.now(),
      expiresAt,
      maxAccessCount,
      accessCount: 0,
      enabled: true,
    };

    this.shareLinks.set(link.linkId, link);
    return link;
  }

  /**
   * Verify access permission
   */
  static verifyAccess(
    photoId: number,
    userId: number,
    requiredPermission: PermissionLevel
  ): boolean {
    // Check direct shares
    let found = false;
    this.shares.forEach((share) => {
      if (
        share.photoId === photoId &&
        share.sharedWithUserId === userId &&
        this.hasPermission(share.permissionLevel, requiredPermission)
      ) {
        // Check expiration
        if (!share.expiresAt || Date.now() <= share.expiresAt) {
          found = true;
        }
      }
    });

    return found;
  }

  /**
   * Verify share link access
   */
  static verifyShareLinkAccess(
    linkId: string,
    requiredPermission: PermissionLevel
  ): { valid: boolean; link?: ShareLink } {
    const link = this.shareLinks.get(linkId);

    if (!link) {
      return { valid: false };
    }

    if (!link.enabled) {
      return { valid: false };
    }

    // Check expiration
    if (link.expiresAt && Date.now() > link.expiresAt) {
      return { valid: false };
    }

    // Check access limit
    if (link.maxAccessCount && link.accessCount >= link.maxAccessCount) {
      return { valid: false };
    }

    // Check permission
    if (!this.hasPermission(link.permissionLevel, requiredPermission)) {
      return { valid: false };
    }

    return { valid: true, link };
  }

  /**
   * Log photo access
   */
  static logAccess(
    photoId: number,
    userId: number,
    userEmail: string,
    action: PhotoAccessLog['action'],
    ipAddress?: string
  ): PhotoAccessLog {
    const log: PhotoAccessLog = {
      logId: `log-${photoId}-${userId}-${Date.now()}`,
      photoId,
      userId,
      userEmail,
      action,
      timestamp: Date.now(),
      ipAddress,
    };

    this.accessLogs.push(log);

    // Update share access count
    this.shares.forEach((share) => {
      if (share.photoId === photoId && share.sharedWithUserId === userId) {
        share.accessCount++;
        share.lastAccessedAt = Date.now();
      }
    });

    return log;
  }

  /**
   * Get all shares for a photo
   */
  static getPhotoShares(photoId: number): PhotoShare[] {
    const result: PhotoShare[] = [];
    this.shares.forEach((share) => {
      if (share.photoId === photoId) {
        result.push(share);
      }
    });
    return result;
  }

  /**
   * Get all shares for a user (as owner)
   */
  static getUserShares(userId: number): PhotoShare[] {
    const result: PhotoShare[] = [];
    this.shares.forEach((share) => {
      if (share.ownerId === userId) {
        result.push(share);
      }
    });
    return result;
  }

  /**
   * Get all shares for a user (as recipient)
   */
  static getSharedWithMe(userId: number): PhotoShare[] {
    const result: PhotoShare[] = [];
    this.shares.forEach((share) => {
      if (share.sharedWithUserId === userId) {
        result.push(share);
      }
    });
    return result;
  }

  /**
   * Get share links for a photo
   */
  static getPhotoShareLinks(photoId: number): ShareLink[] {
    const result: ShareLink[] = [];
    this.shareLinks.forEach((link) => {
      if (link.photoId === photoId) {
        result.push(link);
      }
    });
    return result;
  }

  /**
   * Revoke share
   */
  static revokeShare(shareId: string): boolean {
    return this.shares.delete(shareId);
  }

  /**
   * Disable share link
   */
  static disableShareLink(linkId: string): boolean {
    const link = this.shareLinks.get(linkId);
    if (!link) return false;

    link.enabled = false;
    return true;
  }

  /**
   * Update share permission
   */
  static updateSharePermission(shareId: string, newPermission: PermissionLevel): boolean {
    const share = this.shares.get(shareId);
    if (!share) return false;

    share.permissionLevel = newPermission;
    return true;
  }

  /**
   * Get access logs for a photo
   */
  static getPhotoAccessLogs(photoId: number): PhotoAccessLog[] {
    const result: PhotoAccessLog[] = [];
    this.accessLogs.forEach((log) => {
      if (log.photoId === photoId) {
        result.push(log);
      }
    });
    return result;
  }

  /**
   * Get access logs for a user
   */
  static getUserAccessLogs(userId: number): PhotoAccessLog[] {
    const result: PhotoAccessLog[] = [];
    this.accessLogs.forEach((log) => {
      if (log.userId === userId) {
        result.push(log);
      }
    });
    return result;
  }

  /**
   * Get sharing statistics
   */
  static getSharingStats(photoId: number): {
    totalShares: number;
    totalAccessCount: number;
    shareLinks: number;
    activeLinks: number;
    permissions: Record<PermissionLevel, number>;
    accessByAction: Record<string, number>;
  } {
    const shares = this.getPhotoShares(photoId);
    const links = this.getPhotoShareLinks(photoId);
    const logs = this.getPhotoAccessLogs(photoId);

    const permissions: Record<PermissionLevel, number> = {
      view: 0,
      comment: 0,
      edit: 0,
      admin: 0,
    };

    shares.forEach((share) => {
      permissions[share.permissionLevel]++;
    });

    const accessByAction: Record<string, number> = {};
    logs.forEach((log) => {
      accessByAction[log.action] = (accessByAction[log.action] || 0) + 1;
    });

    return {
      totalShares: shares.length,
      totalAccessCount: shares.reduce((sum, s) => sum + s.accessCount, 0),
      shareLinks: links.length,
      activeLinks: links.filter((l) => l.enabled).length,
      permissions,
      accessByAction,
    };
  }

  /**
   * Check if user can perform action
   */
  static canPerformAction(
    photoId: number,
    userId: number,
    action: 'view' | 'comment' | 'edit' | 'delete'
  ): boolean {
    const requiredPermissions: Record<string, PermissionLevel> = {
      view: 'view',
      comment: 'comment',
      edit: 'edit',
      delete: 'admin',
    };

    return this.verifyAccess(photoId, userId, requiredPermissions[action]);
  }

  /**
   * Bulk revoke shares
   */
  static revokeAllShares(photoId: number): number {
    let revoked = 0;
    const toDelete: string[] = [];

    this.shares.forEach((share, shareId) => {
      if (share.photoId === photoId) {
        toDelete.push(shareId);
      }
    });

    toDelete.forEach((shareId) => {
      this.shares.delete(shareId);
      revoked++;
    });

    return revoked;
  }

  /**
   * Export sharing report
   */
  static exportSharingReport(photoId: number): string {
    const shares = this.getPhotoShares(photoId);
    const logs = this.getPhotoAccessLogs(photoId);

    const rows = ['PhotoID,SharedWith,Permission,SharedAt,LastAccessed,AccessCount,ExpiresAt'];

    shares.forEach((share) => {
      rows.push(
        `${share.photoId},"${share.sharedWithEmail}",${share.permissionLevel},${new Date(share.sharedAt).toISOString()},${share.lastAccessedAt ? new Date(share.lastAccessedAt).toISOString() : 'N/A'},${share.accessCount},${share.expiresAt ? new Date(share.expiresAt).toISOString() : 'Never'}`
      );
    });

    return rows.join('\n');
  }

  // Private helper methods

  private static hasPermission(
    userPermission: PermissionLevel,
    requiredPermission: PermissionLevel
  ): boolean {
    const permissionHierarchy: Record<PermissionLevel, number> = {
      view: 1,
      comment: 2,
      edit: 3,
      admin: 4,
    };

    return permissionHierarchy[userPermission] >= permissionHierarchy[requiredPermission];
  }

  private static generateAccessToken(): string {
    return `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * tRPC Procedures for Photo Sharing
 */
export const photoSharingProcedures = {
  /**
   * Share with user
   */
  shareWithUser: (
    photoId: number,
    ownerId: number,
    sharedWithUserId: number,
    sharedWithEmail: string,
    permissionLevel: PermissionLevel,
    expiresAt?: number,
    notes?: string
  ) => {
    return PhotoSharingService.shareWithUser(
      photoId,
      ownerId,
      sharedWithUserId,
      sharedWithEmail,
      permissionLevel,
      expiresAt,
      notes
    );
  },

  /**
   * Create share link
   */
  createShareLink: (
    photoId: number,
    ownerId: number,
    permissionLevel: PermissionLevel,
    isPublic?: boolean,
    expiresAt?: number,
    maxAccessCount?: number
  ) => {
    return PhotoSharingService.createShareLink(
      photoId,
      ownerId,
      permissionLevel,
      isPublic,
      expiresAt,
      maxAccessCount
    );
  },

  /**
   * Verify access
   */
  verifyAccess: (photoId: number, userId: number, requiredPermission: PermissionLevel) => {
    return PhotoSharingService.verifyAccess(photoId, userId, requiredPermission);
  },

  /**
   * Get photo shares
   */
  getPhotoShares: (photoId: number) => {
    return PhotoSharingService.getPhotoShares(photoId);
  },

  /**
   * Get shared with me
   */
  getSharedWithMe: (userId: number) => {
    return PhotoSharingService.getSharedWithMe(userId);
  },

  /**
   * Revoke share
   */
  revokeShare: (shareId: string) => {
    return PhotoSharingService.revokeShare(shareId);
  },

  /**
   * Get sharing stats
   */
  getSharingStats: (photoId: number) => {
    return PhotoSharingService.getSharingStats(photoId);
  },

  /**
   * Export report
   */
  exportReport: (photoId: number) => {
    return PhotoSharingService.exportSharingReport(photoId);
  },
};
