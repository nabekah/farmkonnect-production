import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.ts';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function main() {
  console.log('🌱 Starting farm operations data seeding...');

  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection, { schema, mode: 'default' });

  try {
    // Get the first farm (assuming it exists from previous seeds)
    const farms = await db.select().from(schema.farms).limit(1);
    if (farms.length === 0) {
      console.error('❌ No farms found. Please run the main seed script first.');
      process.exit(1);
    }
    const farmId = farms[0].id;
    console.log(`✅ Using farm ID: ${farmId}`);

    // Check if data already exists
    const existingExpenses = await db.select().from(schema.farmExpenses).where(eq(schema.farmExpenses.farmId, farmId)).limit(1);
    if (existingExpenses.length > 0) {
      console.log('⚠️  Farm operations data already exists. Skipping seeding.');
      console.log('   To re-seed, please manually delete existing data first.');
      return;
    }

    // Seed Farm Expenses
    console.log('💰 Seeding farm expenses...');
    const expenses = [
      {
        farmId,
        category: 'feed',
        amount: '1500.00',
        expenseDate: new Date('2024-01-15'),
        description: 'Cattle feed purchase - 500kg',
        paymentMethod: 'bank_transfer',
      },
      {
        farmId,
        category: 'labor',
        amount: '2500.00',
        expenseDate: new Date('2024-01-20'),
        description: 'Monthly wages for 5 workers',
        paymentMethod: 'cash',
      },
      {
        farmId,
        category: 'equipment',
        amount: '5000.00',
        expenseDate: new Date('2024-01-25'),
        description: 'New irrigation pump',
        paymentMethod: 'bank_transfer',
      },
      {
        farmId,
        category: 'utilities',
        amount: '800.00',
        expenseDate: new Date('2024-02-01'),
        description: 'Electricity bill for January',
        paymentMethod: 'bank_transfer',
      },
      {
        farmId,
        category: 'feed',
        amount: '1800.00',
        expenseDate: new Date('2024-02-10'),
        description: 'Poultry feed - 600kg',
        paymentMethod: 'cash',
      },
      {
        farmId,
        category: 'veterinary',
        amount: '450.00',
        expenseDate: new Date('2024-02-15'),
        description: 'Vaccination for 20 cattle',
        paymentMethod: 'mobile_money',
      },
    ];

    for (const expense of expenses) {
      await db.insert(schema.farmExpenses).values(expense);
    }
    console.log(`✅ Seeded ${expenses.length} farm expenses`);

    // Seed Farm Revenue
    console.log('💵 Seeding farm revenue...');
    const revenues = [
      {
        farmId,
        source: 'crop_sales',
        amount: '8000.00',
        saleDate: new Date('2024-01-18'),
        buyer: 'Ghana Grains Ltd',
        quantity: '2000.00',
        unit: 'kg',
        notes: 'Maize harvest sale',
      },
      {
        farmId,
        source: 'livestock_sales',
        amount: '12000.00',
        saleDate: new Date('2024-01-28'),
        buyer: 'Accra Meat Market',
        quantity: '5.00',
        unit: 'head',
        notes: 'Sold 5 mature cattle',
      },
      {
        farmId,
        source: 'product_sales',
        amount: '3500.00',
        saleDate: new Date('2024-02-05'),
        buyer: 'Local Dairy Cooperative',
        quantity: '500.00',
        unit: 'liters',
        notes: 'Fresh milk sales',
      },
      {
        farmId,
        source: 'crop_sales',
        amount: '6500.00',
        saleDate: new Date('2024-02-12'),
        buyer: 'Kumasi Vegetable Market',
        quantity: '1500.00',
        unit: 'kg',
        notes: 'Tomato harvest',
      },
      {
        farmId,
        source: 'livestock_sales',
        amount: '4500.00',
        saleDate: new Date('2024-02-20'),
        buyer: 'Tema Poultry Traders',
        quantity: '150.00',
        unit: 'birds',
        notes: 'Broiler chicken sales',
      },
    ];

    for (const revenue of revenues) {
      await db.insert(schema.farmRevenue).values(revenue);
    }
    console.log(`✅ Seeded ${revenues.length} farm revenue records`);

    // Get or create animal types
    console.log('🐄 Seeding animal types...');
    const animalTypes = [
      { typeName: 'Cattle', description: 'Beef and dairy cattle' },
      { typeName: 'Poultry', description: 'Chickens and other birds' },
      { typeName: 'Goats', description: 'Meat and dairy goats' },
      { typeName: 'Sheep', description: 'Wool and meat sheep' },
    ];

    const animalTypeIds = [];
    for (const type of animalTypes) {
      const [result] = await db.insert(schema.animalTypes).values(type);
      animalTypeIds.push(result.insertId);
    }
    console.log(`✅ Seeded ${animalTypes.length} animal types`);

    // Seed Animals
    console.log('🐮 Seeding animals...');
    const animals = [
      {
        farmId,
        typeId: animalTypeIds[0], // Cattle
        uniqueTagId: 'CTL-001',
        birthDate: new Date('2021-03-15'),
        gender: 'female',
        breed: 'Holstein Friesian',
        status: 'active',
      },
      {
        farmId,
        typeId: animalTypeIds[0], // Cattle
        uniqueTagId: 'CTL-002',
        birthDate: new Date('2021-05-20'),
        gender: 'male',
        breed: 'Angus',
        status: 'active',
      },
      {
        farmId,
        typeId: animalTypeIds[1], // Poultry
        uniqueTagId: 'PLT-001',
        birthDate: new Date('2023-11-01'),
        gender: 'female',
        breed: 'Rhode Island Red',
        status: 'active',
      },
      {
        farmId,
        typeId: animalTypeIds[1], // Poultry
        uniqueTagId: 'PLT-002',
        birthDate: new Date('2023-11-01'),
        gender: 'male',
        breed: 'Leghorn',
        status: 'active',
      },
      {
        farmId,
        typeId: animalTypeIds[2], // Goats
        uniqueTagId: 'GOT-001',
        birthDate: new Date('2022-07-10'),
        gender: 'female',
        breed: 'Boer',
        status: 'active',
      },
      {
        farmId,
        typeId: animalTypeIds[2], // Goats
        uniqueTagId: 'GOT-002',
        birthDate: new Date('2022-08-15'),
        gender: 'male',
        breed: 'Saanen',
        status: 'active',
      },
    ];

    const animalIds = [];
    for (const animal of animals) {
      const [result] = await db.insert(schema.animals).values(animal);
      animalIds.push(result.insertId);
    }
    console.log(`✅ Seeded ${animals.length} animals`);

    // Seed Animal Health Records
    console.log('🏥 Seeding animal health records...');
    const healthRecords = [
      {
        animalId: animalIds[0],
        recordDate: new Date('2024-01-10'),
        eventType: 'vaccination',
        details: 'Foot and mouth disease vaccination',
        veterinarianUserId: null,
      },
      {
        animalId: animalIds[0],
        recordDate: new Date('2024-02-15'),
        eventType: 'checkup',
        details: 'Routine health checkup - all normal',
        veterinarianUserId: null,
      },
      {
        animalId: animalIds[1],
        recordDate: new Date('2024-01-12'),
        eventType: 'treatment',
        details: 'Treated for minor infection',
        veterinarianUserId: null,
      },
      {
        animalId: animalIds[2],
        recordDate: new Date('2024-01-20'),
        eventType: 'vaccination',
        details: 'Newcastle disease vaccination',
        veterinarianUserId: null,
      },
      {
        animalId: animalIds[4],
        recordDate: new Date('2024-02-01'),
        eventType: 'checkup',
        details: 'Pregnancy check - positive',
        veterinarianUserId: null,
      },
    ];

    for (const record of healthRecords) {
      await db.insert(schema.animalHealthRecords).values(record);
    }
    console.log(`✅ Seeded ${healthRecords.length} health records`);

    // Seed Farm Workers
    console.log('👷 Seeding farm workers...');
    const workers = [
      {
        farmId,
        name: 'Kwame Mensah',
        role: 'farm_manager',
        phoneNumber: '+233244123456',
        email: 'kwame.mensah@farmkonnect.gh',
        hireDate: new Date('2020-01-15'),
        salary: '3500.00',
        status: 'active',
      },
      {
        farmId,
        name: 'Ama Owusu',
        role: 'livestock_handler',
        phoneNumber: '+233244234567',
        email: 'ama.owusu@farmkonnect.gh',
        hireDate: new Date('2021-03-20'),
        salary: '2200.00',
        status: 'active',
      },
      {
        farmId,
        name: 'Kofi Asante',
        role: 'crop_specialist',
        phoneNumber: '+233244345678',
        email: 'kofi.asante@farmkonnect.gh',
        hireDate: new Date('2021-06-10'),
        salary: '2500.00',
        status: 'active',
      },
      {
        farmId,
        name: 'Abena Boateng',
        role: 'general_laborer',
        phoneNumber: '+233244456789',
        email: null,
        hireDate: new Date('2022-01-05'),
        salary: '1800.00',
        status: 'active',
      },
      {
        farmId,
        name: 'Yaw Osei',
        role: 'equipment_operator',
        phoneNumber: '+233244567890',
        email: 'yaw.osei@farmkonnect.gh',
        hireDate: new Date('2022-08-15'),
        salary: '2000.00',
        status: 'active',
      },
    ];

    for (const worker of workers) {
      await db.insert(schema.farmWorkers).values(worker);
    }
    console.log(`✅ Seeded ${workers.length} farm workers`);

    // Seed Fish Ponds
    console.log('🐟 Seeding fish ponds...');
    const ponds = [
      {
        farmId,
        pondName: 'Pond A - Tilapia',
        pondType: 'earthen',
        surfaceArea: '500.00',
        depth: '2.50',
        status: 'active',
      },
      {
        farmId,
        pondName: 'Pond B - Catfish',
        pondType: 'concrete',
        surfaceArea: '300.00',
        depth: '2.00',
        status: 'active',
      },
      {
        farmId,
        pondName: 'Pond C - Mixed',
        pondType: 'earthen',
        surfaceArea: '800.00',
        depth: '3.00',
        status: 'active',
      },
    ];

    const pondIds = [];
    for (const pond of ponds) {
      const [result] = await db.insert(schema.fishPonds).values(pond);
      pondIds.push(result.insertId);
    }
    console.log(`✅ Seeded ${ponds.length} fish ponds`);

    // Seed Fish Pond Activities
    console.log('🌊 Seeding fish pond activities...');
    const activities = [
      {
        pondId: pondIds[0],
        activityType: 'stocking',
        activityDate: new Date('2024-01-05'),
        quantity: '5000.00',
        notes: 'Stocked 5000 tilapia fingerlings',
      },
      {
        pondId: pondIds[0],
        activityType: 'water_quality',
        activityDate: new Date('2024-01-10'),
        quantity: null,
        notes: 'pH: 7.2, DO: 6.5 mg/L, Temp: 28°C',
      },
      {
        pondId: pondIds[1],
        activityType: 'stocking',
        activityDate: new Date('2024-01-08'),
        quantity: '3000.00',
        notes: 'Stocked 3000 catfish fingerlings',
      },
      {
        pondId: pondIds[1],
        activityType: 'feeding',
        activityDate: new Date('2024-02-01'),
        quantity: '50.00',
        notes: 'Fed 50kg of pellets',
      },
      {
        pondId: pondIds[2],
        activityType: 'harvest',
        activityDate: new Date('2024-02-10'),
        quantity: '800.00',
        notes: 'Harvested 800kg of mixed fish',
      },
    ];

    for (const activity of activities) {
      await db.insert(schema.fishPondActivities).values(activity);
    }
    console.log(`✅ Seeded ${activities.length} fish pond activities`);

    // Seed Farm Assets
    console.log('🚜 Seeding farm assets...');
    const assets = [
      {
        farmId,
        assetName: 'John Deere Tractor 5075E',
        assetType: 'vehicle',
        purchaseDate: new Date('2020-06-15'),
        purchaseValue: '45000.00',
        currentValue: '38000.00',
        status: 'active',
        location: 'Main barn',
      },
      {
        farmId,
        assetName: 'Irrigation System - Drip',
        assetType: 'equipment',
        purchaseDate: new Date('2021-03-20'),
        purchaseValue: '12000.00',
        currentValue: '9500.00',
        status: 'active',
        location: 'Field 1',
      },
      {
        farmId,
        assetName: 'Storage Warehouse',
        assetType: 'building',
        purchaseDate: new Date('2019-01-10'),
        purchaseValue: '80000.00',
        currentValue: '75000.00',
        status: 'active',
        location: 'North section',
      },
      {
        farmId,
        assetName: 'Grain Harvester',
        assetType: 'equipment',
        purchaseDate: new Date('2022-08-05'),
        purchaseValue: '28000.00',
        currentValue: '25000.00',
        status: 'active',
        location: 'Equipment shed',
      },
      {
        farmId,
        assetName: 'Water Pump - Diesel',
        assetType: 'equipment',
        purchaseDate: new Date('2023-02-15'),
        purchaseValue: '5000.00',
        currentValue: '4500.00',
        status: 'active',
        location: 'Pond area',
      },
    ];

    const assetIds = [];
    for (const asset of assets) {
      const [result] = await db.insert(schema.farmAssets).values(asset);
      assetIds.push(result.insertId);
    }
    console.log(`✅ Seeded ${assets.length} farm assets`);

    // Seed Asset Maintenance Records
    console.log('🔧 Seeding asset maintenance records...');
    const maintenanceRecords = [
      {
        assetId: assetIds[0],
        maintenanceDate: new Date('2024-01-15'),
        maintenanceType: 'routine',
        description: 'Oil change and filter replacement',
        cost: '250.00',
        performedBy: 'Yaw Osei',
      },
      {
        assetId: assetIds[0],
        maintenanceDate: new Date('2024-02-20'),
        maintenanceType: 'repair',
        description: 'Fixed hydraulic leak',
        cost: '450.00',
        performedBy: 'External mechanic',
      },
      {
        assetId: assetIds[1],
        maintenanceDate: new Date('2024-01-20'),
        maintenanceType: 'routine',
        description: 'Cleaned filters and checked pressure',
        cost: '150.00',
        performedBy: 'Kofi Asante',
      },
      {
        assetId: assetIds[3],
        maintenanceDate: new Date('2024-02-10'),
        maintenanceType: 'routine',
        description: 'Blade sharpening and lubrication',
        cost: '200.00',
        performedBy: 'Yaw Osei',
      },
    ];

    for (const record of maintenanceRecords) {
      await db.insert(schema.assetMaintenanceRecords).values(record);
    }
    console.log(`✅ Seeded ${maintenanceRecords.length} maintenance records`);

    console.log('🎉 Farm operations data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${expenses.length} expenses`);
    console.log(`   - ${revenues.length} revenue records`);
    console.log(`   - ${animals.length} animals`);
    console.log(`   - ${healthRecords.length} health records`);
    console.log(`   - ${workers.length} farm workers`);
    console.log(`   - ${ponds.length} fish ponds`);
    console.log(`   - ${activities.length} pond activities`);
    console.log(`   - ${assets.length} farm assets`);
    console.log(`   - ${maintenanceRecords.length} maintenance records`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

main()
  .then(() => {
    console.log('✅ Seed script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });
