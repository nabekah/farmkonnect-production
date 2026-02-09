import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { and, eq, like, desc } from "drizzle-orm";
import { veterinarians, vetCommunications } from "../../drizzle/schema";

export const vetDirectoryRouter = router({
  /**
   * Search veterinarians by specialization, region, or name
   */
  searchVeterinarians: protectedProcedure
    .input(
      z.object({
        specialization: z.string().optional(),
        region: z.string().optional(),
        searchTerm: z.string().optional(),
        telemedicineOnly: z.boolean().default(false),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      let query = db.select().from(veterinarians).where(eq(veterinarians.isVerified, true));

      if (input.specialization) {
        query = db
          .select()
          .from(veterinarians)
          .where(
            and(
              eq(veterinarians.isVerified, true),
              like(veterinarians.specialization, `%${input.specialization}%`)
            )
          );
      }

      if (input.region) {
        query = db
          .select()
          .from(veterinarians)
          .where(
            and(
              eq(veterinarians.isVerified, true),
              eq(veterinarians.clinicRegion, input.region)
            )
          );
      }

      if (input.searchTerm) {
        query = db
          .select()
          .from(veterinarians)
          .where(
            and(
              eq(veterinarians.isVerified, true),
              like(veterinarians.clinicName, `%${input.searchTerm}%`)
            )
          );
      }

      if (input.telemedicineOnly) {
        query = db
          .select()
          .from(veterinarians)
          .where(
            and(
              eq(veterinarians.isVerified, true),
              eq(veterinarians.telemedicineAvailable, true)
            )
          );
      }

      const results = await query;

      return results.map((vet) => ({
        id: vet.id,
        clinicName: vet.clinicName,
        specialization: vet.specialization,
        clinicCity: vet.clinicCity,
        clinicRegion: vet.clinicRegion,
        clinicPhone: vet.clinicPhone,
        clinicEmail: vet.clinicEmail,
        yearsOfExperience: vet.yearsOfExperience,
        consultationFee: parseFloat(vet.consultationFee?.toString() || "0"),
        currency: vet.currency,
        rating: parseFloat(vet.rating?.toString() || "0"),
        totalReviews: vet.totalReviews,
        telemedicineAvailable: vet.telemedicineAvailable,
      }));
    }),

  /**
   * Get veterinarian profile details
   */
  getVeterinarianProfile: protectedProcedure
    .input(z.object({ veterinarianId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      const vet = await db
        .select()
        .from(veterinarians)
        .where(eq(veterinarians.id, input.veterinarianId))
        .limit(1);

      if (!vet || vet.length === 0) {
        return { error: "Veterinarian not found" };
      }

      const vetRecord = vet[0];

      return {
        id: vetRecord.id,
        clinicName: vetRecord.clinicName,
        specialization: vetRecord.specialization,
        licenseNumber: vetRecord.licenseNumber,
        yearsOfExperience: vetRecord.yearsOfExperience,
        clinicAddress: vetRecord.clinicAddress,
        clinicCity: vetRecord.clinicCity,
        clinicRegion: vetRecord.clinicRegion,
        clinicPhone: vetRecord.clinicPhone,
        clinicEmail: vetRecord.clinicEmail,
        consultationFee: parseFloat(vetRecord.consultationFee?.toString() || "0"),
        currency: vetRecord.currency,
        rating: parseFloat(vetRecord.rating?.toString() || "0"),
        totalReviews: vetRecord.totalReviews,
        availability: vetRecord.availability ? JSON.parse(vetRecord.availability) : {},
        telemedicineAvailable: vetRecord.telemedicineAvailable,
        isVerified: vetRecord.isVerified,
      };
    }),

  /**
   * Send message to veterinarian
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        veterinarianId: z.number(),
        message: z.string().min(1),
        messageType: z.enum(["text", "image", "document", "audio"]).default("text"),
        attachmentUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      const [result] = await db.insert(vetCommunications).values({
        farmId: input.farmId,
        veterinarianId: input.veterinarianId,
        senderId: ctx.user.id,
        messageType: input.messageType,
        message: input.message,
        attachmentUrl: input.attachmentUrl,
        isRead: false,
      });

      return {
        success: true,
        messageId: result.insertId,
        message: "Message sent successfully",
      };
    }),

  /**
   * Get conversation history with a veterinarian
   */
  getConversation: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        veterinarianId: z.number(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      const messages = await db
        .select()
        .from(vetCommunications)
        .where(
          and(
            eq(vetCommunications.farmId, input.farmId),
            eq(vetCommunications.veterinarianId, input.veterinarianId)
          )
        )
        .orderBy(desc(vetCommunications.createdAt))
        .limit(input.limit);

      return messages.map((msg) => ({
        id: msg.id,
        senderId: msg.senderId,
        messageType: msg.messageType,
        message: msg.message,
        attachmentUrl: msg.attachmentUrl,
        isRead: msg.isRead,
        createdAt: msg.createdAt,
      }));
    }),

  /**
   * Mark messages as read
   */
  markMessagesAsRead: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        veterinarianId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      await db
        .update(vetCommunications)
        .set({ isRead: true, readAt: new Date() })
        .where(
          and(
            eq(vetCommunications.farmId, input.farmId),
            eq(vetCommunications.veterinarianId, input.veterinarianId),
            eq(vetCommunications.isRead, false)
          )
        );

      return { success: true, message: "Messages marked as read" };
    }),

  /**
   * Get unread message count
   */
  getUnreadMessageCount: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      const messages = await db
        .select()
        .from(vetCommunications)
        .where(
          and(
            eq(vetCommunications.farmId, input.farmId),
            eq(vetCommunications.isRead, false)
          )
        );

      const grouped: Record<number, number> = {};
      messages.forEach((msg) => {
        grouped[msg.veterinarianId] = (grouped[msg.veterinarianId] || 0) + 1;
      });

      return {
        unreadCount: messages.length,
        conversations: grouped,
      };
    }),

  /**
   * Get list of veterinarians the farm has communicated with
   */
  getCommunicationHistory: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      const communications = await db
        .select()
        .from(vetCommunications)
        .where(eq(vetCommunications.farmId, input.farmId))
        .orderBy(desc(vetCommunications.createdAt));

      const grouped: Record<number, { lastMessage: string; lastMessageDate: Date; messageCount: number }> = {};

      communications.forEach((comm) => {
        if (!grouped[comm.veterinarianId]) {
          grouped[comm.veterinarianId] = {
            lastMessage: comm.message || "",
            lastMessageDate: comm.createdAt,
            messageCount: 0,
          };
        }
        grouped[comm.veterinarianId].messageCount += 1;
      });

      return Object.entries(grouped).map(([vetId, data]) => ({
        veterinarianId: parseInt(vetId),
        ...data,
      }));
    }),
});
