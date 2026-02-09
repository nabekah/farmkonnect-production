import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

/**
 * Simplified Breeding Analytics Router
 * Works with existing breedingRecords and animals tables
 */
export const breedingSimplifiedRouter = router({
  /**
   * Get all breeding records for a farm
   */
  getBreedingRecords: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const records = await ctx.db.query.breedingRecords.findMany({
          where: (br, { eq }) => eq(br.farmId, input.farmId),
        });
        return records || [];
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch breeding records",
        });
      }
    }),

  /**
   * Get breeding analytics summary for a farm
   */
  getBreedingAnalytics: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const breedingRecords = await ctx.db.query.breedingRecords.findMany({
          where: (br, { eq }) => eq(br.farmId, input.farmId),
        });

        const totalBreedingEvents = breedingRecords.length;
        const successfulBreedings = breedingRecords.filter(
          (r) => r.outcome === "successful"
        ).length;
        const failedBreedings = breedingRecords.filter(
          (r) => r.outcome === "unsuccessful"
        ).length;
        const pendingBreedings = breedingRecords.filter(
          (r) => r.outcome === "pending"
        ).length;

        const successRate =
          totalBreedingEvents > 0
            ? Math.round((successfulBreedings / totalBreedingEvents) * 100)
            : 0;

        // Get breeding animals
        const animals = await ctx.db.query.animals.findMany({
          where: (a, { eq }) => eq(a.farmId, input.farmId),
        });

        const breedingAnimals = animals.filter(
          (a) => a.animalType === "cattle" || a.animalType === "goat" || a.animalType === "sheep"
        );

        return {
          totalBreedingEvents,
          successfulBreedings,
          failedBreedings,
          pendingBreedings,
          successRate,
          totalBreedingAnimals: breedingAnimals.length,
          averageBreedingAge: Math.round(
            breedingAnimals.reduce((sum, a) => sum + (a.age || 0), 0) /
              Math.max(breedingAnimals.length, 1)
          ),
          lastBreedingDate: breedingRecords.length > 0
            ? new Date(
                Math.max(
                  ...breedingRecords.map((r) => new Date(r.breedingDate).getTime())
                )
              )
            : null,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch breeding analytics",
        });
      }
    }),

  /**
   * Calculate breeding recommendation score between two animals
   */
  calculateBreedingScore: protectedProcedure
    .input(
      z.object({
        sireId: z.number(),
        damId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const sire = await ctx.db.query.animals.findFirst({
          where: (a, { eq }) => eq(a.id, input.sireId),
        });

        const dam = await ctx.db.query.animals.findFirst({
          where: (a, { eq }) => eq(a.id, input.damId),
        });

        if (!sire || !dam) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "One or both animals not found",
          });
        }

        // Calculate compatibility score based on multiple factors
        let compatibilityScore = 75; // Base score

        // Factor 1: Same breed (bonus +15)
        if (sire.breed === dam.breed) {
          compatibilityScore += 15;
        }

        // Factor 2: Age difference (optimal 2-8 years difference)
        const ageDifference = Math.abs((sire.age || 0) - (dam.age || 0));
        if (ageDifference >= 2 && ageDifference <= 8) {
          compatibilityScore += 10;
        } else if (ageDifference > 8) {
          compatibilityScore -= 5;
        }

        // Factor 3: Health status
        if (sire.healthStatus === "healthy" && dam.healthStatus === "healthy") {
          compatibilityScore += 10;
        }

        // Factor 4: Weight compatibility (within 20% difference is good)
        const sireWeight = sire.weight || 0;
        const damWeight = dam.weight || 0;
        if (sireWeight > 0 && damWeight > 0) {
          const weightDifference = Math.abs(sireWeight - damWeight) / Math.max(sireWeight, damWeight);
          if (weightDifference <= 0.2) {
            compatibilityScore += 5;
          }
        }

        // Cap at 100
        compatibilityScore = Math.min(100, compatibilityScore);

        // Determine recommendation
        let recommendation = "not_recommended";
        if (compatibilityScore >= 80) {
          recommendation = "highly_recommended";
        } else if (compatibilityScore >= 65) {
          recommendation = "recommended";
        } else if (compatibilityScore >= 50) {
          recommendation = "consider";
        }

        // Estimate offspring quality
        let estimatedOffspringQuality = "average";
        if (compatibilityScore >= 85) estimatedOffspringQuality = "excellent";
        else if (compatibilityScore >= 70) estimatedOffspringQuality = "good";
        else if (compatibilityScore < 50) estimatedOffspringQuality = "poor";

        return {
          sireId: input.sireId,
          damId: input.damId,
          sireName: sire.name,
          damName: dam.name,
          compatibilityScore: Math.round(compatibilityScore),
          recommendation,
          estimatedOffspringQuality,
          factors: {
            sameBreed: sire.breed === dam.breed,
            ageOptimal: ageDifference >= 2 && ageDifference <= 8,
            bothHealthy: sire.healthStatus === "healthy" && dam.healthStatus === "healthy",
            weightCompatible: sireWeight > 0 && damWeight > 0 && Math.abs(sireWeight - damWeight) / Math.max(sireWeight, damWeight) <= 0.2,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to calculate breeding score",
        });
      }
    }),

  /**
   * Get offspring from a breeding record
   */
  getOffspringFromBreeding: protectedProcedure
    .input(z.object({ breedingRecordId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        // Get the breeding record
        const breedingRecord = await ctx.db.query.breedingRecords.findFirst({
          where: (br, { eq }) => eq(br.id, input.breedingRecordId),
        });

        if (!breedingRecord) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Breeding record not found",
          });
        }

        // Find offspring (animals born from this sire/dam combination)
        const offspring = await ctx.db.query.animals.findMany({
          where: (a, { eq, and }) =>
            and(
              eq(a.farmId, breedingRecord.farmId),
              eq(a.parentSireId, breedingRecord.sireId || 0)
            ),
        });

        return offspring || [];
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch offspring",
        });
      }
    }),

  /**
   * Get breeding performance metrics for an animal
   */
  getAnimalBreedingPerformance: protectedProcedure
    .input(z.object({ animalId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const animal = await ctx.db.query.animals.findFirst({
          where: (a, { eq }) => eq(a.id, input.animalId),
        });

        if (!animal) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Animal not found",
          });
        }

        // Get breeding records where this animal is sire
        const asBreedingSire = await ctx.db.query.breedingRecords.findMany({
          where: (br, { eq }) => eq(br.sireId, input.animalId),
        });

        // Get breeding records where this animal is dam
        const asBreedingDam = await ctx.db.query.breedingRecords.findMany({
          where: (br, { eq }) => eq(br.damId, input.animalId),
        });

        const totalBreedingEvents = asBreedingSire.length + asBreedingDam.length;
        const successfulBreedings = [
          ...asBreedingSire,
          ...asBreedingDam,
        ].filter((r) => r.outcome === "successful").length;

        // Get offspring
        const offspring = await ctx.db.query.animals.findMany({
          where: (a, { eq }) => eq(a.parentSireId, input.animalId),
        });

        const successRate =
          totalBreedingEvents > 0
            ? Math.round((successfulBreedings / totalBreedingEvents) * 100)
            : 0;

        return {
          animalId: input.animalId,
          animalName: animal.name,
          totalBreedingEvents,
          successfulBreedings,
          successRate,
          totalOffspring: offspring.length,
          lastBreedingDate: [
            ...asBreedingSire,
            ...asBreedingDam,
          ].length > 0
            ? new Date(
                Math.max(
                  ...[...asBreedingSire, ...asBreedingDam].map((r) =>
                    new Date(r.breedingDate).getTime()
                  )
                )
              )
            : null,
          averageOffspringWeight: offspring.length > 0
            ? Math.round(
                offspring.reduce((sum, o) => sum + (o.weight || 0), 0) /
                  offspring.length
              )
            : 0,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch breeding performance",
        });
      }
    }),

  /**
   * Get recommended breeding pairs for a farm
   */
  getRecommendedBreedingPairs: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        // Get all breeding animals
        const animals = await ctx.db.query.animals.findMany({
          where: (a, { eq, and }) =>
            and(
              eq(a.farmId, input.farmId),
              eq(a.status, "active")
            ),
        });

        const breedingAnimals = animals.filter(
          (a) => a.animalType === "cattle" || a.animalType === "goat" || a.animalType === "sheep"
        );

        const recommendations = [];

        // Find potential breeding pairs
        for (let i = 0; i < breedingAnimals.length; i++) {
          for (let j = i + 1; j < breedingAnimals.length; j++) {
            const animal1 = breedingAnimals[i];
            const animal2 = breedingAnimals[j];

            // Skip if same gender or not of breeding age
            if (
              animal1.gender === animal2.gender ||
              (animal1.age || 0) < 2 ||
              (animal2.age || 0) < 2
            ) {
              continue;
            }

            // Calculate compatibility
            let score = 75;
            if (animal1.breed === animal2.breed) score += 15;
            if (animal1.healthStatus === "healthy" && animal2.healthStatus === "healthy") score += 10;

            if (score >= 70) {
              recommendations.push({
                sireId: animal1.gender === "male" ? animal1.id : animal2.id,
                damId: animal1.gender === "male" ? animal2.id : animal1.id,
                sireName: animal1.gender === "male" ? animal1.name : animal2.name,
                damName: animal1.gender === "male" ? animal2.name : animal1.name,
                compatibilityScore: score,
                breed: animal1.breed,
              });
            }
          }
        }

        // Sort by compatibility score
        recommendations.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

        return recommendations.slice(0, 10); // Return top 10
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get recommended breeding pairs",
        });
      }
    }),
});
