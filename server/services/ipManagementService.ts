import { getDb } from "../db";
import { ipWhitelistBlacklist } from "../../drizzle/schema";
import { eq, and, or, like } from "drizzle-orm";

export type IPListType = "whitelist" | "blacklist";
export type IPReason = "trusted_partner" | "known_attacker" | "vpn_provider" | "corporate_network" | "manual" | "auto_blocked";

export interface IPListEntry {
  ipAddress: string;
  listType: IPListType;
  reason: IPReason;
  description?: string;
  expiresAt?: Date;
  addedBy: number;
}

export class IPManagementService {
  /**
   * Add IP to whitelist
   */
  static async addToWhitelist(
    ipAddress: string,
    reason: IPReason,
    description: string | undefined,
    addedBy: number,
    expiresAt?: Date
  ): Promise<void> {
    const db = getDb();

    // Remove from blacklist if exists
    await db
      .delete(ipWhitelistBlacklist)
      .where(
        and(
          eq(ipWhitelistBlacklist.ipAddress, ipAddress),
          eq(ipWhitelistBlacklist.listType, "blacklist")
        )
      );

    // Add to whitelist
    await db.insert(ipWhitelistBlacklist).values({
      ipAddress,
      listType: "whitelist",
      reason,
      description,
      expiresAt,
      addedBy,
      addedAt: new Date(),
    });
  }

  /**
   * Add IP to blacklist
   */
  static async addToBlacklist(
    ipAddress: string,
    reason: IPReason,
    description: string | undefined,
    addedBy: number,
    expiresAt?: Date
  ): Promise<void> {
    const db = getDb();

    // Remove from whitelist if exists
    await db
      .delete(ipWhitelistBlacklist)
      .where(
        and(
          eq(ipWhitelistBlacklist.ipAddress, ipAddress),
          eq(ipWhitelistBlacklist.listType, "whitelist")
        )
      );

    // Add to blacklist
    await db.insert(ipWhitelistBlacklist).values({
      ipAddress,
      listType: "blacklist",
      reason,
      description,
      expiresAt,
      addedBy,
      addedAt: new Date(),
    });
  }

  /**
   * Remove IP from lists
   */
  static async removeIP(ipAddress: string): Promise<void> {
    const db = getDb();
    await db
      .delete(ipWhitelistBlacklist)
      .where(eq(ipWhitelistBlacklist.ipAddress, ipAddress));
  }

  /**
   * Check if IP is whitelisted
   */
  static async isWhitelisted(ipAddress: string): Promise<boolean> {
    const db = getDb();
    const now = new Date();

    const entries = await db
      .select()
      .from(ipWhitelistBlacklist)
      .where(
        and(
          eq(ipWhitelistBlacklist.ipAddress, ipAddress),
          eq(ipWhitelistBlacklist.listType, "whitelist")
        )
      )
      .limit(1);

    if (entries.length === 0) {
      return false;
    }

    const entry = entries[0];

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < now) {
      await this.removeIP(ipAddress);
      return false;
    }

    return true;
  }

  /**
   * Check if IP is blacklisted
   */
  static async isBlacklisted(ipAddress: string): Promise<boolean> {
    const db = getDb();
    const now = new Date();

    const entries = await db
      .select()
      .from(ipWhitelistBlacklist)
      .where(
        and(
          eq(ipWhitelistBlacklist.ipAddress, ipAddress),
          eq(ipWhitelistBlacklist.listType, "blacklist")
        )
      )
      .limit(1);

    if (entries.length === 0) {
      return false;
    }

    const entry = entries[0];

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < now) {
      await this.removeIP(ipAddress);
      return false;
    }

    return true;
  }

  /**
   * Get IP status
   */
  static async getIPStatus(ipAddress: string): Promise<{
    status: "whitelisted" | "blacklisted" | "neutral";
    entry: any | null;
  }> {
    const db = getDb();
    const now = new Date();

    const entries = await db
      .select()
      .from(ipWhitelistBlacklist)
      .where(eq(ipWhitelistBlacklist.ipAddress, ipAddress))
      .limit(1);

    if (entries.length === 0) {
      return { status: "neutral", entry: null };
    }

    const entry = entries[0];

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < now) {
      await this.removeIP(ipAddress);
      return { status: "neutral", entry: null };
    }

    return {
      status: entry.listType === "whitelist" ? "whitelisted" : "blacklisted",
      entry,
    };
  }

  /**
   * Get all whitelisted IPs
   */
  static async getWhitelist(limit: number = 100, offset: number = 0): Promise<any[]> {
    const db = getDb();
    const now = new Date();

    const entries = await db
      .select()
      .from(ipWhitelistBlacklist)
      .where(eq(ipWhitelistBlacklist.listType, "whitelist"))
      .limit(limit)
      .offset(offset);

    // Filter out expired entries
    return entries.filter((e) => !e.expiresAt || e.expiresAt > now);
  }

  /**
   * Get all blacklisted IPs
   */
  static async getBlacklist(limit: number = 100, offset: number = 0): Promise<any[]> {
    const db = getDb();
    const now = new Date();

    const entries = await db
      .select()
      .from(ipWhitelistBlacklist)
      .where(eq(ipWhitelistBlacklist.listType, "blacklist"))
      .limit(limit)
      .offset(offset);

    // Filter out expired entries
    return entries.filter((e) => !e.expiresAt || e.expiresAt > now);
  }

  /**
   * Search IPs
   */
  static async searchIPs(query: string, limit: number = 50): Promise<any[]> {
    const db = getDb();
    const now = new Date();

    const entries = await db
      .select()
      .from(ipWhitelistBlacklist)
      .where(like(ipWhitelistBlacklist.ipAddress, `%${query}%`))
      .limit(limit);

    // Filter out expired entries
    return entries.filter((e) => !e.expiresAt || e.expiresAt > now);
  }

  /**
   * Get statistics
   */
  static async getStatistics(): Promise<{
    totalWhitelisted: number;
    totalBlacklisted: number;
    totalExpired: number;
  }> {
    const db = getDb();
    const now = new Date();

    const allEntries = await db.select().from(ipWhitelistBlacklist);

    const whitelisted = allEntries.filter(
      (e) => e.listType === "whitelist" && (!e.expiresAt || e.expiresAt > now)
    ).length;

    const blacklisted = allEntries.filter(
      (e) => e.listType === "blacklist" && (!e.expiresAt || e.expiresAt > now)
    ).length;

    const expired = allEntries.filter((e) => e.expiresAt && e.expiresAt <= now).length;

    return {
      totalWhitelisted: whitelisted,
      totalBlacklisted: blacklisted,
      totalExpired: expired,
    };
  }

  /**
   * Bulk import IPs
   */
  static async bulkImport(
    ips: Array<{ ipAddress: string; listType: IPListType; reason: IPReason; description?: string }>,
    addedBy: number
  ): Promise<{ imported: number; failed: number }> {
    const db = getDb();
    let imported = 0;
    let failed = 0;

    for (const ip of ips) {
      try {
        // Remove existing entry
        await db
          .delete(ipWhitelistBlacklist)
          .where(eq(ipWhitelistBlacklist.ipAddress, ip.ipAddress));

        // Add new entry
        await db.insert(ipWhitelistBlacklist).values({
          ipAddress: ip.ipAddress,
          listType: ip.listType,
          reason: ip.reason,
          description: ip.description,
          addedBy,
          addedAt: new Date(),
        });

        imported++;
      } catch (error) {
        console.error(`Failed to import IP ${ip.ipAddress}:`, error);
        failed++;
      }
    }

    return { imported, failed };
  }

  /**
   * Export IPs as CSV
   */
  static async exportAsCSV(listType?: IPListType): Promise<string> {
    const db = getDb();
    const now = new Date();

    let entries = await db.select().from(ipWhitelistBlacklist);

    if (listType) {
      entries = entries.filter((e) => e.listType === listType);
    }

    // Filter out expired entries
    entries = entries.filter((e) => !e.expiresAt || e.expiresAt > now);

    const headers = ["IP Address", "List Type", "Reason", "Description", "Expires At", "Added At"];
    const rows = entries.map((e) => [
      e.ipAddress,
      e.listType,
      e.reason,
      e.description || "",
      e.expiresAt ? e.expiresAt.toISOString() : "Never",
      e.addedAt.toISOString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

    return csv;
  }

  /**
   * Cleanup expired entries
   */
  static async cleanupExpired(): Promise<number> {
    const db = getDb();
    const now = new Date();

    const expiredEntries = await db
      .select()
      .from(ipWhitelistBlacklist)
      .where((table) => table.expiresAt !== null && table.expiresAt <= now);

    for (const entry of expiredEntries) {
      await db
        .delete(ipWhitelistBlacklist)
        .where(eq(ipWhitelistBlacklist.id, entry.id));
    }

    return expiredEntries.length;
  }
}
