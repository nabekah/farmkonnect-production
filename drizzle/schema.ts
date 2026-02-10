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
  // Security fields
  approvalStatus: mysqlEnum("approvalStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
  accountStatus: mysqlEnum("accountStatus", ["active", "disabled", "suspended"]).default("active").notNull(),
  accountStatusReason: text("accountStatusReason"),
  mfaEnabled: boolean("mfaEnabled").default(false).notNull(),
  mfaSecret: varchar("mfaSecret", { length: 255 }),
  mfaBackupCodes: text("mfaBackupCodes"), // JSON array of backup codes
  failedLoginAttempts: int("failedLoginAttempts").default(0).notNull(),
  lastFailedLoginAt: timestamp("lastFailedLoginAt"),
  accountLockedUntil: timestamp("accountLockedUntil"),
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
  description: text("description"),
  photoUrl: varchar("photoUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Farm = typeof farms.$inferSelect;
export type InsertFarm = typeof farms.$inferInsert;

export const farmActivities = mysqlTable("farmActivities", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  activityType: mysqlEnum("activityType", ["crop_planting", "livestock_addition", "weather_alert", "harvest", "feeding", "health_check", "other"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FarmActivity = typeof farmActivities.$inferSelect;
export type InsertFarmActivity = typeof farmActivities.$inferInsert;

// ============================================================================
// CROP MANAGEMENT
// ============================================================================
export const crops = mysqlTable("crops", {
  id: int("id").autoincrement().primaryKey(),
  cropName: varchar("cropName", { length: 255 }).notNull(),
  scientificName: varchar("scientificName", { length: 255 }),
  variety: varchar("variety", { length: 255 }),
  cultivarParameters: text("cultivarParameters"),
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
  expectedYieldKg: decimal("expectedYieldKg", { precision: 10, scale: 2 }),
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

export const cropHealthRecords = mysqlTable("cropHealthRecords", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").notNull(),
  recordDate: date("recordDate").notNull(),
  issueType: mysqlEnum("issueType", ["disease", "pest", "nutrient_deficiency", "weather_damage", "other"]).notNull(),
  issueName: varchar("issueName", { length: 255 }).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  affectedArea: varchar("affectedArea", { length: 255 }),
  symptoms: text("symptoms"),
  photoUrls: text("photoUrls"),
  notes: text("notes"),
  status: mysqlEnum("status", ["active", "treated", "resolved"]).default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CropHealthRecord = typeof cropHealthRecords.$inferSelect;
export type InsertCropHealthRecord = typeof cropHealthRecords.$inferInsert;

export const cropTreatments = mysqlTable("cropTreatments", {
  id: int("id").autoincrement().primaryKey(),
  healthRecordId: int("healthRecordId").notNull(),
  treatmentDate: date("treatmentDate").notNull(),
  treatmentType: varchar("treatmentType", { length: 255 }).notNull(),
  productName: varchar("productName", { length: 255 }),
  dosage: varchar("dosage", { length: 255 }),
  applicationMethod: varchar("applicationMethod", { length: 255 }),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  appliedByUserId: int("appliedByUserId"),
  effectiveness: mysqlEnum("effectiveness", ["not_evaluated", "ineffective", "partially_effective", "effective", "very_effective"]).default("not_evaluated"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CropTreatment = typeof cropTreatments.$inferSelect;
export type InsertCropTreatment = typeof cropTreatments.$inferInsert;

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
    "stock_low",
    "stock_critical",
    "harvest_reminder",
    "weather_alert",
    "weather_warning",
    "iot_sensor_alert",
    "marketplace_order",
    "marketplace_sale",
    "task_reminder",
    "system_alert",
    "security_alert",
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
// MARKETPLACE - PRODUCT IMAGES
// ============================================================================
export const marketplaceProductImages = mysqlTable("marketplaceProductImages", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().references(() => marketplaceProducts.id, { onDelete: "cascade" }),
  imageUrl: varchar("imageUrl", { length: 500 }).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(), // Order in which images should be displayed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MarketplaceProductImage = typeof marketplaceProductImages.$inferSelect;
export type InsertMarketplaceProductImage = typeof marketplaceProductImages.$inferInsert;

// ============================================================================
// MARKETPLACE - PRODUCT REVIEWS
// ============================================================================
export const marketplaceProductReviews = mysqlTable("marketplaceProductReviews", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().references(() => marketplaceProducts.id, { onDelete: "cascade" }),
  userId: int("userId").notNull(),
  rating: int("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  verifiedPurchase: boolean("verifiedPurchase").default(false).notNull(),
  helpfulCount: int("helpfulCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MarketplaceProductReview = typeof marketplaceProductReviews.$inferSelect;
export type InsertMarketplaceProductReview = typeof marketplaceProductReviews.$inferInsert;

// ============================================================================
// MARKETPLACE - BULK PRICING TIERS
// ============================================================================
export const marketplaceBulkPricingTiers = mysqlTable("marketplaceBulkPricingTiers", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().references(() => marketplaceProducts.id, { onDelete: "cascade" }),
  minQuantity: decimal("minQuantity", { precision: 10, scale: 2 }).notNull(),
  maxQuantity: decimal("maxQuantity", { precision: 10, scale: 2 }),
  discountPercentage: decimal("discountPercentage", { precision: 5, scale: 2 }).notNull(),
  discountedPrice: decimal("discountedPrice", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MarketplaceBulkPricingTier = typeof marketplaceBulkPricingTiers.$inferSelect;
export type InsertMarketplaceBulkPricingTier = typeof marketplaceBulkPricingTiers.$inferInsert;

// ============================================================================
// MARKETPLACE - ORDER REVIEWS
// ============================================================================
export const marketplaceOrderReviews = mysqlTable("marketplaceOrderReviews", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().unique(), // One review per order
  buyerId: int("buyerId").notNull(),
  sellerId: int("sellerId").notNull(),
  rating: int("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  sellerResponse: text("sellerResponse"),
  sellerResponseAt: timestamp("sellerResponseAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MarketplaceOrderReview = typeof marketplaceOrderReviews.$inferSelect;
export type InsertMarketplaceOrderReview = typeof marketplaceOrderReviews.$inferInsert;

// ============================================================================
// MARKETPLACE - ORDER DISPUTES
// ============================================================================
export const marketplaceOrderDisputes = mysqlTable("marketplaceOrderDisputes", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  buyerId: int("buyerId").notNull(),
  sellerId: int("sellerId").notNull(),
  reason: varchar("reason", { length: 100 }).notNull(), // damaged_product, wrong_item, not_delivered, quality_issue
  description: text("description").notNull(),
  evidence: text("evidence"), // JSON array of file URLs
  status: mysqlEnum("status", ["pending", "under_review", "resolved", "rejected"]).default("pending").notNull(),
  resolution: text("resolution"),
  adminNotes: text("adminNotes"),
  resolvedBy: int("resolvedBy"), // Admin user ID
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MarketplaceOrderDispute = typeof marketplaceOrderDisputes.$inferSelect;
export type InsertMarketplaceOrderDispute = typeof marketplaceOrderDisputes.$inferInsert;

// ============================================================================
// MARKETPLACE - SELLER PAYOUTS
// ============================================================================
export const marketplaceSellerPayouts = mysqlTable("marketplaceSellerPayouts", {
  id: int("id").autoincrement().primaryKey(),
  sellerId: int("sellerId").notNull(),
  orderId: int("orderId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  payoutDate: date("payoutDate"),
  transactionReference: varchar("transactionReference", { length: 255 }),
  paymentMethod: varchar("paymentMethod", { length: 100 }), // mobile_money, bank_transfer
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MarketplaceSellerPayout = typeof marketplaceSellerPayouts.$inferSelect;
export type InsertMarketplaceSellerPayout = typeof marketplaceSellerPayouts.$inferInsert;

// ============================================================================
// MARKETPLACE - WISHLIST
// ============================================================================
export const marketplaceWishlist = mysqlTable("marketplaceWishlist", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MarketplaceWishlist = typeof marketplaceWishlist.$inferSelect;
export type InsertMarketplaceWishlist = typeof marketplaceWishlist.$inferInsert;

// ============================================================================
// MARKETPLACE - SELLER VERIFICATION
// ============================================================================
export const sellerVerifications = mysqlTable("sellerVerifications", {
  id: int("id").autoincrement().primaryKey(),
  sellerId: int("sellerId").notNull(),
  documentUrl: text("documentUrl").notNull(), // S3 URL to verification document
  documentType: varchar("documentType", { length: 100 }).notNull(), // business_license, tax_id, national_id, etc.
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
  reviewedBy: int("reviewedBy"), // admin user ID
  notes: text("notes"), // admin notes for rejection reason or comments
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SellerVerification = typeof sellerVerifications.$inferSelect;
export type InsertSellerVerification = typeof sellerVerifications.$inferInsert;

// ============================================================================
// MARKETPLACE - INVENTORY ALERTS
// ============================================================================
export const inventoryAlerts = mysqlTable("inventoryAlerts", {
  id: int("id").autoincrement().primaryKey(),
  sellerId: int("sellerId").notNull(),
  productId: int("productId").notNull().references(() => marketplaceProducts.id, { onDelete: "cascade" }),
  threshold: decimal("threshold", { precision: 10, scale: 2 }).notNull(), // alert when quantity falls below this
  isActive: boolean("isActive").default(true).notNull(),
  lastAlertSent: timestamp("lastAlertSent"),
  alertFrequencyHours: int("alertFrequencyHours").default(24).notNull(), // minimum hours between alerts
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type InventoryAlert = typeof inventoryAlerts.$inferSelect;
export type InsertInventoryAlert = typeof inventoryAlerts.$inferInsert;

// ============================================================================
// MARKETPLACE - DELIVERY ZONES
// ============================================================================
export const marketplaceDeliveryZones = mysqlTable("marketplaceDeliveryZones", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "Greater Accra", "Ashanti Region"
  region: varchar("region", { length: 100 }).notNull(),
  shippingCost: decimal("shippingCost", { precision: 10, scale: 2 }).notNull(),
  estimatedDays: int("estimatedDays").notNull(), // Estimated delivery days
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MarketplaceDeliveryZone = typeof marketplaceDeliveryZones.$inferSelect;
export type InsertMarketplaceDeliveryZone = typeof marketplaceDeliveryZones.$inferInsert;

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
  trackingNumber: varchar("trackingNumber", { length: 100 }),
  estimatedDeliveryDate: date("estimatedDeliveryDate"),
  deliveryZoneId: int("deliveryZoneId"),
  shippingCost: decimal("shippingCost", { precision: 10, scale: 2 }),
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
  expiresAt: timestamp("expiresAt").notNull(),
});
export type MarketplaceCart = typeof marketplaceCart.$inferSelect;
export type InsertMarketplaceCart = typeof marketplaceCart.$inferInsert;


// IoT Devices and Sensors

// Irrigation Automation System
export const irrigationZones = mysqlTable("irrigation_zones", {
  id: int("id").primaryKey().autoincrement(),
  farmId: int("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" }),
  zoneName: varchar("zone_name", { length: 255 }).notNull(),
  cropType: varchar("crop_type", { length: 100 }).notNull(), // wheat, corn, rice, etc.
  areaHectares: decimal("area_hectares", { precision: 10, scale: 2 }),
  soilType: varchar("soil_type", { length: 100 }), // clay, sandy, loam, etc.
  fieldCapacity: decimal("field_capacity", { precision: 5, scale: 2 }), // % water holding capacity
  wiltingPoint: decimal("wilting_point", { precision: 5, scale: 2 }), // % water stress point
  targetMoisture: decimal("target_moisture", { precision: 5, scale: 2 }), // optimal % moisture
  minMoisture: decimal("min_moisture", { precision: 5, scale: 2 }), // trigger irrigation threshold
  maxMoisture: decimal("max_moisture", { precision: 5, scale: 2 }), // prevent overwatering
  status: varchar("status", { length: 50 }).default("active"), // active, inactive, maintenance
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type IrrigationZone = typeof irrigationZones.$inferSelect;
export type InsertIrrigationZone = typeof irrigationZones.$inferInsert;

export const irrigationSchedules = mysqlTable("irrigation_schedules", {
  id: int("id").primaryKey().autoincrement(),
  zoneId: int("zone_id").notNull().references(() => irrigationZones.id, { onDelete: "cascade" }),
  scheduleName: varchar("schedule_name", { length: 255 }).notNull(),
  scheduleType: varchar("schedule_type", { length: 50 }).notNull(), // manual, automatic, weather-based
  durationMinutes: int("duration_minutes").notNull(), // irrigation duration in minutes
  flowRateLitersPerMin: decimal("flow_rate_liters_per_min", { precision: 10, scale: 2 }),
  frequency: varchar("frequency", { length: 50 }), // daily, every_2_days, weekly, etc.
  startTime: varchar("start_time", { length: 8 }), // HH:MM:SS format
  endTime: varchar("end_time", { length: 8 }),
  daysOfWeek: varchar("days_of_week", { length: 100 }), // 0-6 for Sun-Sat (comma-separated)
  weatherAdjustment: boolean("weather_adjustment").default(true), // adjust based on rainfall
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type IrrigationSchedule = typeof irrigationSchedules.$inferSelect;
export type InsertIrrigationSchedule = typeof irrigationSchedules.$inferInsert;

export const irrigationEvents = mysqlTable("irrigation_events", {
  id: int("id").primaryKey().autoincrement(),
  scheduleId: int("schedule_id").notNull().references(() => irrigationSchedules.id, { onDelete: "cascade" }),
  zoneId: int("zone_id").notNull().references(() => irrigationZones.id, { onDelete: "cascade" }),
  eventType: varchar("event_type", { length: 50 }).notNull(), // scheduled, manual, emergency, skipped
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  durationMinutes: int("duration_minutes"),
  waterAppliedLiters: decimal("water_applied_liters", { precision: 15, scale: 2 }),
  reason: varchar("reason", { length: 500 }), // why irrigation was triggered/skipped
  status: varchar("status", { length: 50 }).notNull(), // completed, in_progress, failed, skipped
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type IrrigationEvent = typeof irrigationEvents.$inferSelect;
export type InsertIrrigationEvent = typeof irrigationEvents.$inferInsert;

export const soilMoistureReadings = mysqlTable("soil_moisture_readings", {
  id: int("id").primaryKey().autoincrement(),
  zoneId: int("zone_id").notNull().references(() => irrigationZones.id, { onDelete: "cascade" }),
  sensorId: int("sensor_id").references(() => iotDevices.id, { onDelete: "set null" }),
  moisturePercentage: decimal("moisture_percentage", { precision: 5, scale: 2 }).notNull(),
  temperature: decimal("temperature", { precision: 5, scale: 2 }), // soil temperature
  conductivity: decimal("conductivity", { precision: 10, scale: 2 }), // soil EC value
  ph: decimal("ph", { precision: 3, scale: 1 }), // soil pH
  readingTime: timestamp("reading_time").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type SoilMoistureReading = typeof soilMoistureReadings.$inferSelect;
export type InsertSoilMoistureReading = typeof soilMoistureReadings.$inferInsert;

export const irrigationRecommendations = mysqlTable("irrigation_recommendations", {
  id: int("id").primaryKey().autoincrement(),
  zoneId: int("zone_id").notNull().references(() => irrigationZones.id, { onDelete: "cascade" }),
  recommendationType: varchar("recommendation_type", { length: 50 }).notNull(), // irrigate_now, delay, skip, increase, decrease
  priority: varchar("priority", { length: 50 }).notNull(), // critical, high, medium, low
  reason: varchar("reason", { length: 500 }).notNull(),
  recommendedDurationMinutes: int("recommended_duration_minutes"),
  estimatedWaterNeeded: decimal("estimated_water_needed", { precision: 15, scale: 2 }), // liters
  weatherFactor: decimal("weather_factor", { precision: 5, scale: 2 }), // rainfall adjustment %
  soilMoistureFactor: decimal("soil_moisture_factor", { precision: 5, scale: 2 }), // current moisture %
  cropWaterRequirement: decimal("crop_water_requirement", { precision: 10, scale: 2 }), // mm/day
  acknowledged: boolean("acknowledged").default(false),
  acknowledgedAt: timestamp("acknowledged_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type IrrigationRecommendation = typeof irrigationRecommendations.$inferSelect;
export type InsertIrrigationRecommendation = typeof irrigationRecommendations.$inferInsert;

export const irrigationStatistics = mysqlTable("irrigation_statistics", {
  id: int("id").primaryKey().autoincrement(),
  zoneId: int("zone_id").notNull().references(() => irrigationZones.id, { onDelete: "cascade" }),
  dateStart: date("date_start").notNull(),
  dateEnd: date("date_end").notNull(),
  totalWaterAppliedLiters: decimal("total_water_applied_liters", { precision: 15, scale: 2 }).default("0"),
  totalDurationMinutes: int("total_duration_minutes").default(0),
  irrigationEventCount: int("irrigation_event_count").default(0),
  averageMoisture: decimal("average_moisture", { precision: 5, scale: 2 }),
  rainfallMm: decimal("rainfall_mm", { precision: 10, scale: 2 }), // total rainfall in period
  waterEfficiency: decimal("water_efficiency", { precision: 5, scale: 2 }), // % efficiency score
  costEstimate: decimal("cost_estimate", { precision: 10, scale: 2 }), // estimated water cost
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type IrrigationStatistics = typeof irrigationStatistics.$inferSelect;
export type InsertIrrigationStatistics = typeof irrigationStatistics.$inferInsert;


// Inventory Management System
export const inventoryItems = mysqlTable("inventory_items", {
  id: int("id").primaryKey().autoincrement(),
  productId: int("product_id").notNull().references(() => marketplaceProducts.id, { onDelete: "cascade" }),
  currentStock: decimal("current_stock", { precision: 15, scale: 2 }).notNull().default("0"),
  reservedStock: decimal("reserved_stock", { precision: 15, scale: 2 }).default("0"), // stock in pending orders
  availableStock: decimal("available_stock", { precision: 15, scale: 2 }).default("0"), // current - reserved
  minimumThreshold: decimal("minimum_threshold", { precision: 15, scale: 2 }).notNull(), // low stock alert level
  reorderQuantity: decimal("reorder_quantity", { precision: 15, scale: 2 }), // suggested reorder amount
  lastRestockedAt: timestamp("last_restocked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = typeof inventoryItems.$inferInsert;

export const inventoryTransactions = mysqlTable("inventory_transactions", {
  id: int("id").primaryKey().autoincrement(),
  productId: int("product_id").notNull().references(() => marketplaceProducts.id, { onDelete: "cascade" }),
  transactionType: varchar("transaction_type", { length: 50 }).notNull(), // purchase, sale, adjustment, restock, damage, return
  quantity: decimal("quantity", { precision: 15, scale: 2 }).notNull(),
  notes: varchar("notes", { length: 500 }),
  referenceId: int("reference_id"), // order ID, return ID, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type InsertInventoryTransaction = typeof inventoryTransactions.$inferInsert;

export const lowStockAlerts = mysqlTable("low_stock_alerts", {
  id: int("id").primaryKey().autoincrement(),
  productId: int("product_id").notNull().references(() => marketplaceProducts.id, { onDelete: "cascade" }),
  sellerId: int("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  alertType: varchar("alert_type", { length: 50 }).notNull(), // low_stock, out_of_stock, critical
  currentStock: decimal("current_stock", { precision: 15, scale: 2 }).notNull(),
  minimumThreshold: decimal("minimum_threshold", { precision: 15, scale: 2 }).notNull(),
  acknowledged: boolean("acknowledged").default(false),
  acknowledgedAt: timestamp("acknowledged_at"),
  acknowledgedBy: int("acknowledged_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type LowStockAlert = typeof lowStockAlerts.$inferSelect;
export type InsertLowStockAlert = typeof lowStockAlerts.$inferInsert;

export const inventoryForecasts = mysqlTable("inventory_forecasts", {
  id: int("id").primaryKey().autoincrement(),
  productId: int("product_id").notNull().references(() => marketplaceProducts.id, { onDelete: "cascade" }),
  forecastDate: date("forecast_date").notNull(),
  projectedStock: decimal("projected_stock", { precision: 15, scale: 2 }).notNull(),
  projectedSales: decimal("projected_sales", { precision: 15, scale: 2 }), // estimated sales for period
  forecastMethod: varchar("forecast_method", { length: 50 }), // moving_average, trend, seasonal
  confidence: decimal("confidence", { precision: 3, scale: 0 }), // 0-100 confidence %
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type InventoryForecast = typeof inventoryForecasts.$inferSelect;
export type InsertInventoryForecast = typeof inventoryForecasts.$inferInsert;

export const inventoryAuditLogs = mysqlTable("inventory_audit_logs", {
  id: int("id").primaryKey().autoincrement(),
  productId: int("product_id").notNull().references(() => marketplaceProducts.id, { onDelete: "cascade" }),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 100 }).notNull(), // update_stock, set_threshold, acknowledge_alert, etc.
  oldValue: varchar("old_value", { length: 500 }),
  newValue: varchar("new_value", { length: 500 }),
  reason: varchar("reason", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type InventoryAuditLog = typeof inventoryAuditLogs.$inferSelect;
export type InsertInventoryAuditLog = typeof inventoryAuditLogs.$inferInsert;


// ============================================================================
// WEATHER HISTORY
// ============================================================================
export const weatherHistory = mysqlTable("weatherHistory", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
  temperature: decimal("temperature", { precision: 5, scale: 2 }),
  feelsLike: decimal("feelsLike", { precision: 5, scale: 2 }),
  humidity: int("humidity"),
  pressure: int("pressure"),
  windSpeed: decimal("windSpeed", { precision: 5, scale: 2 }),
  windDirection: int("windDirection"),
  cloudCover: int("cloudCover"),
  precipitation: decimal("precipitation", { precision: 5, scale: 2 }),
  weatherCondition: varchar("weatherCondition", { length: 100 }),
  weatherDescription: text("weatherDescription"),
  sunrise: timestamp("sunrise"),
  sunset: timestamp("sunset"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WeatherHistory = typeof weatherHistory.$inferSelect;
export type InsertWeatherHistory = typeof weatherHistory.$inferInsert;

// ============================================================================
// ENTERPRISE SECURITY SYSTEM
// ============================================================================

// Dynamic Roles with Custom Permissions
export const customRoles = mysqlTable("customRoles", {
  id: int("id").autoincrement().primaryKey(),
  roleName: varchar("roleName", { length: 100 }).notNull().unique(),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  description: text("description"),
  isSystemRole: boolean("isSystemRole").default(false).notNull(), // Cannot be deleted if true
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomRole = typeof customRoles.$inferSelect;
export type InsertCustomRole = typeof customRoles.$inferInsert;

// Module Permissions
export const modulePermissions = mysqlTable("modulePermissions", {
  id: int("id").autoincrement().primaryKey(),
  moduleName: varchar("moduleName", { length: 100 }).notNull(), // e.g., "farms", "crops", "livestock", "marketplace"
  displayName: varchar("displayName", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }), // e.g., "Agriculture", "Business", "Administration"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ModulePermission = typeof modulePermissions.$inferSelect;
export type InsertModulePermission = typeof modulePermissions.$inferInsert;

// Role-Permission Mapping (Many-to-Many)
export const rolePermissions = mysqlTable("rolePermissions", {
  id: int("id").autoincrement().primaryKey(),
  roleId: int("roleId").notNull(),
  permissionId: int("permissionId").notNull(),
  canView: boolean("canView").default(false).notNull(),
  canCreate: boolean("canCreate").default(false).notNull(),
  canEdit: boolean("canEdit").default(false).notNull(),
  canDelete: boolean("canDelete").default(false).notNull(),
  canExport: boolean("canExport").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = typeof rolePermissions.$inferInsert;

// User-Role Assignment (supports multiple roles per user)
export const userRoles = mysqlTable("userRoles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  roleId: int("roleId").notNull(),
  assignedBy: int("assignedBy").notNull(),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
});

export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = typeof userRoles.$inferInsert;

// Security Audit Logs
export const securityAuditLogs = mysqlTable("securityAuditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // Null for system events
  eventType: mysqlEnum("eventType", [
    "login_success",
    "login_failed",
    "logout",
    "mfa_enabled",
    "mfa_disabled",
    "mfa_verified",
    "mfa_failed",
    "password_changed",
    "role_assigned",
    "role_removed",
    "permission_changed",
    "account_approved",
    "account_rejected",
    "account_disabled",
    "account_enabled",
    "account_suspended",
    "session_created",
    "session_terminated",
    "security_alert",
  ]).notNull(),
  eventDescription: text("eventDescription"),
  ipAddress: varchar("ipAddress", { length: 45 }), // IPv6 support
  userAgent: text("userAgent"),
  deviceFingerprint: varchar("deviceFingerprint", { length: 255 }),
  metadata: text("metadata"), // JSON for additional context
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("low"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SecurityAuditLog = typeof securityAuditLogs.$inferSelect;
export type InsertSecurityAuditLog = typeof securityAuditLogs.$inferInsert;

// Active Sessions
export const userSessions = mysqlTable("userSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionToken: varchar("sessionToken", { length: 255 }).notNull().unique(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  deviceFingerprint: varchar("deviceFingerprint", { length: 255 }),
  deviceName: varchar("deviceName", { length: 255 }), // e.g., "Chrome on Windows"
  lastActivity: timestamp("lastActivity").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;

// User Approval Requests
export const userApprovalRequests = mysqlTable("userApprovalRequests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // Nullable - will be set after approval
  email: varchar("email", { length: 320 }).notNull(),
  name: text("name").notNull(),
  phone: varchar("phone", { length: 20 }),
  requestedRole: varchar("requestedRole", { length: 100 }),
  justification: text("justification"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserApprovalRequest = typeof userApprovalRequests.$inferSelect;
export type InsertUserApprovalRequest = typeof userApprovalRequests.$inferInsert;

// Account Status Change History
export const accountStatusHistory = mysqlTable("accountStatusHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  previousStatus: mysqlEnum("previousStatus", ["active", "disabled", "suspended"]).notNull(),
  newStatus: mysqlEnum("newStatus", ["active", "disabled", "suspended"]).notNull(),
  reason: text("reason"),
  changedBy: int("changedBy").notNull(),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
});

export type AccountStatusHistory = typeof accountStatusHistory.$inferSelect;
export type InsertAccountStatusHistory = typeof accountStatusHistory.$inferInsert;

// MFA Backup Codes Usage Tracking
export const mfaBackupCodeUsage = mysqlTable("mfaBackupCodeUsage", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  codeHash: varchar("codeHash", { length: 255 }).notNull(), // Hashed backup code
  usedAt: timestamp("usedAt").defaultNow().notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
});

export type MfaBackupCodeUsage = typeof mfaBackupCodeUsage.$inferSelect;
export type InsertMfaBackupCodeUsage = typeof mfaBackupCodeUsage.$inferInsert;

// Security Settings (System-wide)
export const securitySettings = mysqlTable("securitySettings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
  settingValue: text("settingValue").notNull(),
  description: text("description"),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SecuritySetting = typeof securitySettings.$inferSelect;
export type InsertSecuritySetting = typeof securitySettings.$inferInsert;


// Password Reset Requests
export const passwordResetRequests = mysqlTable("passwordResetRequests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  used: boolean("used").default(false).notNull(),
  usedAt: timestamp("usedAt"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordResetRequest = typeof passwordResetRequests.$inferSelect;
export type InsertPasswordResetRequest = typeof passwordResetRequests.$inferInsert;


// ============================================================================
// FINANCIAL MANAGEMENT
// ============================================================================

// Farm Expenses
export const farmExpenses = mysqlTable("farmExpenses", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull().references(() => farms.id),
  category: varchar("category", { length: 50 }).notNull(), // seeds, fertilizers, pesticides, labor, equipment, fuel, utilities, maintenance, feed, veterinary, other
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  expenseDate: date("expenseDate").notNull(),
  description: text("description"),
  vendor: varchar("vendor", { length: 255 }),
  invoiceNumber: varchar("invoiceNumber", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FarmExpense = typeof farmExpenses.$inferSelect;
export type InsertFarmExpense = typeof farmExpenses.$inferInsert;

// Farm Revenue
export const farmRevenue = mysqlTable("farmRevenue", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull().references(() => farms.id),
  source: varchar("source", { length: 50 }).notNull(), // crop_sales, livestock_sales, fish_sales, services, other
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  saleDate: date("saleDate").notNull(),
  buyer: varchar("buyer", { length: 255 }),
  quantity: varchar("quantity", { length: 100 }),
  unit: varchar("unit", { length: 50 }), // kg, liters, pieces, etc
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FarmRevenue = typeof farmRevenue.$inferSelect;
export type InsertFarmRevenue = typeof farmRevenue.$inferInsert;

// Farm Workers
export const farmWorkers = mysqlTable("farmWorkers", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull().references(() => farms.id),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 100 }).notNull(), // farm manager, laborer, specialist, etc
  contact: varchar("contact", { length: 20 }),
  email: varchar("email", { length: 255 }),
  hireDate: date("hireDate").notNull(),
  salary: decimal("salary", { precision: 10, scale: 2 }),
  salaryFrequency: varchar("salaryFrequency", { length: 20 }), // daily, weekly, monthly
  status: varchar("status", { length: 20 }).default("active"), // active, inactive, on_leave
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FarmWorker = typeof farmWorkers.$inferSelect;
export type InsertFarmWorker = typeof farmWorkers.$inferInsert;

// Farm Assets
export const farmAssets = mysqlTable("farmAssets", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull().references(() => farms.id),
  assetType: varchar("assetType", { length: 100 }).notNull(), // tractor, pump, shed, fence, etc
  name: varchar("name", { length: 255 }).notNull(),
  purchaseDate: date("purchaseDate").notNull(),
  purchaseValue: decimal("purchaseValue", { precision: 10, scale: 2 }),
  currentValue: decimal("currentValue", { precision: 10, scale: 2 }),
  maintenanceSchedule: varchar("maintenanceSchedule", { length: 50 }), // monthly, quarterly, annually
  lastMaintenanceDate: date("lastMaintenanceDate"),
  nextMaintenanceDate: date("nextMaintenanceDate"),
  status: varchar("status", { length: 20 }).default("active"), // active, maintenance, retired
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FarmAsset = typeof farmAssets.$inferSelect;
export type InsertFarmAsset = typeof farmAssets.$inferInsert;

// Fish Ponds
export const fishPonds = mysqlTable("fishPonds", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull().references(() => farms.id),
  pondName: varchar("pondName", { length: 255 }).notNull(),
  sizeSquareMeters: decimal("sizeSquareMeters", { precision: 10, scale: 2 }),
  depthMeters: decimal("depthMeters", { precision: 5, scale: 2 }),
  waterSource: varchar("waterSource", { length: 100 }), // borehole, river, rain, etc
  stockingDensity: varchar("stockingDensity", { length: 100 }), // fingerlings per square meter
  status: varchar("status", { length: 20 }).default("active"), // active, draining, empty
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FishPond = typeof fishPonds.$inferSelect;
export type InsertFishPond = typeof fishPonds.$inferInsert;

// Fish Stocking Records
export const fishStockingRecords = mysqlTable("fishStockingRecords", {
  id: int("id").autoincrement().primaryKey(),
  pondId: int("pondId").notNull().references(() => fishPonds.id),
  species: varchar("species", { length: 100 }).notNull(), // tilapia, catfish, carp, etc
  fingerlings: int("fingerlings").notNull(),
  stockingDate: date("stockingDate").notNull(),
  expectedHarvestDate: date("expectedHarvestDate"),
  status: varchar("status", { length: 20 }).default("stocked"), // stocked, growing, harvesting, harvested
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FishStockingRecord = typeof fishStockingRecords.$inferSelect;
export type InsertFishStockingRecord = typeof fishStockingRecords.$inferInsert;

// Fish Pond Activities (water quality, feeding, etc)
export const fishPondActivities = mysqlTable("fishPondActivities", {
  id: int("id").autoincrement().primaryKey(),
  pondId: int("pondId").notNull().references(() => fishPonds.id),
  activityType: varchar("activityType", { length: 50 }).notNull(), // feeding, water_change, treatment, harvesting, etc
  activityDate: date("activityDate").notNull(),
  waterTemperature: decimal("waterTemperature", { precision: 5, scale: 2 }),
  phLevel: decimal("phLevel", { precision: 3, scale: 1 }),
  dissolvedOxygen: decimal("dissolvedOxygen", { precision: 5, scale: 2 }),
  feedAmount: decimal("feedAmount", { precision: 10, scale: 2 }), // kg
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FishPondActivity = typeof fishPondActivities.$inferSelect;
export type InsertFishPondActivity = typeof fishPondActivities.$inferInsert;

// Notification Preferences
export const notificationPreferences = mysqlTable("notificationPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  emailEnabled: boolean("emailEnabled").default(true).notNull(),
  smsEnabled: boolean("smsEnabled").default(false).notNull(),
  pushEnabled: boolean("pushEnabled").default(true).notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }),
  criticalAlerts: boolean("criticalAlerts").default(true).notNull(),
  warningAlerts: boolean("warningAlerts").default(true).notNull(),
  infoAlerts: boolean("infoAlerts").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

// Alert History
export const alertHistory = mysqlTable("alertHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  farmId: int("farmId").notNull().references(() => farms.id),
  alertType: mysqlEnum("alertType", ["health", "water_quality", "weather", "maintenance", "other"]).notNull(),
  severity: mysqlEnum("severity", ["critical", "warning", "info"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  isAcknowledged: boolean("isAcknowledged").default(false).notNull(),
  acknowledgedAt: timestamp("acknowledgedAt"),
  acknowledgedBy: int("acknowledgedBy").references(() => users.id),
  actionTaken: text("actionTaken"),
  responseTimeMinutes: int("responseTimeMinutes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AlertHistory = typeof alertHistory.$inferSelect;
export type InsertAlertHistory = typeof alertHistory.$inferInsert;


// ============================================================================
// REPORTING AND ANALYTICS
// ============================================================================
export const reportSchedules = mysqlTable("reportSchedules", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  farmId: int("farmId").notNull().references(() => farms.id),
  reportType: mysqlEnum("reportType", ["financial", "livestock", "complete"]).notNull(),
  frequency: mysqlEnum("frequency", ["daily", "weekly", "monthly"]).notNull(),
  recipients: text("recipients").notNull(), // JSON array of email addresses
  isActive: boolean("isActive").default(true).notNull(),
  nextRun: timestamp("nextRun"),
  lastRun: timestamp("lastRun"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReportSchedule = typeof reportSchedules.$inferSelect;
export type InsertReportSchedule = typeof reportSchedules.$inferInsert;

export const reportHistory = mysqlTable("reportHistory", {
  id: int("id").autoincrement().primaryKey(),
  scheduleId: int("scheduleId").notNull().references(() => reportSchedules.id),
  farmId: int("farmId").notNull().references(() => farms.id),
  reportType: mysqlEnum("reportType", ["financial", "livestock", "complete"]).notNull(),
  status: mysqlEnum("status", ["pending", "generating", "success", "failed"]).default("pending").notNull(),
  generatedAt: timestamp("generatedAt"),
  sentAt: timestamp("sentAt"),
  recipientCount: int("recipientCount").default(0),
  fileSize: int("fileSize"), // in bytes
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReportHistory = typeof reportHistory.$inferSelect;
export type InsertReportHistory = typeof reportHistory.$inferInsert;


// ============================================================================
// REPORT TEMPLATES & CUSTOMIZATION
// ============================================================================
export const reportTemplates = mysqlTable("reportTemplates", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull().references(() => farms.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  reportType: mysqlEnum("reportType", ["financial", "livestock", "complete"]).notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  includeSections: text("includeSections").notNull(), // JSON array of section names
  customBranding: text("customBranding"), // JSON object with logo, colors, etc.
  dataFilters: text("dataFilters"), // JSON object with date ranges, categories, etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ReportTemplate = typeof reportTemplates.$inferSelect;
export type InsertReportTemplate = typeof reportTemplates.$inferInsert;

export const reportTemplateFields = mysqlTable("reportTemplateFields", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull().references(() => reportTemplates.id),
  fieldName: varchar("fieldName", { length: 255 }).notNull(),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  fieldType: mysqlEnum("fieldType", ["text", "number", "date", "currency", "percentage", "chart"]).notNull(),
  isVisible: boolean("isVisible").default(true).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  aggregationType: mysqlEnum("aggregationType", ["sum", "average", "count", "min", "max", "none"]).default("none"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ReportTemplateField = typeof reportTemplateFields.$inferSelect;
export type InsertReportTemplateField = typeof reportTemplateFields.$inferInsert;

// ============================================================================
// REPORT ANALYTICS & TRACKING
// ============================================================================
export const reportAnalytics = mysqlTable("reportAnalytics", {
  id: int("id").autoincrement().primaryKey(),
  scheduleId: int("scheduleId").notNull().references(() => reportSchedules.id),
  farmId: int("farmId").notNull().references(() => farms.id),
  reportType: mysqlEnum("reportType", ["financial", "livestock", "complete"]).notNull(),
  totalGenerated: int("totalGenerated").default(0).notNull(),
  totalSent: int("totalSent").default(0).notNull(),
  totalFailed: int("totalFailed").default(0).notNull(),
  successRate: decimal("successRate", { precision: 5, scale: 2 }).default("0.00"),
  averageGenerationTime: int("averageGenerationTime"), // in milliseconds
  averageFileSize: int("averageFileSize"), // in bytes
  lastGeneratedAt: timestamp("lastGeneratedAt"),
  lastFailedAt: timestamp("lastFailedAt"),
  lastFailureReason: text("lastFailureReason"),
  recipientEngagement: text("recipientEngagement"), // JSON object with open counts, etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ReportAnalytic = typeof reportAnalytics.$inferSelect;
export type InsertReportAnalytic = typeof reportAnalytics.$inferInsert;

export const reportDeliveryEvents = mysqlTable("reportDeliveryEvents", {
  id: int("id").autoincrement().primaryKey(),
  reportHistoryId: int("reportHistoryId").notNull().references(() => reportHistory.id),
  recipient: varchar("recipient", { length: 320 }).notNull(),
  status: mysqlEnum("status", ["sent", "delivered", "opened", "failed", "bounced"]).notNull(),
  sentAt: timestamp("sentAt"),
  deliveredAt: timestamp("deliveredAt"),
  openedAt: timestamp("openedAt"),
  failureReason: text("failureReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ReportDeliveryEvent = typeof reportDeliveryEvents.$inferSelect;
export type InsertReportDeliveryEvent = typeof reportDeliveryEvents.$inferInsert;


// ============================================================================
// RECIPIENT GROUPS & MANAGEMENT
// ============================================================================
export const recipientGroups = mysqlTable("recipientGroups", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull().references(() => farms.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RecipientGroup = typeof recipientGroups.$inferSelect;
export type InsertRecipientGroup = typeof recipientGroups.$inferInsert;

export const groupMembers = mysqlTable("groupMembers", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull().references(() => recipientGroups.id),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 255 }),
  role: varchar("role", { length: 50 }), // e.g., "manager", "accountant", "stakeholder"
  isPrimary: boolean("isPrimary").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = typeof groupMembers.$inferInsert;

// ============================================================================
// REPORT ARCHIVAL & EXPORT
// ============================================================================
export const reportArchival = mysqlTable("reportArchival", {
  id: int("id").autoincrement().primaryKey(),
  reportHistoryId: int("reportHistoryId").notNull().references(() => reportHistory.id),
  farmId: int("farmId").notNull().references(() => farms.id),
  s3Key: varchar("s3Key", { length: 500 }).notNull(),
  s3Url: text("s3Url").notNull(),
  archivedAt: timestamp("archivedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"), // For retention policies
  retentionDays: int("retentionDays"), // Number of days to keep
  isRestored: boolean("isRestored").default(false).notNull(),
  restoredAt: timestamp("restoredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ReportArchival = typeof reportArchival.$inferSelect;
export type InsertReportArchival = typeof reportArchival.$inferInsert;

export const reportExportLog = mysqlTable("reportExportLog", {
  id: int("id").autoincrement().primaryKey(),
  reportHistoryId: int("reportHistoryId").notNull().references(() => reportHistory.id),
  farmId: int("farmId").notNull().references(() => farms.id),
  exportedBy: int("exportedBy").notNull().references(() => users.id),
  exportFormat: mysqlEnum("exportFormat", ["pdf", "excel", "csv"]).notNull(),
  downloadUrl: text("downloadUrl"),
  expiresAt: timestamp("expiresAt"),
  downloadCount: int("downloadCount").default(0).notNull(),
  lastDownloadedAt: timestamp("lastDownloadedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ReportExportLog = typeof reportExportLog.$inferSelect;
export type InsertReportExportLog = typeof reportExportLog.$inferInsert;


// ============================================================================
// REPORT TEMPLATE SECTIONS & CUSTOMIZATION
// ============================================================================
export const reportTemplateSections = mysqlTable("reportTemplateSections", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull().references(() => reportTemplates.id),
  sectionName: varchar("sectionName", { length: 100 }).notNull(),
  sectionType: mysqlEnum("sectionType", ["financial", "livestock", "crop", "weather", "summary", "custom"]).notNull(),
  isEnabled: boolean("isEnabled").default(true).notNull(),
  displayOrder: int("displayOrder").notNull(),
  customContent: text("customContent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ReportTemplateSection = typeof reportTemplateSections.$inferSelect;
export type InsertReportTemplateSection = typeof reportTemplateSections.$inferInsert;

export const reportTemplateCustomization = mysqlTable("reportTemplateCustomization", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull().references(() => reportTemplates.id),
  farmId: int("farmId").notNull().references(() => farms.id),
  brandingColor: varchar("brandingColor", { length: 7 }),
  headerText: text("headerText"),
  footerText: text("footerText"),
  logoUrl: text("logoUrl"),
  includeCharts: boolean("includeCharts").default(true).notNull(),
  includeMetrics: boolean("includeMetrics").default(true).notNull(),
  includeRecommendations: boolean("includeRecommendations").default(true).notNull(),
  pageOrientation: mysqlEnum("pageOrientation", ["portrait", "landscape"]).default("portrait").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ReportTemplateCustomization = typeof reportTemplateCustomization.$inferSelect;
export type InsertReportTemplateCustomization = typeof reportTemplateCustomization.$inferInsert;

// ============================================================================
// REPORT EXECUTION & SCHEDULING LOGS
// ============================================================================
export const reportExecutionLog = mysqlTable("reportExecutionLog", {
  id: int("id").autoincrement().primaryKey(),
  scheduleId: int("scheduleId").notNull().references(() => reportSchedules.id),
  farmId: int("farmId").notNull().references(() => farms.id),
  executionStatus: mysqlEnum("executionStatus", ["pending", "running", "success", "failed", "partial"]).notNull(),
  executedAt: timestamp("executedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  reportHistoryId: int("reportHistoryId").references(() => reportHistory.id),
  recipientCount: int("recipientCount").default(0).notNull(),
  successCount: int("successCount").default(0).notNull(),
  failureCount: int("failureCount").default(0).notNull(),
  errorMessage: text("errorMessage"),
  executionDurationMs: int("executionDurationMs"),
  nextScheduledExecution: timestamp("nextScheduledExecution"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ReportExecutionLog = typeof reportExecutionLog.$inferSelect;
export type InsertReportExecutionLog = typeof reportExecutionLog.$inferInsert;

export const reportExecutionDetails = mysqlTable("reportExecutionDetails", {
  id: int("id").autoincrement().primaryKey(),
  executionLogId: int("executionLogId").notNull().references(() => reportExecutionLog.id),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  recipientName: varchar("recipientName", { length: 255 }),
  deliveryStatus: mysqlEnum("deliveryStatus", ["pending", "sent", "failed", "bounced"]).notNull(),
  deliveryTimestamp: timestamp("deliveryTimestamp"),
  errorReason: text("errorReason"),
  retryCount: int("retryCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ReportExecutionDetail = typeof reportExecutionDetails.$inferSelect;
export type InsertReportExecutionDetail = typeof reportExecutionDetails.$inferInsert;


// ============================================================================
// FERTILIZER COST ANALYSIS
// ============================================================================
export const fertilizerCosts = mysqlTable("fertilizerCosts", {
  id: int("id").autoincrement().primaryKey(),
  fertilizerType: varchar("fertilizerType", { length: 100 }).notNull(),
  supplier: varchar("supplier", { length: 255 }),
  costPerKg: decimal("costPerKg", { precision: 10, scale: 4 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  effectiveDate: date("effectiveDate").notNull(),
  expiryDate: date("expiryDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FertilizerCost = typeof fertilizerCosts.$inferSelect;
export type InsertFertilizerCost = typeof fertilizerCosts.$inferInsert;

export const costAnalysis = mysqlTable("costAnalysis", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").notNull().references(() => cropCycles.id),
  totalCostSpent: decimal("totalCostSpent", { precision: 12, scale: 2 }).notNull(),
  costPerHectare: decimal("costPerHectare", { precision: 10, scale: 2 }).notNull(),
  costPerKgYield: decimal("costPerKgYield", { precision: 10, scale: 4 }),
  roiPercentage: decimal("roiPercentage", { precision: 8, scale: 2 }),
  averageCostPerApplication: decimal("averageCostPerApplication", { precision: 10, scale: 2 }),
  mostExpensiveType: varchar("mostExpensiveType", { length: 100 }),
  analysisDate: timestamp("analysisDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CostAnalysis = typeof costAnalysis.$inferSelect;
export type InsertCostAnalysis = typeof costAnalysis.$inferInsert;

// ============================================================================
// FERTILIZER INVENTORY MANAGEMENT
// ============================================================================
export const fertilizerInventory = mysqlTable("fertilizer_inventory", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull().references(() => farms.id),
  fertilizerType: varchar("fertilizerType", { length: 100 }).notNull(),
  currentStock: decimal("currentStock", { precision: 12, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 20 }).default("kg").notNull(),
  reorderPoint: decimal("reorderPoint", { precision: 12, scale: 2 }).notNull(),
  reorderQuantity: decimal("reorderQuantity", { precision: 12, scale: 2 }).notNull(),
  supplier: varchar("supplier", { length: 255 }),
  supplierContact: varchar("supplierContact", { length: 255 }),
  lastRestockDate: date("lastRestockDate"),
  expiryDate: date("expiryDate"),
  storageLocation: varchar("storageLocation", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FertilizerInventory = typeof fertilizerInventory.$inferSelect;
export type InsertFertilizerInventory = typeof fertilizerInventory.$inferInsert;

export const fertilizerInventoryTransactions = mysqlTable("fertilizer_inventory_transactions", {
  id: int("id").autoincrement().primaryKey(),
  inventoryId: int("inventoryId").notNull().references(() => fertilizerInventory.id),
  transactionType: mysqlEnum("transactionType", ["purchase", "usage", "adjustment", "damage", "expiry"]).notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 20 }).default("kg").notNull(),
  cost: decimal("cost", { precision: 12, scale: 2 }),
  reason: text("reason"),
  referenceId: int("referenceId"), // Links to fertilizer application or purchase order
  transactionDate: date("transactionDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type FertilizerInventoryTransaction = typeof fertilizerInventoryTransactions.$inferSelect;
export type InsertFertilizerInventoryTransaction = typeof fertilizerInventoryTransactions.$inferInsert;

// ============================================================================
// SOIL HEALTH RECOMMENDATIONS
// ============================================================================
export const soilHealthRecommendations = mysqlTable("soilHealthRecommendations", {
  id: int("id").autoincrement().primaryKey(),
  soilTestId: int("soilTestId").notNull().references(() => soilTests.id),
  cycleId: int("cycleId").notNull().references(() => cropCycles.id),
  recommendedFertilizerType: varchar("recommendedFertilizerType", { length: 100 }).notNull(),
  recommendedQuantityKg: decimal("recommendedQuantityKg", { precision: 10, scale: 2 }).notNull(),
  applicationTiming: varchar("applicationTiming", { length: 100 }),
  deficiencyType: varchar("deficiencyType", { length: 100 }),
  deficiencySeverity: mysqlEnum("deficiencySeverity", ["low", "moderate", "high", "critical"]).notNull(),
  expectedYieldImprovement: decimal("expectedYieldImprovement", { precision: 8, scale: 2 }),
  costBenefit: decimal("costBenefit", { precision: 10, scale: 2 }),
  alternativeOptions: text("alternativeOptions"), // JSON array of alternative fertilizers
  implementationStatus: mysqlEnum("implementationStatus", ["pending", "applied", "completed", "cancelled"]).default("pending").notNull(),
  appliedDate: date("appliedDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SoilHealthRecommendation = typeof soilHealthRecommendations.$inferSelect;
export type InsertSoilHealthRecommendation = typeof soilHealthRecommendations.$inferInsert;


// ============================================================================
// NAVIGATION ENHANCEMENTS - FAVORITES & BREADCRUMBS
// ============================================================================
export const userFavorites = mysqlTable("userFavorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  menuPath: varchar("menuPath", { length: 255 }).notNull(),
  menuLabel: varchar("menuLabel", { length: 255 }).notNull(),
  menuIcon: varchar("menuIcon", { length: 100 }),
  position: int("position").notNull(),
  isPinned: boolean("isPinned").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserFavorite = typeof userFavorites.$inferSelect;
export type InsertUserFavorite = typeof userFavorites.$inferInsert;

export const navigationHistory = mysqlTable("navigationHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  path: varchar("path", { length: 255 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  breadcrumbTrail: text("breadcrumbTrail").notNull(), // JSON array of breadcrumb items
  visitedAt: timestamp("visitedAt").defaultNow().notNull(),
  sessionId: varchar("sessionId", { length: 100 }),
  referrerPath: varchar("referrerPath", { length: 255 }),
});
export type NavigationHistory = typeof navigationHistory.$inferSelect;
export type InsertNavigationHistory = typeof navigationHistory.$inferInsert;

export const searchIndexes = mysqlTable("searchIndexes", {
  id: int("id").autoincrement().primaryKey(),
  path: varchar("path", { length: 255 }).notNull().unique(),
  label: varchar("label", { length: 255 }).notNull(),
  description: text("description"),
  keywords: text("keywords"), // JSON array of searchable keywords
  category: varchar("category", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 100 }),
  searchScore: decimal("searchScore", { precision: 5, scale: 2 }).default("1"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SearchIndex = typeof searchIndexes.$inferSelect;
export type InsertSearchIndex = typeof searchIndexes.$inferInsert;


// ============================================================================
// FIELD WORKER MANAGEMENT
// ============================================================================

/**
 * Field Worker Profiles
 * Links users to their field worker roles and assignments
 */
export const fieldWorkerProfiles = mysqlTable("fieldWorkerProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  farmId: int("farmId").notNull(),
  managerId: int("managerId").notNull(), // User ID of farm manager/supervisor
  specialization: varchar("specialization", { length: 255 }), // e.g., "crop_management", "pest_control", "irrigation"
  experience: varchar("experience", { length: 50 }), // e.g., "beginner", "intermediate", "expert"
  phoneNumber: varchar("phoneNumber", { length: 20 }),
  emergencyContact: varchar("emergencyContact", { length: 255 }),
  emergencyPhone: varchar("emergencyPhone", { length: 20 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FieldWorkerProfile = typeof fieldWorkerProfiles.$inferSelect;
export type InsertFieldWorkerProfile = typeof fieldWorkerProfiles.$inferInsert;

/**
 * Field Worker Tasks
 * Tasks assigned by managers to field workers
 */
export const fieldWorkerTasks = mysqlTable("fieldWorkerTasks", {
  id: int("id").autoincrement().primaryKey(),
  taskId: varchar("taskId", { length: 50 }).notNull().unique(), // UUID-like identifier
  assignedToUserId: int("assignedToUserId").notNull(), // Field worker user ID
  assignedByUserId: int("assignedByUserId").notNull(), // Manager user ID
  farmId: int("farmId").notNull(),
  fieldId: int("fieldId"), // Optional: specific field
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  taskType: mysqlEnum("taskType", [
    "planting",
    "monitoring",
    "irrigation",
    "fertilization",
    "pest_control",
    "weed_control",
    "harvest",
    "equipment_maintenance",
    "soil_testing",
    "other"
  ]).notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  dueDate: timestamp("dueDate").notNull(),
  startDate: timestamp("startDate"),
  completedDate: timestamp("completedDate"),
  estimatedDuration: int("estimatedDuration"), // in minutes
  actualDuration: int("actualDuration"), // in minutes
  notes: text("notes"),
  completionNotes: text("completionNotes"),
  attachments: text("attachments"), // JSON array of file URLs
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FieldWorkerTask = typeof fieldWorkerTasks.$inferSelect;
export type InsertFieldWorkerTask = typeof fieldWorkerTasks.$inferInsert;

/**
 * Field Worker Activity Logs
 * Real-time logging of field worker activities
 */
export const fieldWorkerActivityLogs = mysqlTable("fieldWorkerActivityLogs", {
  id: int("id").autoincrement().primaryKey(),
  logId: varchar("logId", { length: 50 }).notNull().unique(),
  userId: int("userId").notNull(), // Field worker user ID
  farmId: int("farmId").notNull(),
  fieldId: int("fieldId"),
  taskId: varchar("taskId", { length: 50 }), // Reference to fieldWorkerTasks.taskId
  activityType: mysqlEnum("activityType", [
    "crop_health",
    "pest_monitoring",
    "disease_detection",
    "irrigation",
    "fertilizer_application",
    "weed_control",
    "harvest",
    "equipment_check",
    "soil_test",
    "weather_observation",
    "general_note"
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  observations: text("observations"),
  gpsLatitude: decimal("gpsLatitude", { precision: 10, scale: 8 }),
  gpsLongitude: decimal("gpsLongitude", { precision: 11, scale: 8 }),
  photoUrls: text("photoUrls"), // JSON array of photo URLs
  duration: int("duration"), // in minutes
  status: mysqlEnum("status", ["draft", "submitted", "reviewed"]).default("draft").notNull(),
  reviewedBy: int("reviewedBy"), // Manager user ID
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"),
  syncedToServer: boolean("syncedToServer").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FieldWorkerActivityLog = typeof fieldWorkerActivityLogs.$inferSelect;
export type InsertFieldWorkerActivityLog = typeof fieldWorkerActivityLogs.$inferInsert;

/**
 * Field Worker Time Tracking
 * Clock in/out and work hour tracking
 */
export const fieldWorkerTimeTracking = mysqlTable("fieldWorkerTimeTracking", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  farmId: int("farmId").notNull(),
  clockInTime: timestamp("clockInTime").notNull(),
  clockOutTime: timestamp("clockOutTime"),
  workDuration: int("workDuration"), // in minutes
  taskId: varchar("taskId", { length: 50 }), // Optional: task being worked on
  breakDuration: int("breakDuration").default(0), // in minutes
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FieldWorkerTimeTracking = typeof fieldWorkerTimeTracking.$inferSelect;
export type InsertFieldWorkerTimeTracking = typeof fieldWorkerTimeTracking.$inferInsert;

/**
 * Field Worker Equipment Assignments
 * Track equipment assigned to field workers
 */
export const fieldWorkerEquipmentAssignments = mysqlTable("fieldWorkerEquipmentAssignments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  equipmentId: int("equipmentId").notNull(),
  assignedDate: timestamp("assignedDate").defaultNow().notNull(),
  returnedDate: timestamp("returnedDate"),
  condition: mysqlEnum("condition", ["good", "fair", "poor", "damaged"]).default("good").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FieldWorkerEquipmentAssignment = typeof fieldWorkerEquipmentAssignments.$inferSelect;
export type InsertFieldWorkerEquipmentAssignment = typeof fieldWorkerEquipmentAssignments.$inferInsert;

/**
 * Field Worker Offline Queue
 * Stores activities created offline to sync when online
 */
export const fieldWorkerOfflineQueue = mysqlTable("fieldWorkerOfflineQueue", {
  id: int("id").autoincrement().primaryKey(),
  queueId: varchar("queueId", { length: 50 }).notNull().unique(),
  userId: int("userId").notNull(),
  farmId: int("farmId").notNull(),
  actionType: mysqlEnum("actionType", [
    "create_activity",
    "update_activity",
    "create_task",
    "update_task",
    "clock_in",
    "clock_out"
  ]).notNull(),
  payload: text("payload").notNull(), // JSON payload
  status: mysqlEnum("status", ["pending", "synced", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  syncAttempts: int("syncAttempts").default(0).notNull(),
  lastSyncAttempt: timestamp("lastSyncAttempt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FieldWorkerOfflineQueue = typeof fieldWorkerOfflineQueue.$inferSelect;
export type InsertFieldWorkerOfflineQueue = typeof fieldWorkerOfflineQueue.$inferInsert;

/**
 * Field Worker Dashboard Preferences
 * Store user preferences for dashboard widgets and layout
 */
export const fieldWorkerDashboardPreferences = mysqlTable("fieldWorkerDashboardPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  widgetOrder: text("widgetOrder"), // JSON array of widget IDs in order
  visibleWidgets: text("visibleWidgets"), // JSON array of visible widget IDs
  refreshInterval: int("refreshInterval").default(300000), // in milliseconds (default 5 min)
  theme: varchar("theme", { length: 50 }).default("light"),
  compactMode: boolean("compactMode").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FieldWorkerDashboardPreferences = typeof fieldWorkerDashboardPreferences.$inferSelect;
export type InsertFieldWorkerDashboardPreferences = typeof fieldWorkerDashboardPreferences.$inferInsert;

/**
 * Task History
 * Audit trail for all changes made to tasks
 */
export const taskHistory = mysqlTable("taskHistory", {
  id: int("id").autoincrement().primaryKey(),
  historyId: varchar("historyId", { length: 50 }).notNull().unique(),
  taskId: varchar("taskId", { length: 50 }).notNull(), // Reference to fieldWorkerTasks.taskId
  changedByUserId: int("changedByUserId").notNull(), // User who made the change
  changeType: mysqlEnum("changeType", [
    "created",
    "status_changed",
    "priority_changed",
    "due_date_changed",
    "reassigned",
    "notes_added",
    "completed",
    "cancelled",
    "edited"
  ]).notNull(),
  oldValue: text("oldValue"), // JSON: previous value
  newValue: text("newValue"), // JSON: new value
  fieldChanged: varchar("fieldChanged", { length: 100 }), // e.g., "status", "priority", "dueDate"
  description: text("description"), // Human-readable description of change
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskHistory = typeof taskHistory.$inferSelect;
export type InsertTaskHistory = typeof taskHistory.$inferInsert;


// ============================================================================
// AUDIT LOGS (for tracking data changes)
// ============================================================================
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  entityType: varchar("entityType", { length: 100 }).notNull(), // e.g., "animalType", "cropType", "disease"
  entityId: int("entityId").notNull(),
  action: mysqlEnum("action", ["create", "update", "delete", "import", "export"]).notNull(),
  oldValues: text("oldValues"), // JSON object of previous values
  newValues: text("newValues"), // JSON object of new values
  changedFields: text("changedFields"), // JSON array of field names that changed
  reason: text("reason"), // Optional reason for the change
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ============================================================================
// DATA VALIDATION RULES
// ============================================================================
export const validationRules = mysqlTable("validationRules", {
  id: int("id").autoincrement().primaryKey(),
  entityType: varchar("entityType", { length: 100 }).notNull(), // e.g., "animal", "crop"
  fieldName: varchar("fieldName", { length: 100 }).notNull(),
  ruleType: mysqlEnum("ruleType", ["required", "min", "max", "pattern", "enum", "custom"]).notNull(),
  ruleValue: text("ruleValue"), // JSON value for the rule (e.g., min value, regex pattern)
  errorMessage: text("errorMessage"),
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ValidationRule = typeof validationRules.$inferSelect;
export type InsertValidationRule = typeof validationRules.$inferInsert;

// ============================================================================
// BULK IMPORT JOBS
// ============================================================================
export const bulkImportJobs = mysqlTable("bulkImportJobs", {
  id: int("id").autoincrement().primaryKey(),
  jobId: varchar("jobId", { length: 50 }).notNull().unique(),
  userId: int("userId").notNull(),
  entityType: varchar("entityType", { length: 100 }).notNull(), // e.g., "animalType", "cropType"
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  totalRecords: int("totalRecords").notNull(),
  successCount: int("successCount").default(0).notNull(),
  failureCount: int("failureCount").default(0).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  errorLog: text("errorLog"), // JSON array of errors
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BulkImportJob = typeof bulkImportJobs.$inferSelect;
export type InsertBulkImportJob = typeof bulkImportJobs.$inferInsert;


// ============================================================================
// TIME TRACKER LOGS
// ============================================================================
export const timeTrackerLogs = mysqlTable("timeTrackerLogs", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  workerId: int("workerId").notNull(),
  activityType: varchar("activityType", { length: 100 }).notNull(), // e.g., "crop_health", "irrigation"
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime"),
  durationMinutes: int("durationMinutes"), // Calculated duration in minutes
  notes: text("notes"),
  gpsLatitude: decimal("gpsLatitude", { precision: 10, scale: 8 }),
  gpsLongitude: decimal("gpsLongitude", { precision: 11, scale: 8 }),
  photoUrls: text("photoUrls"), // JSON array of photo URLs
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TimeTrackerLog = typeof timeTrackerLogs.$inferSelect;
export type InsertTimeTrackerLog = typeof timeTrackerLogs.$inferInsert;


// ============================================================================
// FARM PERMISSIONS
// ============================================================================
export const farmPermissions = mysqlTable("farmPermissions", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["viewer", "editor", "admin"]).default("viewer").notNull(),
  grantedBy: int("grantedBy").notNull(), // User ID who granted the permission
  grantedAt: timestamp("grantedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"), // Optional expiration date
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FarmPermission = typeof farmPermissions.$inferSelect;
export type InsertFarmPermission = typeof farmPermissions.$inferInsert;


// ============================================================================
// BULK OPERATION HISTORY
// ============================================================================
export const bulkOperationHistory = mysqlTable("bulkOperationHistory", {
  id: varchar("id", { length: 64 }).primaryKey(), // UUID
  farmId: int("farmId").notNull(),
  userId: int("userId").notNull(),
  operationType: mysqlEnum("operationType", ["batch-edit", "import", "export", "bulk-register"]).notNull(),
  status: mysqlEnum("status", ["pending", "in-progress", "completed", "failed", "cancelled"]).default("pending").notNull(),
  totalItems: int("totalItems").notNull(),
  processedItems: int("processedItems").default(0).notNull(),
  successCount: int("successCount").default(0).notNull(),
  failureCount: int("failureCount").default(0).notNull(),
  errorMessage: text("errorMessage"),
  details: json("details"), // JSON object with operation-specific details
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  duration: int("duration"), // Duration in milliseconds
  retryCount: int("retryCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BulkOperationHistory = typeof bulkOperationHistory.$inferSelect;
export type InsertBulkOperationHistory = typeof bulkOperationHistory.$inferInsert;

// ============================================================================
// OPERATION RETRY LOG
// ============================================================================
export const operationRetryLog = mysqlTable("operationRetryLog", {
  id: int("id").autoincrement().primaryKey(),
  operationId: varchar("operationId", { length: 64 }).notNull(),
  retryAttempt: int("retryAttempt").notNull(),
  status: mysqlEnum("status", ["pending", "in-progress", "completed", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  nextRetryAt: timestamp("nextRetryAt"),
  backoffMultiplier: decimal("backoffMultiplier", { precision: 4, scale: 2 }).default("1.5"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type OperationRetryLog = typeof operationRetryLog.$inferSelect;
export type InsertOperationRetryLog = typeof operationRetryLog.$inferInsert;

// ============================================================================
// OPERATION FAILURE DETAILS
// ============================================================================
export const operationFailureDetails = mysqlTable("operationFailureDetails", {
  id: int("id").autoincrement().primaryKey(),
  operationId: varchar("operationId", { length: 64 }).notNull(),
  itemId: varchar("itemId", { length: 64 }).notNull(),
  itemType: varchar("itemType", { length: 50 }).notNull(), // e.g., "animal", "field", "activity"
  errorCode: varchar("errorCode", { length: 50 }).notNull(),
  errorMessage: text("errorMessage").notNull(),
  itemData: json("itemData"), // Original item data that failed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OperationFailureDetails = typeof operationFailureDetails.$inferSelect;
export type InsertOperationFailureDetails = typeof operationFailureDetails.$inferInsert;


// ============================================================================
// SEARCH ANALYTICS & TRACKING
// ============================================================================
export const searchAnalytics = mysqlTable("searchAnalytics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  query: varchar("query", { length: 255 }).notNull(),
  resultCount: int("resultCount").default(0).notNull(),
  resultClicked: boolean("resultClicked").default(false).notNull(),
  clickedResultId: int("clickedResultId"),
  clickedResultType: varchar("clickedResultType", { length: 50 }), // "animal", "farm", "crop"
  searchDuration: int("searchDuration"), // milliseconds
  filters: json("filters"), // Applied filters as JSON
  sessionId: varchar("sessionId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SearchAnalytics = typeof searchAnalytics.$inferSelect;
export type InsertSearchAnalytics = typeof searchAnalytics.$inferInsert;

// ============================================================================
// SEARCH SUGGESTIONS & CACHE
// ============================================================================
export const searchSuggestions = mysqlTable("searchSuggestions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  suggestionText: varchar("suggestionText", { length: 255 }).notNull(),
  suggestionType: varchar("suggestionType", { length: 50 }).notNull(), // "recent", "trending", "popular"
  frequency: int("frequency").default(1).notNull(),
  lastUsedAt: timestamp("lastUsedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SearchSuggestions = typeof searchSuggestions.$inferSelect;
export type InsertSearchSuggestions = typeof searchSuggestions.$inferInsert;

// ============================================================================
// TRENDING SEARCHES
// ============================================================================
export const trendingSearches = mysqlTable("trendingSearches", {
  id: int("id").autoincrement().primaryKey(),
  query: varchar("query", { length: 255 }).notNull(),
  searchCount: int("searchCount").default(1).notNull(),
  clickThroughRate: decimal("clickThroughRate", { precision: 5, scale: 2 }).default("0"),
  averageResultCount: decimal("averageResultCount", { precision: 8, scale: 2 }).default("0"),
  period: varchar("period", { length: 20 }).notNull(), // "daily", "weekly", "monthly"
  rank: int("rank").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TrendingSearches = typeof trendingSearches.$inferSelect;
export type InsertTrendingSearches = typeof trendingSearches.$inferInsert;


// ============================================================================
// SAVED QUERIES (User's saved searches for quick access)
// ============================================================================
export const savedQueries = mysqlTable("savedQueries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "My Active Cattle"
  description: text("description"),
  query: varchar("query", { length: 255 }).notNull(),
  filters: text("filters"), // JSON stringified filters
  category: varchar("category", { length: 50 }), // "animal", "farm", "crop"
  icon: varchar("icon", { length: 50 }), // icon name for UI
  isPinned: boolean("isPinned").default(false).notNull(),
  usageCount: int("usageCount").default(0).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SavedQueries = typeof savedQueries.$inferSelect;
export type InsertSavedQueries = typeof savedQueries.$inferInsert;

// ============================================================================
// SEARCH FEEDBACK (User feedback on search results for ranking improvement)
// ============================================================================
export const searchFeedback = mysqlTable("searchFeedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  searchId: int("searchId"), // Reference to searchAnalytics
  query: varchar("query", { length: 255 }).notNull(),
  resultId: int("resultId"), // ID of the result (animal, farm, crop)
  resultType: varchar("resultType", { length: 50 }).notNull(), // "animal", "farm", "crop"
  resultTitle: varchar("resultTitle", { length: 255 }),
  rating: int("rating"), // 1-5 star rating
  helpful: boolean("helpful"), // thumbs up/down
  relevanceScore: decimal("relevanceScore", { precision: 5, scale: 2 }), // calculated score
  clickedAt: timestamp("clickedAt"),
  feedbackType: varchar("feedbackType", { length: 50 }), // "thumbsUp", "thumbsDown", "rating"
  comment: text("comment"), // optional user comment
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SearchFeedback = typeof searchFeedback.$inferSelect;
export type InsertSearchFeedback = typeof searchFeedback.$inferInsert;


// ============================================================================
// MULTI-SPECIES LIVESTOCK SUPPORT
// ============================================================================

/**
 * Species templates with standardized configurations for each livestock type
 * Supports: Cattle, Poultry, Goats, Sheep, Pigs, Rabbits, Horses
 */
export const speciesTemplates = mysqlTable("speciesTemplates", {
  id: int("id").autoincrement().primaryKey(),
  speciesName: varchar("speciesName", { length: 100 }).notNull().unique(), // cattle, poultry, goat, sheep, pig, rabbit, horse
  commonNames: varchar("commonNames", { length: 500 }), // comma-separated common names
  description: text("description"),
  icon: varchar("icon", { length: 100 }), // icon name for UI
  averageLifespanYears: int("averageLifespanYears"),
  matureWeightKg: decimal("matureWeightKg", { precision: 8, scale: 2 }),
  productionType: varchar("productionType", { length: 100 }), // milk, meat, eggs, wool, fiber, etc.
  gestationPeriodDays: int("gestationPeriodDays"),
  averageLitterSize: int("averageLitterSize"),
  sexualMaturityMonths: int("sexualMaturityMonths"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SpeciesTemplate = typeof speciesTemplates.$inferSelect;
export type InsertSpeciesTemplate = typeof speciesTemplates.$inferInsert;

/**
 * Breed database with comprehensive breed information
 * Supports 1200+ breeds across all species
 */
export const breeds = mysqlTable("breeds", {
  id: int("id").autoincrement().primaryKey(),
  speciesId: int("speciesId").notNull(),
  breedName: varchar("breedName", { length: 255 }).notNull(),
  breedCode: varchar("breedCode", { length: 50 }).unique(),
  origin: varchar("origin", { length: 255 }), // country of origin
  description: text("description"),
  characteristics: text("characteristics"), // JSON: color, size, temperament, etc.
  productionCapabilities: text("productionCapabilities"), // JSON: milk yield, egg production, etc.
  adaptability: varchar("adaptability", { length: 100 }), // climate/environment suitability
  rarity: mysqlEnum("rarity", ["common", "uncommon", "rare", "endangered"]).default("common"),
  imageUrl: varchar("imageUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Breed = typeof breeds.$inferSelect;
export type InsertBreed = typeof breeds.$inferInsert;

/**
 * Species-specific health protocols and vaccination schedules
 */
export const healthProtocols = mysqlTable("healthProtocols", {
  id: int("id").autoincrement().primaryKey(),
  speciesId: int("speciesId").notNull(),
  protocolName: varchar("protocolName", { length: 255 }).notNull(),
  description: text("description"),
  protocolType: mysqlEnum("protocolType", ["vaccination", "treatment", "prevention", "monitoring"]).notNull(),
  recommendedAge: varchar("recommendedAge", { length: 100 }), // e.g., "8 weeks", "6 months"
  frequency: varchar("frequency", { length: 100 }), // e.g., "once", "annually", "every 6 months"
  disease: varchar("disease", { length: 255 }), // disease being prevented/treated
  vaccine: varchar("vaccine", { length: 255 }), // vaccine name if applicable
  dosage: varchar("dosage", { length: 255 }),
  administrationRoute: varchar("administrationRoute", { length: 100 }), // oral, injection, etc.
  sideEffects: text("sideEffects"),
  contraindications: text("contraindications"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HealthProtocol = typeof healthProtocols.$inferSelect;
export type InsertHealthProtocol = typeof healthProtocols.$inferInsert;

/**
 * Production metrics templates by species
 * Tracks species-specific outputs: milk, eggs, wool, meat, etc.
 */
export const productionMetricsTemplates = mysqlTable("productionMetricsTemplates", {
  id: int("id").autoincrement().primaryKey(),
  speciesId: int("speciesId").notNull(),
  metricName: varchar("metricName", { length: 255 }).notNull(), // e.g., "Daily Milk Yield", "Egg Production"
  metricType: mysqlEnum("metricType", ["milk", "eggs", "wool", "meat", "fiber", "reproduction", "other"]).notNull(),
  unit: varchar("unit", { length: 100 }).notNull(), // liters, pieces, kg, etc.
  benchmarkMin: decimal("benchmarkMin", { precision: 8, scale: 2 }),
  benchmarkAverage: decimal("benchmarkAverage", { precision: 8, scale: 2 }),
  benchmarkMax: decimal("benchmarkMax", { precision: 8, scale: 2 }),
  frequency: varchar("frequency", { length: 100 }), // daily, weekly, monthly
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductionMetricsTemplate = typeof productionMetricsTemplates.$inferSelect;
export type InsertProductionMetricsTemplate = typeof productionMetricsTemplates.$inferInsert;

/**
 * Species-specific production records
 * Tracks actual production metrics for each animal
 */
export const speciesProductionRecords = mysqlTable("speciesProductionRecords", {
  id: int("id").autoincrement().primaryKey(),
  animalId: int("animalId").notNull(),
  metricTemplateId: int("metricTemplateId").notNull(),
  recordDate: date("recordDate").notNull(),
  value: decimal("value", { precision: 8, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 100 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SpeciesProductionRecord = typeof speciesProductionRecords.$inferSelect;
export type InsertSpeciesProductionRecord = typeof speciesProductionRecords.$inferInsert;

/**
 * Breeding calculators and genetic information
 */
export const breedingCalculators = mysqlTable("breedingCalculators", {
  id: int("id").autoincrement().primaryKey(),
  speciesId: int("speciesId").notNull(),
  breedId: int("breedId"),
  calculatorName: varchar("calculatorName", { length: 255 }).notNull(),
  description: text("description"),
  calculationType: mysqlEnum("calculationType", ["inbreeding", "expectedProgeny", "geneticValue", "heterosis"]).notNull(),
  formula: text("formula"), // JSON: calculation parameters
  parameters: text("parameters"), // JSON: required inputs
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BreedingCalculator = typeof breedingCalculators.$inferSelect;
export type InsertBreedingCalculator = typeof breedingCalculators.$inferInsert;

/**
 * Feed and nutrition recommendations by species
 */
export const feedRecommendations = mysqlTable("feedRecommendations", {
  id: int("id").autoincrement().primaryKey(),
  speciesId: int("speciesId").notNull(),
  breedId: int("breedId"),
  ageGroup: varchar("ageGroup", { length: 100 }).notNull(), // e.g., "0-3 months", "3-6 months", "adult"
  productionStage: varchar("productionStage", { length: 100 }), // e.g., "growing", "lactating", "pregnant"
  feedType: varchar("feedType", { length: 255 }).notNull(), // e.g., "starter feed", "grower feed"
  dailyQuantityKg: decimal("dailyQuantityKg", { precision: 8, scale: 2 }),
  proteinPercentage: decimal("proteinPercentage", { precision: 5, scale: 2 }),
  energyMcalKg: decimal("energyMcalKg", { precision: 8, scale: 2 }),
  fiberPercentage: decimal("fiberPercentage", { precision: 5, scale: 2 }),
  fatPercentage: decimal("fatPercentage", { precision: 5, scale: 2 }),
  calciumPercentage: decimal("calciumPercentage", { precision: 5, scale: 2 }),
  phosphorusPercentage: decimal("phosphorusPercentage", { precision: 5, scale: 2 }),
  ingredients: text("ingredients"), // JSON: list of recommended ingredients
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FeedRecommendation = typeof feedRecommendations.$inferSelect;
export type InsertFeedRecommendation = typeof feedRecommendations.$inferInsert;

/**
 * Species-specific animal records
 * Extends the basic animals table with species-specific fields
 */
export const speciesAnimalRecords = mysqlTable("speciesAnimalRecords", {
  id: int("id").autoincrement().primaryKey(),
  animalId: int("animalId").notNull().unique(),
  speciesId: int("speciesId").notNull(),
  breedId: int("breedId"),
  productionType: varchar("productionType", { length: 100 }), // milk, meat, eggs, etc.
  registrationNumber: varchar("registrationNumber", { length: 255 }),
  pedigree: text("pedigree"), // JSON: family tree
  geneticMarkers: text("geneticMarkers"), // JSON: genetic test results
  currentWeight: decimal("currentWeight", { precision: 8, scale: 2 }),
  lastWeightDate: date("lastWeightDate"),
  bodyConditionScore: decimal("bodyConditionScore", { precision: 3, scale: 1 }), // 1-5 or 1-9 scale
  reproductiveStatus: varchar("reproductiveStatus", { length: 100 }), // virgin, pregnant, lactating, etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SpeciesAnimalRecord = typeof speciesAnimalRecords.$inferSelect;
export type InsertSpeciesAnimalRecord = typeof speciesAnimalRecords.$inferInsert;


// ============================================================================
// FINANCIAL MANAGEMENT & COST ANALYSIS
// ============================================================================

/**
 * Expense tracking for all farm operations
 */
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  animalId: int("animalId"), // Optional: link to specific animal
  cropId: int("cropId"), // Optional: link to specific crop
  expenseType: mysqlEnum("expenseType", [
    "feed",
    "medication",
    "labor",
    "equipment",
    "utilities",
    "transport",
    "veterinary",
    "fertilizer",
    "seeds",
    "pesticides",
    "water",
    "rent",
    "insurance",
    "maintenance",
    "other"
  ]).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }),
  unitCost: decimal("unitCost", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("GHS").notNull(),
  vendor: varchar("vendor", { length: 255 }),
  invoiceNumber: varchar("invoiceNumber", { length: 100 }),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "partial"]).default("pending").notNull(),
  paymentDate: date("paymentDate"),
  expenseDate: date("expenseDate").notNull(),
  notes: text("notes"),
  attachmentUrl: varchar("attachmentUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

/**
 * Revenue tracking from farm products and sales
 */
export const revenue = mysqlTable("revenue", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  animalId: int("animalId"), // Optional: link to specific animal
  cropId: int("cropId"), // Optional: link to specific crop
  revenueType: mysqlEnum("revenueType", [
    "animal_sale",
    "milk_production",
    "egg_production",
    "wool_production",
    "meat_sale",
    "crop_sale",
    "produce_sale",
    "breeding_service",
    "other"
  ]).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("GHS").notNull(),
  buyer: varchar("buyer", { length: 255 }),
  invoiceNumber: varchar("invoiceNumber", { length: 100 }),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "partial"]).default("pending").notNull(),
  paymentDate: date("paymentDate"),
  revenueDate: date("revenueDate").notNull(),
  notes: text("notes"),
  attachmentUrl: varchar("attachmentUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Revenue = typeof revenue.$inferSelect;
export type InsertRevenue = typeof revenue.$inferInsert;

/**
 * Budget planning and forecasting
 */
export const budgets = mysqlTable("budgets", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  budgetName: varchar("budgetName", { length: 255 }).notNull(),
  budgetType: mysqlEnum("budgetType", ["annual", "quarterly", "monthly", "project"]).notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  totalBudget: decimal("totalBudget", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("GHS").notNull(),
  status: mysqlEnum("status", ["draft", "approved", "active", "completed"]).default("draft").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = typeof budgets.$inferInsert;

/**
 * Budget line items
 */
export const budgetLineItems = mysqlTable("budgetLineItems", {
  id: int("id").autoincrement().primaryKey(),
  budgetId: int("budgetId").notNull(),
  expenseType: varchar("expenseType", { length: 100 }).notNull(),
  description: varchar("description", { length: 500 }),
  budgetedAmount: decimal("budgetedAmount", { precision: 12, scale: 2 }).notNull(),
  actualAmount: decimal("actualAmount", { precision: 12, scale: 2 }),
  variance: decimal("variance", { precision: 12, scale: 2 }),
  percentageUsed: decimal("percentageUsed", { precision: 5, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BudgetLineItem = typeof budgetLineItems.$inferSelect;
export type InsertBudgetLineItem = typeof budgetLineItems.$inferInsert;

/**
 * Invoices for tracking payments
 */
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 100 }).unique().notNull(),
  invoiceType: mysqlEnum("invoiceType", ["expense", "revenue"]).notNull(),
  vendorOrBuyer: varchar("vendorOrBuyer", { length: 255 }).notNull(),
  invoiceDate: date("invoiceDate").notNull(),
  dueDate: date("dueDate"),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  paidAmount: decimal("paidAmount", { precision: 12, scale: 2 }).default(0),
  currency: varchar("currency", { length: 3 }).default("GHS").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["draft", "sent", "pending", "partial", "paid", "overdue", "cancelled"]).default("draft").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 100 }),
  notes: text("notes"),
  attachmentUrl: varchar("attachmentUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Invoice line items
 */
export const invoiceLineItems = mysqlTable("invoiceLineItems", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  lineTotal: decimal("lineTotal", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;
export type InsertInvoiceLineItem = typeof invoiceLineItems.$inferInsert;

/**
 * Financial summary and KPIs by period
 */
export const financialSummaries = mysqlTable("financialSummaries", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  period: varchar("period", { length: 20 }).notNull(), // YYYY-MM or YYYY-Q1, etc.
  totalExpenses: decimal("totalExpenses", { precision: 12, scale: 2 }).notNull(),
  totalRevenue: decimal("totalRevenue", { precision: 12, scale: 2 }).notNull(),
  netProfit: decimal("netProfit", { precision: 12, scale: 2 }).notNull(),
  profitMargin: decimal("profitMargin", { precision: 5, scale: 2 }),
  roi: decimal("roi", { precision: 5, scale: 2 }),
  costPerHectare: decimal("costPerHectare", { precision: 10, scale: 2 }),
  revenuePerHectare: decimal("revenuePerHectare", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("GHS").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FinancialSummary = typeof financialSummaries.$inferSelect;
export type InsertFinancialSummary = typeof financialSummaries.$inferInsert;



/**
 * Tax records for accounting and reporting
 */
export const taxRecords = mysqlTable("taxRecords", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  taxYear: int("taxYear").notNull(),
  totalIncome: decimal("totalIncome", { precision: 12, scale: 2 }).notNull(),
  totalExpenses: decimal("totalExpenses", { precision: 12, scale: 2 }).notNull(),
  taxableIncome: decimal("taxableIncome", { precision: 12, scale: 2 }).notNull(),
  taxRate: decimal("taxRate", { precision: 5, scale: 2 }),
  taxAmount: decimal("taxAmount", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("GHS").notNull(),
  status: mysqlEnum("status", ["draft", "filed", "paid", "pending"]).default("draft").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TaxRecord = typeof taxRecords.$inferSelect;
export type InsertTaxRecord = typeof taxRecords.$inferInsert;


// ============================================================================
// VETERINARY INTEGRATION & APPOINTMENT MANAGEMENT
// ============================================================================

/**
 * Veterinarian directory - stores vet information and clinic details
 */
export const veterinarians = mysqlTable("veterinarians", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Reference to users table (role: veterinarian)
  licenseNumber: varchar("licenseNumber", { length: 100 }).notNull(),
  specialization: varchar("specialization", { length: 255 }), // e.g., "Livestock", "Poultry", "Fish"
  clinicName: varchar("clinicName", { length: 255 }).notNull(),
  clinicPhone: varchar("clinicPhone", { length: 20 }).notNull(),
  clinicEmail: varchar("clinicEmail", { length: 320 }),
  clinicAddress: text("clinicAddress"),
  clinicCity: varchar("clinicCity", { length: 100 }),
  clinicRegion: varchar("clinicRegion", { length: 100 }), // Ghana region
  yearsOfExperience: int("yearsOfExperience"),
  consultationFee: decimal("consultationFee", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("GHS"),
  isVerified: boolean("isVerified").default(false),
  verificationDate: timestamp("verificationDate"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"), // 0-5 stars
  totalReviews: int("totalReviews").default(0),
  availability: text("availability"), // JSON: { mon: "09:00-17:00", tue: "09:00-17:00", ... }
  telemedicineAvailable: boolean("telemedicineAvailable").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Veterinarian = typeof veterinarians.$inferSelect;
export type InsertVeterinarian = typeof veterinarians.$inferInsert;

/**
 * Veterinary appointments - tracks vet consultations and clinic visits
 */
export const vetAppointments = mysqlTable("vetAppointments", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  veterinarianId: int("veterinarianId").notNull(),
  animalId: int("animalId"), // Optional - can be null for farm-level consultation
  appointmentType: mysqlEnum("appointmentType", ["clinic_visit", "farm_visit", "telemedicine", "emergency"]).notNull(),
  appointmentDate: timestamp("appointmentDate").notNull(),
  duration: int("duration").default(30), // minutes
  status: mysqlEnum("status", ["scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show"]).default("scheduled"),
  reason: text("reason"), // Chief complaint/reason for visit
  notes: text("notes"),
  diagnosis: text("diagnosis"),
  treatment: text("treatment"),
  recommendations: text("recommendations"),
  followUpDate: timestamp("followUpDate"),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "partially_paid", "waived"]).default("pending"),
  telemedicineLink: varchar("telemedicineLink", { length: 500 }), // Zoom/Meet link for remote consultations
  recordingUrl: varchar("recordingUrl", { length: 500 }), // Recording of telemedicine session
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VetAppointment = typeof vetAppointments.$inferSelect;
export type InsertVetAppointment = typeof vetAppointments.$inferInsert;

/**
 * Prescriptions - tracks medications prescribed by veterinarians
 */
export const prescriptions = mysqlTable("prescriptions", {
  id: int("id").autoincrement().primaryKey(),
  appointmentId: int("appointmentId").notNull(),
  farmId: int("farmId").notNull(),
  animalId: int("animalId").notNull(),
  veterinarianId: int("veterinarianId").notNull(),
  medicationName: varchar("medicationName", { length: 255 }).notNull(),
  dosage: varchar("dosage", { length: 100 }).notNull(), // e.g., "500mg", "2ml"
  frequency: varchar("frequency", { length: 100 }).notNull(), // e.g., "twice daily", "every 8 hours"
  duration: int("duration").notNull(), // days
  route: mysqlEnum("route", ["oral", "injection", "topical", "inhalation", "other"]).notNull(),
  quantity: int("quantity").notNull(), // number of doses
  instructions: text("instructions"), // Special instructions
  prescriptionDate: timestamp("prescriptionDate").defaultNow().notNull(),
  expiryDate: timestamp("expiryDate").notNull(), // Prescription validity period
  status: mysqlEnum("status", ["active", "fulfilled", "expired", "cancelled"]).default("active"),
  fulfillmentDate: timestamp("fulfillmentDate"),
  fulfillmentVendor: varchar("fulfillmentVendor", { length: 255 }), // Pharmacy/supplier name
  cost: decimal("cost", { precision: 10, scale: 2 }),
  complianceStatus: mysqlEnum("complianceStatus", ["not_started", "in_progress", "completed", "abandoned"]).default("not_started"),
  complianceNotes: text("complianceNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = typeof prescriptions.$inferInsert;

/**
 * Prescription compliance tracking - monitors adherence to prescribed medications
 */
export const prescriptionCompliance = mysqlTable("prescriptionCompliance", {
  id: int("id").autoincrement().primaryKey(),
  prescriptionId: int("prescriptionId").notNull(),
  doseDate: date("doseDate").notNull(),
  doseTime: varchar("doseTime", { length: 10 }), // HH:MM format
  administered: boolean("administered").default(false),
  dosesGiven: int("dosesGiven").default(0),
  notes: text("notes"),
  recordedBy: varchar("recordedBy", { length: 255 }), // Farm worker name
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PrescriptionCompliance = typeof prescriptionCompliance.$inferSelect;
export type InsertPrescriptionCompliance = typeof prescriptionCompliance.$inferInsert;

/**
 * Vet recommendations history - tracks advice and recommendations from veterinarians
 */
export const vetRecommendations = mysqlTable("vetRecommendations", {
  id: int("id").autoincrement().primaryKey(),
  appointmentId: int("appointmentId").notNull(),
  farmId: int("farmId").notNull(),
  veterinarianId: int("veterinarianId").notNull(),
  animalId: int("animalId"),
  recommendationType: mysqlEnum("recommendationType", ["nutrition", "housing", "breeding", "vaccination", "parasite_control", "disease_prevention", "management", "other"]).notNull(),
  recommendation: text("recommendation").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium"),
  implementationDate: timestamp("implementationDate"),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "not_applicable"]).default("pending"),
  outcome: text("outcome"), // Result of implementing the recommendation
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VetRecommendation = typeof vetRecommendations.$inferSelect;
export type InsertVetRecommendation = typeof vetRecommendations.$inferInsert;

/**
 * Insurance claims - tracks veterinary insurance claims for farm operations
 */
export const insuranceClaims = mysqlTable("insuranceClaims", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  appointmentId: int("appointmentId"),
  claimNumber: varchar("claimNumber", { length: 100 }).notNull().unique(),
  insuranceProvider: varchar("insuranceProvider", { length: 255 }).notNull(),
  policyNumber: varchar("policyNumber", { length: 100 }).notNull(),
  claimType: mysqlEnum("claimType", ["veterinary_service", "medication", "emergency", "preventive", "other"]).notNull(),
  claimAmount: decimal("claimAmount", { precision: 10, scale: 2 }).notNull(),
  claimDate: timestamp("claimDate").defaultNow().notNull(),
  submissionDate: timestamp("submissionDate"),
  status: mysqlEnum("status", ["draft", "submitted", "under_review", "approved", "rejected", "paid"]).default("draft"),
  approvalAmount: decimal("approvalAmount", { precision: 10, scale: 2 }),
  rejectionReason: text("rejectionReason"),
  paymentDate: timestamp("paymentDate"),
  paymentAmount: decimal("paymentAmount", { precision: 10, scale: 2 }),
  supportingDocuments: text("supportingDocuments"), // JSON array of file URLs
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InsuranceClaim = typeof insuranceClaims.$inferSelect;
export type InsertInsuranceClaim = typeof insuranceClaims.$inferInsert;

/**
 * Vet communication - direct messaging between farmers and veterinarians
 */
export const vetCommunications = mysqlTable("vetCommunications", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  veterinarianId: int("veterinarianId").notNull(),
  senderId: int("senderId").notNull(), // User ID of sender
  messageType: mysqlEnum("messageType", ["text", "image", "document", "audio"]).default("text"),
  message: text("message"),
  attachmentUrl: varchar("attachmentUrl", { length: 500 }),
  isRead: boolean("isRead").default(false),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VetCommunication = typeof vetCommunications.$inferSelect;
export type InsertVetCommunication = typeof vetCommunications.$inferInsert;

/**
 * Telemedicine sessions - tracks video consultation sessions
 */
export const telemedicineSessions = mysqlTable("telemedicineSessions", {
  id: int("id").autoincrement().primaryKey(),
  appointmentId: int("appointmentId").notNull(),
  farmId: int("farmId").notNull(),
  veterinarianId: int("veterinarianId").notNull(),
  sessionType: mysqlEnum("sessionType", ["consultation", "follow_up", "emergency"]).default("consultation"),
  platform: mysqlEnum("platform", ["zoom", "google_meet", "custom_webrtc"]).notNull(),
  sessionLink: varchar("sessionLink", { length: 500 }).notNull(),
  startTime: timestamp("startTime"),
  endTime: timestamp("endTime"),
  duration: int("duration"), // minutes
  recordingUrl: varchar("recordingUrl", { length: 500 }),
  transcriptUrl: varchar("transcriptUrl", { length: 500 }),
  status: mysqlEnum("status", ["scheduled", "in_progress", "completed", "cancelled", "no_show"]).default("scheduled"),
  participantCount: int("participantCount").default(2),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TelemedicineSession = typeof telemedicineSessions.$inferSelect;
export type InsertTelemedicineSession = typeof telemedicineSessions.$inferInsert;


/**
 * Veterinarian Reviews - tracks farmer ratings and reviews of veterinarians
 */
export const vetReviews = mysqlTable("vetReviews", {
  id: int("id").autoincrement().primaryKey(),
  veterinarianId: int("veterinarianId").notNull(), // Reference to veterinarians table
  farmId: int("farmId").notNull(), // Reference to farms table
  userId: int("userId").notNull(), // Reference to users table (farmer)
  appointmentId: int("appointmentId"), // Optional - reference to vetAppointments table
  rating: int("rating").notNull(), // 1-5 stars
  reviewTitle: varchar("reviewTitle", { length: 255 }).notNull(),
  reviewText: text("reviewText"), // Detailed review
  professionalismRating: int("professionalismRating"), // 1-5
  communicationRating: int("communicationRating"), // 1-5
  priceValueRating: int("priceValueRating"), // 1-5
  treatmentEffectivenessRating: int("treatmentEffectivenessRating"), // 1-5
  animalSpecies: varchar("animalSpecies", { length: 100 }), // Species treated
  treatmentType: varchar("treatmentType", { length: 255 }), // Type of treatment/service
  wouldRecommend: boolean("wouldRecommend").default(true),
  helpfulCount: int("helpfulCount").default(0), // Number of farmers who found review helpful
  unhelpfulCount: int("unhelpfulCount").default(0), // Number of farmers who found review unhelpful
  isVerified: boolean("isVerified").default(false), // Verified purchase/appointment
  isAnonymous: boolean("isAnonymous").default(false), // Hide farmer name
  status: mysqlEnum("status", ["pending", "approved", "rejected", "hidden"]).default("pending"), // Moderation status
  moderationNotes: text("moderationNotes"), // Admin notes for rejection
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VetReview = typeof vetReviews.$inferSelect;
export type InsertVetReview = typeof vetReviews.$inferInsert;

/**
 * Veterinarian Review Statistics - cached statistics for performance
 */
export const vetReviewStats = mysqlTable("vetReviewStats", {
  id: int("id").autoincrement().primaryKey(),
  veterinarianId: int("veterinarianId").notNull().unique(), // Reference to veterinarians table
  totalReviews: int("totalReviews").default(0),
  averageRating: decimal("averageRating", { precision: 3, scale: 2 }).default("0.00"), // 0-5
  averageProfessionalism: decimal("averageProfessionalism", { precision: 3, scale: 2 }).default("0.00"),
  averageCommunication: decimal("averageCommunication", { precision: 3, scale: 2 }).default("0.00"),
  averagePriceValue: decimal("averagePriceValue", { precision: 3, scale: 2 }).default("0.00"),
  averageTreatmentEffectiveness: decimal("averageTreatmentEffectiveness", { precision: 3, scale: 2 }).default("0.00"),
  recommendationPercentage: int("recommendationPercentage").default(0), // % who would recommend
  fiveStarCount: int("fiveStarCount").default(0),
  fourStarCount: int("fourStarCount").default(0),
  threeStarCount: int("threeStarCount").default(0),
  twoStarCount: int("twoStarCount").default(0),
  oneStarCount: int("oneStarCount").default(0),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VetReviewStats = typeof vetReviewStats.$inferSelect;
export type InsertVetReviewStats = typeof vetReviewStats.$inferInsert;


// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

/**
 * Push Notification Subscriptions - stores browser push notification endpoints
 */
export const pushSubscriptions = mysqlTable("pushSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  endpoint: varchar("endpoint", { length: 500 }).notNull().unique(),
  auth: varchar("auth", { length: 255 }).notNull(),
  p256dh: varchar("p256dh", { length: 255 }).notNull(),
  expirationTime: varchar("expirationTime", { length: 50 }),
  userAgent: varchar("userAgent", { length: 500 }),
  isActive: boolean("isActive").default(true).notNull(),
  lastUsed: timestamp("lastUsed"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

/**
 * Notification Delivery Log - tracks sent notifications and delivery status
 */
export const notificationDeliveryLog = mysqlTable("notificationDeliveryLog", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  notificationType: varchar("notificationType", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  channel: mysqlEnum("channel", ["push", "email", "sms"]).notNull(),
  deliveryStatus: mysqlEnum("deliveryStatus", ["pending", "sent", "delivered", "failed", "bounced"]).default("pending").notNull(),
  deliveryError: text("deliveryError"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  relatedId: int("relatedId"),
  relatedType: varchar("relatedType", { length: 100 }),
  actionUrl: varchar("actionUrl", { length: 500 }),
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  retryCount: int("retryCount").default(0).notNull(),
  nextRetryAt: timestamp("nextRetryAt"),
  sentAt: timestamp("sentAt"),
  deliveredAt: timestamp("deliveredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationDeliveryLog = typeof notificationDeliveryLog.$inferSelect;
export type InsertNotificationDeliveryLog = typeof notificationDeliveryLog.$inferInsert;

/**
 * User Notification Preferences - stores user notification settings
 */
export const userNotificationPreferences = mysqlTable("userNotificationPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  breedingReminders: boolean("breedingReminders").default(true).notNull(),
  stockAlerts: boolean("stockAlerts").default(true).notNull(),
  weatherAlerts: boolean("weatherAlerts").default(true).notNull(),
  vaccinationReminders: boolean("vaccinationReminders").default(true).notNull(),
  harvestReminders: boolean("harvestReminders").default(true).notNull(),
  marketplaceUpdates: boolean("marketplaceUpdates").default(true).notNull(),
  iotSensorAlerts: boolean("iotSensorAlerts").default(true).notNull(),
  trainingReminders: boolean("trainingReminders").default(true).notNull(),
  pushNotificationsEnabled: boolean("pushNotificationsEnabled").default(true).notNull(),
  emailNotificationsEnabled: boolean("emailNotificationsEnabled").default(true).notNull(),
  smsNotificationsEnabled: boolean("smsNotificationsEnabled").default(false).notNull(),
  quietHoursEnabled: boolean("quietHoursEnabled").default(false).notNull(),
  quietHoursStart: varchar("quietHoursStart", { length: 5 }), // HH:MM format
  quietHoursEnd: varchar("quietHoursEnd", { length: 5 }), // HH:MM format
  timezone: varchar("timezone", { length: 100 }).default("UTC").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserNotificationPreferences = typeof userNotificationPreferences.$inferSelect;
export type InsertUserNotificationPreferences = typeof userNotificationPreferences.$inferInsert;


/**
 * Notification Logs - stores all notification delivery history for analytics and tracking
 */
export const notificationLogs = mysqlTable("notificationLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  notificationType: varchar("notificationType", { length: 100 }).notNull(), // breeding, vaccination, harvest, stock, weather, order, iot, training
  subject: varchar("subject", { length: 255 }),
  message: text("message").notNull(),
  channel: mysqlEnum("channel", ["push", "email", "sms"]).notNull(),
  status: mysqlEnum("status", ["sent", "delivered", "failed", "pending", "bounced"]).default("pending").notNull(),
  failureReason: text("failureReason"),
  retryCount: int("retryCount").default(0).notNull(),
  maxRetries: int("maxRetries").default(3).notNull(),
  nextRetryAt: timestamp("nextRetryAt"),
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  recipientPhone: varchar("recipientPhone", { length: 20 }),
  templateId: varchar("templateId", { length: 100 }),
  templateVariables: text("templateVariables"), // JSON object with template variables
  relatedId: int("relatedId"), // ID of related entity (animal, crop, order, etc.)
  relatedType: varchar("relatedType", { length: 100 }), // Type of related entity
  metadata: text("metadata"), // JSON object with additional metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  sentAt: timestamp("sentAt"),
  deliveredAt: timestamp("deliveredAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationLog = typeof notificationLogs.$inferSelect;
export type InsertNotificationLog = typeof notificationLogs.$inferInsert;

/**
 * Blockchain Supply Chain - tracks product origin and certification
 */
export const supplyChainRecords = mysqlTable("supplyChainRecords", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  farmId: int("farmId").notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  productType: varchar("productType", { length: 100 }).notNull(), // crop, livestock, processed
  batchNumber: varchar("batchNumber", { length: 100 }).notNull().unique(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(), // kg, liters, units, etc.
  harvestDate: date("harvestDate").notNull(),
  productionMethod: varchar("productionMethod", { length: 100 }), // organic, conventional, etc.
  certifications: text("certifications"), // JSON array of certification IDs
  blockchainHash: varchar("blockchainHash", { length: 256 }), // Hash of blockchain record
  status: mysqlEnum("status", ["pending", "verified", "certified", "archived"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupplyChainRecord = typeof supplyChainRecords.$inferSelect;
export type InsertSupplyChainRecord = typeof supplyChainRecords.$inferInsert;

/**
 * Blockchain Transactions - immutable record of all supply chain events
 */
export const blockchainTransactions = mysqlTable("blockchainTransactions", {
  id: int("id").autoincrement().primaryKey(),
  supplyChainId: int("supplyChainId").notNull(),
  transactionHash: varchar("transactionHash", { length: 256 }).notNull().unique(),
  previousHash: varchar("previousHash", { length: 256 }),
  eventType: mysqlEnum("eventType", ["production", "processing", "transport", "storage", "sale", "certification"]).notNull(),
  actor: varchar("actor", { length: 100 }).notNull(), // farmer, processor, transporter, retailer
  actorId: int("actorId").notNull(),
  location: varchar("location", { length: 255 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  temperature: decimal("temperature", { precision: 5, scale: 2 }), // For cold chain tracking
  humidity: decimal("humidity", { precision: 5, scale: 2 }),
  notes: text("notes"),
  documentHash: varchar("documentHash", { length: 256 }), // Hash of supporting documents
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BlockchainTransaction = typeof blockchainTransactions.$inferSelect;
export type InsertBlockchainTransaction = typeof blockchainTransactions.$inferInsert;

/**
 * Product Certifications - tracks certifications and compliance
 */
export const productCertifications = mysqlTable("productCertifications", {
  id: int("id").autoincrement().primaryKey(),
  supplyChainId: int("supplyChainId").notNull(),
  certificationType: varchar("certificationType", { length: 100 }).notNull(), // organic, fair-trade, rainforest-alliance, etc.
  certifyingBody: varchar("certifyingBody", { length: 255 }).notNull(),
  certificateNumber: varchar("certificateNumber", { length: 100 }).notNull().unique(),
  issueDate: date("issueDate").notNull(),
  expiryDate: date("expiryDate").notNull(),
  verificationUrl: varchar("verificationUrl", { length: 500 }),
  documentHash: varchar("documentHash", { length: 256 }), // Hash of certification document
  status: mysqlEnum("status", ["valid", "expired", "revoked", "pending"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductCertification = typeof productCertifications.$inferSelect;
export type InsertProductCertification = typeof productCertifications.$inferInsert;

/**
 * Audit Trail - comprehensive audit log for compliance and transparency
 */
export const auditTrail = mysqlTable("auditTrail", {
  id: int("id").autoincrement().primaryKey(),
  supplyChainId: int("supplyChainId").notNull(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 100 }).notNull(), // create, update, verify, certify, etc.
  entityType: varchar("entityType", { length: 100 }).notNull(), // supplyChainRecord, transaction, certification
  entityId: int("entityId").notNull(),
  previousValues: text("previousValues"), // JSON object of previous values
  newValues: text("newValues"), // JSON object of new values
  changeReason: text("changeReason"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditTrailEntry = typeof auditTrail.$inferSelect;
export type InsertAuditTrailEntry = typeof auditTrail.$inferInsert;


/**
 * Expense receipts for document tracking and OCR
 */
export const expenseReceipts = mysqlTable("expenseReceipts", {
  id: int("id").autoincrement().primaryKey(),
  expenseId: int("expenseId").notNull(),
  farmId: int("farmId").notNull(),
  receiptUrl: varchar("receiptUrl", { length: 500 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSize: int("fileSize"), // in bytes
  mimeType: varchar("mimeType", { length: 50 }),
  // OCR extracted data
  extractedAmount: decimal("extractedAmount", { precision: 12, scale: 2 }),
  extractedDate: date("extractedDate"),
  extractedVendor: varchar("extractedVendor", { length: 255 }),
  extractedDescription: text("extractedDescription"),
  ocrConfidence: decimal("ocrConfidence", { precision: 5, scale: 2 }), // 0-100
  ocrProcessed: boolean("ocrProcessed").default(false).notNull(),
  uploadedBy: int("uploadedBy").notNull(), // userId
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExpenseReceipt = typeof expenseReceipts.$inferSelect;
export type InsertExpenseReceipt = typeof expenseReceipts.$inferInsert;

/**
 * Financial forecasts based on historical trends
 */
export const financialForecasts = mysqlTable("financialForecasts", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  forecastType: mysqlEnum("forecastType", ["revenue", "expense", "profit"]).notNull(),
  category: varchar("category", { length: 100 }), // expense type or revenue type
  forecastPeriod: varchar("forecastPeriod", { length: 20 }).notNull(), // YYYY-MM or YYYY-Q1
  historicalAverage: decimal("historicalAverage", { precision: 12, scale: 2 }).notNull(),
  forecastedAmount: decimal("forecastedAmount", { precision: 12, scale: 2 }).notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(), // 0-100
  trend: mysqlEnum("trend", ["increasing", "decreasing", "stable"]).notNull(),
  trendPercentage: decimal("trendPercentage", { precision: 5, scale: 2 }), // % change
  dataPointsUsed: int("dataPointsUsed"), // number of historical periods used
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FinancialForecast = typeof financialForecasts.$inferSelect;
export type InsertFinancialForecast = typeof financialForecasts.$inferInsert;

/**
 * Budget variance alerts
 */
export const budgetVarianceAlerts = mysqlTable("budgetVarianceAlerts", {
  id: int("id").autoincrement().primaryKey(),
  budgetLineItemId: int("budgetLineItemId").notNull(),
  farmId: int("farmId").notNull(),
  varianceAmount: decimal("varianceAmount", { precision: 12, scale: 2 }).notNull(),
  variancePercentage: decimal("variancePercentage", { precision: 5, scale: 2 }).notNull(),
  alertType: mysqlEnum("alertType", ["over_budget", "approaching_budget", "under_budget"]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  acknowledged: boolean("acknowledged").default(false).notNull(),
  acknowledgedBy: int("acknowledgedBy"),
  acknowledgedAt: timestamp("acknowledgedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BudgetVarianceAlert = typeof budgetVarianceAlerts.$inferSelect;
export type InsertBudgetVarianceAlert = typeof budgetVarianceAlerts.$inferInsert;

/**
 * Animal profitability tracking
 */
export const animalProfitability = mysqlTable("animalProfitability", {
  id: int("id").autoincrement().primaryKey(),
  farmId: int("farmId").notNull(),
  animalTypeId: int("animalTypeId").notNull(), // Reference to animal type/breed
  animalType: varchar("animalType", { length: 100 }).notNull(), // e.g., "Cattle", "Poultry", "Goat"
  period: varchar("period", { length: 20 }).notNull(), // YYYY-MM or YYYY-Q1
  totalAnimals: int("totalAnimals").notNull(),
  totalRevenue: decimal("totalRevenue", { precision: 12, scale: 2 }).notNull(),
  totalExpenses: decimal("totalExpenses", { precision: 12, scale: 2 }).notNull(),
  netProfit: decimal("netProfit", { precision: 12, scale: 2 }).notNull(),
  profitMargin: decimal("profitMargin", { precision: 5, scale: 2 }).notNull(), // percentage
  revenuePerAnimal: decimal("revenuePerAnimal", { precision: 12, scale: 2 }).notNull(),
  costPerAnimal: decimal("costPerAnimal", { precision: 12, scale: 2 }).notNull(),
  roi: decimal("roi", { precision: 5, scale: 2 }), // Return on Investment percentage
  currency: varchar("currency", { length: 3 }).default("GHS").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AnimalProfitability = typeof animalProfitability.$inferSelect;
export type InsertAnimalProfitability = typeof animalProfitability.$inferInsert;
