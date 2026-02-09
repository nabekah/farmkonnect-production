import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { and, eq, desc, gte, lte, sql } from "drizzle-orm";
import { vetReviews, vetReviewStats, veterinarians } from "../../drizzle/schema";

export const vetRatingsRouter = router({
  /**
   * Submit a review for a veterinarian
   */
  submitReview: protectedProcedure
    .input(
      z.object({
        veterinarianId: z.number(),
        farmId: z.number(),
        appointmentId: z.number().optional(),
        rating: z.number().min(1).max(5),
        reviewTitle: z.string().min(5).max(255),
        reviewText: z.string().min(10).max(5000),
        professionalismRating: z.number().min(1).max(5).optional(),
        communicationRating: z.number().min(1).max(5).optional(),
        priceValueRating: z.number().min(1).max(5).optional(),
        treatmentEffectivenessRating: z.number().min(1).max(5).optional(),
        animalSpecies: z.string().optional(),
        treatmentType: z.string().optional(),
        wouldRecommend: z.boolean().default(true),
        isAnonymous: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      // Insert review
      const [result] = await db.insert(vetReviews).values({
        veterinarianId: input.veterinarianId,
        farmId: input.farmId,
        userId: ctx.user.id,
        appointmentId: input.appointmentId,
        rating: input.rating,
        reviewTitle: input.reviewTitle,
        reviewText: input.reviewText,
        professionalismRating: input.professionalismRating,
        communicationRating: input.communicationRating,
        priceValueRating: input.priceValueRating,
        treatmentEffectivenessRating: input.treatmentEffectivenessRating,
        animalSpecies: input.animalSpecies,
        treatmentType: input.treatmentType,
        wouldRecommend: input.wouldRecommend,
        isAnonymous: input.isAnonymous,
        isVerified: !!input.appointmentId, // Mark as verified if appointment exists
        status: "pending", // Reviews are pending moderation
      });

      // Update review statistics
      await updateReviewStats(input.veterinarianId);

      return {
        success: true,
        reviewId: result.insertId,
        message: "Review submitted successfully and is pending moderation",
      };
    }),

  /**
   * Get all reviews for a veterinarian
   */
  getVeterinarianReviews: protectedProcedure
    .input(
      z.object({
        veterinarianId: z.number(),
        limit: z.number().default(10),
        offset: z.number().default(0),
        sortBy: z.enum(["recent", "helpful", "rating_high", "rating_low"]).default("recent"),
        minRating: z.number().min(1).max(5).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      let query = db
        .select()
        .from(vetReviews)
        .where(
          and(
            eq(vetReviews.veterinarianId, input.veterinarianId),
            eq(vetReviews.status, "approved")
          )
        );

      if (input.minRating) {
        query = db
          .select()
          .from(vetReviews)
          .where(
            and(
              eq(vetReviews.veterinarianId, input.veterinarianId),
              eq(vetReviews.status, "approved"),
              gte(vetReviews.rating, input.minRating)
            )
          );
      }

      // Apply sorting
      if (input.sortBy === "helpful") {
        query = query.orderBy(desc(vetReviews.helpfulCount));
      } else if (input.sortBy === "rating_high") {
        query = query.orderBy(desc(vetReviews.rating));
      } else if (input.sortBy === "rating_low") {
        query = query.orderBy(vetReviews.rating);
      } else {
        query = query.orderBy(desc(vetReviews.createdAt));
      }

      const reviews = await query.limit(input.limit).offset(input.offset);

      return reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        reviewTitle: review.reviewTitle,
        reviewText: review.reviewText,
        professionalismRating: review.professionalismRating,
        communicationRating: review.communicationRating,
        priceValueRating: review.priceValueRating,
        treatmentEffectivenessRating: review.treatmentEffectivenessRating,
        animalSpecies: review.animalSpecies,
        treatmentType: review.treatmentType,
        wouldRecommend: review.wouldRecommend,
        isVerified: review.isVerified,
        helpfulCount: review.helpfulCount,
        unhelpfulCount: review.unhelpfulCount,
        createdAt: review.createdAt,
        isAnonymous: review.isAnonymous,
      }));
    }),

  /**
   * Get review statistics for a veterinarian
   */
  getReviewStats: protectedProcedure
    .input(z.object({ veterinarianId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      const stats = await db
        .select()
        .from(vetReviewStats)
        .where(eq(vetReviewStats.veterinarianId, input.veterinarianId))
        .limit(1);

      if (!stats || stats.length === 0) {
        return {
          veterinarianId: input.veterinarianId,
          totalReviews: 0,
          averageRating: 0,
          averageProfessionalism: 0,
          averageCommunication: 0,
          averagePriceValue: 0,
          averageTreatmentEffectiveness: 0,
          recommendationPercentage: 0,
          ratingDistribution: {
            fiveStar: 0,
            fourStar: 0,
            threeStar: 0,
            twoStar: 0,
            oneStar: 0,
          },
        };
      }

      const stat = stats[0];

      return {
        veterinarianId: input.veterinarianId,
        totalReviews: stat.totalReviews,
        averageRating: parseFloat(stat.averageRating?.toString() || "0"),
        averageProfessionalism: parseFloat(stat.averageProfessionalism?.toString() || "0"),
        averageCommunication: parseFloat(stat.averageCommunication?.toString() || "0"),
        averagePriceValue: parseFloat(stat.averagePriceValue?.toString() || "0"),
        averageTreatmentEffectiveness: parseFloat(stat.averageTreatmentEffectiveness?.toString() || "0"),
        recommendationPercentage: stat.recommendationPercentage,
        ratingDistribution: {
          fiveStar: stat.fiveStarCount,
          fourStar: stat.fourStarCount,
          threeStar: stat.threeStarCount,
          twoStar: stat.twoStarCount,
          oneStar: stat.oneStarCount,
        },
      };
    }),

  /**
   * Mark review as helpful
   */
  markReviewHelpful: protectedProcedure
    .input(z.object({ reviewId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();

      await db
        .update(vetReviews)
        .set({ helpfulCount: sql`helpfulCount + 1` })
        .where(eq(vetReviews.id, input.reviewId));

      return { success: true, message: "Review marked as helpful" };
    }),

  /**
   * Mark review as unhelpful
   */
  markReviewUnhelpful: protectedProcedure
    .input(z.object({ reviewId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();

      await db
        .update(vetReviews)
        .set({ unhelpfulCount: sql`unhelpfulCount + 1` })
        .where(eq(vetReviews.id, input.reviewId));

      return { success: true, message: "Review marked as unhelpful" };
    }),

  /**
   * Get top-rated veterinarians
   */
  getTopRatedVeterinarians: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        minReviews: z.number().default(3),
        region: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      let query = db
        .select({
          id: veterinarians.id,
          clinicName: veterinarians.clinicName,
          specialization: veterinarians.specialization,
          clinicCity: veterinarians.clinicCity,
          clinicRegion: veterinarians.clinicRegion,
          consultationFee: veterinarians.consultationFee,
          rating: veterinarians.rating,
          totalReviews: veterinarians.totalReviews,
          telemedicineAvailable: veterinarians.telemedicineAvailable,
        })
        .from(veterinarians)
        .where(
          and(
            eq(veterinarians.isVerified, true),
            gte(veterinarians.totalReviews, input.minReviews)
          )
        );

      if (input.region) {
        query = db
          .select({
            id: veterinarians.id,
            clinicName: veterinarians.clinicName,
            specialization: veterinarians.specialization,
            clinicCity: veterinarians.clinicCity,
            clinicRegion: veterinarians.clinicRegion,
            consultationFee: veterinarians.consultationFee,
            rating: veterinarians.rating,
            totalReviews: veterinarians.totalReviews,
            telemedicineAvailable: veterinarians.telemedicineAvailable,
          })
          .from(veterinarians)
          .where(
            and(
              eq(veterinarians.isVerified, true),
              gte(veterinarians.totalReviews, input.minReviews),
              eq(veterinarians.clinicRegion, input.region)
            )
          );
      }

      const vets = await query
        .orderBy(desc(veterinarians.rating))
        .limit(input.limit);

      return vets;
    }),

  /**
   * Search veterinarians by rating and reviews
   */
  searchByRating: protectedProcedure
    .input(
      z.object({
        minRating: z.number().min(1).max(5).default(3),
        specialization: z.string().optional(),
        region: z.string().optional(),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      let query = db
        .select()
        .from(veterinarians)
        .where(
          and(
            eq(veterinarians.isVerified, true),
            gte(veterinarians.rating, input.minRating)
          )
        );

      if (input.specialization) {
        query = db
          .select()
          .from(veterinarians)
          .where(
            and(
              eq(veterinarians.isVerified, true),
              gte(veterinarians.rating, input.minRating),
              sql`specialization LIKE ${`%${input.specialization}%`}`
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
              gte(veterinarians.rating, input.minRating),
              eq(veterinarians.clinicRegion, input.region)
            )
          );
      }

      const vets = await query
        .orderBy(desc(veterinarians.rating))
        .limit(input.limit);

      return vets.map((vet) => ({
        id: vet.id,
        clinicName: vet.clinicName,
        specialization: vet.specialization,
        clinicCity: vet.clinicCity,
        clinicRegion: vet.clinicRegion,
        consultationFee: parseFloat(vet.consultationFee?.toString() || "0"),
        rating: parseFloat(vet.rating?.toString() || "0"),
        totalReviews: vet.totalReviews,
        telemedicineAvailable: vet.telemedicineAvailable,
      }));
    }),

  /**
   * Get user's reviews
   */
  getUserReviews: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = getDb();

      const reviews = await db
        .select()
        .from(vetReviews)
        .where(
          and(
            eq(vetReviews.farmId, input.farmId),
            eq(vetReviews.userId, ctx.user.id)
          )
        )
        .orderBy(desc(vetReviews.createdAt));

      return reviews;
    }),

  /**
   * Delete a review (only by author)
   */
  deleteReview: protectedProcedure
    .input(z.object({ reviewId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      const review = await db
        .select()
        .from(vetReviews)
        .where(eq(vetReviews.id, input.reviewId))
        .limit(1);

      if (!review || review.length === 0) {
        return { error: "Review not found" };
      }

      if (review[0].userId !== ctx.user.id) {
        return { error: "Unauthorized" };
      }

      await db.delete(vetReviews).where(eq(vetReviews.id, input.reviewId));

      // Update stats
      await updateReviewStats(review[0].veterinarianId);

      return { success: true, message: "Review deleted successfully" };
    }),
});

/**
 * Helper function to update review statistics
 */
async function updateReviewStats(veterinarianId: number) {
  const db = getDb();

  const reviews = await db
    .select()
    .from(vetReviews)
    .where(
      and(
        eq(vetReviews.veterinarianId, veterinarianId),
        eq(vetReviews.status, "approved")
      )
    );

  if (reviews.length === 0) {
    return;
  }

  const totalReviews = reviews.length;
  const averageRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
  const averageProfessionalism =
    reviews.filter((r) => r.professionalismRating).reduce((sum, r) => sum + (r.professionalismRating || 0), 0) /
    reviews.filter((r) => r.professionalismRating).length || 0;
  const averageCommunication =
    reviews.filter((r) => r.communicationRating).reduce((sum, r) => sum + (r.communicationRating || 0), 0) /
    reviews.filter((r) => r.communicationRating).length || 0;
  const averagePriceValue =
    reviews.filter((r) => r.priceValueRating).reduce((sum, r) => sum + (r.priceValueRating || 0), 0) /
    reviews.filter((r) => r.priceValueRating).length || 0;
  const averageTreatmentEffectiveness =
    reviews.filter((r) => r.treatmentEffectivenessRating).reduce((sum, r) => sum + (r.treatmentEffectivenessRating || 0), 0) /
    reviews.filter((r) => r.treatmentEffectivenessRating).length || 0;
  const recommendationPercentage = Math.round(
    (reviews.filter((r) => r.wouldRecommend).length / totalReviews) * 100
  );

  const ratingCounts = {
    fiveStarCount: reviews.filter((r) => r.rating === 5).length,
    fourStarCount: reviews.filter((r) => r.rating === 4).length,
    threeStarCount: reviews.filter((r) => r.rating === 3).length,
    twoStarCount: reviews.filter((r) => r.rating === 2).length,
    oneStarCount: reviews.filter((r) => r.rating === 1).length,
  };

  // Update or insert stats
  const existingStats = await db
    .select()
    .from(vetReviewStats)
    .where(eq(vetReviewStats.veterinarianId, veterinarianId))
    .limit(1);

  if (existingStats && existingStats.length > 0) {
    await db
      .update(vetReviewStats)
      .set({
        totalReviews,
        averageRating: averageRating.toString(),
        averageProfessionalism: averageProfessionalism.toString(),
        averageCommunication: averageCommunication.toString(),
        averagePriceValue: averagePriceValue.toString(),
        averageTreatmentEffectiveness: averageTreatmentEffectiveness.toString(),
        recommendationPercentage,
        ...ratingCounts,
      })
      .where(eq(vetReviewStats.veterinarianId, veterinarianId));
  } else {
    await db.insert(vetReviewStats).values({
      veterinarianId,
      totalReviews,
      averageRating: averageRating.toString(),
      averageProfessionalism: averageProfessionalism.toString(),
      averageCommunication: averageCommunication.toString(),
      averagePriceValue: averagePriceValue.toString(),
      averageTreatmentEffectiveness: averageTreatmentEffectiveness.toString(),
      recommendationPercentage,
      ...ratingCounts,
    });
  }

  // Update veterinarian's rating
  await db
    .update(veterinarians)
    .set({
      rating: averageRating.toString(),
      totalReviews,
    })
    .where(eq(veterinarians.id, veterinarianId));
}
