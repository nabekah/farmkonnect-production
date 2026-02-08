import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { z } from "zod";
import { and, eq, gte, lte } from "drizzle-orm";
import {
  animals,
  healthProtocols,
  speciesTemplates,
  animalHealthRecords,
} from "../../drizzle/schema";

export const veterinaryIntegrationRouter = router({
  // Get vaccination schedule for animal
  getVaccinationSchedule: protectedProcedure
    .input(z.object({ animalId: z.number() }))
    .query(async ({ input, ctx }: any) => {
      const db = ctx.db;
      if (!db) throw new Error("Database not available");

      const animal = await db
        .select()
        .from(animals)
        .where(eq(animals.id, input.animalId))
        .limit(1);

      if (!animal.length) {
        throw new Error("Animal not found");
      }

      const species = await db
        .select()
        .from(speciesTemplates)
        .where(eq(speciesTemplates.speciesName, "Cattle"))
        .limit(1);

      if (!species.length) {
        throw new Error("Species not found");
      }

      const protocols = await db
        .select()
        .from(healthProtocols)
        .where(
          and(
            eq(healthProtocols.speciesId, species[0].id),
            eq(healthProtocols.protocolType, "vaccination")
          )
        );

      return {
        animalId: input.animalId,
        animalName: animal[0].uniqueTagId || "Unknown",
        species: "Cattle",
        dateOfBirth: animal[0].dateOfBirth,
        vaccinationSchedule: protocols.map((p: any) => ({
          id: p.id,
          vaccine: p.vaccine,
          disease: p.disease,
          recommendedAge: p.recommendedAge,
          frequency: p.frequency,
          dosage: p.dosage,
          administrationRoute: p.administrationRoute,
          nextDueDate: calculateNextDueDate(
            animal[0].dateOfBirth,
            p.recommendedAge
          ),
        })),
      };
    }),

  // Get disease alerts for species
  getDiseaseAlerts: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        speciesName: z.string(),
      })
    )
    .query(async ({ input, ctx }: any) => {
      const db = ctx.db;
      if (!db) throw new Error("Database not available");

      const species = await db
        .select()
        .from(speciesTemplates)
        .where(eq(speciesTemplates.speciesName, input.speciesName))
        .limit(1);

      if (!species.length) {
        throw new Error("Species not found");
      }

      const protocols = await db
        .select()
        .from(healthProtocols)
        .where(
          and(
            eq(healthProtocols.speciesId, species[0].id),
            eq(healthProtocols.protocolType, "prevention")
          )
        );

      const farmAnimals = await db
        .select()
        .from(animals)
        .where(eq(animals.farmId, input.farmId));

      return {
        species: input.speciesName,
        totalAnimals: farmAnimals.length,
        alerts: protocols.map((p: any) => ({
          disease: p.disease,
          severity: "medium",
          preventionMeasures: p.notes || "",
          affectedAnimals: farmAnimals.length,
        })),
      };
    }),

  // Get treatment protocols for species
  getTreatmentProtocols: protectedProcedure
    .input(
      z.object({
        speciesName: z.string(),
        diseaseType: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }: any) => {
      const db = ctx.db;
      if (!db) throw new Error("Database not available");

      const species = await db
        .select()
        .from(speciesTemplates)
        .where(eq(speciesTemplates.speciesName, input.speciesName))
        .limit(1);

      if (!species.length) {
        throw new Error("Species not found");
      }

      let query = db
        .select()
        .from(healthProtocols)
        .where(
          and(
            eq(healthProtocols.speciesId, species[0].id),
            eq(healthProtocols.protocolType, "treatment")
          )
        );

      if (input.diseaseType) {
        query = query.where(eq(healthProtocols.disease, input.diseaseType));
      }

      const protocols = await query;

      return {
        species: input.speciesName,
        disease: input.diseaseType || "All",
        protocols: protocols.map((p: any) => ({
          id: p.id,
          protocolName: p.protocolName,
          disease: p.disease,
          treatment: p.vaccine || "N/A",
          dosage: p.dosage,
          administrationRoute: p.administrationRoute,
          frequency: p.frequency,
          duration: "7-14 days",
          sideEffects: p.sideEffects || "None known",
          contraindications: p.contraindications || "None",
        })),
      };
    }),

  // Record vaccination for animal
  recordVaccination: protectedProcedure
    .input(
      z.object({
        animalId: z.number(),
        vaccineId: z.number(),
        vaccineName: z.string(),
        disease: z.string(),
        dateAdministered: z.date(),
        dosage: z.string(),
        administeredBy: z.string(),
        nextDueDate: z.date().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      const db = ctx.db;
      if (!db) throw new Error("Database not available");

      // Record in health records
      await db.insert(animalHealthRecords).values({
        animalId: input.animalId,
        recordType: "Vaccination",
        description: `${input.vaccineName} for ${input.disease}`,
        recordDate: input.dateAdministered,
        details: JSON.stringify({
          vaccine: input.vaccineName,
          disease: input.disease,
          dosage: input.dosage,
          administeredBy: input.administeredBy,
          nextDue: input.nextDueDate,
        }),
      });

      return {
        success: true,
        animalId: input.animalId,
        vaccine: input.vaccineName,
        dateAdministered: input.dateAdministered,
        nextDueDate: input.nextDueDate,
      };
    }),

  // Get upcoming vaccinations
  getUpcomingVaccinations: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        daysAhead: z.number().default(30),
      })
    )
    .query(async ({ input, ctx }: any) => {
      const db = ctx.db;
      if (!db) throw new Error("Database not available");

      const farmAnimals = await db
        .select()
        .from(animals)
        .where(eq(animals.farmId, input.farmId));

      const upcomingVaccinations = [];

      for (const animal of farmAnimals) {
        const species = await db
          .select()
          .from(speciesTemplates)
          .where(eq(speciesTemplates.speciesName, "Cattle"))
          .limit(1);

        if (species.length) {
          const protocols = await db
            .select()
            .from(healthProtocols)
            .where(
              and(
                eq(healthProtocols.speciesId, species[0].id),
                eq(healthProtocols.protocolType, "vaccination")
              )
            );

          for (const protocol of protocols) {
            const nextDue = calculateNextDueDate(
              animal.dateOfBirth,
              protocol.recommendedAge
            );
            const daysUntilDue = Math.ceil(
              (nextDue.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );

            if (daysUntilDue > 0 && daysUntilDue <= input.daysAhead) {
              upcomingVaccinations.push({
                animalId: animal.id,
                animalName: animal.uniqueTagId || "Unknown",
                species: "Cattle",
                vaccine: protocol.vaccine,
                disease: protocol.disease,
                dueDate: nextDue,
                daysUntilDue,
                priority:
                  daysUntilDue <= 7 ? "high" : daysUntilDue <= 14 ? "medium" : "low",
              });
            }
          }
        }
      }

      return {
        farmId: input.farmId,
        daysAhead: input.daysAhead,
        upcomingVaccinations: upcomingVaccinations.sort(
          (a, b) => a.daysUntilDue - b.daysUntilDue
        ),
        totalPending: upcomingVaccinations.length,
      };
    }),

  // Get health history for animal
  getHealthHistory: protectedProcedure
    .input(
      z.object({
        animalId: z.number(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input, ctx }: any) => {
      const db = ctx.db;
      if (!db) throw new Error("Database not available");

      const history = await db
        .select()
        .from(animalHealthRecords)
        .where(eq(animalHealthRecords.animalId, input.animalId))
        .limit(input.limit);

      return {
        animalId: input.animalId,
        healthHistory: history.map((h: any) => ({
          id: h.id,
          type: h.recordType,
          description: h.description,
          date: h.recordDate,
          details: h.details ? JSON.parse(h.details) : {},
        })),
        totalRecords: history.length,
      };
    }),
});

// Helper function to calculate next due date based on age
function calculateNextDueDate(
  dateOfBirth: Date | null,
  recommendedAge: string | null
): Date {
  if (!dateOfBirth || !recommendedAge) {
    return new Date();
  }

  const ageMatch = recommendedAge.match(/(\d+)\s*(day|week|month|year)s?/i);
  if (!ageMatch) {
    return new Date();
  }

  const amount = parseInt(ageMatch[1]);
  const unit = ageMatch[2].toLowerCase();

  const dueDate = new Date(dateOfBirth);

  switch (unit) {
    case "day":
      dueDate.setDate(dueDate.getDate() + amount);
      break;
    case "week":
      dueDate.setDate(dueDate.getDate() + amount * 7);
      break;
    case "month":
      dueDate.setMonth(dueDate.getMonth() + amount);
      break;
    case "year":
      dueDate.setFullYear(dueDate.getFullYear() + amount);
      break;
  }

  return dueDate;
}
