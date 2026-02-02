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
