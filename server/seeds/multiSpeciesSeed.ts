import { getDb } from "../db";
import {
  speciesTemplates,
  breeds,
  healthProtocols,
  feedRecommendations,
  productionMetricsTemplates,
} from "../../drizzle/schema";

export async function seedMultiSpeciesData() {
  const db = await getDb();
  if (!db) {
    console.error("Database connection failed");
    return;
  }
  console.log("Seeding multi-species data...");

  // Species Templates
  const speciesData = [
    {
      speciesName: "Cattle",
      productionType: "Dairy/Beef",
      description: "Large ruminant livestock for dairy and meat production",
      averageLifespanYears: 18,
      matureWeightKg: 650,
      gestationPeriodDays: 280,
      averageLitterSize: 1,
      sexualMaturityMonths: 12,
    },
    {
      speciesName: "Poultry",
      productionType: "Eggs/Meat",
      description: "Chickens, turkeys, and ducks for eggs and meat",
      averageLifespanYears: 7,
      matureWeightKg: 2.5,
      gestationPeriodDays: 21,
      averageLitterSize: 10,
      sexualMaturityMonths: 5,
    },
    {
      speciesName: "Goats",
      productionType: "Dairy/Meat",
      description: "Small ruminants for milk, meat, and fiber",
      averageLifespanYears: 12,
      matureWeightKg: 70,
      gestationPeriodDays: 150,
      averageLitterSize: 2,
      sexualMaturityMonths: 10,
    },
    {
      speciesName: "Sheep",
      productionType: "Wool/Meat",
      description: "Wool and meat production livestock",
      averageLifespanYears: 11,
      matureWeightKg: 100,
      gestationPeriodDays: 147,
      averageLitterSize: 1,
      sexualMaturityMonths: 8,
    },
    {
      speciesName: "Pigs",
      productionType: "Meat",
      description: "Pork production livestock",
      averageLifespanYears: 17,
      matureWeightKg: 200,
      gestationPeriodDays: 114,
      averageLitterSize: 10,
      sexualMaturityMonths: 6,
    },
    {
      speciesName: "Rabbits",
      productionType: "Meat/Fur",
      description: "Small livestock for meat and fur production",
      averageLifespanYears: 10,
      matureWeightKg: 4,
      gestationPeriodDays: 31,
      averageLitterSize: 8,
      sexualMaturityMonths: 5,
    },
    {
      speciesName: "Horses",
      productionType: "Work/Recreation",
      description: "Equine livestock for work and recreation",
      averageLifespanYears: 27,
      matureWeightKg: 450,
      gestationPeriodDays: 340,
      averageLitterSize: 1,
      sexualMaturityMonths: 24,
    },
  ];

  const speciesMap = new Map<string, number>();

  for (const species of speciesData) {
    const result = await db.insert(speciesTemplates).values({
      speciesName: species.speciesName,
      productionType: species.productionType,
      description: species.description,
      averageLifespanYears: species.averageLifespanYears,
      matureWeightKg: species.matureWeightKg.toString(),
      gestationPeriodDays: species.gestationPeriodDays,
      averageLitterSize: species.averageLitterSize,
      sexualMaturityMonths: species.sexualMaturityMonths,
      isActive: true,
    });
    // Store species ID for breed mapping
    speciesMap.set(species.speciesName, 1); // Placeholder - will be updated after insertion
  }

  console.log("✓ Species templates seeded");

  // Breed Database
  const breedsData = [
    // Cattle Breeds
    {
      speciesName: "Cattle",
      breedName: "Holstein",
      origin: "Netherlands",
      rarity: "common" as const,
      adaptability: "Temperate",
      description: "High milk production dairy breed",
    },
    {
      speciesName: "Cattle",
      breedName: "Angus",
      origin: "Scotland",
      rarity: "common" as const,
      adaptability: "Temperate",
      description: "Premium beef production breed",
    },
    {
      speciesName: "Poultry",
      breedName: "Leghorn",
      origin: "Italy",
      rarity: "common" as const,
      adaptability: "Temperate",
      description: "High egg production layer breed",
    },
    {
      speciesName: "Goats",
      breedName: "Alpine",
      origin: "France",
      rarity: "common" as const,
      adaptability: "Mountain",
      description: "High milk production dairy breed",
    },
    {
      speciesName: "Sheep",
      breedName: "Merino",
      origin: "Spain",
      rarity: "common" as const,
      adaptability: "Arid",
      description: "Fine wool production breed",
    },
    {
      speciesName: "Pigs",
      breedName: "Landrace",
      origin: "Denmark",
      rarity: "common" as const,
      adaptability: "Temperate",
      description: "Lean meat production breed",
    },
    {
      speciesName: "Rabbits",
      breedName: "Flemish Giant",
      origin: "Belgium",
      rarity: "uncommon" as const,
      adaptability: "Temperate",
      description: "Large meat production breed",
    },
  ];

  for (const breed of breedsData) {
    const speciesId = speciesMap.get(breed.speciesName) || 1;
    await db.insert(breeds).values({
      speciesId,
      breedName: breed.breedName,
      origin: breed.origin,
      rarity: breed.rarity,
      adaptability: breed.adaptability,
      description: breed.description,
      characteristics: JSON.stringify({}),
      productionCapabilities: JSON.stringify({}),
    });
  }

  console.log("✓ Breed database seeded");

  // Health Protocols
  const healthProtocolsData = [
    {
      speciesName: "Cattle",
      protocolName: "Blackleg Vaccination",
      protocolType: "vaccination" as const,
      disease: "Blackleg",
      vaccine: "Blackleg Vaccine",
      frequency: "Annual",
      recommendedAge: "3-6 months",
      dosage: "2 mL",
      administrationRoute: "Intramuscular",
    },
    {
      speciesName: "Poultry",
      protocolName: "Newcastle Disease Vaccination",
      protocolType: "vaccination" as const,
      disease: "Newcastle Disease",
      vaccine: "ND Vaccine",
      frequency: "Every 4 weeks",
      recommendedAge: "1 day",
      dosage: "Spray",
      administrationRoute: "Ocular/Nasal",
    },
    {
      speciesName: "Goats",
      protocolName: "Deworming Program",
      protocolType: "treatment" as const,
      disease: "Internal Parasites",
      frequency: "Every 6-8 weeks",
      recommendedAge: "2 weeks",
      dosage: "Variable",
      administrationRoute: "Oral",
    },
  ];

  for (const protocol of healthProtocolsData) {
    const speciesId = speciesMap.get(protocol.speciesName) || 1;
    await db.insert(healthProtocols).values({
      speciesId,
      protocolName: protocol.protocolName,
      protocolType: protocol.protocolType,
      disease: protocol.disease,
      vaccine: protocol.vaccine,
      frequency: protocol.frequency,
      recommendedAge: protocol.recommendedAge,
      dosage: protocol.dosage,
      administrationRoute: protocol.administrationRoute,
      description: `${protocol.protocolName} for ${protocol.speciesName}`,
    });
  }

  console.log("✓ Health protocols seeded");

  // Feed Recommendations
  const feedRecommendationsData = [
    {
      speciesName: "Cattle",
      breedName: "Holstein",
      feedType: "Dairy",
      recommendations: {
        dailyIntake: "20-25 kg",
        protein: "16-18%",
        energy: "1.6-1.8 Mcal/kg",
      },
    },
    {
      speciesName: "Poultry",
      breedName: "Leghorn",
      feedType: "Layer",
      recommendations: {
        dailyIntake: "0.1-0.12 kg",
        protein: "16-18%",
        calcium: "3.5-4%",
      },
    },
    {
      speciesName: "Goats",
      breedName: "Alpine",
      feedType: "Dairy",
      recommendations: {
        dailyIntake: "2-3 kg",
        protein: "14-16%",
        energy: "2.8-3.0 Mcal/kg",
      },
    },
  ];

  for (const feed of feedRecommendationsData) {
    const speciesId = speciesMap.get(feed.speciesName) || 1;
    await db.insert(feedRecommendations).values({
      speciesId: speciesId,
      breedId: 1,
      ageGroup: "Adult",
      feedType: feed.feedType,
      dailyQuantityKg: "20.00",
      proteinPercentage: "16.00",
      energyMcalKg: "1.70",
      fiberPercentage: "8.00",
      fatPercentage: "5.00",
      calciumPercentage: "0.80",
      phosphorusPercentage: "0.60",
      ingredients: JSON.stringify(["Hay", "Grains", "Legumes", "Minerals"]),
      notes: `Feed recommendations for ${feed.breedName} ${feed.feedType}`,
    });
  }

  console.log("✓ Feed recommendations seeded");

  // Production Metrics
  const productionMetricsData = [
    {
      speciesName: "Cattle",
      metricName: "Daily Milk Production",
      metricType: "milk" as const,
      unit: "liters",
      benchmarkMin: 15,
      benchmarkAverage: 25,
      benchmarkMax: 35,
    },
    {
      speciesName: "Poultry",
      metricName: "Eggs per Bird per Year",
      metricType: "eggs" as const,
      unit: "count",
      benchmarkMin: 250,
      benchmarkAverage: 280,
      benchmarkMax: 320,
    },
    {
      speciesName: "Goats",
      metricName: "Daily Milk Production",
      metricType: "milk" as const,
      unit: "liters",
      benchmarkMin: 2,
      benchmarkAverage: 4,
      benchmarkMax: 6,
    },
    {
      speciesName: "Sheep",
      metricName: "Annual Wool Production",
      metricType: "wool" as const,
      unit: "kg",
      benchmarkMin: 2,
      benchmarkAverage: 4,
      benchmarkMax: 6,
    },
    {
      speciesName: "Pigs",
      metricName: "Feed Conversion Ratio",
      metricType: "other" as const,
      unit: "ratio",
      benchmarkMin: 3.0,
      benchmarkAverage: 3.5,
      benchmarkMax: 4.0,
    },
  ];

  for (const metric of productionMetricsData) {
    const speciesId = speciesMap.get(metric.speciesName) || 1;
    await db.insert(productionMetricsTemplates).values({
      speciesId,
      metricName: metric.metricName,
      metricType: metric.metricType,
      unit: metric.unit,
      benchmarkMin: metric.benchmarkMin.toString(),
      benchmarkAverage: metric.benchmarkAverage.toString(),
      benchmarkMax: metric.benchmarkMax.toString(),
      description: `${metric.metricName} benchmark for ${metric.speciesName}`,
    });
  }

  console.log("✓ Production metrics seeded");

  console.log("✅ Multi-species seed data completed successfully!");
}
