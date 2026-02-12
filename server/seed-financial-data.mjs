#!/usr/bin/env node

/**
 * Financial Data Seed Script
 * Creates sample expenses, revenue, and budget data for testing
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL || "mysql://root:password@localhost:3306/farmkonnect";

async function seedFinancialData() {
  console.log("🌱 Seeding financial data...\n");

  try {
    // Create database connection
    const connection = await mysql.createConnection(DATABASE_URL);
    const db = drizzle(connection);

    const FARM_ID = 1;

    // Sample Expenses
    const expenseData = [
      {
        farmId: FARM_ID,
        expenseType: "feed",
        description: "Poultry feed - 50kg bags",
        amount: 5000,
        quantity: 50,
        unitCost: 100,
        currency: "GHS",
        vendor: "Local Feed Supplier",
        paymentStatus: "paid",
        expenseDate: new Date("2026-02-01"),
      },
      {
        farmId: FARM_ID,
        expenseType: "medication",
        description: "Vaccines and antibiotics",
        amount: 2500,
        quantity: null,
        unitCost: null,
        currency: "GHS",
        vendor: "Veterinary Clinic",
        paymentStatus: "paid",
        expenseDate: new Date("2026-02-02"),
      },
      {
        farmId: FARM_ID,
        expenseType: "labor",
        description: "Monthly labor - 4 workers",
        amount: 8000,
        quantity: null,
        unitCost: null,
        currency: "GHS",
        vendor: null,
        paymentStatus: "paid",
        expenseDate: new Date("2026-02-05"),
      },
      {
        farmId: FARM_ID,
        expenseType: "equipment",
        description: "Water pump maintenance",
        amount: 15000,
        quantity: null,
        unitCost: null,
        currency: "GHS",
        vendor: "Equipment Services",
        paymentStatus: "paid",
        expenseDate: new Date("2026-02-10"),
      },
      {
        farmId: FARM_ID,
        expenseType: "utilities",
        description: "Electricity and water",
        amount: 3000,
        quantity: null,
        unitCost: null,
        currency: "GHS",
        vendor: null,
        paymentStatus: "paid",
        expenseDate: new Date("2026-02-12"),
      },
    ];

    console.log("📊 Creating expenses...");
    for (const exp of expenseData) {
      await connection.execute(
        `INSERT INTO expenses (farmId, expenseType, description, amount, quantity, unitCost, currency, vendor, paymentStatus, expenseDate) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [exp.farmId, exp.expenseType, exp.description, exp.amount, exp.quantity, exp.unitCost, exp.currency, exp.vendor, exp.paymentStatus, exp.expenseDate]
      );
      console.log(`  ✓ Added ${exp.expenseType}: GHS ${exp.amount}`);
    }

    // Sample Revenue
    const revenueData = [
      {
        farmId: FARM_ID,
        revenueType: "animal_sale",
        description: "Sold 50 broiler chickens",
        amount: 12000,
        quantity: 50,
        unitPrice: 240,
        currency: "GHS",
        buyer: "Local Market",
        paymentStatus: "paid",
        revenueDate: new Date("2026-02-03"),
      },
      {
        farmId: FARM_ID,
        revenueType: "milk_production",
        description: "Milk sales - 2 weeks",
        amount: 8500,
        quantity: 85,
        unitPrice: 100,
        currency: "GHS",
        buyer: "Dairy Cooperative",
        paymentStatus: "paid",
        revenueDate: new Date("2026-02-08"),
      },
      {
        farmId: FARM_ID,
        revenueType: "crop_sale",
        description: "Maize harvest - 2 bags",
        amount: 6000,
        quantity: 2,
        unitPrice: 3000,
        currency: "GHS",
        buyer: "Grain Buyer",
        paymentStatus: "paid",
        revenueDate: new Date("2026-02-11"),
      },
      {
        farmId: FARM_ID,
        revenueType: "egg_production",
        description: "Egg sales - 450 eggs",
        amount: 4500,
        quantity: 450,
        unitPrice: 10,
        currency: "GHS",
        buyer: "Local Retailer",
        paymentStatus: "paid",
        revenueDate: new Date("2026-02-12"),
      },
    ];

    console.log("\n💰 Creating revenue...");
    for (const rev of revenueData) {
      await connection.execute(
        `INSERT INTO revenue (farmId, revenueType, description, amount, quantity, unitPrice, currency, buyer, paymentStatus, revenueDate) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [rev.farmId, rev.revenueType, rev.description, rev.amount, rev.quantity, rev.unitPrice, rev.currency, rev.buyer, rev.paymentStatus, rev.revenueDate]
      );
      console.log(`  ✓ Added ${rev.revenueType}: GHS ${rev.amount}`);
    }

    // Sample Budgets
    console.log("\n📋 Creating budgets...");
    const [budgetResult] = await connection.execute(
      `INSERT INTO budgets (farmId, name, category, allocatedAmount, startDate, endDate) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [FARM_ID, "February 2026 Budget", "Overall", 50000, new Date("2026-02-01"), new Date("2026-02-28")]
    );

    const budgetId = budgetResult.insertId;
    console.log(`  ✓ Created budget: February 2026 Budget`);

    // Create budget categories for tracking
    console.log("\n📝 Creating budget categories...");
    const categories = [
      { name: "Feed Budget", category: "feed", amount: 15000 },
      { name: "Medication Budget", category: "medication", amount: 5000 },
      { name: "Labor Budget", category: "labor", amount: 16000 },
      { name: "Equipment Budget", category: "equipment", amount: 8000 },
      { name: "Utilities Budget", category: "utilities", amount: 6000 },
    ];

    for (const cat of categories) {
      await connection.execute(
        `INSERT INTO budgets (farmId, name, category, allocatedAmount, startDate, endDate) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [FARM_ID, cat.name, cat.category, cat.amount, new Date("2026-02-01"), new Date("2026-02-28")]
      );
      console.log(`  ✓ Added ${cat.category}: GHS ${cat.amount}`);
    }

    console.log("\n✅ Financial data seeding complete!");
    console.log("\n📊 Summary:");
    console.log(`  • Expenses: ${expenseData.length} records (Total: GHS ${expenseData.reduce((sum, e) => sum + e.amount, 0)})`);
    console.log(`  • Revenue: ${revenueData.length} records (Total: GHS ${revenueData.reduce((sum, r) => sum + r.amount, 0)})`);
    console.log(`  • Budgets: 6 budget records (1 overall + 5 categories)`);

    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error("❌ Error seeding financial data:", error);
    process.exit(1);
  }
}

seedFinancialData();
