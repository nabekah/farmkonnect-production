import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq } from "drizzle-orm";
import * as schema from "./drizzle/schema.ts";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: "default" });

console.log("🌱 Seeding marketplace features...\n");

try {
  // Seed Delivery Zones
  console.log("📍 Creating delivery zones...");
  const deliveryZones = [
    { name: "Greater Accra", region: "Accra Metropolitan", shippingCost: "25.00", estimatedDays: 1, isActive: true },
    { name: "Kumasi Metro", region: "Ashanti Region", shippingCost: "35.00", estimatedDays: 2, isActive: true },
    { name: "Takoradi", region: "Western Region", shippingCost: "40.00", estimatedDays: 2, isActive: true },
    { name: "Cape Coast", region: "Central Region", shippingCost: "35.00", estimatedDays: 2, isActive: true },
    { name: "Tamale", region: "Northern Region", shippingCost: "60.00", estimatedDays: 4, isActive: true },
    { name: "Ho", region: "Volta Region", shippingCost: "45.00", estimatedDays: 3, isActive: true },
    { name: "Sunyani", region: "Bono Region", shippingCost: "50.00", estimatedDays: 3, isActive: true },
    { name: "Bolgatanga", region: "Upper East Region", shippingCost: "70.00", estimatedDays: 5, isActive: true },
  ];

  for (const zone of deliveryZones) {
    await db.insert(schema.marketplaceDeliveryZones).values(zone);
  }
  console.log(`✓ Created ${deliveryZones.length} delivery zones\n`);

  // Get some products for reviews and bulk pricing
  const products = await db.select().from(schema.marketplaceProducts).limit(10);
  
  if (products.length > 0) {
    // Seed Product Reviews
    console.log("⭐ Creating product reviews...");
    const reviews = [
      { productId: products[0].id, userId: 1, rating: 5, comment: "Excellent quality seeds! High germination rate and healthy plants.", verifiedPurchase: true, helpfulCount: 12 },
      { productId: products[0].id, userId: 1, rating: 4, comment: "Good product, delivered on time. Slightly expensive but worth it.", verifiedPurchase: true, helpfulCount: 5 },
      { productId: products[1].id, userId: 1, rating: 5, comment: "Best fertilizer I've used! My tomatoes are thriving.", verifiedPurchase: true, helpfulCount: 18 },
      { productId: products[1].id, userId: 1, rating: 5, comment: "Highly effective. Noticed improvement in soil quality within weeks.", verifiedPurchase: false, helpfulCount: 7 },
      { productId: products[2].id, userId: 1, rating: 4, comment: "Works well for pest control. A bit pricey but effective.", verifiedPurchase: true, helpfulCount: 9 },
      { productId: products[3].id, userId: 1, rating: 5, comment: "Reliable tractor, great for small to medium farms. Good fuel efficiency.", verifiedPurchase: true, helpfulCount: 23 },
      { productId: products[4].id, userId: 1, rating: 4, comment: "Sturdy sprayer, covers large areas quickly. Easy to maintain.", verifiedPurchase: true, helpfulCount: 11 },
      { productId: products[5].id, userId: 1, rating: 5, comment: "Traditional Asante hoe, very durable. Perfect for weeding.", verifiedPurchase: true, helpfulCount: 15 },
    ];

    for (const review of reviews) {
      await db.insert(schema.marketplaceProductReviews).values(review);
    }

    // Update product ratings
    for (const product of products.slice(0, 6)) {
      const productReviews = reviews.filter(r => r.productId === product.id);
      if (productReviews.length > 0) {
        const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
        await db.update(schema.marketplaceProducts)
          .set({ rating: avgRating.toFixed(2), reviewCount: productReviews.length })
          .where(eq(schema.marketplaceProducts.id, product.id));
      }
    }
    console.log(`✓ Created ${reviews.length} product reviews\n`);

    // Seed Bulk Pricing Tiers
    console.log("💰 Creating bulk pricing tiers...");
    const bulkPricingTiers = [
      // Obatanpa Maize Seeds
      { productId: products[0].id, minQuantity: "10", maxQuantity: "49", discountPercentage: "5.00", discountedPrice: (parseFloat(products[0].price) * 0.95).toFixed(2) },
      { productId: products[0].id, minQuantity: "50", maxQuantity: null, discountPercentage: "10.00", discountedPrice: (parseFloat(products[0].price) * 0.90).toFixed(2) },
      
      // NPK Fertilizer
      { productId: products[1].id, minQuantity: "5", maxQuantity: "19", discountPercentage: "7.00", discountedPrice: (parseFloat(products[1].price) * 0.93).toFixed(2) },
      { productId: products[1].id, minQuantity: "20", maxQuantity: null, discountPercentage: "15.00", discountedPrice: (parseFloat(products[1].price) * 0.85).toFixed(2) },
      
      // Akate Master Pesticide
      { productId: products[2].id, minQuantity: "10", maxQuantity: "29", discountPercentage: "8.00", discountedPrice: (parseFloat(products[2].price) * 0.92).toFixed(2) },
      { productId: products[2].id, minQuantity: "30", maxQuantity: null, discountPercentage: "12.00", discountedPrice: (parseFloat(products[2].price) * 0.88).toFixed(2) },
      
      // Knapsack Sprayer
      { productId: products[4].id, minQuantity: "5", maxQuantity: null, discountPercentage: "10.00", discountedPrice: (parseFloat(products[4].price) * 0.90).toFixed(2) },
    ];

    for (const tier of bulkPricingTiers) {
      await db.insert(schema.marketplaceBulkPricingTiers).values(tier);
    }
    console.log(`✓ Created ${bulkPricingTiers.length} bulk pricing tiers\n`);
  }

  console.log("✅ Marketplace features seeded successfully!");
  console.log("\nSummary:");
  console.log(`- ${deliveryZones.length} delivery zones`);
  console.log(`- 8 product reviews`);
  console.log(`- 7 bulk pricing tiers`);

} catch (error) {
  console.error("❌ Error seeding marketplace features:", error);
} finally {
  await connection.end();
}
