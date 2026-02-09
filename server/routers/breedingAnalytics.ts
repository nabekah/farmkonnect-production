import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { db } from "../db";
import { TRPCError } from "@trpc/server";

export const breedingAnalyticsRouter = router({
  /**
   * Get genetic traits for an animal
   */
  getGeneticTraits: protectedProcedure
    .input(z.object({ animalId: z.number() }))
    .query(async ({ input }) => {
      try {
        const traits = await db.query.geneticTraits.findMany({
          where: (t, { eq }) => eq(t.animalId, input.animalId),
        });
        return traits;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch genetic traits",
        });
      }
    }),

  /**
   * Add genetic trait for an animal
   */
  addGeneticTrait: protectedProcedure
    .input(
      z.object({
        animalId: z.number(),
        traitName: z.string(),
        traitValue: z.number(),
        traitUnit: z.string().optional(),
        inheritancePattern: z.enum(["dominant", "recessive", "codominant", "polygenic"]).optional(),
        recordedDate: z.date(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await db.insert(db.schema.geneticTraits).values({
          animalId: input.animalId,
          traitName: input.traitName,
          traitValue: input.traitValue,
          traitUnit: input.traitUnit,
          inheritancePattern: input.inheritancePattern || "polygenic",
          recordedDate: input.recordedDate,
          notes: input.notes,
        });
        return { success: true, id: result.insertId };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add genetic trait",
        });
      }
    }),

  /**
   * Get pedigree records for an animal
   */
  getPedigreeRecord: protectedProcedure
    .input(z.object({ animalId: z.number() }))
    .query(async ({ input }) => {
      try {
        const pedigree = await db.query.pedigreeRecords.findFirst({
          where: (p, { eq }) => eq(p.animalId, input.animalId),
        });
        return pedigree;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch pedigree record",
        });
      }
    }),

  /**
   * Create or update pedigree record
   */
  updatePedigreeRecord: protectedProcedure
    .input(
      z.object({
        animalId: z.number(),
        generation: z.number(),
        patternalLineage: z.array(z.string()).optional(),
        maternalLineage: z.array(z.string()).optional(),
        inbreedingCoefficient: z.number().optional(),
        purebredStatus: z.enum(["purebred", "crossbred", "hybrid"]).optional(),
        registrationNumber: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const existing = await db.query.pedigreeRecords.findFirst({
          where: (p, { eq }) => eq(p.animalId, input.animalId),
        });

        if (existing) {
          await db.update(db.schema.pedigreeRecords)
            .set({
              generation: input.generation,
              patternalLineage: input.patternalLineage ? JSON.stringify(input.patternalLineage) : undefined,
              maternalLineage: input.maternalLineage ? JSON.stringify(input.maternalLineage) : undefined,
              inbreedingCoefficient: input.inbreedingCoefficient,
              purebredStatus: input.purebredStatus,
              registrationNumber: input.registrationNumber,
            })
            .where((p, { eq }) => eq(p.animalId, input.animalId));
          return { success: true, id: existing.id };
        } else {
          const result = await db.insert(db.schema.pedigreeRecords).values({
            animalId: input.animalId,
            generation: input.generation,
            patternalLineage: input.patternalLineage ? JSON.stringify(input.patternalLineage) : null,
            maternalLineage: input.maternalLineage ? JSON.stringify(input.maternalLineage) : null,
            inbreedingCoefficient: input.inbreedingCoefficient,
            purebredStatus: input.purebredStatus || "crossbred",
            registrationNumber: input.registrationNumber,
          });
          return { success: true, id: result.insertId };
        }
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update pedigree record",
        });
      }
    }),

  /**
   * Get offspring records for a breeding event
   */
  getOffspring: protectedProcedure
    .input(z.object({ breedingRecordId: z.number() }))
    .query(async ({ input }) => {
      try {
        const offspring = await db.query.offspringRecords.findMany({
          where: (o, { eq }) => eq(o.breedingRecordId, input.breedingRecordId),
        });
        return offspring;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch offspring records",
        });
      }
    }),

  /**
   * Add offspring record
   */
  addOffspring: protectedProcedure
    .input(
      z.object({
        breedingRecordId: z.number(),
        offspringAnimalId: z.number(),
        birthDate: z.date(),
        birthWeight: z.number().optional(),
        gender: z.enum(["male", "female", "unknown"]).optional(),
        healthStatus: z.enum(["healthy", "weak", "diseased", "deceased"]).optional(),
        survivalStatus: z.enum(["alive", "deceased"]).optional(),
        deathDate: z.date().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await db.insert(db.schema.offspringRecords).values({
          breedingRecordId: input.breedingRecordId,
          offspringAnimalId: input.offspringAnimalId,
          birthDate: input.birthDate,
          birthWeight: input.birthWeight,
          gender: input.gender || "unknown",
          healthStatus: input.healthStatus || "healthy",
          survivalStatus: input.survivalStatus || "alive",
          deathDate: input.deathDate,
          notes: input.notes,
        });
        return { success: true, id: result.insertId };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add offspring record",
        });
      }
    }),

  /**
   * Get breeding recommendations for a farm
   */
  getBreedingRecommendations: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      try {
        const recommendations = await db.query.breedingRecommendations.findMany({
          where: (r, { eq }) => eq(r.farmId, input.farmId),
        });
        return recommendations;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch breeding recommendations",
        });
      }
    }),

  /**
   * Calculate breeding recommendation score
   */
  calculateBreedingScore: protectedProcedure
    .input(
      z.object({
        sireId: z.number(),
        damId: z.number(),
        farmId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Get genetic traits for both animals
        const sireTraits = await db.query.geneticTraits.findMany({
          where: (t, { eq }) => eq(t.animalId, input.sireId),
        });

        const damTraits = await db.query.geneticTraits.findMany({
          where: (t, { eq }) => eq(t.animalId, input.damId),
        });

        // Get pedigree records
        const sirePedigree = await db.query.pedigreeRecords.findFirst({
          where: (p, { eq }) => eq(p.animalId, input.sireId),
        });

        const damPedigree = await db.query.pedigreeRecords.findFirst({
          where: (p, { eq }) => eq(p.animalId, input.damId),
        });

        // Calculate genetic compatibility (0-100)
        let geneticCompatibility = 75; // Base score
        if (sireTraits.length > 0 && damTraits.length > 0) {
          geneticCompatibility = Math.min(100, 75 + (Math.min(sireTraits.length, damTraits.length) * 5));
        }

        // Calculate inbreeding risk (0-100)
        let inbreedingRisk = 0;
        if (sirePedigree?.inbreedingCoefficient && damPedigree?.inbreedingCoefficient) {
          inbreedingRisk = Math.min(100, Number(sirePedigree.inbreedingCoefficient) * 50 + Number(damPedigree.inbreedingCoefficient) * 50);
        }

        // Calculate overall recommendation score (0-100)
        const recommendationScore = Math.max(0, geneticCompatibility - (inbreedingRisk * 0.5));

        // Determine estimated offspring quality
        let estimatedOffspringQuality = "average";
        if (recommendationScore >= 85) estimatedOffspringQuality = "excellent";
        else if (recommendationScore >= 70) estimatedOffspringQuality = "good";
        else if (recommendationScore < 40) estimatedOffspringQuality = "poor";

        // Create recommendation record
        const result = await db.insert(db.schema.breedingRecommendations).values({
          farmId: input.farmId,
          sireId: input.sireId,
          damId: input.damId,
          recommendationScore: Math.round(recommendationScore * 100) / 100,
          geneticCompatibility: Math.round(geneticCompatibility * 100) / 100,
          traitImprovement: JSON.stringify(sireTraits.map(t => t.traitName)),
          riskFactors: JSON.stringify([]),
          inbreedingRisk: Math.round(inbreedingRisk * 100) / 100,
          recommendedBreedingAge: 24, // months
          estimatedOffspringQuality,
          status: "recommended",
        });

        return {
          success: true,
          id: result.insertId,
          recommendationScore: Math.round(recommendationScore * 100) / 100,
          geneticCompatibility: Math.round(geneticCompatibility * 100) / 100,
          inbreedingRisk: Math.round(inbreedingRisk * 100) / 100,
          estimatedOffspringQuality,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to calculate breeding score",
        });
      }
    }),

  /**
   * Get breeding performance for an animal
   */
  getBreedingPerformance: protectedProcedure
    .input(z.object({ animalId: z.number() }))
    .query(async ({ input }) => {
      try {
        const performance = await db.query.breedingPerformance.findFirst({
          where: (p, { eq }) => eq(p.animalId, input.animalId),
        });
        return performance;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch breeding performance",
        });
      }
    }),

  /**
   * Update breeding performance metrics
   */
  updateBreedingPerformance: protectedProcedure
    .input(
      z.object({
        animalId: z.number(),
        totalBreedingEvents: z.number().optional(),
        successfulBreedings: z.number().optional(),
        failedBreedings: z.number().optional(),
        totalOffspring: z.number().optional(),
        maleOffspring: z.number().optional(),
        femaleOffspring: z.number().optional(),
        offspringSurvivalRate: z.number().optional(),
        averageOffspringWeight: z.number().optional(),
        lastBreedingDate: z.date().optional(),
        nextRecommendedBreedingDate: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const existing = await db.query.breedingPerformance.findFirst({
          where: (p, { eq }) => eq(p.animalId, input.animalId),
        });

        const successRate = input.totalBreedingEvents
          ? Math.round((input.successfulBreedings || 0) / input.totalBreedingEvents * 100 * 100) / 100
          : undefined;

        if (existing) {
          await db.update(db.schema.breedingPerformance)
            .set({
              totalBreedingEvents: input.totalBreedingEvents,
              successfulBreedings: input.successfulBreedings,
              failedBreedings: input.failedBreedings,
              successRate,
              totalOffspring: input.totalOffspring,
              maleOffspring: input.maleOffspring,
              femaleOffspring: input.femaleOffspring,
              offspringSurvivalRate: input.offspringSurvivalRate,
              averageOffspringWeight: input.averageOffspringWeight,
              lastBreedingDate: input.lastBreedingDate,
              nextRecommendedBreedingDate: input.nextRecommendedBreedingDate,
            })
            .where((p, { eq }) => eq(p.animalId, input.animalId));
          return { success: true, id: existing.id };
        } else {
          const result = await db.insert(db.schema.breedingPerformance).values({
            animalId: input.animalId,
            totalBreedingEvents: input.totalBreedingEvents || 0,
            successfulBreedings: input.successfulBreedings || 0,
            failedBreedings: input.failedBreedings || 0,
            successRate,
            totalOffspring: input.totalOffspring || 0,
            maleOffspring: input.maleOffspring || 0,
            femaleOffspring: input.femaleOffspring || 0,
            offspringSurvivalRate: input.offspringSurvivalRate,
            averageOffspringWeight: input.averageOffspringWeight,
            lastBreedingDate: input.lastBreedingDate,
            nextRecommendedBreedingDate: input.nextRecommendedBreedingDate,
          });
          return { success: true, id: result.insertId };
        }
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update breeding performance",
        });
      }
    }),

  /**
   * Get genetic health screening results
   */
  getHealthScreening: protectedProcedure
    .input(z.object({ animalId: z.number() }))
    .query(async ({ input }) => {
      try {
        const screening = await db.query.geneticHealthScreening.findMany({
          where: (s, { eq }) => eq(s.animalId, input.animalId),
          orderBy: (s, { desc }) => [desc(s.screeningDate)],
        });
        return screening;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch health screening results",
        });
      }
    }),

  /**
   * Add genetic health screening record
   */
  addHealthScreening: protectedProcedure
    .input(
      z.object({
        animalId: z.number(),
        screeningDate: z.date(),
        screeningType: z.string(),
        diseaseRisks: z.array(z.string()).optional(),
        carrierStatus: z.array(z.string()).optional(),
        healthScore: z.number().optional(),
        recommendations: z.string().optional(),
        veterinarianNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await db.insert(db.schema.geneticHealthScreening).values({
          animalId: input.animalId,
          screeningDate: input.screeningDate,
          screeningType: input.screeningType,
          diseaseRisks: input.diseaseRisks ? JSON.stringify(input.diseaseRisks) : null,
          carrierStatus: input.carrierStatus ? JSON.stringify(input.carrierStatus) : null,
          healthScore: input.healthScore,
          recommendations: input.recommendations,
          veterinarianNotes: input.veterinarianNotes,
        });
        return { success: true, id: result.insertId };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add health screening record",
        });
      }
    }),

  /**
   * Get breeding analytics summary for a farm
   */
  getAnalyticsSummary: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      try {
        const summary = await db.query.breedingAnalyticsSummary.findFirst({
          where: (s, { eq }) => eq(s.farmId, input.farmId),
          orderBy: (s, { desc }) => [desc(s.reportDate)],
        });
        return summary;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch analytics summary",
        });
      }
    }),

  /**
   * Generate breeding analytics summary
   */
  generateAnalyticsSummary: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        // Get all breeding animals for the farm
        const breedingAnimals = await db.query.animals.findMany({
          where: (a, { eq, and }) => and(eq(a.farmId, input.farmId), eq(a.status, "active")),
        });

        // Calculate metrics
        let totalOffspringThisYear = 0;
        let totalGeneticScore = 0;
        let geneticDiversity = 75;
        let recommendedBreedingPairs = 0;
        let highRiskPairs = 0;
        let totalSurvivalRate = 0;

        for (const animal of breedingAnimals) {
          const performance = await db.query.breedingPerformance.findFirst({
            where: (p, { eq }) => eq(p.animalId, animal.id),
          });
          if (performance) {
            totalOffspringThisYear += performance.totalOffspring || 0;
            totalGeneticScore += 75; // Default score
            totalSurvivalRate += Number(performance.offspringSurvivalRate) || 0;
          }
        }

        const averageGeneticScore = breedingAnimals.length > 0 ? Math.round((totalGeneticScore / breedingAnimals.length) * 100) / 100 : 0;
        const averageOffspringSurvivalRate = breedingAnimals.length > 0 ? Math.round((totalSurvivalRate / breedingAnimals.length) * 100) / 100 : 0;

        const result = await db.insert(db.schema.breedingAnalyticsSummary).values({
          farmId: input.farmId,
          reportDate: new Date(),
          totalBreedingAnimals: breedingAnimals.length,
          totalOffspringThisYear,
          averageGeneticScore,
          geneticDiversity: Math.round(geneticDiversity * 100) / 100,
          inbreedingTrend: "stable",
          recommendedBreedingPairs,
          highRiskPairs,
          averageOffspringSurvivalRate,
        });

        return { success: true, id: result.insertId };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate analytics summary",
        });
      }
    }),
});
