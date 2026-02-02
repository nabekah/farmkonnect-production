import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.js';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

console.log('🌱 Starting sample data seeding...\n');

// Get the owner user ID (assuming ID 1 is the owner)
const OWNER_ID = 1;

try {
  // 1. Add more farms with varied data
  console.log('📍 Seeding farms...');
  const farmData = [
    {
      farmName: 'Northern Savanna Farm',
      farmType: 'crop',
      location: 'Northern Region, Ghana',
      sizeHectares: 15.5,
      description: 'Specialized in millet and sorghum production',
      farmerUserId: OWNER_ID,
    },
    {
      farmName: 'Western Cocoa Estate',
      farmType: 'crop',
      location: 'Western Region, Ghana',
      sizeHectares: 25.0,
      description: 'Premium cocoa production with organic certification',
      farmerUserId: OWNER_ID,
    },
    {
      farmName: 'Central Poultry Farm',
      farmType: 'livestock',
      location: 'Central Region, Ghana',
      sizeHectares: 3.5,
      description: 'Large-scale poultry and egg production',
      farmerUserId: OWNER_ID,
    },
  ];

  for (const farm of farmData) {
    await db.insert(schema.farms).values(farm).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
  }
  console.log(`✅ Added ${farmData.length} farms\n`);

  // Get all farms for reference
  const allFarms = await db.select().from(schema.farms);
  const farmIds = allFarms.map(f => f.id);

  // 2. Add crops first
  console.log('🌾 Seeding crops...');
  const cropData = [
    { cropName: 'Rice', category: 'grains', description: 'Staple grain crop' },
    { cropName: 'Tomatoes', category: 'vegetables', description: 'Fresh vegetable' },
    { cropName: 'Cassava', category: 'tubers', description: 'Root crop' },
    { cropName: 'Millet', category: 'grains', description: 'Drought-resistant grain' },
    { cropName: 'Cocoa', category: 'cash_crops', description: 'Premium cash crop' },
  ];

  for (const crop of cropData) {
    await db.insert(schema.crops).values(crop).onDuplicateKeyUpdate({ set: { cropName: crop.cropName } });
  }
  console.log(`✅ Added ${cropData.length} crops\n`);

  // Get crops for reference
  const allCrops = await db.select().from(schema.crops);

  // 3. Add crop cycles with complete data
  console.log('🌾 Seeding crop cycles...');
  const cropCycleData = [
    {
      farmId: farmIds[0],
      cropId: allCrops.find(c => c.cropName === 'Rice')?.id || 1,
      varietyName: 'Jasmine',
      plantingDate: new Date('2025-11-01'),
      expectedHarvestDate: new Date('2026-03-15'),
      areaPlantedHectares: 8.0,
      status: 'growing',
      expectedYieldKg: 32000,
    },
    {
      farmId: farmIds[1],
      cropId: allCrops.find(c => c.cropName === 'Tomatoes')?.id || 2,
      varietyName: 'Roma',
      plantingDate: new Date('2025-12-10'),
      expectedHarvestDate: new Date('2026-03-20'),
      areaPlantedHectares: 2.5,
      status: 'growing',
      expectedYieldKg: 15000,
    },
    {
      farmId: farmIds[2],
      cropId: allCrops.find(c => c.cropName === 'Cassava')?.id || 3,
      varietyName: 'Afisiafi',
      plantingDate: new Date('2025-08-01'),
      expectedHarvestDate: new Date('2026-02-01'),
      areaPlantedHectares: 7.0,
      status: 'growing',
      expectedYieldKg: 105000,
    },
    {
      farmId: farmIds[3],
      cropId: allCrops.find(c => c.cropName === 'Millet')?.id || 4,
      varietyName: 'Pearl Millet',
      plantingDate: new Date('2025-09-15'),
      expectedHarvestDate: new Date('2026-01-30'),
      areaPlantedHectares: 10.0,
      status: 'growing',
      expectedYieldKg: 15000,
    },
    {
      farmId: farmIds[4],
      cropId: allCrops.find(c => c.cropName === 'Cocoa')?.id || 5,
      varietyName: 'Amelonado',
      plantingDate: new Date('2023-03-01'),
      expectedHarvestDate: new Date('2026-11-01'),
      areaPlantedHectares: 20.0,
      status: 'growing',
      expectedYieldKg: 40000,
    },
  ];

  for (const cycle of cropCycleData) {
    await db.insert(schema.cropCycles).values(cycle);
  }
  console.log(`✅ Added ${cropCycleData.length} crop cycles\n`);

  // Get crop cycles for reference
  const allCycles = await db.select().from(schema.cropCycles);

  // 4. Add soil tests
  console.log('🧪 Seeding soil tests...');
  const soilTestData = [
    {
      farmId: farmIds[0],
      testDate: new Date('2025-10-15'),
      ph: 6.5,
      nitrogen: 45.0,
      phosphorus: 30.0,
      potassium: 180.0,
      organicMatter: 3.2,
      notes: 'Good soil health, ready for planting',
    },
    {
      farmId: farmIds[1],
      testDate: new Date('2025-11-20'),
      ph: 6.8,
      nitrogen: 52.0,
      phosphorus: 35.0,
      potassium: 200.0,
      organicMatter: 3.8,
      notes: 'Excellent nutrient levels',
    },
    {
      farmId: farmIds[2],
      testDate: new Date('2025-07-10'),
      ph: 6.2,
      nitrogen: 38.0,
      phosphorus: 25.0,
      potassium: 150.0,
      organicMatter: 2.9,
      notes: 'Needs nitrogen supplementation',
    },
  ];

  for (const test of soilTestData) {
    await db.insert(schema.soilTests).values(test);
  }
  console.log(`✅ Added ${soilTestData.length} soil tests\n`);

  // 4. Add yield records
  console.log('📊 Seeding yield records...');
  const yieldData = [
    {
      cycleId: allCycles[0]?.id,
      yieldQuantityKg: 7800.0,
      qualityGrade: 'A',
      recordedDate: new Date('2026-01-20'),
      notes: 'First harvest - excellent quality',
    },
    {
      cycleId: allCycles[1]?.id,
      yieldQuantityKg: 3200.0,
      qualityGrade: 'A',
      recordedDate: new Date('2026-01-15'),
      notes: 'Premium grade tomatoes',
    },
  ];

  for (const yieldRecord of yieldData) {
    if (yieldRecord.cycleId) {
      await db.insert(schema.yieldRecords).values(yieldRecord);
    }
  }
  console.log(`✅ Added ${yieldData.length} yield records\n`);

  // 5. Add crop health records
  console.log('🏥 Seeding crop health records...');
  const healthData = [
    {
      cycleId: allCycles[0]?.id,
      recordDate: new Date('2026-01-10'),
      issueType: 'pest',
      issueName: 'Rice Stem Borer',
      severity: 'medium',
      affectedArea: '0.5 hectares',
      symptoms: 'Dead hearts and white heads visible',
      notes: 'Early detection, treatment applied',
      status: 'treated',
    },
    {
      cycleId: allCycles[1]?.id,
      recordDate: new Date('2026-01-12'),
      issueType: 'disease',
      issueName: 'Early Blight',
      severity: 'low',
      affectedArea: '0.2 hectares',
      symptoms: 'Brown spots on lower leaves',
      notes: 'Fungicide application scheduled',
      status: 'active',
    },
    {
      cycleId: allCycles[2]?.id,
      recordDate: new Date('2026-01-05'),
      issueType: 'nutrient_deficiency',
      issueName: 'Nitrogen Deficiency',
      severity: 'medium',
      affectedArea: '1.0 hectares',
      symptoms: 'Yellowing of older leaves',
      notes: 'Fertilizer application completed',
      status: 'resolved',
    },
  ];

  for (const health of healthData) {
    if (health.cycleId) {
      await db.insert(schema.cropHealthRecords).values(health);
    }
  }
  console.log(`✅ Added ${healthData.length} crop health records\n`);

  // 6. Add crop treatments
  console.log('💊 Seeding crop treatments...');
  const treatmentData = [
    {
      healthRecordId: 1,
      treatmentDate: new Date('2026-01-11'),
      treatmentType: 'chemical',
      productName: 'Cypermethrin 10% EC',
      dosage: '500ml per hectare',
      applicationMethod: 'Foliar spray',
      cost: 250.0,
      notes: 'Applied in early morning',
      effectiveness: 'effective',
    },
    {
      healthRecordId: 2,
      treatmentDate: new Date('2026-01-13'),
      treatmentType: 'chemical',
      productName: 'Mancozeb 80% WP',
      dosage: '2kg per hectare',
      applicationMethod: 'Foliar spray',
      cost: 180.0,
      notes: 'Second application scheduled for next week',
      effectiveness: 'not_evaluated',
    },
  ];

  for (const treatment of treatmentData) {
    await db.insert(schema.cropTreatments).values(treatment);
  }
  console.log(`✅ Added ${treatmentData.length} crop treatments\n`);

  // 7. Add livestock (animals)
  console.log('🐄 Seeding livestock...');
  
  // First, ensure animal types exist
  const animalTypes = [
    { typeName: 'Cattle', description: 'Beef and dairy cattle' },
    { typeName: 'Goat', description: 'Meat and dairy goats' },
    { typeName: 'Sheep', description: 'Wool and meat sheep' },
    { typeName: 'Pig', description: 'Pork production' },
    { typeName: 'Chicken', description: 'Poultry for eggs and meat' },
  ];

  for (const type of animalTypes) {
    await db.insert(schema.animalTypes).values(type).onDuplicateKeyUpdate({ set: { typeName: type.typeName } });
  }

  const allAnimalTypes = await db.select().from(schema.animalTypes);

  const livestockData = [
    {
      farmId: farmIds[1],
      typeId: allAnimalTypes.find(t => t.typeName === 'Cattle')?.id || 1,
      uniqueTagId: 'CTL-001',
      breed: 'Holstein Friesian',
      birthDate: new Date('2023-03-15'),
      gender: 'female',
      status: 'active',
    },
    {
      farmId: farmIds[1],
      typeId: allAnimalTypes.find(t => t.typeName === 'Cattle')?.id || 1,
      uniqueTagId: 'CTL-002',
      breed: 'Angus',
      birthDate: new Date('2022-08-20'),
      gender: 'male',
      status: 'active',
    },
    {
      farmId: farmIds[5],
      typeId: allAnimalTypes.find(t => t.typeName === 'Chicken')?.id || 5,
      uniqueTagId: 'CHK-BATCH-001',
      breed: 'Leghorn',
      birthDate: new Date('2025-09-01'),
      gender: 'female',
      status: 'active',
    },
    {
      farmId: farmIds[1],
      typeId: allAnimalTypes.find(t => t.typeName === 'Goat')?.id || 2,
      uniqueTagId: 'GT-001',
      breed: 'Boer',
      birthDate: new Date('2024-01-10'),
      gender: 'male',
      status: 'active',
    },
  ];

  for (const animal of livestockData) {
    try {
      await db.insert(schema.animals).values(animal);
    } catch (error) {
      if (error.cause?.code === 'ER_DUP_ENTRY') {
        console.log(`  ⏭️  Skipping duplicate animal: ${animal.uniqueTagId}`);
      } else {
        throw error;
      }
    }
  }
  console.log(`✅ Added ${livestockData.length} livestock\n`);

  // Get animals for reference
  const allAnimals = await db.select().from(schema.animals);

  // 8. Add animal health records
  console.log('🏥 Seeding animal health records...');
  const animalHealthData = [
    {
      animalId: allAnimals[0]?.id,
      recordDate: new Date('2026-01-15'),
      eventType: 'checkup',
      details: 'Routine checkup - Deworming and vaccination with Ivermectin, FMD vaccine. Excellent health condition.',
    },
    {
      animalId: allAnimals[1]?.id,
      recordDate: new Date('2026-01-10'),
      eventType: 'treatment',
      details: 'Minor hoof infection treated with Oxytetracycline. Follow-up required.',
    },
  ];

  for (const health of animalHealthData) {
    if (health.animalId) {
      await db.insert(schema.animalHealthRecords).values(health);
    }
  }
  console.log(`✅ Added ${animalHealthData.length} animal health records\n`);

  // 9. Add breeding records
  console.log('🐣 Seeding breeding records...');
  const breedingData = [
    {
      animalId: allAnimals[0]?.id,
      breedingDate: new Date('2025-10-15'),
      expectedDueDate: new Date('2026-07-22'),
      outcome: 'pending',
      notes: 'First breeding',
    },
  ];

  for (const breeding of breedingData) {
    if (breeding.animalId) {
      await db.insert(schema.breedingRecords).values(breeding);
    }
  }
  console.log(`✅ Added ${breedingData.length} breeding records\n`);

  // 10. Add feeding records
  console.log('🌾 Seeding feeding records...');
  const feedingData = [
    {
      animalId: allAnimals[0]?.id,
      feedDate: new Date('2026-01-20'),
      feedType: 'Hay and concentrate',
      quantityKg: 15.0,
      costGHS: 45.0,
      notes: 'Morning and evening feeding',
    },
    {
      animalId: allAnimals[1]?.id,
      feedDate: new Date('2026-01-20'),
      feedType: 'Silage and grain mix',
      quantityKg: 20.0,
      costGHS: 60.0,
      notes: 'High protein diet for breeding',
    },
    {
      animalId: allAnimals[2]?.id,
      feedDate: new Date('2026-01-20'),
      feedType: 'Layer feed',
      quantityKg: 50.0,
      costGHS: 150.0,
      notes: 'Daily ration for 500 birds',
    },
  ];

  for (const feeding of feedingData) {
    if (feeding.animalId) {
      await db.insert(schema.feedingRecords).values(feeding);
    }
  }
  console.log(`✅ Added ${feedingData.length} feeding records\n`);

  // 11. Add marketplace products (skipping - table not in schema yet)
  console.log('🛍️ Skipping marketplace products (table not in schema)...');
  /*  const productData = [
    {
      productName: 'Fresh Tomatoes',
      description: 'Organic Roma tomatoes, freshly harvested',
      category: 'vegetables',
      pricePerUnit: 8.50,
      unit: 'kg',
      quantityAvailable: 500,
      farmId: farmIds[1],
      sellerUserId: OWNER_ID,
      status: 'available',
    },
    {
      productName: 'Premium Cocoa Beans',
      description: 'Grade A cocoa beans, sun-dried',
      category: 'crops',
      pricePerUnit: 25.00,
      unit: 'kg',
      quantityAvailable: 1000,
      farmId: farmIds[4],
      sellerUserId: OWNER_ID,
      status: 'available',
    },
    {
      productName: 'Fresh Eggs',
      description: 'Free-range chicken eggs',
      category: 'livestock_products',
      pricePerUnit: 2.50,
      unit: 'dozen',
      quantityAvailable: 200,
      farmId: farmIds[5],
      sellerUserId: OWNER_ID,
      status: 'available',
    },
    {
      productName: 'Cassava Tubers',
      description: 'Fresh cassava for processing',
      category: 'crops',
      pricePerUnit: 3.00,
      unit: 'kg',
      quantityAvailable: 2000,
      farmId: farmIds[2],
      sellerUserId: OWNER_ID,
      status: 'available',
    },
    {
      productName: 'Millet Grain',
      description: 'Pearl millet, cleaned and dried',
      category: 'grains',
      pricePerUnit: 5.50,
      unit: 'kg',
      quantityAvailable: 800,
      farmId: farmIds[3],
      sellerUserId: OWNER_ID,
      status: 'available',
    },
  ];

  for (const product of productData) {
    await db.insert(schema.products).values(product);
  }
  console.log(`✅ Added ${productData.length} marketplace products\n`);  
  */

  // 12. Add farm activities
  console.log('📝 Seeding farm activities...');
  /*
  const activityData = [
    {
      farmId: farmIds[0],
      activityType: 'crop_planting',
      activityDate: new Date('2025-11-01'),
      description: 'Planted Rice - Jasmine variety',
      notes: 'Used mechanical planter',
    },
    {
      farmId: farmIds[1],
      activityType: 'harvest',
      activityDate: new Date('2026-01-15'),
      description: 'Harvested tomatoes - 3200kg',
      notes: 'Excellent yield',
    },
    {
      farmId: farmIds[1],
      activityType: 'livestock_addition',
      activityDate: new Date('2024-01-10'),
      description: 'Added goat Billy to herd',
      notes: 'Purchased from local breeder',
    },
    {
      farmId: farmIds[0],
      activityType: 'weather_alert',
      activityDate: new Date('2026-01-10'),
      description: 'Heavy rain alert received',
      notes: 'Postponed fertilizer application',
    },
  ];

  for (const activity of activityData) {
    await db.insert(schema.farmActivities).values(activity);
  }
  console.log(`✅ Added ${activityData.length} farm activities\n`);
  */

  console.log('✨ Sample data seeding completed successfully!\n');
  console.log('Summary:');
  console.log(`- Farms: ${farmData.length}`);
  console.log(`- Crop Cycles: ${cropCycleData.length}`);
  console.log(`- Soil Tests: ${soilTestData.length}`);
  console.log(`- Yield Records: ${yieldData.length}`);
  console.log(`- Crop Health Records: ${healthData.length}`);
  console.log(`- Crop Treatments: ${treatmentData.length}`);
  console.log(`- Livestock: ${livestockData.length}`);
  console.log(`- Animal Health Records: ${animalHealthData.length}`);
  console.log(`- Breeding Records: ${breedingData.length}`);
  console.log(`- Feeding Records: ${feedingData.length}`);
  // console.log(`- Marketplace Products: ${productData.length}`);
  // console.log(`- Farm Activities: ${activityData.length}`);

} catch (error) {
  console.error('❌ Error seeding data:', error);
  process.exit(1);
} finally {
  await connection.end();
}
