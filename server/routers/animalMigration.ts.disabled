import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { animals, speciesTemplates, breeds } from "../../drizzle/schema";

export const animalMigrationRouter = router({
  // Get migration summary for a farm
  getMigrationSummary: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = ctx.db;
      if (!db) throw new Error("Database not available");

      const farmAnimals = await db
        .select()
        .from(animals)
        .where(eq(animals.farmId, input.farmId));

      const cattleCount = farmAnimals.filter(
        (a) => a.animalType === "Cattle"
      ).length;
      const otherCount = farmAnimals.length - cattleCount;

      return {
        totalAnimals: farmAnimals.length,
        cattleCount,
        otherCount,
        readyForMigration: cattleCount > 0,
      };
    }),

  // Get animals ready for migration
  getAnimalsForMigration: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        limit: z.number().default(100),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = ctx.db;
      if (!db) throw new Error("Database not available");

      const farmAnimals = await db
        .select()
        .from(animals)
        .where(eq(animals.farmId, input.farmId))
        .limit(input.limit)
        .offset(input.offset);

      return {
        animals: farmAnimals,
        total: farmAnimals.length,
      };
    }),

  // Migrate single animal to new species
  migrateAnimal: protectedProcedure
    .input(
      z.object({
        animalId: z.number(),
        newSpecies: z.string(),
        newBreed: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = ctx.db;
      if (!db) throw new Error("Database not available");

      // Get species ID
      const species = await db
        .select()
        .from(speciesTemplates)
        .where(eq(speciesTemplates.speciesName, input.newSpecies))
        .limit(1);

      if (!species.length) {
        throw new Error(`Species ${input.newSpecies} not found`);
      }

      const speciesId = species[0].id;

      // Get breed ID if provided
      let breedId: number | null = null;
      if (input.newBreed) {
        const breed = await db
          .select()
          .from(breeds)
          .where(
            and(
              eq(breeds.speciesId, speciesId),
              eq(breeds.breedName, input.newBreed)
            )
          )
          .limit(1);

        if (breed.length) {
          breedId = breed[0].id;
        }
      }

      // Update animal
      await db
        .update(animals)
        .set({
          animalType: input.newSpecies,
          breed: input.newBreed || null,
          notes: input.notes || null,
          updatedAt: new Date(),
        })
        .where(eq(animals.id, input.animalId));

      return {
        success: true,
        animalId: input.animalId,
        newSpecies: input.newSpecies,
        newBreed: input.newBreed,
      };
    }),

  // Batch migrate animals
  batchMigrateAnimals: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        migrations: z.array(
          z.object({
            animalId: z.number(),
            newSpecies: z.string(),
            newBreed: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = ctx.db;
      if (!db) throw new Error("Database not available");

      const results = [];
      let successCount = 0;
      let failureCount = 0;

      for (const migration of input.migrations) {
        try {
          // Get species ID
          const species = await db
            .select()
            .from(speciesTemplates)
            .where(eq(speciesTemplates.speciesName, migration.newSpecies))
            .limit(1);

          if (!species.length) {
            failureCount++;
            results.push({
              animalId: migration.animalId,
              success: false,
              error: `Species ${migration.newSpecies} not found`,
            });
            continue;
          }

          // Update animal
          await db
            .update(animals)
            .set({
              animalType: migration.newSpecies,
              breed: migration.newBreed || null,
              updatedAt: new Date(),
            })
            .where(eq(animals.id, migration.animalId));

          successCount++;
          results.push({
            animalId: migration.animalId,
            success: true,
            newSpecies: migration.newSpecies,
          });
        } catch (error) {
          failureCount++;
          results.push({
            animalId: migration.animalId,
            success: false,
            error: String(error),
          });
        }
      }

      return {
        totalMigrations: input.migrations.length,
        successCount,
        failureCount,
        results,
      };
    }),

  // Rollback migration for an animal
  rollbackMigration: protectedProcedure
    .input(
      z.object({
        animalId: z.number(),
        previousSpecies: z.string(),
        previousBreed: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = ctx.db;
      if (!db) throw new Error("Database not available");

      await db
        .update(animals)
        .set({
          animalType: input.previousSpecies,
          breed: input.previousBreed || null,
          updatedAt: new Date(),
        })
        .where(eq(animals.id, input.animalId));

      return {
        success: true,
        animalId: input.animalId,
        restoredSpecies: input.previousSpecies,
      };
    }),

  // Get migration history
  getMigrationHistory: protectedProcedure
    .input(z.object({ farmId: z.number(), limit: z.number().default(50) }))
    .query(async ({ input, ctx }) => {
      const db = ctx.db;
      if (!db) throw new Error("Database not available");

      // This would typically query a migration history table
      // For now, return empty array
      return {
        migrations: [],
        total: 0,
      };
    }),

  // Get species compatibility info
  getSpeciesCompatibility: protectedProcedure
    .input(z.object({ fromSpecies: z.string(), toSpecies: z.string() }))
    .query(async ({ input, ctx }) => {
      const db = ctx.db;
      if (!db) throw new Error("Database not available");

      const fromSpeciesData = await db
        .select()
        .from(speciesTemplates)
        .where(eq(speciesTemplates.speciesName, input.fromSpecies))
        .limit(1);

      const toSpeciesData = await db
        .select()
        .from(speciesTemplates)
        .where(eq(speciesTemplates.speciesName, input.toSpecies))
        .limit(1);

      if (!fromSpeciesData.length || !toSpeciesData.length) {
        throw new Error("Species not found");
      }

      return {
        compatible: true,
        notes: `Migration from ${input.fromSpecies} to ${input.toSpecies} is supported`,
        dataPreservation: {
          healthRecords: true,
          productionMetrics: false,
          breedingHistory: false,
        },
      };
    }),
});
