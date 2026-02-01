import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { marketplaceProducts } from "./drizzle/schema.js";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log("🌾 Seeding Marketplace Products for Ghana Agriculture...\n");

// Ghana-specific agricultural products
const products = [
  // SEEDS CATEGORY
  {
    sellerId: 1,
    farmId: null,
    name: "Obatanpa Maize Seeds (Improved Variety)",
    description: "High-yielding drought-resistant maize variety developed by CSIR. Matures in 90-100 days with excellent grain quality. Suitable for all agro-ecological zones in Ghana.",
    category: "Seeds",
    productType: "Maize",
    price: "45.00",
    quantity: "500.00",
    unit: "kg",
    imageUrl: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500",
    status: "active",
    rating: "4.80",
    reviewCount: 24
  },
  {
    sellerId: 1,
    farmId: null,
    name: "Puna Tomato Seeds (Hybrid F1)",
    description: "Heat-tolerant hybrid tomato variety perfect for Ghana's climate. Resistant to bacterial wilt and nematodes. High yield potential of 40-50 tons/hectare.",
    category: "Seeds",
    productType: "Tomato",
    price: "120.00",
    quantity: "50.00",
    unit: "kg",
    imageUrl: "https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=500",
    status: "active",
    rating: "4.90",
    reviewCount: 18
  },
  {
    sellerId: 1,
    farmId: null,
    name: "Bankye Hemaa Cassava Stems",
    description: "Improved cassava variety with high starch content (30-35%). Resistant to cassava mosaic disease. Matures in 12 months with yield of 25-30 tons/hectare.",
    category: "Seeds",
    productType: "Cassava",
    price: "2.50",
    quantity: "10000.00",
    unit: "stems",
    imageUrl: "https://images.unsplash.com/photo-1585238341710-5c4b3d1c8c7e?w=500",
    status: "active",
    rating: "4.70",
    reviewCount: 32
  },
  {
    sellerId: 1,
    farmId: null,
    name: "Tetteh Quarshie Cocoa Pods",
    description: "Premium cocoa variety from Ghana Cocoa Board certified nursery. High disease resistance and excellent bean quality. Starts bearing in 3-4 years.",
    category: "Seeds",
    productType: "Cocoa",
    price: "15.00",
    quantity: "200.00",
    unit: "pods",
    imageUrl: "https://images.unsplash.com/photo-1511381939415-e44015466834?w=500",
    status: "active",
    rating: "4.95",
    reviewCount: 41
  },
  {
    sellerId: 1,
    farmId: null,
    name: "Agric Onion Seeds (Red Creole)",
    description: "Adapted variety for Ghana's tropical conditions. Good storage quality and pungency. Matures in 120-140 days with bulb weight of 80-120g.",
    category: "Seeds",
    productType: "Onion",
    price: "350.00",
    quantity: "25.00",
    unit: "kg",
    imageUrl: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500",
    status: "active",
    rating: "4.60",
    reviewCount: 15
  },

  // FERTILIZERS CATEGORY
  {
    sellerId: 1,
    farmId: null,
    name: "NPK 15-15-15 Compound Fertilizer",
    description: "Balanced fertilizer ideal for maize, rice, and vegetable production. Manufactured by Wienco Ghana. Contains nitrogen, phosphorus, and potassium in equal proportions.",
    category: "Fertilizers",
    productType: "NPK",
    price: "180.00",
    quantity: "1000.00",
    unit: "50kg bag",
    imageUrl: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=500",
    status: "active",
    rating: "4.75",
    reviewCount: 67
  },
  {
    sellerId: 1,
    farmId: null,
    name: "Urea Fertilizer (46% Nitrogen)",
    description: "High nitrogen content fertilizer for top dressing cereals and leafy vegetables. Suitable for all soil types. Apply 2-3 weeks after planting.",
    category: "Fertilizers",
    productType: "Urea",
    price: "165.00",
    quantity: "800.00",
    unit: "50kg bag",
    imageUrl: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=500",
    status: "active",
    rating: "4.70",
    reviewCount: 52
  },
  {
    sellerId: 1,
    farmId: null,
    name: "Cocoa Fertilizer (0-22-18+9CaO+7S)",
    description: "Specially formulated for cocoa farms by Ghana Cocoa Board. Contains phosphorus, potassium, calcium, and sulfur. Apply twice yearly for optimal yield.",
    category: "Fertilizers",
    productType: "Cocoa Fertilizer",
    price: "195.00",
    quantity: "600.00",
    unit: "50kg bag",
    imageUrl: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=500",
    status: "active",
    rating: "4.85",
    reviewCount: 38
  },
  {
    sellerId: 1,
    farmId: null,
    name: "Organic Compost (Zoomlion)",
    description: "100% organic compost from municipal waste. Rich in organic matter and micronutrients. Improves soil structure and water retention. pH balanced.",
    category: "Fertilizers",
    productType: "Compost",
    price: "80.00",
    quantity: "500.00",
    unit: "50kg bag",
    imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500",
    status: "active",
    rating: "4.65",
    reviewCount: 29
  },
  {
    sellerId: 1,
    farmId: null,
    name: "Liquid Foliar Fertilizer (Aminogro)",
    description: "Concentrated liquid fertilizer with amino acids and micronutrients. Promotes rapid growth and stress recovery. Mix 2-3 liters per 200L water for foliar spray.",
    category: "Fertilizers",
    productType: "Foliar",
    price: "95.00",
    quantity: "150.00",
    unit: "5L container",
    imageUrl: "https://images.unsplash.com/photo-1615671524827-c1fe3973b648?w=500",
    status: "active",
    rating: "4.80",
    reviewCount: 22
  },

  // PESTICIDES & HERBICIDES CATEGORY
  {
    sellerId: 1,
    farmId: null,
    name: "Akate Master Insecticide",
    description: "Broad-spectrum insecticide for controlling aphids, whiteflies, and caterpillars. Active ingredient: Emamectin Benzoate. Safe for beneficial insects when used correctly.",
    category: "Pesticides",
    productType: "Insecticide",
    price: "45.00",
    quantity: "200.00",
    unit: "500ml bottle",
    imageUrl: "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=500",
    status: "active",
    rating: "4.70",
    reviewCount: 31
  },
  {
    sellerId: 1,
    farmId: null,
    name: "Confidor Systemic Insecticide",
    description: "Systemic insecticide for sucking pests on vegetables and cocoa. Active ingredient: Imidacloprid 200SL. Long-lasting protection up to 3 weeks.",
    category: "Pesticides",
    productType: "Insecticide",
    price: "65.00",
    quantity: "180.00",
    unit: "1L bottle",
    imageUrl: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=500",
    status: "active",
    rating: "4.85",
    reviewCount: 44
  },
  {
    sellerId: 1,
    farmId: null,
    name: "Kocide Fungicide (Copper-based)",
    description: "Preventive fungicide for bacterial and fungal diseases on cocoa, tomato, and vegetables. Contains copper hydroxide. Apply before disease onset.",
    category: "Pesticides",
    productType: "Fungicide",
    price: "55.00",
    quantity: "150.00",
    unit: "1kg pack",
    imageUrl: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=500",
    status: "active",
    rating: "4.75",
    reviewCount: 27
  },
  {
    sellerId: 1,
    farmId: null,
    name: "Glyphosate Herbicide (Roundup)",
    description: "Non-selective post-emergence herbicide for weed control. Effective against annual and perennial weeds. Apply before planting or as spot treatment.",
    category: "Pesticides",
    productType: "Herbicide",
    price: "85.00",
    quantity: "250.00",
    unit: "5L container",
    imageUrl: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=500",
    status: "active",
    rating: "4.60",
    reviewCount: 36
  },
  {
    sellerId: 1,
    farmId: null,
    name: "Atrazine Herbicide (Pre-emergence)",
    description: "Selective pre-emergence herbicide for maize and sugarcane. Controls broadleaf and grass weeds. Apply within 3 days after planting.",
    category: "Pesticides",
    productType: "Herbicide",
    price: "70.00",
    quantity: "200.00",
    unit: "5L container",
    imageUrl: "https://images.unsplash.com/photo-1625246297576-8a6e80d7e0a9?w=500",
    status: "active",
    rating: "4.65",
    reviewCount: 19
  },

  // EQUIPMENT CATEGORY
  {
    sellerId: 1,
    farmId: null,
    name: "Massey Ferguson 375 Tractor (75HP)",
    description: "Reliable 4WD tractor suitable for Ghana's terrain. 75 horsepower diesel engine. Includes front loader attachment. Low fuel consumption and easy maintenance.",
    category: "Equipment",
    productType: "Tractor",
    price: "125000.00",
    quantity: "3.00",
    unit: "unit",
    imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500",
    status: "active",
    rating: "4.90",
    reviewCount: 8
  },
  {
    sellerId: 1,
    farmId: null,
    name: "Motorized Knapsack Sprayer (20L)",
    description: "Petrol-powered knapsack sprayer for pesticide and herbicide application. 20-liter capacity with adjustable nozzle. Covers up to 2 hectares per tank.",
    category: "Equipment",
    productType: "Sprayer",
    price: "1200.00",
    quantity: "45.00",
    unit: "unit",
    imageUrl: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=500",
    status: "active",
    rating: "4.75",
    reviewCount: 23
  },
  {
    sellerId: 1,
    farmId: null,
    name: "Drip Irrigation Kit (1 Hectare)",
    description: "Complete drip irrigation system for 1 hectare. Includes main line, laterals, drippers, filters, and fittings. Saves 60% water compared to flood irrigation.",
    category: "Equipment",
    productType: "Irrigation",
    price: "8500.00",
    quantity: "12.00",
    unit: "kit",
    imageUrl: "https://images.unsplash.com/photo-1625246297576-8a6e80d7e0a9?w=500",
    status: "active",
    rating: "4.85",
    reviewCount: 16
  },
  {
    sellerId: 1,
    farmId: null,
    name: "Disc Plough (3-Disc, Tractor-mounted)",
    description: "Heavy-duty 3-disc plough for primary tillage. Compatible with 50-75HP tractors. Adjustable depth control up to 30cm. Made in India.",
    category: "Equipment",
    productType: "Plough",
    price: "4200.00",
    quantity: "8.00",
    unit: "unit",
    imageUrl: "https://images.unsplash.com/photo-1625246297576-8a6e80d7e0a9?w=500",
    status: "active",
    rating: "4.70",
    reviewCount: 11
  },
  {
    sellerId: 1,
    farmId: null,
    name: "Maize Sheller (Motorized)",
    description: "Electric maize shelling machine. Capacity: 500kg/hour. Low grain damage rate. Suitable for small to medium-scale farmers. 220V single phase.",
    category: "Equipment",
    productType: "Processing",
    price: "2800.00",
    quantity: "15.00",
    unit: "unit",
    imageUrl: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500",
    status: "active",
    rating: "4.80",
    reviewCount: 14
  },

  // TOOLS CATEGORY
  {
    sellerId: 1,
    farmId: null,
    name: "Cutlass (Machete) - Heavy Duty",
    description: "Traditional Ghanaian farming cutlass with hardened steel blade. 18-inch blade length. Wooden handle with comfortable grip. Essential for land clearing and weeding.",
    category: "Tools",
    productType: "Hand Tool",
    price: "25.00",
    quantity: "500.00",
    unit: "piece",
    imageUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500",
    status: "active",
    rating: "4.60",
    reviewCount: 89
  },
  {
    sellerId: 1,
    farmId: null,
    name: "Hoe (Asante Hoe)",
    description: "Traditional Asante-style hoe for ridging and weeding. Forged steel blade with wooden handle. Ideal for cassava and yam cultivation.",
    category: "Tools",
    productType: "Hand Tool",
    price: "35.00",
    quantity: "400.00",
    unit: "piece",
    imageUrl: "https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=500",
    status: "active",
    rating: "4.70",
    reviewCount: 76
  },
  {
    sellerId: 1,
    farmId: null,
    name: "Manual Knapsack Sprayer (16L)",
    description: "Hand-pump knapsack sprayer with brass nozzle. 16-liter capacity. Adjustable spray pattern. Durable HDPE tank. Perfect for small-scale farmers.",
    category: "Tools",
    productType: "Sprayer",
    price: "85.00",
    quantity: "200.00",
    unit: "piece",
    imageUrl: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=500",
    status: "active",
    rating: "4.65",
    reviewCount: 54
  },
  {
    sellerId: 1,
    farmId: null,
    name: "Wheelbarrow (Heavy Duty)",
    description: "Galvanized steel wheelbarrow with pneumatic tire. 100kg load capacity. Rust-resistant finish. Essential for transporting harvests and materials.",
    category: "Tools",
    productType: "Transport",
    price: "180.00",
    quantity: "75.00",
    unit: "piece",
    imageUrl: "https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=500",
    status: "active",
    rating: "4.75",
    reviewCount: 42
  },
  {
    sellerId: 1,
    farmId: null,
    name: "Pruning Shears (Professional)",
    description: "High-carbon steel pruning shears for cocoa and fruit trees. Bypass cutting action for clean cuts. Ergonomic handles with safety lock.",
    category: "Tools",
    productType: "Hand Tool",
    price: "45.00",
    quantity: "150.00",
    unit: "piece",
    imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500",
    status: "active",
    rating: "4.80",
    reviewCount: 33
  },
  {
    sellerId: 1,
    farmId: null,
    name: "Wellington Boots (Rubber)",
    description: "Heavy-duty rubber boots for farm work. Waterproof and chemical-resistant. Non-slip sole. Available in sizes 39-45. Essential PPE for pesticide application.",
    category: "Tools",
    productType: "Safety Equipment",
    price: "55.00",
    quantity: "300.00",
    unit: "pair",
    imageUrl: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=500",
    status: "active",
    rating: "4.55",
    reviewCount: 67
  },
  {
    sellerId: 1,
    farmId: null,
    name: "Harvesting Basket (Bamboo)",
    description: "Traditional woven bamboo basket for harvesting vegetables and fruits. 25kg capacity. Lightweight and durable. Locally made by Ghanaian artisans.",
    category: "Tools",
    productType: "Harvest Tool",
    price: "20.00",
    quantity: "250.00",
    unit: "piece",
    imageUrl: "https://images.unsplash.com/photo-1519735777090-ec97a0cae44a?w=500",
    status: "active",
    rating: "4.50",
    reviewCount: 48
  },
  {
    sellerId: 1,
    farmId: null,
    name: "Soil pH Meter (Digital)",
    description: "Digital soil pH and moisture meter. 3-in-1 functionality (pH, moisture, light). No batteries required. Essential for soil testing and fertilizer planning.",
    category: "Tools",
    productType: "Testing Equipment",
    price: "120.00",
    quantity: "80.00",
    unit: "piece",
    imageUrl: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=500",
    status: "active",
    rating: "4.70",
    reviewCount: 26
  }
];

console.log(`📦 Inserting ${products.length} agricultural products...\n`);

try {
  for (const product of products) {
    await db.insert(marketplaceProducts).values(product);
    console.log(`✅ Added: ${product.name} (${product.category})`);
  }

  console.log(`\n✨ Successfully seeded ${products.length} marketplace products!`);
  console.log("\n📊 Summary by Category:");
  console.log(`   - Seeds: 5 products`);
  console.log(`   - Fertilizers: 5 products`);
  console.log(`   - Pesticides: 5 products`);
  console.log(`   - Equipment: 5 products`);
  console.log(`   - Tools: 10 products`);
  console.log(`\n🌍 All products are Ghana-specific and market-ready!`);

} catch (error) {
  console.error("❌ Error seeding products:", error);
  throw error;
} finally {
  await connection.end();
}
