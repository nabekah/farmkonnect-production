import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, date } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["farmer", "agent", "veterinarian", "buyer", "transporter", "admin", "user"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================================
// SPECIALIST PROFILES (for Agents and Veterinarians)
// ============================================================================
export const specialistProfiles = mysqlTable("specialistProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  licenseNumber: varchar("licenseNumber", { length: 100 }),
  accreditationStatus: mysqlEnum("accreditationStatus", ["pending", "verified", "expired", "revoked"]).default("pending"),
  specialization: varchar("specialization", { length: 255 }),
  licenseExpiryDate: date("licenseExpiryDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SpecialistProfile = typeof specialistProfiles.$inferSelect;
export type InsertSpecialistProfile = typeof specialistProfiles.$inferInsert;

// ============================================================================
// FARMS
// ============================================================================
export const farms = mysqlTable("farms", {
  id: int("id").autoincrement().primaryKey(),
  farmerUserId: int("farmerUserId").notNull(),
  farmName: varchar("farmName", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  gpsLatitude: decimal("gpsLatitude", { precision: 10, scale: 8 }),
  gpsLongitude: decimal("gpsLongitude", { precision: 11, scale: 8 }),
  sizeHectares: decimal("sizeHectares", { precision: 10, scale: 2 }),
  farmType: mysqlEnum("farmType", ["crop", "livestock", "mixed"]).default("mixed"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Farm = typeof farms.$inferSelect;
export type InsertFarm = typeof farms.$inferInsert;

// ============================================================================
// CROP MANAGEMENT
// ============================================================================
export const crops = mysqlTable("crops", {
  id: int("id").autoincrement().primaryKey(),
  cropName: varchar("cropName", { length: 255 }).notNull(),
  scientificName: varchar("scientificName", { length: 255 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Crop = typeof crops.$inferSelect;
export type InsertCrop = typeof crops.$inferInsert;

export const cropCycles = mysqlTable("cropCycles", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  cropId: int("cropId").notNull(),
  varietyName: varchar("varietyName", { length: 255 }),
  plantingDate: date("plantingDate").notNull(),
  expectedHarvestDate: date("expectedHarvestDate"),
  actualHarvestDate: date("actualHarvestDate"),
  status: mysqlEnum("status", ["planning", "planted", "growing", "harvesting", "completed", "abandoned"]).default("planning"),
  areaPlantedHectares: decimal("areaPlantedHectares", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CropCycle = typeof cropCycles.$inferSelect;
export type InsertCropCycle = typeof cropCycles.$inferInsert;

export const soilTests = mysqlTable("soilTests", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  testDate: date("testDate").notNull(),
  phLevel: decimal("phLevel", { precision: 4, scale: 2 }),
  nitrogenLevel: decimal("nitrogenLevel", { precision: 8, scale: 2 }),
  phosphorusLevel: decimal("phosphorusLevel", { precision: 8, scale: 2 }),
  potassiumLevel: decimal("potassiumLevel", { precision: 8, scale: 2 }),
  organicMatter: decimal("organicMatter", { precision: 8, scale: 2 }),
  recommendations: text("recommendations"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SoilTest = typeof soilTests.$inferSelect;
export type InsertSoilTest = typeof soilTests.$inferInsert;

export const fertilizerApplications = mysqlTable("fertilizerApplications", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").notNull(),
  applicationDate: date("applicationDate").notNull(),
  fertilizerType: varchar("fertilizerType", { length: 255 }).notNull(),
  quantityKg: decimal("quantityKg", { precision: 10, scale: 2 }).notNull(),
  appliedByUserId: int("appliedByUserId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FertilizerApplication = typeof fertilizerApplications.$inferSelect;
export type InsertFertilizerApplication = typeof fertilizerApplications.$inferInsert;

export const yieldRecords = mysqlTable("yieldRecords", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").notNull(),
  yieldQuantityKg: decimal("yieldQuantityKg", { precision: 12, scale: 2 }).notNull(),
  qualityGrade: varchar("qualityGrade", { length: 50 }),
  postHarvestLossKg: decimal("postHarvestLossKg", { precision: 10, scale: 2 }),
  recordedDate: date("recordedDate").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type YieldRecord = typeof yieldRecords.$inferSelect;
export type InsertYieldRecord = typeof yieldRecords.$inferInsert;

// ============================================================================
// ANIMAL MANAGEMENT
// ============================================================================
export const animalTypes = mysqlTable("animalTypes", {
  id: int("id").autoincrement().primaryKey(),
  typeName: varchar("typeName", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnimalType = typeof animalTypes.$inferSelect;
export type InsertAnimalType = typeof animalTypes.$inferInsert;

export const animals = mysqlTable("animals", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  typeId: int("typeId").notNull(),
  uniqueTagId: varchar("uniqueTagId", { length: 100 }).unique(),
  birthDate: date("birthDate"),
  gender: mysqlEnum("gender", ["male", "female", "unknown"]),
  breed: varchar("breed", { length: 255 }),
  status: mysqlEnum("status", ["active", "sold", "culled", "deceased"]).default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Animal = typeof animals.$inferSelect;
export type InsertAnimal = typeof animals.$inferInsert;

export const animalHealthRecords = mysqlTable("animalHealthRecords", {
  id: int("id").autoincrement().primaryKey(),
  animalId: int("animalId").notNull(),
  recordDate: date("recordDate").notNull(),
  eventType: mysqlEnum("eventType", ["vaccination", "treatment", "illness", "checkup", "other"]).notNull(),
  details: text("details"),
  veterinarianUserId: int("veterinarianUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnimalHealthRecord = typeof animalHealthRecords.$inferSelect;
export type InsertAnimalHealthRecord = typeof animalHealthRecords.$inferInsert;

export const breedingRecords = mysqlTable("breedingRecords", {
  id: int("id").autoincrement().primaryKey(),
  animalId: int("animalId").notNull(),
  breedingDate: date("breedingDate").notNull(),
  sireId: int("sireId"),
  damId: int("damId"),
  expectedDueDate: date("expectedDueDate"),
  outcome: mysqlEnum("outcome", ["pending", "successful", "unsuccessful", "aborted"]).default("pending"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BreedingRecord = typeof breedingRecords.$inferSelect;
export type InsertBreedingRecord = typeof breedingRecords.$inferInsert;

export const feedingRecords = mysqlTable("feedingRecords", {
  id: int("id").autoincrement().primaryKey(),
  animalId: int("animalId").notNull(),
  feedDate: date("feedDate").notNull(),
  feedType: varchar("feedType", { length: 255 }).notNull(),
  quantityKg: decimal("quantityKg", { precision: 8, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FeedingRecord = typeof feedingRecords.$inferSelect;
export type InsertFeedingRecord = typeof feedingRecords.$inferInsert;

export const performanceMetrics = mysqlTable("performanceMetrics", {
  id: int("id").autoincrement().primaryKey(),
  animalId: int("animalId").notNull(),
  metricDate: date("metricDate").notNull(),
  weightKg: decimal("weightKg", { precision: 8, scale: 2 }),
  milkYieldLiters: decimal("milkYieldLiters", { precision: 8, scale: 2 }),
  eggCount: int("eggCount"),
  otherMetrics: json("otherMetrics"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetric = typeof performanceMetrics.$inferInsert;

// ============================================================================
// TRAINING AND EXTENSION
// ============================================================================
export const trainingPrograms = mysqlTable("trainingPrograms", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  targetAudience: varchar("targetAudience", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TrainingProgram = typeof trainingPrograms.$inferSelect;
export type InsertTrainingProgram = typeof trainingPrograms.$inferInsert;

export const trainingSessions = mysqlTable("trainingSessions", {
  id: int("id").autoincrement().primaryKey(),
  programId: int("programId").notNull(),
  sessionDate: date("sessionDate").notNull(),
  location: varchar("location", { length: 255 }),
  trainerUserId: int("trainerUserId"),
  maxParticipants: int("maxParticipants"),
  status: mysqlEnum("status", ["scheduled", "ongoing", "completed", "cancelled"]).default("scheduled"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TrainingSession = typeof trainingSessions.$inferSelect;
export type InsertTrainingSession = typeof trainingSessions.$inferInsert;

export const enrollments = mysqlTable("enrollments", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId").notNull(),
  attendanceStatus: mysqlEnum("attendanceStatus", ["enrolled", "attended", "absent", "dropped"]).default("enrolled"),
  feedbackScore: int("feedbackScore"),
  feedbackNotes: text("feedbackNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = typeof enrollments.$inferInsert;

// ============================================================================
// LOGISTICS AND MARKET ACCESS
// ============================================================================
export const productListings = mysqlTable("productListings", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  productType: mysqlEnum("productType", ["crop", "livestock", "processed"]).notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  quantityAvailable: decimal("quantityAvailable", { precision: 12, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  listingDate: date("listingDate").notNull(),
  status: mysqlEnum("status", ["active", "sold_out", "delisted"]).default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductListing = typeof productListings.$inferSelect;
export type InsertProductListing = typeof productListings.$inferInsert;

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  buyerUserId: int("buyerUserId").notNull(),
  orderDate: date("orderDate").notNull(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "fulfilled", "cancelled"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  listingId: int("listingId").notNull(),
  quantityOrdered: decimal("quantityOrdered", { precision: 12, scale: 2 }).notNull(),
  priceAtOrder: decimal("priceAtOrder", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

export const transportRequests = mysqlTable("transportRequests", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  transporterUserId: int("transporterUserId"),
  pickupLocation: varchar("pickupLocation", { length: 255 }).notNull(),
  deliveryLocation: varchar("deliveryLocation", { length: 255 }).notNull(),
  requestDate: date("requestDate").notNull(),
  estimatedDeliveryDate: date("estimatedDeliveryDate"),
  actualDeliveryDate: date("actualDeliveryDate"),
  status: mysqlEnum("status", ["requested", "accepted", "in_transit", "delivered", "cancelled"]).default("requested"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TransportRequest = typeof transportRequests.$inferSelect;
export type InsertTransportRequest = typeof transportRequests.$inferInsert;

// ============================================================================
// MERL (MONITORING, EVALUATION, REPORTING, LEARNING)
// ============================================================================
export const kpis = mysqlTable("kpis", {
  id: int("id").autoincrement().primaryKey(),
  kpiName: varchar("kpiName", { length: 255 }).notNull(),
  description: text("description"),
  targetValue: decimal("targetValue", { precision: 12, scale: 2 }),
  unitOfMeasure: varchar("unitOfMeasure", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type KPI = typeof kpis.$inferSelect;
export type InsertKPI = typeof kpis.$inferInsert;

export const kpiValues = mysqlTable("kpiValues", {
  id: int("id").autoincrement().primaryKey(),
  kpiId: int("kpiId").notNull(),
  farmId: int("farmId"),
  measurementDate: date("measurementDate").notNull(),
  actualValue: decimal("actualValue", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type KPIValue = typeof kpiValues.$inferSelect;
export type InsertKPIValue = typeof kpiValues.$inferInsert;

export const monitoringVisits = mysqlTable("monitoringVisits", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  visitorUserId: int("visitorUserId").notNull(),
  visitDate: date("visitDate").notNull(),
  observations: text("observations"),
  photoEvidenceUrl: varchar("photoEvidenceUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MonitoringVisit = typeof monitoringVisits.$inferSelect;
export type InsertMonitoringVisit = typeof monitoringVisits.$inferInsert;

export const challenges = mysqlTable("challenges", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  reportedByUserId: int("reportedByUserId").notNull(),
  challengeDescription: text("challengeDescription").notNull(),
  category: varchar("category", { length: 100 }),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium"),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).default("open"),
  reportedDate: date("reportedDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = typeof challenges.$inferInsert;

// ============================================================================
// IOT AND SMART FARMING
// ============================================================================
export const iotDevices = mysqlTable("iotDevices", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  deviceSerial: varchar("deviceSerial", { length: 100 }).unique().notNull(),
  deviceType: mysqlEnum("deviceType", ["soil_sensor", "weather_station", "animal_monitor", "water_meter", "other"]).notNull(),
  installationDate: date("installationDate"),
  status: mysqlEnum("status", ["active", "inactive", "maintenance", "retired"]).default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IotDevice = typeof iotDevices.$inferSelect;
export type InsertIotDevice = typeof iotDevices.$inferInsert;

export const sensorReadings = mysqlTable("sensorReadings", {
  id: int("id").autoincrement().primaryKey(),
  deviceId: int("deviceId").notNull(),
  readingTimestamp: timestamp("readingTimestamp").notNull(),
  readingType: varchar("readingType", { length: 100 }).notNull(),
  value: decimal("value", { precision: 12, scale: 4 }).notNull(),
  unit: varchar("unit", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SensorReading = typeof sensorReadings.$inferSelect;
export type InsertSensorReading = typeof sensorReadings.$inferInsert;

export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  deviceId: int("deviceId").notNull(),
  farmId: int("farmId").notNull(),
  alertType: varchar("alertType", { length: 100 }).notNull(),
  message: text("message"),
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).default("warning"),
  isResolved: boolean("isResolved").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

// ============================================================================
// BUSINESS AND STRATEGY
// ============================================================================
export const strategicGoals = mysqlTable("strategicGoals", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  goalDescription: text("goalDescription").notNull(),
  startDate: date("startDate"),
  endDate: date("endDate"),
  status: mysqlEnum("status", ["planning", "in_progress", "completed", "abandoned"]).default("planning"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StrategicGoal = typeof strategicGoals.$inferSelect;
export type InsertStrategicGoal = typeof strategicGoals.$inferInsert;

export const swotAnalysis = mysqlTable("swotAnalysis", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  analysisDate: date("analysisDate").notNull(),
  strengths: text("strengths"),
  weaknesses: text("weaknesses"),
  opportunities: text("opportunities"),
  threats: text("threats"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SWOTAnalysis = typeof swotAnalysis.$inferSelect;
export type InsertSWOTAnalysis = typeof swotAnalysis.$inferInsert;


// ============================================================================
// THEME CONFIGURATION
// ============================================================================
export const themeConfigs = mysqlTable("themeConfigs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  primaryColor: varchar("primaryColor", { length: 7 }).default("#3b82f6").notNull(),
  secondaryColor: varchar("secondaryColor", { length: 7 }).default("#10b981").notNull(),
  accentColor: varchar("accentColor", { length: 7 }).default("#f59e0b").notNull(),
  backgroundColor: varchar("backgroundColor", { length: 7 }).default("#ffffff").notNull(),
  textColor: varchar("textColor", { length: 7 }).default("#1f2937").notNull(),
  borderColor: varchar("borderColor", { length: 7 }).default("#e5e7eb").notNull(),
  fontFamily: varchar("fontFamily", { length: 255 }).default("Inter, system-ui, sans-serif").notNull(),
  fontSize: varchar("fontSize", { length: 10 }).default("16px").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ThemeConfig = typeof themeConfigs.$inferSelect;
export type InsertThemeConfig = typeof themeConfigs.$inferInsert;

// ============================================================================
// NOTIFICATIONS
// ============================================================================
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", [
    "vaccination_due",
    "vaccination_overdue",
    "breeding_due",
    "breeding_overdue",
    "health_alert",
    "performance_alert",
    "feed_low",
    "task_reminder",
    "system_alert",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  relatedAnimalId: int("relatedAnimalId"),
  relatedBreedingId: int("relatedBreedingId"),
  relatedVaccinationId: int("relatedVaccinationId"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  actionUrl: varchar("actionUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  readAt: timestamp("readAt"),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;


// ============================================================================
// MARKETPLACE - PRODUCTS
// ============================================================================
export const marketplaceProducts = mysqlTable("marketplaceProducts", {
  id: int("id").autoincrement().primaryKey(),
  sellerId: int("sellerId").notNull(),
  farmId: int("farmId"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(), // e.g., "Vegetables", "Dairy", "Meat", "Grains"
  productType: varchar("productType", { length: 100 }).notNull(), // e.g., "Tomato", "Milk", "Beef"
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(), // e.g., "kg", "liter", "dozen", "bunch"
  imageUrl: varchar("imageUrl", { length: 500 }),
  status: mysqlEnum("status", ["active", "inactive", "sold_out", "discontinued"]).default("active").notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: int("reviewCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MarketplaceProduct = typeof marketplaceProducts.$inferSelect;
export type InsertMarketplaceProduct = typeof marketplaceProducts.$inferInsert;

// ============================================================================
// MARKETPLACE - ORDERS
// ============================================================================
export const marketplaceOrders = mysqlTable("marketplaceOrders", {
  id: int("id").autoincrement().primaryKey(),
  buyerId: int("buyerId").notNull(),
  sellerId: int("sellerId").notNull(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "shipped", "delivered", "cancelled", "refunded"]).default("pending").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "paid", "refunded"]).default("unpaid").notNull(),
  deliveryAddress: text("deliveryAddress"),
  deliveryDate: date("deliveryDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MarketplaceOrder = typeof marketplaceOrders.$inferSelect;
export type InsertMarketplaceOrder = typeof marketplaceOrders.$inferInsert;

// ============================================================================
// MARKETPLACE - ORDER ITEMS
// ============================================================================
export const marketplaceOrderItems = mysqlTable("marketplaceOrderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MarketplaceOrderItem = typeof marketplaceOrderItems.$inferSelect;
export type InsertMarketplaceOrderItem = typeof marketplaceOrderItems.$inferInsert;

// ============================================================================
// MARKETPLACE - TRANSACTIONS
// ============================================================================
export const marketplaceTransactions = mysqlTable("marketplaceTransactions", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  transactionId: varchar("transactionId", { length: 100 }).unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }).notNull(), // e.g., "credit_card", "bank_transfer", "cash"
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  reference: varchar("reference", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});
export type MarketplaceTransaction = typeof marketplaceTransactions.$inferSelect;
export type InsertMarketplaceTransaction = typeof marketplaceTransactions.$inferInsert;

// ============================================================================
// MARKETPLACE - REVIEWS
// ============================================================================
export const marketplaceReviews = mysqlTable("marketplaceReviews", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  buyerId: int("buyerId").notNull(),
  orderId: int("orderId"),
  rating: int("rating").notNull(), // 1-5 stars
  title: varchar("title", { length: 255 }),
  comment: text("comment"),
  helpful: int("helpful").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MarketplaceReview = typeof marketplaceReviews.$inferSelect;
export type InsertMarketplaceReview = typeof marketplaceReviews.$inferInsert;

// ============================================================================
// MARKETPLACE - SHOPPING CART
// ============================================================================
export const marketplaceCart = mysqlTable("marketplaceCart", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MarketplaceCart = typeof marketplaceCart.$inferSelect;
export type InsertMarketplaceCart = typeof marketplaceCart.$inferInsert;


// IoT Devices and Sensors
