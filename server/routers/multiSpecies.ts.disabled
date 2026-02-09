import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  speciesTemplates,
  breeds,
  healthProtocols,
  productionMetricsTemplates,
  feedRecommendations,
  speciesAnimalRecords,
  speciesProductionRecords,
} from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const multiSpeciesRouter = router({
  /**
   * Get all available species templates
   */
  getSpeciesTemplates: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      try {
        const templates = await db
          .select()
          .from(speciesTemplates)
          .where(eq(speciesTemplates.isActive, true))
          .limit(input.limit)
          .offset(input.offset);

        return {
          success: true,
          templates,
        };
      } catch (error) {
        console.error("Error fetching species templates:", error);
        return {
          success: false,
          templates: [],
          error: "Failed to fetch species templates",
        };
      }
    }),

  /**
   * Get breeds for a specific species
   */
  getBreedsBySpecies: protectedProcedure
    .input(
      z.object({
        speciesId: z.number(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      try {
        const breedList = await db
          .select()
          .from(breeds)
          .where(eq(breeds.speciesId, input.speciesId))
          .limit(input.limit)
          .offset(input.offset);

        return {
          success: true,
          breeds: breedList.map((b) => ({
            ...b,
            characteristics: b.characteristics ? JSON.parse(b.characteristics) : null,
            productionCapabilities: b.productionCapabilities
              ? JSON.parse(b.productionCapabilities)
              : null,
          })),
        };
      } catch (error) {
        console.error("Error fetching breeds:", error);
        return {
          success: false,
          breeds: [],
          error: "Failed to fetch breeds",
        };
      }
    }),

  /**
   * Get health protocols for a species
   */
  getHealthProtocols: protectedProcedure
    .input(
      z.object({
        speciesId: z.number(),
        protocolType: z.enum(["vaccination", "treatment", "prevention", "monitoring"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      try {
        let query = db.select().from(healthProtocols).where(eq(healthProtocols.speciesId, input.speciesId));

        if (input.protocolType) {
          query = query.where(eq(healthProtocols.protocolType, input.protocolType));
        }

        const protocols = await query;

        return {
          success: true,
          protocols,
        };
      } catch (error) {
        console.error("Error fetching health protocols:", error);
        return {
          success: false,
          protocols: [],
          error: "Failed to fetch health protocols",
        };
      }
    }),

  /**
   * Get production metrics templates for a species
   */
  getProductionMetrics: protectedProcedure
    .input(z.object({ speciesId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      try {
        const metrics = await db
          .select()
          .from(productionMetricsTemplates)
          .where(eq(productionMetricsTemplates.speciesId, input.speciesId));

        return {
          success: true,
          metrics,
        };
      } catch (error) {
        console.error("Error fetching production metrics:", error);
        return {
          success: false,
          metrics: [],
          error: "Failed to fetch production metrics",
        };
      }
    }),

  /**
   * Get feed recommendations for a species and age group
   */
  getFeedRecommendations: protectedProcedure
    .input(
      z.object({
        speciesId: z.number(),
        ageGroup: z.string(),
        productionStage: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      try {
        const recommendations = await db
          .select()
          .from(feedRecommendations)
          .where(
            and(
              eq(feedRecommendations.speciesId, input.speciesId),
              eq(feedRecommendations.ageGroup, input.ageGroup)
            )
          );

        return {
          success: true,
          recommendations: recommendations.map((r) => ({
            ...r,
            ingredients: r.ingredients ? JSON.parse(r.ingredients) : null,
          })),
        };
      } catch (error) {
        console.error("Error fetching feed recommendations:", error);
        return {
          success: false,
          recommendations: [],
          error: "Failed to fetch feed recommendations",
        };
      }
    }),

  /**
   * Create species-specific animal record
   */
  createSpeciesAnimalRecord: protectedProcedure
    .input(
      z.object({
        animalId: z.number(),
        speciesId: z.number(),
        breedId: z.number().optional(),
        productionType: z.string().optional(),
        registrationNumber: z.string().optional(),
        currentWeight: z.string().optional(),
        bodyConditionScore: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      try {
        const result = await db.insert(speciesAnimalRecords).values({
          animalId: input.animalId,
          speciesId: input.speciesId,
          breedId: input.breedId,
          productionType: input.productionType,
          registrationNumber: input.registrationNumber,
          currentWeight: input.currentWeight ? String(input.currentWeight) : null,
          bodyConditionScore: input.bodyConditionScore ? String(input.bodyConditionScore) : null,
        });

        return {
          success: true,
          recordId: result.insertId,
          message: "Species animal record created successfully",
        };
      } catch (error) {
        console.error("Error creating species animal record:", error);
        return {
          success: false,
          error: "Failed to create species animal record",
        };
      }
    }),

  /**
   * Record production metric for an animal
   */
  recordProductionMetric: protectedProcedure
    .input(
      z.object({
        animalId: z.number(),
        metricTemplateId: z.number(),
        recordDate: z.string(),
        value: z.string(),
        unit: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      try {
        const result = await db.insert(speciesProductionRecords).values({
          animalId: input.animalId,
          metricTemplateId: input.metricTemplateId,
          recordDate: new Date(input.recordDate),
          value: String(input.value),
          unit: input.unit,
          notes: input.notes,
        });

        return {
          success: true,
          recordId: result.insertId,
          message: "Production metric recorded successfully",
        };
      } catch (error) {
        console.error("Error recording production metric:", error);
        return {
          success: false,
          error: "Failed to record production metric",
        };
      }
    }),

  /**
   * Get production history for an animal
   */
  getProductionHistory: protectedProcedure
    .input(
      z.object({
        animalId: z.number(),
        metricType: z.string().optional(),
        days: z.number().default(90),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - input.days);

        const history = await db
          .select()
          .from(speciesProductionRecords)
          .where(eq(speciesProductionRecords.animalId, input.animalId));

        // Filter by date and optionally by metric type
        const filtered = history.filter(
          (h) =>
            h.recordDate &&
            new Date(h.recordDate) > cutoffDate &&
            (!input.metricType || h.unit === input.metricType)
        );

        return {
          success: true,
          history: filtered,
        };
      } catch (error) {
        console.error("Error fetching production history:", error);
        return {
          success: false,
          history: [],
          error: "Failed to fetch production history",
        };
      }
    }),

  /**
   * Get species-specific animal record
   */
  getSpeciesAnimalRecord: protectedProcedure
    .input(z.object({ animalId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();

      try {
        const record = await db
          .select()
          .from(speciesAnimalRecords)
          .where(eq(speciesAnimalRecords.animalId, input.animalId));

        if (record.length === 0) {
          return {
            success: false,
            record: null,
            error: "Species animal record not found",
          };
        }

        const r = record[0];
        return {
          success: true,
          record: {
            ...r,
            pedigree: r.pedigree ? JSON.parse(r.pedigree) : null,
            geneticMarkers: r.geneticMarkers ? JSON.parse(r.geneticMarkers) : null,
          },
        };
      } catch (error) {
        console.error("Error fetching species animal record:", error);
        return {
          success: false,
          record: null,
          error: "Failed to fetch species animal record",
        };
      }
    }),

  /**
   * Update species animal record
   */
  updateSpeciesAnimalRecord: protectedProcedure
    .input(
      z.object({
        animalId: z.number(),
        currentWeight: z.string().optional(),
        bodyConditionScore: z.string().optional(),
        reproductiveStatus: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      try {
        await db
          .update(speciesAnimalRecords)
          .set({
            currentWeight: input.currentWeight ? String(input.currentWeight) : undefined,
            bodyConditionScore: input.bodyConditionScore ? String(input.bodyConditionScore) : undefined,
            reproductiveStatus: input.reproductiveStatus,
            lastWeightDate: input.currentWeight ? new Date() : undefined,
            updatedAt: new Date(),
          })
          .where(eq(speciesAnimalRecords.animalId, input.animalId));

        return {
          success: true,
          message: "Species animal record updated successfully",
        };
      } catch (error) {
        console.error("Error updating species animal record:", error);
        return {
          success: false,
          error: "Failed to update species animal record",
        };
      }
    }),
});
