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
    farmName: "Ashanti Valley Farm",
    location: "Kumasi, Ashanti Region",
    sizeHectares: 25,
    farmType: "mixed",
    farmerUserId: 1,
  },
  {
    farmName: "Volta Green Acres",
    location: "Ho, Volta Region",
    sizeHectares: 18,
    farmType: "crop",
    farmerUserId: 1,
  },
  {
    farmName: "Northern Savanna Farm",
    location: "Tamale, Northern Region",
    sizeHectares: 40,
    farmType: "livestock",
    farmerUserId: 3,
  },
  {
    farmName: "Coastal Harvest Farm",
    location: "Cape Coast, Central Region",
    sizeHectares: 15,
    farmType: "crop",
    farmerUserId: 1,
  },
  {
    farmName: "Eastern Hills Farm",
    location: "Koforidua, Eastern Region",
    sizeHectares: 22,
    farmType: "mixed",
    farmerUserId: 3,
  },
];

const westAfricanFarms = [
  {
    farmName: "Senegal Groundnut Farm",
    location: "Kaolack, Senegal",
    sizeHectares: 35,
    farmType: "crop",
    farmerUserId: 1,
  },
  {
    farmName: "Ivory Coast Cocoa Estate",
    location: "Daloa, Côte d'Ivoire",
    sizeHectares: 50,
    farmType: "crop",
    farmerUserId: 3,
  },
  {
    farmName: "Burkina Faso Millet Farm",
    location: "Bobo-Dioulasso, Burkina Faso",
    sizeHectares: 30,
    farmType: "crop",
    farmerUserId: 1,
  },
  {
    farmName: "Nigeria Cassava Farm",
    location: "Ibadan, Oyo, Nigeria",
    sizeHectares: 28,
    farmType: "crop",
    farmerUserId: 3,
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
    productName: "Organic Cocoa Beans",
    description: "High-quality cocoa beans from Ivory Coast",
    price: 45.0,
    category: "cash_crops",
    quantity: 250,
    sellerId: 3,
  },
  {
    productName: "Fresh Cassava Roots",
    description: "Fresh cassava from Ghana farms",
    price: 8.5,
    category: "root_crops",
    quantity: 500,
    sellerId: 1,
  },
  {
    productName: "Groundnut Paste",
    description: "Pure groundnut paste from Senegal",
    price: 12.0,
    category: "processed",
    quantity: 150,
    sellerId: 1,
  },
  {
    productName: "Organic Maize Flour",
    description: "Stone-ground maize flour",
    price: 6.5,
    category: "cereals",
    quantity: 300,
    sellerId: 3,
  },
  {
    productName: "Fresh Plantains",
    description: "Ripe plantains from Ghana",
    price: 4.0,
    category: "fruits",
    quantity: 400,
    sellerId: 1,
  },
  {
    productName: "Shea Butter",
    description: "Pure shea butter from Burkina Faso",
    price: 18.0,
    category: "processed",
    quantity: 100,
    sellerId: 3,
  },
  {
    productName: "Free-Range Chicken Eggs",
    description: "Fresh eggs from local chickens",
    price: 3.5,
    category: "poultry",
    quantity: 600,
    sellerId: 1,
  },
  {
    productName: "Dried Chili Peppers",
    description: "Dried chili peppers from Ghana",
    price: 9.0,
    category: "spices",
    quantity: 200,
    sellerId: 3,
  },
];

async function seedData() {
  try {
    console.log("Starting data population for Ghana and West Africa...\n");

    const allFarms = [...ghanianFarms, ...westAfricanFarms];

    // Insert farms
    console.log("📍 Creating farms...");
    for (const farm of allFarms) {
      try {
        await connection.execute(
          `INSERT INTO farms (farmName, location, sizeHectares, farmType, farmerUserId, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            farm.farmName,
            farm.location,
            farm.sizeHectares.toString(),
            farm.farmType,
            farm.farmerUserId,
          ]
        );
      } catch (e) {
        console.log(`  ⚠️  Farm "${farm.farmName}" may already exist`);
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
      if (farm.farmType === "livestock" || farm.farmType === "mixed") {
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
                farmIdx + 1,
                "active",
              ]
            );
            animalCount++;
          } catch (e) {
            // Skip duplicates
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
                farmIdx + 1,
                "active",
              ]
            );
            animalCount++;
          } catch (e) {
            // Skip duplicates
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
                farmIdx + 1,
                "active",
              ]
            );
            animalCount++;
          } catch (e) {
            // Skip duplicates
          }
        }
      }
    }
    console.log(`✅ Created ${animalCount} animals\n`);

    // Insert marketplace products
    console.log("🛒 Creating marketplace products...");
    for (const product of products) {
      try {
        await connection.execute(
          `INSERT INTO marketplaceProducts (productName, description, price, category, quantity, sellerId, status, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            product.productName,
            product.description,
            product.price.toString(),
            product.category,
            product.quantity.toString(),
            product.sellerId,
            "active",
          ]
        );
      } catch (e) {
        console.log(`  ⚠️  Product "${product.productName}" may already exist`);
      }
    }
    console.log(`✅ Created/Updated ${products.length} marketplace products\n`);

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

Farms Created:
${allFarms.map((f) => `  • ${f.farmName} (${f.location}, ${f.farmType})`).join("\n")}

Users with Data:
  • User ID 1: abekah.ekow@gmail.com
  • User ID 3: sharetekgh@gmail.com
    `);
  } catch (error) {
    console.error("❌ Error seeding data:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedData();
