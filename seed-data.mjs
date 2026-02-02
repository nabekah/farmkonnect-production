import mysql from "mysql2/promise";
import { URL } from "url";

// Parse DATABASE_URL
const dbUrl = new URL(process.env.DATABASE_URL);
const connectionConfig = {
  host: dbUrl.hostname,
  port: parseInt(dbUrl.port) || 3306,
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
};

let connection;
try {
  connection = await mysql.createConnection(connectionConfig);
} catch (e) {
  console.error("Connection error:", e.message);
  process.exit(1);
}

// Ghana and West Africa farm data
const ghanianFarms = [
  {
    name: "Ashanti Valley Farm",
    region: "Ashanti",
    district: "Kumasi",
    latitude: 6.6753,
    longitude: -1.6167,
    size: 25,
    type: "mixed",
  },
  {
    name: "Volta Green Acres",
    region: "Volta",
    district: "Ho",
    latitude: 6.6117,
    longitude: -0.4733,
    size: 18,
    type: "crop",
  },
  {
    name: "Northern Savanna Farm",
    region: "Northern",
    district: "Tamale",
    latitude: 9.4077,
    longitude: -0.8552,
    size: 40,
    type: "livestock",
  },
  {
    name: "Coastal Harvest Farm",
    region: "Central",
    district: "Cape Coast",
    latitude: 5.1033,
    longitude: -1.2466,
    size: 15,
    type: "crop",
  },
  {
    name: "Eastern Hills Farm",
    region: "Eastern",
    district: "Koforidua",
    latitude: 6.0881,
    longitude: -0.3622,
    size: 22,
    type: "mixed",
  },
];

const westAfricanFarms = [
  {
    name: "Senegal Groundnut Farm",
    region: "Kaolack",
    district: "Kaolack",
    latitude: 13.9667,
    longitude: -15.9333,
    size: 35,
    type: "crop",
  },
  {
    name: "Ivory Coast Cocoa Estate",
    region: "Haut-Sassandra",
    district: "Daloa",
    latitude: 6.8776,
    longitude: -6.4516,
    size: 50,
    type: "crop",
  },
  {
    name: "Burkina Faso Millet Farm",
    region: "Hauts-Bassins",
    district: "Bobo-Dioulasso",
    latitude: 12.6547,
    longitude: -4.2903,
    size: 30,
    type: "crop",
  },
  {
    name: "Nigeria Cassava Farm",
    region: "Oyo",
    district: "Ibadan",
    latitude: 7.3775,
    longitude: 3.947,
    size: 28,
    type: "crop",
  },
];

const cropData = [
  { name: "Maize", type: "cereal", season: "rainy" },
  { name: "Cassava", type: "root", season: "year-round" },
  { name: "Cocoa", type: "cash", season: "year-round" },
  { name: "Groundnut", type: "legume", season: "dry" },
  { name: "Yam", type: "root", season: "rainy" },
  { name: "Plantain", type: "fruit", season: "year-round" },
  { name: "Rice", type: "cereal", season: "rainy" },
  { name: "Millet", type: "cereal", season: "dry" },
];

const animalTypesData = [
  { name: "Cattle", category: "livestock", breed: "N'Dama" },
  { name: "Goat", category: "livestock", breed: "West African Dwarf" },
  { name: "Sheep", category: "livestock", breed: "Djallonké" },
  { name: "Chicken", category: "poultry", breed: "Local" },
  { name: "Guinea Fowl", category: "poultry", breed: "Local" },
  { name: "Pig", category: "livestock", breed: "Local" },
];

const products = [
  {
    name: "Organic Cocoa Beans",
    description: "High-quality cocoa beans from Ivory Coast",
    price: 45.0,
    category: "cash_crops",
  },
  {
    name: "Fresh Cassava Roots",
    description: "Fresh cassava from Ghana farms",
    price: 8.5,
    category: "root_crops",
  },
  {
    name: "Groundnut Paste",
    description: "Pure groundnut paste from Senegal",
    price: 12.0,
    category: "processed",
  },
  {
    name: "Organic Maize Flour",
    description: "Stone-ground maize flour",
    price: 6.5,
    category: "cereals",
  },
  {
    name: "Fresh Plantains",
    description: "Ripe plantains from Ghana",
    price: 4.0,
    category: "fruits",
  },
  {
    name: "Shea Butter",
    description: "Pure shea butter from Burkina Faso",
    price: 18.0,
    category: "processed",
  },
  {
    name: "Free-Range Chicken Eggs",
    description: "Fresh eggs from local chickens",
    price: 3.5,
    category: "poultry",
  },
  {
    name: "Dried Chili Peppers",
    description: "Dried chili peppers from Ghana",
    price: 9.0,
    category: "spices",
  },
];

async function seedData() {
  try {
    console.log("Starting data population for Ghana and West Africa...\n");

    const allFarms = [...ghanianFarms, ...westAfricanFarms];

    // Insert farms
    console.log("📍 Creating farms...");
    for (let i = 0; i < allFarms.length; i++) {
      const farm = allFarms[i];
      try {
        await connection.execute(
          `INSERT INTO farms (name, region, district, latitude, longitude, size, type, farmerUserId, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            farm.name,
            farm.region,
            farm.district,
            farm.latitude.toString(),
            farm.longitude.toString(),
            farm.size.toString(),
            farm.type,
            (i + 1) * 100,
          ]
        );
      } catch (e) {
        console.log(`  ⚠️  Farm "${farm.name}" may already exist`);
      }
    }
    console.log(`✅ Created/Updated ${allFarms.length} farms\n`);

    // Insert crops
    console.log("🌾 Creating crop types...");
    for (const crop of cropData) {
      try {
        await connection.execute(
          `INSERT INTO crops (name, type, season, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())`,
          [crop.name, crop.type, crop.season]
        );
      } catch (e) {
        console.log(`  ⚠️  Crop "${crop.name}" may already exist`);
      }
    }
    console.log(`✅ Created/Updated ${cropData.length} crop types\n`);

    // Insert animal types
    console.log("🐄 Creating animal types...");
    for (const animalType of animalTypesData) {
      try {
        await connection.execute(
          `INSERT INTO animalTypes (name, category, breed, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())`,
          [animalType.name, animalType.category, animalType.breed]
        );
      } catch (e) {
        console.log(`  ⚠️  Animal type "${animalType.name}" may already exist`);
      }
    }
    console.log(`✅ Created/Updated ${animalTypesData.length} animal types\n`);

    // Insert animals
    console.log("🐓 Creating sample animals...");
    let animalCount = 0;
    for (let farmIdx = 0; farmIdx < allFarms.length; farmIdx++) {
      const farm = allFarms[farmIdx];
      if (farm.type === "livestock" || farm.type === "mixed") {
        // Add cattle
        for (let i = 0; i < 5; i++) {
          try {
            await connection.execute(
              `INSERT INTO animals (name, type, breed, gender, birthDate, farmId, status, createdAt, updatedAt) 
               VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [
                `Cattle ${farmIdx}-${i + 1}`,
                "Cattle",
                "N'Dama",
                i % 2 === 0 ? "male" : "female",
                new Date(2020 + Math.floor(i / 2), i, 15),
                (farmIdx + 1) * 100,
                "active",
              ]
            );
            animalCount++;
          } catch (e) {
            // Silently skip duplicates
          }
        }

        // Add goats
        for (let i = 0; i < 8; i++) {
          try {
            await connection.execute(
              `INSERT INTO animals (name, type, breed, gender, birthDate, farmId, status, createdAt, updatedAt) 
               VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [
                `Goat ${farmIdx}-${i + 1}`,
                "Goat",
                "West African Dwarf",
                i % 2 === 0 ? "male" : "female",
                new Date(2021 + Math.floor(i / 3), i % 12, 10),
                (farmIdx + 1) * 100,
                "active",
              ]
            );
            animalCount++;
          } catch (e) {
            // Silently skip duplicates
          }
        }

        // Add chickens
        for (let i = 0; i < 20; i++) {
          try {
            await connection.execute(
              `INSERT INTO animals (name, type, breed, gender, birthDate, farmId, status, createdAt, updatedAt) 
               VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [
                `Chicken ${farmIdx}-${i + 1}`,
                "Chicken",
                "Local",
                i % 2 === 0 ? "male" : "female",
                new Date(2023, Math.floor(i / 5), (i % 28) + 1),
                (farmIdx + 1) * 100,
                "active",
              ]
            );
            animalCount++;
          } catch (e) {
            // Silently skip duplicates
          }
        }
      }
    }
    console.log(`✅ Created ${animalCount} animals\n`);

    // Insert marketplace products
    console.log("🛒 Creating marketplace products...");
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const farmIdx = i % allFarms.length;
      try {
        await connection.execute(
          `INSERT INTO marketplaceProducts (productName, description, price, category, quantity, sellerId, status, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            product.name,
            product.description,
            product.price.toString(),
            product.category,
            (Math.floor(Math.random() * 500) + 100).toString(),
            (farmIdx + 1) * 100,
            "active",
          ]
        );
      } catch (e) {
        console.log(`  ⚠️  Product "${product.name}" may already exist`);
      }
    }
    console.log(`✅ Created/Updated ${products.length} marketplace products\n`);

    // Insert IoT devices
    console.log("📡 Creating IoT devices...");
    let deviceCount = 0;
    for (let farmIdx = 0; farmIdx < Math.min(allFarms.length, 5); farmIdx++) {
      const farm = allFarms[farmIdx];

      // Soil moisture sensor
      try {
        await connection.execute(
          `INSERT INTO iotDevices (deviceId, deviceName, deviceType, location, latitude, longitude, farmId, status, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            `SM-${farmIdx + 1}`,
            `Soil Moisture Sensor ${farmIdx + 1}`,
            "soil_moisture",
            `${farm.name} - Field A`,
            farm.latitude.toString(),
            farm.longitude.toString(),
            (farmIdx + 1) * 100,
            "active",
          ]
        );
        deviceCount++;
      } catch (e) {
        // Skip if exists
      }

      // Temperature sensor
      try {
        await connection.execute(
          `INSERT INTO iotDevices (deviceId, deviceName, deviceType, location, latitude, longitude, farmId, status, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            `TEMP-${farmIdx + 1}`,
            `Temperature Sensor ${farmIdx + 1}`,
            "temperature",
            `${farm.name} - Livestock Area`,
            farm.latitude.toString(),
            farm.longitude.toString(),
            (farmIdx + 1) * 100,
            "active",
          ]
        );
        deviceCount++;
      } catch (e) {
        // Skip if exists
      }
    }
    console.log(`✅ Created/Updated ${deviceCount} IoT devices\n`);

    // Insert sensor readings
    console.log("📊 Creating sensor readings...");
    let readingCount = 0;
    for (let deviceIdx = 1; deviceIdx <= Math.min(10, deviceCount); deviceIdx++) {
      for (let day = 0; day < 7; day++) {
        const readingDate = new Date();
        readingDate.setDate(readingDate.getDate() - day);

        const value =
          deviceIdx % 2 === 0
            ? (Math.random() * 100).toString()
            : (20 + Math.random() * 15).toString();
        const unit = deviceIdx % 2 === 0 ? "%" : "°C";

        try {
          await connection.execute(
            `INSERT INTO sensorReadings (deviceId, sensorType, value, unit, timestamp, createdAt, updatedAt) 
             VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              deviceIdx,
              deviceIdx % 2 === 0 ? "soil_moisture" : "temperature",
              value,
              unit,
              readingDate,
            ]
          );
          readingCount++;
        } catch (e) {
          // Skip duplicates
        }
      }
    }
    console.log(`✅ Created ${readingCount} sensor readings\n`);

    // Insert notifications
    console.log("🔔 Creating sample notifications...");
    for (let i = 0; i < 10; i++) {
      try {
        await connection.execute(
          `INSERT INTO notifications (userId, title, content, type, priority, read, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            ((i % allFarms.length) + 1) * 100,
            `Farm Alert ${i + 1}`,
            `This is a sample notification for farm management in ${allFarms[i % allFarms.length].name}`,
            "alert",
            i % 3 === 0 ? "high" : "medium",
            i % 2 === 0,
          ]
        );
      } catch (e) {
        // Skip if exists
      }
    }
    console.log(`✅ Created sample notifications\n`);

    console.log("═══════════════════════════════════════════════════════");
    console.log("✅ Data population completed successfully!");
    console.log("═══════════════════════════════════════════════════════");
    console.log(`
Summary of Ghana & West Africa Sample Data:
  🌍 Farms: ${allFarms.length}
  🌾 Crop Types: ${cropData.length}
  🐄 Animal Types: ${animalTypesData.length}
  🐓 Animals: ${animalCount}
  🛒 Marketplace Products: ${products.length}
  📡 IoT Devices: ${deviceCount}
  📊 Sensor Readings: ${readingCount}
  🔔 Notifications: 10

Farms Created:
${allFarms.map((f) => `  • ${f.name} (${f.region}, ${f.type})`).join("\n")}
    `);
  } catch (error) {
    console.error("❌ Error seeding data:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedData();
