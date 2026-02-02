import { getDb } from '../db';
import { recipientGroups, groupMembers } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

export interface GroupMemberInput {
  email: string;
  name?: string;
  role?: string;
  isPrimary?: boolean;
}

export class RecipientGroupService {
  /**
   * Create a new recipient group
   */
  async createGroup(
    farmId: number,
    name: string,
    description?: string
  ) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const [result] = await db.insert(recipientGroups).values({
      farmId,
      name,
      description,
      isActive: true,
    });

    return result.insertId;
  }

  /**
   * Get group by ID
   */
  async getGroup(groupId: number) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const groups = await db
      .select()
      .from(recipientGroups)
      .where(eq(recipientGroups.id, groupId))
      .limit(1);

    if (!groups.length) return null;

    const members = await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.groupId, groupId));

    return {
      ...groups[0],
      members,
    };
  }

  /**
   * Get all groups for a farm
   */
  async getGroupsForFarm(farmId: number) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const groups = await db
      .select()
      .from(recipientGroups)
      .where(eq(recipientGroups.farmId, farmId));

    const groupsWithMembers = await Promise.all(
      groups.map(async (group) => {
        const members = await db
          .select()
          .from(groupMembers)
          .where(eq(groupMembers.groupId, group.id));

        return {
          ...group,
          memberCount: members.length,
          members,
        };
      })
    );

    return groupsWithMembers;
  }

  /**
   * Update group details
   */
  async updateGroup(
    groupId: number,
    updates: {
      name?: string;
      description?: string;
      isActive?: boolean;
    }
  ) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updates.name) updateData.name = updates.name;
    if (updates.description) updateData.description = updates.description;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    await db
      .update(recipientGroups)
      .set(updateData)
      .where(eq(recipientGroups.id, groupId));

    return this.getGroup(groupId);
  }

  /**
   * Delete group and its members
   */
  async deleteGroup(groupId: number) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    await db.delete(groupMembers).where(eq(groupMembers.groupId, groupId));
    await db.delete(recipientGroups).where(eq(recipientGroups.id, groupId));

    return true;
  }

  /**
   * Add member to group
   */
  async addMember(
    groupId: number,
    email: string,
    name?: string,
    role?: string,
    isPrimary: boolean = false
  ) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    // Check if member already exists
    const existing = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.email, email)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new Error('Member already exists in this group');
    }

    // If marking as primary, unmark other primary members
    if (isPrimary) {
      await db
        .update(groupMembers)
        .set({ isPrimary: false })
        .where(eq(groupMembers.groupId, groupId));
    }

    const [result] = await db.insert(groupMembers).values({
      groupId,
      email,
      name,
      role,
      isPrimary,
    });

    return result.insertId;
  }

  /**
   * Remove member from group
   */
  async removeMember(memberId: number) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    await db.delete(groupMembers).where(eq(groupMembers.id, memberId));

    return true;
  }

  /**
   * Update member details
   */
  async updateMember(
    memberId: number,
    updates: {
      name?: string;
      role?: string;
      isPrimary?: boolean;
    }
  ) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const updateData: any = {};

    if (updates.name) updateData.name = updates.name;
    if (updates.role) updateData.role = updates.role;
    if (updates.isPrimary !== undefined) {
      updateData.isPrimary = updates.isPrimary;

      // If marking as primary, get the group and unmark others
      if (updates.isPrimary) {
        const member = await db
          .select()
          .from(groupMembers)
          .where(eq(groupMembers.id, memberId))
          .limit(1);

        if (member.length > 0) {
          await db
            .update(groupMembers)
            .set({ isPrimary: false })
            .where(eq(groupMembers.groupId, member[0].groupId));
        }
      }
    }

    await db.update(groupMembers).set(updateData).where(eq(groupMembers.id, memberId));

    return true;
  }

  /**
   * Get all emails in a group
   */
  async getGroupEmails(groupId: number): Promise<string[]> {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const members = await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.groupId, groupId));

    return members.map((m) => m.email);
  }

  /**
   * Bulk add members to group
   */
  async addMembers(
    groupId: number,
    members: GroupMemberInput[]
  ) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const insertedIds: number[] = [];

    for (const member of members) {
      try {
        const id = await this.addMember(
          groupId,
          member.email,
          member.name,
          member.role,
          member.isPrimary || false
        );
        insertedIds.push(id);
      } catch (error) {
        // Skip if member already exists
        console.warn(`Failed to add member ${member.email}:`, error);
      }
    }

    return insertedIds;
  }

  /**
   * Clone group with members
   */
  async cloneGroup(groupId: number, newName: string) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const group = await this.getGroup(groupId);
    if (!group) throw new Error('Group not found');

    const [newGroupResult] = await db.insert(recipientGroups).values({
      farmId: group.farmId,
      name: newName,
      description: group.description,
      isActive: group.isActive,
    });

    const newGroupId = newGroupResult.insertId;

    // Clone members
    if (group.members && group.members.length > 0) {
      for (const member of group.members) {
        await this.addMember(
          newGroupId,
          member.email,
          member.name || undefined,
          member.role || undefined,
          member.isPrimary || false
        );
      }
    }

    return newGroupId;
  }

  /**
   * Get group statistics
   */
  async getGroupStats(farmId: number) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const groups = await db
      .select()
      .from(recipientGroups)
      .where(eq(recipientGroups.farmId, farmId));

    let totalMembers = 0;

    for (const group of groups) {
      const members = await db
        .select()
        .from(groupMembers)
        .where(eq(groupMembers.groupId, group.id));

      totalMembers += members.length;
    }

    return {
      totalGroups: groups.length,
      activeGroups: groups.filter((g) => g.isActive).length,
      totalMembers,
      averageMembersPerGroup: groups.length > 0 ? totalMembers / groups.length : 0,
    };
  }
}

export const recipientGroupService = new RecipientGroupService();
