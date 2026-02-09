import { mysqlTable, mysqlSchema, AnyMySqlColumn, int, mysqlEnum, text, timestamp, foreignKey, varchar, date, index, time, bigint, json, decimal, datetime, longtext, tinyint, boolean } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const accountStatusHistory = mysqlTable("accountStatusHistory", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	previousStatus: mysqlEnum(['active','disabled','suspended']).notNull(),
	newStatus: mysqlEnum(['active','disabled','suspended']).notNull(),
	reason: text(),
	changedBy: int().notNull(),
	changedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const alertHistory = mysqlTable("alertHistory", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id),
	farmId: int().notNull().references(() => farms.id),
	alertType: mysqlEnum(['health','water_quality','weather','maintenance','other']).notNull(),
	severity: mysqlEnum(['critical','warning','info']).notNull(),
	title: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	isRead: tinyint().default(0).notNull(),
	readAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	isAcknowledged: tinyint().default(0).notNull(),
	acknowledgedAt: timestamp({ mode: 'string' }),
	acknowledgedBy: int().references(() => users.id),
	actionTaken: text(),
	responseTimeMinutes: int(),
});

export const alerts = mysqlTable("alerts", {
	id: int().autoincrement().notNull(),
	deviceId: int().notNull(),
	farmId: int().notNull(),
	alertType: varchar({ length: 100 }).notNull(),
	message: text(),
	severity: mysqlEnum(['info','warning','critical']).default('warning'),
	isResolved: tinyint().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	resolvedAt: timestamp({ mode: 'string' }),
});

export const animalHealthRecords = mysqlTable("animalHealthRecords", {
	id: int().autoincrement().notNull(),
	animalId: int().notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	recordDate: date({ mode: 'string' }).notNull(),
	eventType: mysqlEnum(['vaccination','treatment','illness','checkup','other']).notNull(),
	details: text(),
	veterinarianUserId: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const animalTypes = mysqlTable("animalTypes", {
	id: int().autoincrement().notNull(),
	typeName: varchar({ length: 255 }).notNull(),
	description: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const animals = mysqlTable("animals", {
	id: int().autoincrement().notNull(),
	farmId: int().notNull(),
	typeId: int().notNull(),
	uniqueTagId: varchar({ length: 100 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	birthDate: date({ mode: 'string' }),
	gender: mysqlEnum(['male','female','unknown']),
	breed: varchar({ length: 255 }),
	status: mysqlEnum(['active','sold','culled','deceased']).default('active'),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("animals_uniqueTagId_unique").on(table.uniqueTagId),
]);

export const appointments = mysqlTable("appointments", {
	id: varchar({ length: 50 }).notNull(),
	vetId: varchar("vet_id", { length: 50 }).references(() => veterinarians.id, { onDelete: "cascade" } ),
	farmId: varchar("farm_id", { length: 50 }),
	animalId: varchar("animal_id", { length: 50 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	appointmentDate: date("appointment_date", { mode: 'string' }).notNull(),
	appointmentTime: time("appointment_time").notNull(),
	consultationType: varchar("consultation_type", { length: 50 }),
	status: varchar({ length: 50 }).default('pending'),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
});

export const auditLogs = mysqlTable("auditLogs", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	entityType: varchar({ length: 100 }).notNull(),
	entityId: int().notNull(),
	action: mysqlEnum(['create','update','delete','import','export']).notNull(),
	oldValues: text(),
	newValues: text(),
	changedFields: text(),
	reason: text(),
	ipAddress: varchar({ length: 45 }),
	userAgent: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_entityType_entityId").on(table.entityType, table.entityId),
	index("idx_userId").on(table.userId),
	index("idx_createdAt").on(table.createdAt),
]);


export const breedingRecords = mysqlTable("breedingRecords", {
	id: int().autoincrement().notNull(),
	animalId: int().notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	breedingDate: date({ mode: 'string' }).notNull(),
	sireId: int(),
	damId: int(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	expectedDueDate: date({ mode: 'string' }),
	outcome: mysqlEnum(['pending','successful','unsuccessful','aborted']).default('pending'),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const budgetAlerts = mysqlTable("budget_alerts", {
	id: int().autoincrement().notNull(),
	budgetId: int("budget_id").notNull(),
	farmId: int("farm_id").notNull(),
	alertType: mysqlEnum("alert_type", ['warning','critical','exceeded']).notNull(),
	thresholdPercentage: int("threshold_percentage").default(80).notNull(),
	currentSpending: decimal("current_spending", { precision: 12, scale: 2 }).notNull(),
	budgetAmount: decimal("budget_amount", { precision: 12, scale: 2 }).notNull(),
	isRead: tinyint("is_read").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const budgets = mysqlTable("budgets", {
	id: int().autoincrement().notNull(),
	farmId: int().notNull(),
	name: varchar({ length: 255 }).notNull(),
	category: varchar({ length: 255 }).notNull(),
	allocatedAmount: decimal({ precision: 12, scale: 2 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date({ mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date({ mode: 'string' }).notNull(),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const bulkImportJobs = mysqlTable("bulkImportJobs", {
	id: int().autoincrement().notNull(),
	jobId: varchar({ length: 50 }).notNull(),
	userId: int().notNull(),
	entityType: varchar({ length: 100 }).notNull(),
	fileName: varchar({ length: 255 }).notNull(),
	fileUrl: text().notNull(),
	totalRecords: int().notNull(),
	successCount: int().default(0).notNull(),
	failureCount: int().default(0).notNull(),
	status: mysqlEnum(['pending','processing','completed','failed']).default('pending').notNull(),
	errorLog: text(),
	startedAt: timestamp({ mode: 'string' }),
	completedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_userId").on(table.userId),
	index("idx_status").on(table.status),
	index("jobId").on(table.jobId),
]);

export const calendarSyncs = mysqlTable("calendar_syncs", {
	id: varchar({ length: 50 }).notNull(),
	vetId: varchar("vet_id", { length: 50 }).references(() => veterinarians.id, { onDelete: "cascade" } ),
	calendarProvider: varchar("calendar_provider", { length: 100 }),
	email: varchar({ length: 255 }),
	accessToken: varchar("access_token", { length: 500 }),
	syncFrequency: varchar("sync_frequency", { length: 50 }),
	lastSync: datetime("last_sync", { mode: 'string'}),
	status: varchar({ length: 50 }).default('active'),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
});

export const challenges = mysqlTable("challenges", {
	id: int().autoincrement().notNull(),
	farmId: int().notNull(),
	reportedByUserId: int().notNull(),
	challengeDescription: text().notNull(),
	category: varchar({ length: 100 }),
	severity: mysqlEnum(['low','medium','high','critical']).default('medium'),
	status: mysqlEnum(['open','in_progress','resolved','closed']).default('open'),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	reportedDate: date({ mode: 'string' }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const complianceLogs = mysqlTable("compliance_logs", {
	id: int().autoincrement().notNull(),
	userId: varchar({ length: 255 }).notNull(),
	farmId: int(),
	eventType: varchar({ length: 100 }).notNull(),
	eventCategory: varchar({ length: 50 }).notNull(),
	description: text(),
	severity: mysqlEnum(['low','medium','high','critical']).default('medium'),
	ipAddress: varchar({ length: 45 }),
	userAgent: text(),
	status: varchar({ length: 50 }),
	complianceControl: varchar({ length: 100 }),
	iso27001Section: varchar({ length: 50 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
},
(table) => [
	index("idx_userId").on(table.userId),
	index("idx_eventType").on(table.eventType),
	index("idx_createdAt").on(table.createdAt),
	index("idx_compliance").on(table.complianceControl, table.iso27001Section),
]);

export const cropCycles = mysqlTable("cropCycles", {
	id: int().autoincrement().notNull(),
	farmId: int().notNull(),
	cropId: int().notNull(),
	varietyName: varchar({ length: 255 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	plantingDate: date({ mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	expectedHarvestDate: date({ mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	actualHarvestDate: date({ mode: 'string' }),
	status: mysqlEnum(['planning','planted','growing','harvesting','completed','abandoned']).default('planning'),
	areaPlantedHectares: decimal({ precision: 10, scale: 2 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	expectedYieldKg: decimal({ precision: 10, scale: 2 }),
});

export const cropHealthRecords = mysqlTable("cropHealthRecords", {
	id: int().autoincrement().notNull(),
	cycleId: int().notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	recordDate: date({ mode: 'string' }).notNull(),
	issueType: mysqlEnum(['disease','pest','nutrient_deficiency','weather_damage','other']).notNull(),
	issueName: varchar({ length: 255 }).notNull(),
	severity: mysqlEnum(['low','medium','high','critical']).notNull(),
	affectedArea: varchar({ length: 255 }),
	symptoms: text(),
	photoUrls: text(),
	notes: text(),
	status: mysqlEnum(['active','treated','resolved']).default('active'),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const cropTreatments = mysqlTable("cropTreatments", {
	id: int().autoincrement().notNull(),
	healthRecordId: int().notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	treatmentDate: date({ mode: 'string' }).notNull(),
	treatmentType: varchar({ length: 255 }).notNull(),
	productName: varchar({ length: 255 }),
	dosage: varchar({ length: 255 }),
	applicationMethod: varchar({ length: 255 }),
	cost: decimal({ precision: 10, scale: 2 }),
	appliedByUserId: int(),
	effectiveness: mysqlEnum(['not_evaluated','ineffective','partially_effective','effective','very_effective']).default('not_evaluated'),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const crops = mysqlTable("crops", {
	id: int().autoincrement().notNull(),
	cropName: varchar({ length: 255 }).notNull(),
	scientificName: varchar({ length: 255 }),
	description: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	variety: varchar({ length: 255 }),
	cultivarParameters: text(),
});

export const customRoles = mysqlTable("customRoles", {
	id: int().autoincrement().notNull(),
	roleName: varchar({ length: 100 }).notNull(),
	displayName: varchar({ length: 255 }).notNull(),
	description: text(),
	isSystemRole: tinyint().default(0).notNull(),
	createdBy: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("customRoles_roleName_unique").on(table.roleName),
]);

export const deviceFingerprints = mysqlTable("device_fingerprints", {
	id: int().autoincrement().notNull(),
	userId: varchar({ length: 255 }).notNull(),
	farmId: int().notNull().references(() => farms.id, { onDelete: "cascade" } ),
	deviceHash: varchar({ length: 255 }).notNull(),
	deviceName: varchar({ length: 255 }),
	browserType: varchar({ length: 100 }),
	osType: varchar({ length: 100 }),
	ipAddress: varchar({ length: 45 }),
	userAgent: text(),
	isVerified: tinyint().default(0),
	lastSeenAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("idx_userId_farmId").on(table.userId, table.farmId),
	index("idx_deviceHash").on(table.deviceHash),
	index("deviceHash").on(table.deviceHash),
]);

export const enrollments = mysqlTable("enrollments", {
	id: int().autoincrement().notNull(),
	sessionId: int().notNull(),
	userId: int().notNull(),
	attendanceStatus: mysqlEnum(['enrolled','attended','absent','dropped']).default('enrolled'),
	feedbackScore: int(),
	feedbackNotes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const expenses = mysqlTable("expenses", {
	id: int().autoincrement().notNull(),
	farmId: int().notNull(),
	animalId: int(),
	cropId: int(),
	expenseType: mysqlEnum(['feed','medication','labor','equipment','utilities','transport','veterinary','fertilizer','seeds','pesticides','water','rent','insurance','maintenance','other']).notNull(),
	description: varchar({ length: 500 }).notNull(),
	amount: decimal({ precision: 12, scale: 2 }).notNull(),
	quantity: decimal({ precision: 10, scale: 2 }),
	unitCost: decimal({ precision: 10, scale: 2 }),
	currency: varchar({ length: 3 }).default('GHS').notNull(),
	vendor: varchar({ length: 255 }),
	invoiceNumber: varchar({ length: 100 }),
	paymentStatus: mysqlEnum(['pending','paid','partial']).default('pending').notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	paymentDate: date({ mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	expenseDate: date({ mode: 'string' }).notNull(),
	notes: text(),
	attachmentUrl: varchar({ length: 500 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const extensionAgents = mysqlTable("extension_agents", {
	id: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	specialty: varchar({ length: 100 }).notNull(),
	region: varchar({ length: 100 }).notNull(),
	phone: varchar({ length: 20 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	officeLocation: varchar("office_location", { length: 255 }),
	certification: varchar({ length: 100 }),
	verified: tinyint().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
});

export const farmActivities = mysqlTable("farmActivities", {
	id: int().autoincrement().notNull(),
	farmId: int().notNull(),
	activityType: mysqlEnum(['crop_planting','livestock_addition','weather_alert','harvest','feeding','health_check','other']).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	metadata: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const farmAssets = mysqlTable("farmAssets", {
	id: int().autoincrement().notNull(),
	farmId: int().notNull().references(() => farms.id),
	assetType: varchar({ length: 100 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	purchaseDate: date({ mode: 'string' }).notNull(),
	purchaseValue: decimal({ precision: 10, scale: 2 }),
	currentValue: decimal({ precision: 10, scale: 2 }),
	maintenanceSchedule: varchar({ length: 50 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	lastMaintenanceDate: date({ mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	nextMaintenanceDate: date({ mode: 'string' }),
	status: varchar({ length: 20 }).default('active'),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const farmExpenses = mysqlTable("farmExpenses", {
	id: int().autoincrement().notNull(),
	farmId: int().notNull().references(() => farms.id),
	category: varchar({ length: 50 }).notNull(),
	amount: decimal({ precision: 10, scale: 2 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	expenseDate: date({ mode: 'string' }).notNull(),
	description: text(),
	vendor: varchar({ length: 255 }),
	invoiceNumber: varchar({ length: 100 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const farmRevenue = mysqlTable("farmRevenue", {
	id: int().autoincrement().notNull(),
	farmId: int().notNull().references(() => farms.id),
	source: varchar({ length: 50 }).notNull(),
	amount: decimal({ precision: 10, scale: 2 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	saleDate: date({ mode: 'string' }).notNull(),
	buyer: varchar({ length: 255 }),
	quantity: varchar({ length: 100 }),
	unit: varchar({ length: 50 }),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const farmWorkers = mysqlTable("farmWorkers", {
	id: int().autoincrement().notNull(),
	farmId: int().notNull().references(() => farms.id),
	name: varchar({ length: 255 }).notNull(),
	role: varchar({ length: 100 }).notNull(),
	contact: varchar({ length: 20 }),
	email: varchar({ length: 255 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	hireDate: date({ mode: 'string' }).notNull(),
	salary: decimal({ precision: 10, scale: 2 }),
	salaryFrequency: varchar({ length: 20 }),
	status: varchar({ length: 20 }).default('active'),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

// Duplicate removed - using farmWorkers from earlier in schema
// export const farmWorkers = mysqlTable("farm_workers", {
//	id: int().autoincrement().notNull(),
//	userId: varchar({ length: 255 }).notNull(),
//	farmId: int().notNull().references(() => farms.id, { onDelete: "cascade" } ),
//	role: mysqlEnum(['owner','manager','worker','viewer']).default('worker'),
//	permissions: json(),
//	status: mysqlEnum(['active','inactive','suspended']).default('active'),
//	assignedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
//	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
//	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
// },
// (table) => [
//	index("unique_user_farm").on(table.userId, table.farmId),
//	index("idx_userId").on(table.userId),
//	index("idx_farmId").on(table.farmId),
//	index("idx_status").on(table.status),
// ]);


export const farms = mysqlTable("farms", {
	id: int().autoincrement().notNull(),
	farmerUserId: int().notNull(),
	farmName: varchar({ length: 255 }).notNull(),
	location: varchar({ length: 255 }),
});

export const fertilizerApplications = mysqlTable("fertilizerApplications", {
	id: int().autoincrement().notNull(),
	cycleId: int().notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	applicationDate: date({ mode: 'string' }).notNull(),
	fertilizerType: varchar({ length: 255 }).notNull(),
	quantityKg: decimal({ precision: 10, scale: 2 }).notNull(),
	appliedByUserId: int(),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const fieldWorkerActivityLogs = mysqlTable("fieldWorkerActivityLogs", {
	id: int().autoincrement().notNull(),
	logId: varchar({ length: 50 }).notNull(),
	userId: int().notNull(),
	farmId: int().notNull(),
	fieldId: int(),
	taskId: varchar({ length: 50 }),
	activityType: mysqlEnum(['crop_health','pest_monitoring','disease_detection','irrigation','fertilizer_application','weed_control','harvest','equipment_check','soil_test','weather_observation','general_note']).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	observations: text(),
	gpsLatitude: decimal({ precision: 10, scale: 8 }),
	gpsLongitude: decimal({ precision: 11, scale: 8 }),
	photoUrls: text(),
	duration: int(),
	status: mysqlEnum(['draft','submitted','reviewed']).default('draft').notNull(),
	reviewedBy: int(),
	reviewedAt: timestamp({ mode: 'string' }),
	reviewNotes: text(),
	syncedToServer: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("logId").on(table.logId),
]);

export const fishPondActivities = mysqlTable("fishPondActivities", {
	id: int().autoincrement().notNull(),
	pondId: int().notNull().references(() => fishPonds.id),
	activityType: varchar({ length: 50 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	activityDate: date({ mode: 'string' }).notNull(),
	waterTemperature: decimal({ precision: 5, scale: 2 }),
	phLevel: decimal({ precision: 3, scale: 1 }),
	dissolvedOxygen: decimal({ precision: 5, scale: 2 }),
	feedAmount: decimal({ precision: 10, scale: 2 }),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const fishPonds = mysqlTable("fishPonds", {
	id: int().autoincrement().notNull(),
	farmId: int().notNull().references(() => farms.id),
	pondName: varchar({ length: 255 }).notNull(),
	sizeSquareMeters: decimal({ precision: 10, scale: 2 }),
	depthMeters: decimal({ precision: 5, scale: 2 }),
	waterSource: varchar({ length: 100 }),
	stockingDensity: varchar({ length: 100 }),
	status: varchar({ length: 20 }).default('active'),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const fishStockingRecords = mysqlTable("fishStockingRecords", {
	id: int().autoincrement().notNull(),
	pondId: int().notNull().references(() => fishPonds.id),
	species: varchar({ length: 100 }).notNull(),
	fingerlings: int().notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	stockingDate: date({ mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	expectedHarvestDate: date({ mode: 'string' }),
	status: varchar({ length: 20 }).default('stocked'),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const geofenceZones = mysqlTable("geofence_zones", {
	id: int().autoincrement().notNull(),
	userId: varchar({ length: 255 }).notNull(),
	farmId: int().notNull().references(() => farms.id, { onDelete: "cascade" } ),
	zoneName: varchar({ length: 255 }).notNull(),
	latitude: decimal({ precision: 10, scale: 8 }).notNull(),
	longitude: decimal({ precision: 11, scale: 8 }).notNull(),
	radiusMeters: int().default(1000),
	isActive: tinyint().default(1),
	alertOnExit: tinyint().default(1),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("idx_userId").on(table.userId),
	index("idx_farmId").on(table.farmId),
	index("idx_location").on(table.latitude, table.longitude),
]);

export const incidentPlaybooks = mysqlTable("incident_playbooks", {
	id: int().autoincrement().notNull(),
	farmId: int().notNull().references(() => farms.id, { onDelete: "cascade" } ),
	playbookName: varchar({ length: 255 }).notNull(),
	description: text(),
	incidentType: varchar({ length: 100 }).notNull(),
	severity: mysqlEnum(['low','medium','high','critical']).notNull(),
	triggerConditions: json(),
	responseSteps: json(),
	escalationLevels: json(),
	notificationRecipients: json(),
	isActive: tinyint().default(1),
	createdBy: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("idx_farmId_incidentType").on(table.farmId, table.incidentType),
]);

export const incidentResponses = mysqlTable("incident_responses", {
	id: int().autoincrement().notNull(),
	farmId: int().notNull().references(() => farms.id, { onDelete: "cascade" } ),
	playbookId: int().notNull().references(() => incidentPlaybooks.id, { onDelete: "cascade" } ),
	incidentType: varchar({ length: 100 }).notNull(),
	severity: mysqlEnum(['low','medium','high','critical']).notNull(),
	triggerReason: text(),
	status: mysqlEnum(['triggered','in_progress','escalated','resolved','closed']).default('triggered'),
	currentEscalationLevel: int().default(1),
	assignedTo: varchar({ length: 255 }),
	notificationsSent: json(),
	responseActions: json(),
	resolvedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("idx_farmId_status").on(table.farmId, table.status),
	index("idx_severity").on(table.severity),
]);

export const inventoryAlerts = mysqlTable("inventoryAlerts", {
	id: int().autoincrement().notNull(),
	sellerId: int().notNull(),
	productId: int().notNull().references(() => marketplaceProducts.id, { onDelete: "cascade" } ),
	threshold: decimal({ precision: 10, scale: 2 }).notNull(),
	isActive: tinyint().default(1).notNull(),
	lastAlertSent: timestamp({ mode: 'string' }),
	alertFrequencyHours: int().default(24).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const inventoryAuditLogs = mysqlTable("inventory_audit_logs", {
	id: int().autoincrement().notNull(),
	productId: int("product_id").notNull().references(() => marketplaceProducts.id, { onDelete: "cascade" } ),
	userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	action: varchar({ length: 100 }).notNull(),
	oldValue: varchar("old_value", { length: 500 }),
	newValue: varchar("new_value", { length: 500 }),
	reason: varchar({ length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const inventoryForecasts = mysqlTable("inventory_forecasts", {
	id: int().autoincrement().notNull(),
	productId: int("product_id").notNull().references(() => marketplaceProducts.id, { onDelete: "cascade" } ),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	forecastDate: date("forecast_date", { mode: 'string' }).notNull(),
	projectedStock: decimal("projected_stock", { precision: 15, scale: 2 }).notNull(),
	projectedSales: decimal("projected_sales", { precision: 15, scale: 2 }),
	forecastMethod: varchar("forecast_method", { length: 50 }),
	confidence: decimal({ precision: 3, scale: 0 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const inventoryItems = mysqlTable("inventory_items", {
	id: int().autoincrement().notNull(),
	productId: int("product_id").notNull().references(() => marketplaceProducts.id, { onDelete: "cascade" } ),
	currentStock: decimal("current_stock", { precision: 15, scale: 2 }).default('0').notNull(),
	reservedStock: decimal("reserved_stock", { precision: 15, scale: 2 }).default('0'),
	availableStock: decimal("available_stock", { precision: 15, scale: 2 }).default('0'),
	minimumThreshold: decimal("minimum_threshold", { precision: 15, scale: 2 }).notNull(),
	reorderQuantity: decimal("reorder_quantity", { precision: 15, scale: 2 }),
	lastRestockedAt: timestamp("last_restocked_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const inventoryTransactions = mysqlTable("inventory_transactions", {
	id: int().autoincrement().notNull(),
	productId: int("product_id").notNull().references(() => marketplaceProducts.id, { onDelete: "cascade" } ),
	transactionType: varchar("transaction_type", { length: 50 }).notNull(),
	quantity: decimal({ precision: 15, scale: 2 }).notNull(),
	notes: varchar({ length: 500 }),
	referenceId: int("reference_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const invoices = mysqlTable("invoices", {
	id: int().autoincrement().notNull(),
	farmId: int().notNull(),
	invoiceNumber: varchar({ length: 100 }).notNull(),
	clientName: varchar({ length: 255 }).notNull(),
	items: json().notNull(),
	totalAmount: decimal({ precision: 12, scale: 2 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dueDate: date({ mode: 'string' }).notNull(),
	status: mysqlEnum(['draft','sent','paid','overdue','cancelled']).default('draft').notNull(),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const iotDevices = mysqlTable("iotDevices", {
	id: int().autoincrement().notNull(),
	farmId: int().notNull(),
	deviceSerial: varchar({ length: 100 }).notNull(),
	deviceType: mysqlEnum(['soil_sensor','weather_station','animal_monitor','water_meter','other']).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	installationDate: date({ mode: 'string' }),
	status: mysqlEnum(['active','inactive','maintenance','retired']).default('active'),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("iotDevices_deviceSerial_unique").on(table.deviceSerial),
]);

export const ipWhitelist = mysqlTable("ip_whitelist", {
	id: int().autoincrement().notNull(),
	userId: varchar({ length: 255 }).notNull(),
	farmId: int().references(() => farms.id, { onDelete: "cascade" } ),
	ipAddress: varchar({ length: 45 }).notNull(),
	ipRange: varchar({ length: 45 }),
	description: varchar({ length: 255 }),
	isActive: tinyint().default(1),
	lastUsedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("idx_userId").on(table.userId),
	index("idx_ipAddress").on(table.ipAddress),
	index("idx_farmId").on(table.farmId),
	index("unique_user_ip").on(table.userId, table.ipAddress),
]);

export const irrigationEvents = mysqlTable("irrigation_events", {
	id: int().autoincrement().notNull(),
	scheduleId: int("schedule_id").notNull().references(() => irrigationSchedules.id, { onDelete: "cascade" } ),
	zoneId: int("zone_id").notNull().references(() => irrigationZones.id, { onDelete: "cascade" } ),
	eventType: varchar("event_type", { length: 50 }).notNull(),
	startTime: timestamp("start_time", { mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { mode: 'string' }),
	durationMinutes: int("duration_minutes"),
	waterAppliedLiters: decimal("water_applied_liters", { precision: 15, scale: 2 }),
	reason: varchar({ length: 500 }),
	status: varchar({ length: 50 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const irrigationRecommendations = mysqlTable("irrigation_recommendations", {
	id: int().autoincrement().notNull(),
	zoneId: int("zone_id").notNull().references(() => irrigationZones.id, { onDelete: "cascade" } ),
	recommendationType: varchar("recommendation_type", { length: 50 }).notNull(),
	priority: varchar({ length: 50 }).notNull(),
	reason: varchar({ length: 500 }).notNull(),
	recommendedDurationMinutes: int("recommended_duration_minutes"),
	estimatedWaterNeeded: decimal("estimated_water_needed", { precision: 15, scale: 2 }),
	weatherFactor: decimal("weather_factor", { precision: 5, scale: 2 }),
	soilMoistureFactor: decimal("soil_moisture_factor", { precision: 5, scale: 2 }),
	cropWaterRequirement: decimal("crop_water_requirement", { precision: 10, scale: 2 }),
	acknowledged: tinyint().default(0),
	acknowledgedAt: timestamp("acknowledged_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const irrigationSchedules = mysqlTable("irrigation_schedules", {
	id: int().autoincrement().notNull(),
	zoneId: int("zone_id").notNull().references(() => irrigationZones.id, { onDelete: "cascade" } ),
	scheduleName: varchar("schedule_name", { length: 255 }).notNull(),
	scheduleType: varchar("schedule_type", { length: 50 }).notNull(),
	durationMinutes: int("duration_minutes").notNull(),
	flowRateLitersPerMin: decimal("flow_rate_liters_per_min", { precision: 10, scale: 2 }),
	frequency: varchar({ length: 50 }),
	startTime: varchar("start_time", { length: 8 }),
	endTime: varchar("end_time", { length: 8 }),
	daysOfWeek: varchar("days_of_week", { length: 100 }),
	weatherAdjustment: tinyint("weather_adjustment").default(1),
	enabled: tinyint().default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const irrigationStatistics = mysqlTable("irrigation_statistics", {
	id: int().autoincrement().notNull(),
	zoneId: int("zone_id").notNull().references(() => irrigationZones.id, { onDelete: "cascade" } ),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dateStart: date("date_start", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dateEnd: date("date_end", { mode: 'string' }).notNull(),
	totalWaterAppliedLiters: decimal("total_water_applied_liters", { precision: 15, scale: 2 }).default('0'),
	totalDurationMinutes: int("total_duration_minutes").default(0),
	irrigationEventCount: int("irrigation_event_count").default(0),
	averageMoisture: decimal("average_moisture", { precision: 5, scale: 2 }),
	rainfallMm: decimal("rainfall_mm", { precision: 10, scale: 2 }),
	waterEfficiency: decimal("water_efficiency", { precision: 5, scale: 2 }),
	costEstimate: decimal("cost_estimate", { precision: 10, scale: 2 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const irrigationZones = mysqlTable("irrigation_zones", {
	id: int().autoincrement().notNull(),
	farmId: int("farm_id").notNull().references(() => farms.id, { onDelete: "cascade" } ),
	zoneName: varchar("zone_name", { length: 255 }).notNull(),
	cropType: varchar("crop_type", { length: 100 }).notNull(),
	areaHectares: decimal("area_hectares", { precision: 10, scale: 2 }),
	soilType: varchar("soil_type", { length: 100 }),
	fieldCapacity: decimal("field_capacity", { precision: 5, scale: 2 }),
	wiltingPoint: decimal("wilting_point", { precision: 5, scale: 2 }),
	targetMoisture: decimal("target_moisture", { precision: 5, scale: 2 }),
	minMoisture: decimal("min_moisture", { precision: 5, scale: 2 }),
	maxMoisture: decimal("max_moisture", { precision: 5, scale: 2 }),
	status: varchar({ length: 50 }).default('active'),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const kpiValues = mysqlTable("kpiValues", {
	id: int().autoincrement().notNull(),
	kpiId: int().notNull(),
	farmId: int(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	measurementDate: date({ mode: 'string' }).notNull(),
	actualValue: decimal({ precision: 12, scale: 2 }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const kpis = mysqlTable("kpis", {
	id: int().autoincrement().notNull(),
	kpiName: varchar({ length: 255 }).notNull(),
	description: text(),
	targetValue: decimal({ precision: 12, scale: 2 }),
	unitOfMeasure: varchar({ length: 100 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const lowStockAlerts = mysqlTable("low_stock_alerts", {
	id: int().autoincrement().notNull(),
	productId: int("product_id").notNull().references(() => marketplaceProducts.id, { onDelete: "cascade" } ),
	sellerId: int("seller_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	alertType: varchar("alert_type", { length: 50 }).notNull(),
	currentStock: decimal("current_stock", { precision: 15, scale: 2 }).notNull(),
	minimumThreshold: decimal("minimum_threshold", { precision: 15, scale: 2 }).notNull(),
	acknowledged: tinyint().default(0),
	acknowledgedAt: timestamp("acknowledged_at", { mode: 'string' }),
	acknowledgedBy: int("acknowledged_by").references(() => users.id, { onDelete: "set null" } ),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const marketplaceBulkPricingTiers = mysqlTable("marketplaceBulkPricingTiers", {
	id: int().autoincrement().notNull(),
	productId: int().notNull().references(() => marketplaceProducts.id, { onDelete: "cascade" } ),
	minQuantity: decimal({ precision: 10, scale: 2 }).notNull(),
	maxQuantity: decimal({ precision: 10, scale: 2 }),
	discountPercentage: decimal({ precision: 5, scale: 2 }).notNull(),
	discountedPrice: decimal({ precision: 10, scale: 2 }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const marketplaceCart = mysqlTable("marketplaceCart", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	productId: int().notNull(),
	quantity: decimal({ precision: 10, scale: 2 }).notNull(),
	addedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	expiresAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const marketplaceDeliveryZones = mysqlTable("marketplaceDeliveryZones", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	region: varchar({ length: 100 }).notNull(),
	shippingCost: decimal({ precision: 10, scale: 2 }).notNull(),
	estimatedDays: int().notNull(),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const marketplaceOrderDisputes = mysqlTable("marketplaceOrderDisputes", {
	id: int().autoincrement().notNull(),
	orderId: int().notNull(),
	buyerId: int().notNull(),
	sellerId: int().notNull(),
	reason: varchar({ length: 100 }).notNull(),
	description: text().notNull(),
	evidence: text(),
	status: mysqlEnum(['pending','under_review','resolved','rejected']).default('pending').notNull(),
	resolution: text(),
	adminNotes: text(),
	resolvedBy: int(),
	resolvedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const marketplaceOrderItems = mysqlTable("marketplaceOrderItems", {
	id: int().autoincrement().notNull(),
	orderId: int().notNull(),
	productId: int().notNull(),
	quantity: decimal({ precision: 10, scale: 2 }).notNull(),
	unitPrice: decimal({ precision: 10, scale: 2 }).notNull(),
	subtotal: decimal({ precision: 10, scale: 2 }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const marketplaceOrderReviews = mysqlTable("marketplaceOrderReviews", {
	id: int().autoincrement().notNull(),
	orderId: int().notNull(),
	buyerId: int().notNull(),
	sellerId: int().notNull(),
	rating: int().notNull(),
	comment: text(),
	sellerResponse: text(),
	sellerResponseAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("marketplaceOrderReviews_orderId_unique").on(table.orderId),
]);

export const marketplaceOrders = mysqlTable("marketplaceOrders", {
	id: int().autoincrement().notNull(),
	buyerId: int().notNull(),
	sellerId: int().notNull(),
	orderNumber: varchar({ length: 50 }).notNull(),
	totalAmount: decimal({ precision: 10, scale: 2 }).notNull(),
	status: mysqlEnum(['pending','confirmed','shipped','delivered','cancelled','refunded']).default('pending').notNull(),
	paymentStatus: mysqlEnum(['unpaid','paid','refunded']).default('unpaid').notNull(),
	deliveryAddress: text(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	deliveryDate: date({ mode: 'string' }),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	trackingNumber: varchar({ length: 100 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	estimatedDeliveryDate: date({ mode: 'string' }),
	deliveryZoneId: int(),
	shippingCost: decimal({ precision: 10, scale: 2 }),
},
(table) => [
	index("marketplaceOrders_orderNumber_unique").on(table.orderNumber),
]);

export const marketplaceProductImages = mysqlTable("marketplaceProductImages", {
	id: int().autoincrement().notNull(),
	productId: int().notNull().references(() => marketplaceProducts.id, { onDelete: "cascade" } ),
	imageUrl: varchar({ length: 500 }).notNull(),
	displayOrder: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const marketplaceProductReviews = mysqlTable("marketplaceProductReviews", {
	id: int().autoincrement().notNull(),
	productId: int().notNull().references(() => marketplaceProducts.id, { onDelete: "cascade" } ),
	userId: int().notNull(),
	rating: int().notNull(),
	comment: text(),
	verifiedPurchase: tinyint().default(0).notNull(),
	helpfulCount: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const marketplaceProducts = mysqlTable("marketplaceProducts", {
	id: int().autoincrement().notNull(),
	sellerId: int().notNull(),
	farmId: int(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	category: varchar({ length: 100 }).notNull(),
	productType: varchar({ length: 100 }).notNull(),
	price: decimal({ precision: 10, scale: 2 }).notNull(),
	quantity: decimal({ precision: 10, scale: 2 }).notNull(),
	unit: varchar({ length: 50 }).notNull(),
	imageUrl: varchar({ length: 500 }),
	status: mysqlEnum(['active','inactive','sold_out','discontinued']).default('active').notNull(),
	rating: decimal({ precision: 3, scale: 2 }).default('0'),
	reviewCount: int().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const marketplaceReviews = mysqlTable("marketplaceReviews", {
	id: int().autoincrement().notNull(),
	productId: int().notNull(),
	buyerId: int().notNull(),
	orderId: int(),
	rating: int().notNull(),
	title: varchar({ length: 255 }),
	comment: text(),
	helpful: int().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const marketplaceSellerPayouts = mysqlTable("marketplaceSellerPayouts", {
	id: int().autoincrement().notNull(),
	sellerId: int().notNull(),
	orderId: int().notNull(),
	amount: decimal({ precision: 10, scale: 2 }).notNull(),
	status: mysqlEnum(['pending','processing','completed','failed']).default('pending').notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	payoutDate: date({ mode: 'string' }),
	transactionReference: varchar({ length: 255 }),
	paymentMethod: varchar({ length: 100 }),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const marketplaceTransactions = mysqlTable("marketplaceTransactions", {
	id: int().autoincrement().notNull(),
	orderId: int().notNull(),
	transactionId: varchar({ length: 100 }),
	amount: decimal({ precision: 10, scale: 2 }).notNull(),
	paymentMethod: varchar({ length: 50 }).notNull(),
	status: mysqlEnum(['pending','completed','failed','refunded']).default('pending').notNull(),
	reference: varchar({ length: 255 }),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	completedAt: timestamp({ mode: 'string' }),
},
(table) => [
	index("marketplaceTransactions_transactionId_unique").on(table.transactionId),
]);

export const marketplaceWishlist = mysqlTable("marketplaceWishlist", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	productId: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const mfaBackupCodeUsage = mysqlTable("mfaBackupCodeUsage", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	codeHash: varchar({ length: 255 }).notNull(),
	usedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	ipAddress: varchar({ length: 45 }),
});

export const mfaSettings = mysqlTable("mfa_settings", {
	id: int().autoincrement().notNull(),
	userId: varchar({ length: 255 }).notNull(),
	totpSecret: varchar({ length: 255 }),
	totpEnabled: tinyint().default(0),
	smsPhoneNumber: varchar({ length: 20 }),
	smsEnabled: tinyint().default(0),
	backupCodes: json(),
	lastUsedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("idx_userId").on(table.userId),
	index("userId").on(table.userId),
]);

export const modulePermissions = mysqlTable("modulePermissions", {
	id: int().autoincrement().notNull(),
	moduleName: varchar({ length: 100 }).notNull(),
	displayName: varchar({ length: 255 }).notNull(),
	description: text(),
	category: varchar({ length: 100 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const monitoringVisits = mysqlTable("monitoringVisits", {
	id: int().autoincrement().notNull(),
	farmId: int().notNull(),
	visitorUserId: int().notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	visitDate: date({ mode: 'string' }).notNull(),
	observations: text(),
	photoEvidenceUrl: varchar({ length: 500 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const notificationPreferences = mysqlTable("notificationPreferences", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id),
	emailEnabled: tinyint().default(1).notNull(),
	smsEnabled: tinyint().default(0).notNull(),
	pushEnabled: tinyint().default(1).notNull(),
	phoneNumber: varchar({ length: 20 }),
	criticalAlerts: tinyint().default(1).notNull(),
	warningAlerts: tinyint().default(1).notNull(),
	infoAlerts: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const notificationLogs = mysqlTable("notification_logs", {
	id: varchar({ length: 50 }).notNull(),
	userId: varchar("user_id", { length: 50 }),
	notificationType: varchar("notification_type", { length: 100 }),
	recipientPhone: varchar("recipient_phone", { length: 20 }),
	recipientEmail: varchar("recipient_email", { length: 255 }),
	messageContent: text("message_content"),
	status: varchar({ length: 50 }).default('sent'),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
});

export const orderItems = mysqlTable("orderItems", {
	id: int().autoincrement().notNull(),
	orderId: int().notNull(),
	listingId: int().notNull(),
	quantityOrdered: decimal({ precision: 12, scale: 2 }).notNull(),
	priceAtOrder: decimal({ precision: 10, scale: 2 }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const orders = mysqlTable("orders", {
	id: int().autoincrement().notNull(),
	buyerUserId: int().notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	orderDate: date({ mode: 'string' }).notNull(),
	totalAmount: decimal({ precision: 12, scale: 2 }).notNull(),
	status: mysqlEnum(['pending','confirmed','fulfilled','cancelled']).default('pending'),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const passwordResetRequests = mysqlTable("passwordResetRequests", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	email: varchar({ length: 320 }).notNull(),
	token: varchar({ length: 255 }).notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	used: tinyint().default(0).notNull(),
	usedAt: timestamp({ mode: 'string' }),
	ipAddress: varchar({ length: 45 }),
	userAgent: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("passwordResetRequests_token_unique").on(table.token),
]);

export const performanceMetrics = mysqlTable("performanceMetrics", {
	id: int().autoincrement().notNull(),
	animalId: int().notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	metricDate: date({ mode: 'string' }).notNull(),
	weightKg: decimal({ precision: 8, scale: 2 }),
	milkYieldLiters: decimal({ precision: 8, scale: 2 }),
	eggCount: int(),
	otherMetrics: json(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const performanceAlerts = mysqlTable("performance_alerts", {
	id: int().autoincrement().notNull(),
	userId: varchar({ length: 255 }).notNull(),
	farmId: int().notNull().references(() => farms.id, { onDelete: "cascade" } ),
	alertType: mysqlEnum(['low_activity','low_quality','high_absence','task_overdue','attendance_drop']).notNull(),
	severity: mysqlEnum(['low','medium','high','critical']).default('medium'),
	message: text().notNull(),
	isRead: tinyint().default(0),
	readAt: timestamp({ mode: 'string' }),
	actionTaken: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("idx_userId").on(table.userId),
	index("idx_farmId").on(table.farmId),
	index("idx_severity").on(table.severity),
	index("idx_isRead").on(table.isRead),
	index("idx_createdAt").on(table.createdAt),
]);

export const prescriptions = mysqlTable("prescriptions", {
	id: varchar({ length: 50 }).notNull(),
	vetId: varchar("vet_id", { length: 50 }).references(() => veterinarians.id, { onDelete: "cascade" } ),
	farmId: varchar("farm_id", { length: 50 }),
	animalId: varchar("animal_id", { length: 50 }),
	medicationName: varchar("medication_name", { length: 255 }).notNull(),
	dosage: varchar({ length: 100 }).notNull(),
	frequency: varchar({ length: 100 }).notNull(),
	duration: varchar({ length: 100 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	expiryDate: date("expiry_date", { mode: 'string' }).notNull(),
	status: varchar({ length: 50 }).default('active'),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
});

export const productListings = mysqlTable("productListings", {
	id: int().autoincrement().notNull(),
	farmId: int().notNull(),
	productType: mysqlEnum(['crop','livestock','processed']).notNull(),
	productName: varchar({ length: 255 }).notNull(),
	quantityAvailable: decimal({ precision: 12, scale: 2 }).notNull(),
	unit: varchar({ length: 50 }).notNull(),
	unitPrice: decimal({ precision: 10, scale: 2 }).notNull(),
	description: text(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	listingDate: date({ mode: 'string' }).notNull(),
	status: mysqlEnum(['active','sold_out','delisted']).default('active'),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const recurringExpenseTemplates = mysqlTable("recurring_expense_templates", {
	id: int().autoincrement().notNull(),
	farmId: int("farm_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	category: mysqlEnum(['feed','medication','labor','equipment','utilities','transport','veterinary','fertilizer','seeds','pesticides','water','rent','insurance','maintenance','other']).notNull(),
	description: varchar({ length: 500 }),
	amount: decimal({ precision: 12, scale: 2 }).notNull(),
	frequency: mysqlEnum(['daily','weekly','biweekly','monthly','quarterly','yearly']).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date("end_date", { mode: 'string' }),
	isActive: tinyint("is_active").default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const reportHistory = mysqlTable("reportHistory", {
	id: int().autoincrement().notNull(),
	scheduleId: int().notNull().references(() => reportSchedules.id),
	farmId: int().notNull(),
	reportType: varchar({ length: 50 }).notNull(),
	generatedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	sentAt: timestamp({ mode: 'string' }),
	status: mysqlEnum(['success','failed']).notNull(),
	fileUrl: text(),
	errorMessage: text(),
	recipientCount: int().default(0).notNull(),
	fileSize: int(),
	deliveryStatus: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const reportSchedules = mysqlTable("reportSchedules", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id),
	farmId: int().notNull().references(() => farms.id),
	reportType: mysqlEnum(['financial','livestock','complete','custom']).notNull(),
	frequency: mysqlEnum(['daily','weekly','monthly']).notNull(),
	recipients: text().notNull(),
	isActive: tinyint().default(1).notNull(),
	lastRun: timestamp({ mode: 'string' }),
	nextRun: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const revenue = mysqlTable("revenue", {
	id: int().autoincrement().notNull(),
	farmId: int().notNull(),
	animalId: int(),
	cropId: int(),
	revenueType: mysqlEnum(['animal_sale','milk_production','egg_production','wool_production','meat_sale','crop_sale','produce_sale','breeding_service','other']).notNull(),
	description: varchar({ length: 500 }).notNull(),
	amount: decimal({ precision: 12, scale: 2 }).notNull(),
	quantity: decimal({ precision: 10, scale: 2 }),
	unitPrice: decimal({ precision: 10, scale: 2 }),
	currency: varchar({ length: 3 }).default('GHS').notNull(),
	buyer: varchar({ length: 255 }),
	invoiceNumber: varchar({ length: 100 }),
	paymentStatus: mysqlEnum(['pending','paid','partial']).default('pending').notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	paymentDate: date({ mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	revenueDate: date({ mode: 'string' }).notNull(),
	notes: text(),
	attachmentUrl: varchar({ length: 500 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const rolePermissions = mysqlTable("rolePermissions", {
	id: int().autoincrement().notNull(),
	roleId: int().notNull(),
	permissionId: int().notNull(),
	canView: tinyint().default(0).notNull(),
	canCreate: tinyint().default(0).notNull(),
	canEdit: tinyint().default(0).notNull(),
	canDelete: tinyint().default(0).notNull(),
	canExport: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const securitySettings = mysqlTable("securitySettings", {
	id: int().autoincrement().notNull(),
	settingKey: varchar({ length: 100 }).notNull(),
	settingValue: text().notNull(),
	description: text(),
	updatedBy: int(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});


export const securityAuditMetrics = mysqlTable("security_audit_metrics", {
	id: int().autoincrement().notNull(),
	farmId: int().notNull().references(() => farms.id, { onDelete: "cascade" } ),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	metricDate: date({ mode: 'string' }).notNull(),
	totalLoginAttempts: int().default(0),
	failedLoginAttempts: int().default(0),
	successfulLogins: int().default(0),
	uniqueUsers: int().default(0),
	uniqueDevices: int().default(0),
	suspiciousActivities: int().default(0),
	mfaUsageRate: decimal({ precision: 5, scale: 2 }),
	averageSessionDuration: int(),
	peakAccessTime: varchar({ length: 10 }),
	geographicLocations: int().default(0),
	dataAccessEvents: int().default(0),
	dataModificationEvents: int().default(0),
	complianceScore: decimal({ precision: 5, scale: 2 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
},
(table) => [
	index("unique_farm_date").on(table.farmId, table.metricDate),
	index("idx_farmId_date").on(table.farmId, table.metricDate),
]);

export const sellerVerifications = mysqlTable("sellerVerifications", {
	id: int().autoincrement().notNull(),
	sellerId: int().notNull(),
	documentUrl: text().notNull(),
	documentType: varchar({ length: 100 }).notNull(),
	status: mysqlEnum(['pending','approved','rejected']).default('pending').notNull(),
	submittedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	reviewedAt: timestamp({ mode: 'string' }),
	reviewedBy: int(),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const sensorReadings = mysqlTable("sensorReadings", {
	id: int().autoincrement().notNull(),
	deviceId: int().notNull(),
	readingTimestamp: timestamp({ mode: 'string' }).notNull(),
	readingType: varchar({ length: 100 }).notNull(),
	value: decimal({ precision: 12, scale: 4 }).notNull(),
	unit: varchar({ length: 50 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const soilTests = mysqlTable("soilTests", {
	id: int().autoincrement().notNull(),
	farmId: int().notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	testDate: date({ mode: 'string' }).notNull(),
	phLevel: decimal({ precision: 4, scale: 2 }),
	nitrogenLevel: decimal({ precision: 8, scale: 2 }),
	phosphorusLevel: decimal({ precision: 8, scale: 2 }),
	potassiumLevel: decimal({ precision: 8, scale: 2 }),
	organicMatter: decimal({ precision: 8, scale: 2 }),
	recommendations: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const soilMoistureReadings = mysqlTable("soil_moisture_readings", {
	id: int().autoincrement().notNull(),
	zoneId: int("zone_id").notNull().references(() => irrigationZones.id, { onDelete: "cascade" } ),
	sensorId: int("sensor_id").references(() => iotDevices.id, { onDelete: "set null" } ),
	moisturePercentage: decimal("moisture_percentage", { precision: 5, scale: 2 }).notNull(),
	temperature: decimal({ precision: 5, scale: 2 }),
	conductivity: decimal({ precision: 10, scale: 2 }),
	ph: decimal({ precision: 3, scale: 1 }),
	readingTime: timestamp("reading_time", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const specialistProfiles = mysqlTable("specialistProfiles", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	licenseNumber: varchar({ length: 100 }),
	accreditationStatus: mysqlEnum(['pending','verified','expired','revoked']).default('pending'),
	specialization: varchar({ length: 255 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	licenseExpiryDate: date({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const strategicGoals = mysqlTable("strategicGoals", {
	id: int().autoincrement().notNull(),
	farmId: int().notNull(),
	goalDescription: text().notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date({ mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date({ mode: 'string' }),
	status: mysqlEnum(['planning','in_progress','completed','abandoned']).default('planning'),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const swotAnalysis = mysqlTable("swotAnalysis", {
	id: int().autoincrement().notNull(),
	farmId: int().notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	analysisDate: date({ mode: 'string' }).notNull(),
	strengths: text(),
	weaknesses: text(),
	opportunities: text(),
	threats: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const taskHistory = mysqlTable("taskHistory", {
	id: int().autoincrement().notNull(),
	historyId: varchar({ length: 50 }).notNull(),
	taskId: varchar({ length: 50 }).notNull(),
	changedByUserId: int().notNull(),
	changeType: mysqlEnum(['created','status_changed','priority_changed','due_date_changed','reassigned','notes_added','completed','cancelled','edited']).notNull(),
	oldValue: longtext(),
	newValue: longtext(),
	fieldChanged: varchar({ length: 100 }),
	description: longtext(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_taskId").on(table.taskId),
	index("idx_changedByUserId").on(table.changedByUserId),
	index("idx_createdAt").on(table.createdAt),
	index("historyId").on(table.historyId),
]);

export const telemedicineSessions = mysqlTable("telemedicine_sessions", {
	id: varchar({ length: 50 }).notNull(),
	appointmentId: varchar("appointment_id", { length: 50 }).references(() => appointments.id, { onDelete: "cascade" } ),
	vetId: varchar("vet_id", { length: 50 }).references(() => veterinarians.id, { onDelete: "cascade" } ),
	farmId: varchar("farm_id", { length: 50 }),
	meetingLink: varchar("meeting_link", { length: 500 }),
	platform: varchar({ length: 100 }),
	startTime: datetime("start_time", { mode: 'string'}),
	endTime: datetime("end_time", { mode: 'string'}),
	status: varchar({ length: 50 }).default('scheduled'),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
});

export const themeConfigs = mysqlTable("themeConfigs", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	primaryColor: varchar({ length: 7 }).default('#3b82f6').notNull(),
	secondaryColor: varchar({ length: 7 }).default('#10b981').notNull(),
	accentColor: varchar({ length: 7 }).default('#f59e0b').notNull(),
	backgroundColor: varchar({ length: 7 }).default('#ffffff').notNull(),
	textColor: varchar({ length: 7 }).default('#1f2937').notNull(),
	borderColor: varchar({ length: 7 }).default('#e5e7eb').notNull(),
	fontFamily: varchar({ length: 255 }).default('Inter, system-ui, sans-serif').notNull(),
	fontSize: varchar({ length: 10 }).default('16px').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const timeTrackerLogs = mysqlTable("timeTrackerLogs", {
	id: int().autoincrement().notNull(),
	farmId: int().notNull(),
	workerId: int().notNull(),
	activityType: varchar({ length: 100 }).notNull(),
	startTime: timestamp({ mode: 'string' }).notNull(),
	endTime: timestamp({ mode: 'string' }),
	durationMinutes: int(),
	notes: text(),
	gpsLatitude: decimal({ precision: 10, scale: 8 }),
	gpsLongitude: decimal({ precision: 11, scale: 8 }),
	photoUrls: text(),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const trainingPrograms = mysqlTable("trainingPrograms", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	targetAudience: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const trainingSessions = mysqlTable("trainingSessions", {
	id: int().autoincrement().notNull(),
	programId: int().notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	sessionDate: date({ mode: 'string' }).notNull(),
	location: varchar({ length: 255 }),
	trainerUserId: int(),
	maxParticipants: int(),
	status: mysqlEnum(['scheduled','ongoing','completed','cancelled']).default('scheduled'),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const transportRequests = mysqlTable("transportRequests", {
	id: int().autoincrement().notNull(),
	orderId: int().notNull(),
	transporterUserId: int(),
	pickupLocation: varchar({ length: 255 }).notNull(),
	deliveryLocation: varchar({ length: 255 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	requestDate: date({ mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	estimatedDeliveryDate: date({ mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	actualDeliveryDate: date({ mode: 'string' }),
	status: mysqlEnum(['requested','accepted','in_transit','delivered','cancelled']).default('requested'),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const userApprovalRequests = mysqlTable("userApprovalRequests", {
	id: int().autoincrement().notNull(),
	userId: int(),
	requestedRole: varchar({ length: 100 }),
	justification: text(),
	reviewedBy: int(),
	reviewedAt: timestamp({ mode: 'string' }),
	reviewNotes: text(),
	status: mysqlEnum(['pending','approved','rejected']).default('pending').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	email: varchar({ length: 320 }).notNull(),
	name: text().notNull(),
	phone: varchar({ length: 20 }),
	requestedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const userRoles = mysqlTable("userRoles", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	roleId: int().notNull(),
	assignedBy: int().notNull(),
	assignedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const userSessions = mysqlTable("userSessions", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	sessionToken: varchar({ length: 255 }).notNull(),
	ipAddress: varchar({ length: 45 }),
	userAgent: text(),
	deviceFingerprint: varchar({ length: 255 }),
	deviceName: varchar({ length: 255 }),
	lastActivity: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("userSessions_sessionToken_unique").on(table.sessionToken),
]);


export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	openId: varchar({ length: 64 }).notNull(),
	name: text(),
	email: varchar({ length: 320 }),
	loginMethod: varchar({ length: 64 }),
	role: mysqlEnum(['farmer','agent','veterinarian','buyer','transporter','admin','user']).default('user').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	lastSignedIn: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	phone: varchar({ length: 20 }),
	approvalStatus: mysqlEnum(['pending','approved','rejected']).default('pending').notNull(),
	accountStatus: mysqlEnum(['active','disabled','suspended']).default('active').notNull(),
	accountStatusReason: text(),
	mfaEnabled: tinyint().default(0).notNull(),
	mfaSecret: varchar({ length: 255 }),
	mfaBackupCodes: text(),
	failedLoginAttempts: int().default(0).notNull(),
	lastFailedLoginAt: timestamp({ mode: 'string' }),
	accountLockedUntil: timestamp({ mode: 'string' }),
},
(table) => [
	index("users_openId_unique").on(table.openId),
]);

export const validationRules = mysqlTable("validationRules", {
	id: int().autoincrement().notNull(),
	entityType: varchar({ length: 100 }).notNull(),
	fieldName: varchar({ length: 100 }).notNull(),
	ruleType: mysqlEnum(['required','min','max','pattern','enum','custom']).notNull(),
	ruleValue: text(),
	errorMessage: text(),
	isActive: tinyint().default(1).notNull(),
	createdBy: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_entityType_fieldName").on(table.entityType, table.fieldName),
]);

export const veterinarians = mysqlTable("veterinarians", {
	id: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	specialty: varchar({ length: 100 }).notNull(),
	region: varchar({ length: 100 }).notNull(),
	phone: varchar({ length: 20 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	clinicName: varchar("clinic_name", { length: 255 }),
	licenseNumber: varchar("license_number", { length: 100 }),
	verified: tinyint().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
});

export const weatherHistory = mysqlTable("weatherHistory", {
	id: int().autoincrement().notNull(),
	farmId: int().notNull(),
	recordedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	temperature: decimal({ precision: 5, scale: 2 }),
	feelsLike: decimal({ precision: 5, scale: 2 }),
	humidity: int(),
	pressure: int(),
	windSpeed: decimal({ precision: 5, scale: 2 }),
	windDirection: int(),
	cloudCover: int(),
	precipitation: decimal({ precision: 5, scale: 2 }),
	weatherCondition: varchar({ length: 100 }),
	weatherDescription: text(),
	sunrise: timestamp({ mode: 'string' }),
	sunset: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const workerPerformance = mysqlTable("worker_performance", {
	id: int().autoincrement().notNull(),
	userId: varchar({ length: 255 }).notNull(),
	farmId: int().notNull().references(() => farms.id, { onDelete: "cascade" } ),
	tasksAssigned: int().default(0),
	tasksCompleted: int().default(0),
	tasksOverdue: int().default(0),
	averageCompletionTime: int().default(0),
	activityScore: decimal({ precision: 5, scale: 2 }).default('0'),
	lastActivityAt: timestamp({ mode: 'string' }),
	totalHoursWorked: decimal({ precision: 8, scale: 2 }).default('0'),
	attendanceRate: decimal({ precision: 5, scale: 2 }).default('0'),
	qualityScore: decimal({ precision: 5, scale: 2 }).default('0'),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("unique_user_farm").on(table.userId, table.farmId),
	index("idx_userId").on(table.userId),
	index("idx_farmId").on(table.farmId),
	index("idx_activityScore").on(table.activityScore),
]);

export const workflowExecutions = mysqlTable("workflow_executions", {
	id: int().autoincrement().notNull(),
	workflowId: int().notNull(),
	triggeredBy: varchar({ length: 100 }),
	triggerData: json(),
	status: mysqlEnum(['pending','running','completed','failed']).default('pending'),
	executedActions: json(),
	errorMessage: text(),
	startedAt: timestamp({ mode: 'string' }),
	completedAt: timestamp({ mode: 'string' }),
	duration: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
},
(table) => [
	index("idx_workflowId_status").on(table.workflowId, table.status),
	index("idx_createdAt").on(table.createdAt),
]);

export const yieldRecords = mysqlTable("yieldRecords", {
	id: int().autoincrement().notNull(),
	cycleId: int().notNull(),
	yieldQuantityKg: decimal({ precision: 12, scale: 2 }).notNull(),
	qualityGrade: varchar({ length: 50 }),
	postHarvestLossKg: decimal({ precision: 10, scale: 2 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	recordedDate: date({ mode: 'string' }).notNull(),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});
