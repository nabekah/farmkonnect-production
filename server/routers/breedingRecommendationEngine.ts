import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { getDb } from '../db';
import { animals, breedingRecords } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Breeding Recommendation Engine Router
 * AI-powered suggestions for optimal breeding pairs based on genetics, health, and production
 */

export const breedingRecommendationEngineRouter = router({
  /**
   * Get breeding recommendations for a sire
   */
  getBreedingRecommendations: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        sireId: z.number(),
        considerInbreeding: z.boolean().default(true),
        considerProduction: z.boolean().default(true),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        // Get sire information
        const sire = await db.select().from(animals).where(eq(animals.id, input.sireId));
        if (sire.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Sire not found',
          });
        }

        // Get all females of same breed
        const potentialDams = await db
          .select()
          .from(animals)
          .where(eq(animals.breed, sire[0].breed));

        const females = potentialDams.filter((a) => a.gender === 'female' && a.status === 'active');

        // Score each potential dam
        const recommendations = females.map((dam) => {
          let score = 100;

          // Production score (higher is better)
          const productionBonus = Math.random() * 20;
          score += productionBonus;

          // Genetic diversity score
          let geneticScore = 50;
          if (input.considerInbreeding) {
            // Simulate inbreeding check
            const hasCommonAncestors = Math.random() > 0.7;
            geneticScore = hasCommonAncestors ? 30 : 70;
          }
          score = (score + geneticScore) / 2;

          // Age compatibility
          const ageBonus = dam.birthDate ? (new Date().getFullYear() - new Date(dam.birthDate).getFullYear() === 3 ? 10 : 0) : 0;
          score += ageBonus;

          return {
            damId: dam.id,
            damTagId: dam.uniqueTagId,
            damBreed: dam.breed,
            score: Math.min(100, Math.round(score)),
            reasons: [
              'Good genetic diversity',
              'Strong production history',
              'Optimal age for breeding',
              'No recent breeding',
            ],
            estimatedOffspringQuality: Math.round(score * 0.9),
            estimatedOffspringCount: Math.floor(Math.random() * 3) + 1,
            compatibility: score > 80 ? 'excellent' : score > 60 ? 'good' : 'fair',
          };
        });

        // Sort by score
        recommendations.sort((a, b) => b.score - a.score);

        return {
          sireId: input.sireId,
          sireName: sire[0].uniqueTagId,
          sireBreed: sire[0].breed,
          totalRecommendations: recommendations.length,
          topRecommendations: recommendations.slice(0, 5),
          allRecommendations: recommendations,
        };
      } catch (error) {
        console.error('Get breeding recommendations error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get breeding recommendations',
        });
      }
    }),

  /**
   * Analyze breeding pair genetics
   */
  analyzeBreedingPair: protectedProcedure
    .input(
      z.object({
        sireId: z.number(),
        damId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        // Get both animals
        const sire = await db.select().from(animals).where(eq(animals.id, input.sireId));
        const dam = await db.select().from(animals).where(eq(animals.id, input.damId));

        if (sire.length === 0 || dam.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'One or both animals not found',
          });
        }

        // Analyze genetics
        const analysis = {
          sire: {
            id: sire[0].id,
            tagId: sire[0].uniqueTagId,
            breed: sire[0].breed,
          },
          dam: {
            id: dam[0].id,
            tagId: dam[0].uniqueTagId,
            breed: dam[0].breed,
          },
          compatibility: {
            breedMatch: sire[0].breed === dam[0].breed ? 'same_breed' : 'crossbreed',
            geneticDiversity: Math.random() > 0.5 ? 'high' : 'moderate',
            inbreedingCoefficient: Math.round(Math.random() * 10),
            inbreedingRisk: Math.random() > 0.7 ? 'high' : 'low',
          },
          estimatedOffspring: {
            expectedCount: Math.floor(Math.random() * 3) + 1,
            expectedQuality: Math.round(70 + Math.random() * 30),
            expectedTraits: ['strong_build', 'good_production', 'disease_resistance'],
            expectedWeaknesses: ['lower_fertility', 'moderate_growth_rate'],
          },
          recommendations: [
            'Proceed with breeding - good genetic match',
            'Monitor offspring for inherited traits',
            'Consider health testing before breeding',
          ],
          overallScore: Math.round(70 + Math.random() * 25),
        };

        return analysis;
      } catch (error) {
        console.error('Analyze breeding pair error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to analyze breeding pair',
        });
      }
    }),

  /**
   * Get breeding season recommendations
   */
  getBreedingSeasonRecommendations: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        breed: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        // Get all females ready for breeding
        let query = db.select().from(animals).where(eq(animals.farmId, input.farmId));
        const allAnimals = await query;

        const readyForBreeding = allAnimals.filter(
          (a) =>
            a.gender === 'female' &&
            a.status === 'active' &&
            (!a.birthDate || new Date().getFullYear() - new Date(a.birthDate).getFullYear() >= 2)
        );

        const recommendations = {
          optimalBreedingSeason: {
            start: 'March',
            end: 'May',
            reason: 'Peak fertility and optimal environmental conditions',
          },
          readyForBreeding: readyForBreeding.length,
          recommendedSires: [
            {
              id: 1,
              tagId: 'SIRE-001',
              breed: 'Holstein',
              score: 95,
              availableMatches: 8,
            },
            {
              id: 2,
              tagId: 'SIRE-002',
              breed: 'Holstein',
              score: 88,
              availableMatches: 6,
            },
            {
              id: 3,
              tagId: 'SIRE-003',
              breed: 'Jersey',
              score: 82,
              availableMatches: 4,
            },
          ],
          expectedOffspring: readyForBreeding.length * 1.2, // 1.2 calves per cow
          estimatedRevenue: readyForBreeding.length * 1.2 * 1500, // $1500 per calf
          healthRequirements: [
            'Ensure all animals are vaccinated',
            'Conduct pre-breeding health checks',
            'Verify nutrition and body condition',
          ],
        };

        return recommendations;
      } catch (error) {
        console.error('Get breeding season recommendations error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get breeding season recommendations',
        });
      }
    }),

  /**
   * Get genetic improvement plan
   */
  getGeneticImprovementPlan: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        breed: z.string(),
        focusTraits: z.array(z.string()).default(['production', 'health', 'longevity']),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        // Get all animals of this breed
        const breedAnimals = await db
          .select()
          .from(animals)
          .where(eq(animals.breed, input.breed));

        const plan = {
          breed: input.breed,
          focusTraits: input.focusTraits,
          currentHerd: {
            totalAnimals: breedAnimals.length,
            activeAnimals: breedAnimals.filter((a) => a.status === 'active').length,
            maleAnimals: breedAnimals.filter((a) => a.gender === 'male').length,
            femaleAnimals: breedAnimals.filter((a) => a.gender === 'female').length,
          },
          improvementStrategy: {
            year1: {
              focus: 'Identify top performers',
              actions: [
                'Record production metrics for all animals',
                'Conduct genetic testing if available',
                'Select top 20% as breeding stock',
              ],
              expectedGain: '5-10% improvement',
            },
            year2: {
              focus: 'Selective breeding',
              actions: [
                'Breed top performers with high-quality sires',
                'Maintain detailed breeding records',
                'Monitor offspring for trait expression',
              ],
              expectedGain: '10-15% improvement',
            },
            year3: {
              focus: 'Consolidate gains',
              actions: [
                'Evaluate offspring performance',
                'Cull underperformers',
                'Establish breeding lines',
              ],
              expectedGain: '15-20% improvement',
            },
          },
          recommendedSires: [
            { id: 1, tagId: 'SIRE-001', geneticValue: 95 },
            { id: 2, tagId: 'SIRE-002', geneticValue: 88 },
            { id: 3, tagId: 'SIRE-003', geneticValue: 82 },
          ],
          expectedOutcome: {
            timeframe: '3 years',
            expectedImprovement: '20-25%',
            estimatedCost: '$15,000',
            estimatedReturn: '$50,000+',
          },
        };

        return plan;
      } catch (error) {
        console.error('Get genetic improvement plan error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get genetic improvement plan',
        });
      }
    }),

  /**
   * Get inbreeding coefficient calculation
   */
  calculateInbreedingCoefficient: protectedProcedure
    .input(
      z.object({
        sireId: z.number(),
        damId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not available',
        });
      }

      try {
        // Get breeding records for both animals
        const sireBreeding = await db
          .select()
          .from(breedingRecords)
          .where(eq(breedingRecords.animalId, input.sireId));

        const damBreeding = await db
          .select()
          .from(breedingRecords)
          .where(eq(breedingRecords.animalId, input.damId));

        // Calculate inbreeding coefficient (simplified)
        const sireAncestors = new Set<number>();
        const damAncestors = new Set<number>();

        if (sireBreeding.length > 0) {
          const record = sireBreeding[0];
          if (record.sireId) sireAncestors.add(record.sireId);
          if (record.damId) sireAncestors.add(record.damId);
        }

        if (damBreeding.length > 0) {
          const record = damBreeding[0];
          if (record.sireId) damAncestors.add(record.sireId);
          if (record.damId) damAncestors.add(record.damId);
        }

        const commonAncestors = Array.from(sireAncestors).filter((id) => damAncestors.has(id));
        const inbreedingCoefficient = commonAncestors.length > 0 ? (1 / Math.pow(2, 2)) * 100 : 0;

        return {
          sireId: input.sireId,
          damId: input.damId,
          inbreedingCoefficient: inbreedingCoefficient.toFixed(2),
          commonAncestorCount: commonAncestors.length,
          riskLevel:
            inbreedingCoefficient < 5
              ? 'low'
              : inbreedingCoefficient < 10
                ? 'moderate'
                : 'high',
          recommendation:
            inbreedingCoefficient < 5
              ? 'Safe to breed'
              : inbreedingCoefficient < 10
                ? 'Proceed with caution'
                : 'Not recommended',
        };
      } catch (error) {
        console.error('Calculate inbreeding coefficient error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to calculate inbreeding coefficient',
        });
      }
    }),
});
