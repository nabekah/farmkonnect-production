import { relations } from "drizzle-orm/relations";
import { users, alertHistory, farms, veterinarians, appointments, calendarSyncs, deviceFingerprints, farmAssets, farmExpenses, farmRevenue, farmWorkers, fishPonds, fishPondActivities, fishStockingRecords, geofenceZones, incidentPlaybooks, incidentResponses, marketplaceProducts, inventoryAlerts, inventoryAuditLogs, inventoryForecasts, inventoryItems, inventoryTransactions, ipWhitelist, irrigationSchedules, irrigationEvents, irrigationZones, irrigationRecommendations, irrigationStatistics, lowStockAlerts, marketplaceBulkPricingTiers, marketplaceProductImages, marketplaceProductReviews, notificationPreferences, performanceAlerts, prescriptions, reportSchedules, reportHistory, securityAuditMetrics, soilMoistureReadings, iotDevices, telemedicineSessions, userInvitations, workerPerformance } from "./schema";

export const alertHistoryRelations = relations(alertHistory, ({one}) => ({
	user_userId: one(users, {
		fields: [alertHistory.userId],
		references: [users.id],
		relationName: "alertHistory_userId_users_id"
	}),
	farm: one(farms, {
		fields: [alertHistory.farmId],
		references: [farms.id]
	}),
	user_acknowledgedBy: one(users, {
		fields: [alertHistory.acknowledgedBy],
		references: [users.id],
		relationName: "alertHistory_acknowledgedBy_users_id"
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	alertHistories_userId: many(alertHistory, {
		relationName: "alertHistory_userId_users_id"
	}),
	alertHistories_acknowledgedBy: many(alertHistory, {
		relationName: "alertHistory_acknowledgedBy_users_id"
	}),
	inventoryAuditLogs: many(inventoryAuditLogs),
	lowStockAlerts_sellerId: many(lowStockAlerts, {
		relationName: "lowStockAlerts_sellerId_users_id"
	}),
	lowStockAlerts_acknowledgedBy: many(lowStockAlerts, {
		relationName: "lowStockAlerts_acknowledgedBy_users_id"
	}),
	notificationPreferences: many(notificationPreferences),
	reportSchedules: many(reportSchedules),
}));

export const farmsRelations = relations(farms, ({many}) => ({
	alertHistories: many(alertHistory),
	deviceFingerprints: many(deviceFingerprints),
	farmAssets: many(farmAssets),
	farmExpenses: many(farmExpenses),
	farmRevenues: many(farmRevenue),
	farmWorkers_farmId: many(farmWorkers, {
		relationName: "farmWorkers_farmId_farms_id"
	}),
	farmWorkers_farmId: many(farmWorkers, {
		relationName: "farmWorkers_farmId_farms_id"
	}),
	fishPonds: many(fishPonds),
	geofenceZones: many(geofenceZones),
	incidentPlaybooks: many(incidentPlaybooks),
	incidentResponses: many(incidentResponses),
	ipWhitelists: many(ipWhitelist),
	irrigationZones: many(irrigationZones),
	performanceAlerts: many(performanceAlerts),
	reportSchedules_farmId: many(reportSchedules, {
		relationName: "reportSchedules_farmId_farms_id"
	}),
	reportSchedules_farmId: many(reportSchedules, {
		relationName: "reportSchedules_farmId_farms_id"
	}),
	securityAuditMetrics: many(securityAuditMetrics),
	userInvitations: many(userInvitations),
	workerPerformances: many(workerPerformance),
}));

export const appointmentsRelations = relations(appointments, ({one, many}) => ({
	veterinarian: one(veterinarians, {
		fields: [appointments.vetId],
		references: [veterinarians.id]
	}),
	telemedicineSessions: many(telemedicineSessions),
}));

export const veterinariansRelations = relations(veterinarians, ({many}) => ({
	appointments: many(appointments),
	calendarSyncs: many(calendarSyncs),
	prescriptions: many(prescriptions),
	telemedicineSessions: many(telemedicineSessions),
}));

export const calendarSyncsRelations = relations(calendarSyncs, ({one}) => ({
	veterinarian: one(veterinarians, {
		fields: [calendarSyncs.vetId],
		references: [veterinarians.id]
	}),
}));

export const deviceFingerprintsRelations = relations(deviceFingerprints, ({one}) => ({
	farm: one(farms, {
		fields: [deviceFingerprints.farmId],
		references: [farms.id]
	}),
}));

export const farmAssetsRelations = relations(farmAssets, ({one}) => ({
	farm: one(farms, {
		fields: [farmAssets.farmId],
		references: [farms.id]
	}),
}));

export const farmExpensesRelations = relations(farmExpenses, ({one}) => ({
	farm: one(farms, {
		fields: [farmExpenses.farmId],
		references: [farms.id]
	}),
}));

export const farmRevenueRelations = relations(farmRevenue, ({one}) => ({
	farm: one(farms, {
		fields: [farmRevenue.farmId],
		references: [farms.id]
	}),
}));

export const farmWorkersRelations = relations(farmWorkers, ({one}) => ({
	farm_farmId: one(farms, {
		fields: [farmWorkers.farmId],
		references: [farms.id],
		relationName: "farmWorkers_farmId_farms_id"
	}),
	farm_farmId: one(farms, {
		fields: [farmWorkers.farmId],
		references: [farms.id],
		relationName: "farmWorkers_farmId_farms_id"
	}),
}));

export const fishPondActivitiesRelations = relations(fishPondActivities, ({one}) => ({
	fishPond: one(fishPonds, {
		fields: [fishPondActivities.pondId],
		references: [fishPonds.id]
	}),
}));

export const fishPondsRelations = relations(fishPonds, ({one, many}) => ({
	fishPondActivities: many(fishPondActivities),
	farm: one(farms, {
		fields: [fishPonds.farmId],
		references: [farms.id]
	}),
	fishStockingRecords: many(fishStockingRecords),
}));

export const fishStockingRecordsRelations = relations(fishStockingRecords, ({one}) => ({
	fishPond: one(fishPonds, {
		fields: [fishStockingRecords.pondId],
		references: [fishPonds.id]
	}),
}));

export const geofenceZonesRelations = relations(geofenceZones, ({one}) => ({
	farm: one(farms, {
		fields: [geofenceZones.farmId],
		references: [farms.id]
	}),
}));

export const incidentPlaybooksRelations = relations(incidentPlaybooks, ({one, many}) => ({
	farm: one(farms, {
		fields: [incidentPlaybooks.farmId],
		references: [farms.id]
	}),
	incidentResponses: many(incidentResponses),
}));

export const incidentResponsesRelations = relations(incidentResponses, ({one}) => ({
	farm: one(farms, {
		fields: [incidentResponses.farmId],
		references: [farms.id]
	}),
	incidentPlaybook: one(incidentPlaybooks, {
		fields: [incidentResponses.playbookId],
		references: [incidentPlaybooks.id]
	}),
}));

export const inventoryAlertsRelations = relations(inventoryAlerts, ({one}) => ({
	marketplaceProduct: one(marketplaceProducts, {
		fields: [inventoryAlerts.productId],
		references: [marketplaceProducts.id]
	}),
}));

export const marketplaceProductsRelations = relations(marketplaceProducts, ({many}) => ({
	inventoryAlerts: many(inventoryAlerts),
	inventoryAuditLogs: many(inventoryAuditLogs),
	inventoryForecasts: many(inventoryForecasts),
	inventoryItems: many(inventoryItems),
	inventoryTransactions: many(inventoryTransactions),
	lowStockAlerts: many(lowStockAlerts),
	marketplaceBulkPricingTiers: many(marketplaceBulkPricingTiers),
	marketplaceProductImages: many(marketplaceProductImages),
	marketplaceProductReviews: many(marketplaceProductReviews),
}));

export const inventoryAuditLogsRelations = relations(inventoryAuditLogs, ({one}) => ({
	marketplaceProduct: one(marketplaceProducts, {
		fields: [inventoryAuditLogs.productId],
		references: [marketplaceProducts.id]
	}),
	user: one(users, {
		fields: [inventoryAuditLogs.userId],
		references: [users.id]
	}),
}));

export const inventoryForecastsRelations = relations(inventoryForecasts, ({one}) => ({
	marketplaceProduct: one(marketplaceProducts, {
		fields: [inventoryForecasts.productId],
		references: [marketplaceProducts.id]
	}),
}));

export const inventoryItemsRelations = relations(inventoryItems, ({one}) => ({
	marketplaceProduct: one(marketplaceProducts, {
		fields: [inventoryItems.productId],
		references: [marketplaceProducts.id]
	}),
}));

export const inventoryTransactionsRelations = relations(inventoryTransactions, ({one}) => ({
	marketplaceProduct: one(marketplaceProducts, {
		fields: [inventoryTransactions.productId],
		references: [marketplaceProducts.id]
	}),
}));

export const ipWhitelistRelations = relations(ipWhitelist, ({one}) => ({
	farm: one(farms, {
		fields: [ipWhitelist.farmId],
		references: [farms.id]
	}),
}));

export const irrigationEventsRelations = relations(irrigationEvents, ({one}) => ({
	irrigationSchedule: one(irrigationSchedules, {
		fields: [irrigationEvents.scheduleId],
		references: [irrigationSchedules.id]
	}),
	irrigationZone: one(irrigationZones, {
		fields: [irrigationEvents.zoneId],
		references: [irrigationZones.id]
	}),
}));

export const irrigationSchedulesRelations = relations(irrigationSchedules, ({one, many}) => ({
	irrigationEvents: many(irrigationEvents),
	irrigationZone: one(irrigationZones, {
		fields: [irrigationSchedules.zoneId],
		references: [irrigationZones.id]
	}),
}));

export const irrigationZonesRelations = relations(irrigationZones, ({one, many}) => ({
	irrigationEvents: many(irrigationEvents),
	irrigationRecommendations: many(irrigationRecommendations),
	irrigationSchedules: many(irrigationSchedules),
	irrigationStatistics: many(irrigationStatistics),
	farm: one(farms, {
		fields: [irrigationZones.farmId],
		references: [farms.id]
	}),
	soilMoistureReadings: many(soilMoistureReadings),
}));

export const irrigationRecommendationsRelations = relations(irrigationRecommendations, ({one}) => ({
	irrigationZone: one(irrigationZones, {
		fields: [irrigationRecommendations.zoneId],
		references: [irrigationZones.id]
	}),
}));

export const irrigationStatisticsRelations = relations(irrigationStatistics, ({one}) => ({
	irrigationZone: one(irrigationZones, {
		fields: [irrigationStatistics.zoneId],
		references: [irrigationZones.id]
	}),
}));

export const lowStockAlertsRelations = relations(lowStockAlerts, ({one}) => ({
	marketplaceProduct: one(marketplaceProducts, {
		fields: [lowStockAlerts.productId],
		references: [marketplaceProducts.id]
	}),
	user_sellerId: one(users, {
		fields: [lowStockAlerts.sellerId],
		references: [users.id],
		relationName: "lowStockAlerts_sellerId_users_id"
	}),
	user_acknowledgedBy: one(users, {
		fields: [lowStockAlerts.acknowledgedBy],
		references: [users.id],
		relationName: "lowStockAlerts_acknowledgedBy_users_id"
	}),
}));

export const marketplaceBulkPricingTiersRelations = relations(marketplaceBulkPricingTiers, ({one}) => ({
	marketplaceProduct: one(marketplaceProducts, {
		fields: [marketplaceBulkPricingTiers.productId],
		references: [marketplaceProducts.id]
	}),
}));

export const marketplaceProductImagesRelations = relations(marketplaceProductImages, ({one}) => ({
	marketplaceProduct: one(marketplaceProducts, {
		fields: [marketplaceProductImages.productId],
		references: [marketplaceProducts.id]
	}),
}));

export const marketplaceProductReviewsRelations = relations(marketplaceProductReviews, ({one}) => ({
	marketplaceProduct: one(marketplaceProducts, {
		fields: [marketplaceProductReviews.productId],
		references: [marketplaceProducts.id]
	}),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({one}) => ({
	user: one(users, {
		fields: [notificationPreferences.userId],
		references: [users.id]
	}),
}));

export const performanceAlertsRelations = relations(performanceAlerts, ({one}) => ({
	farm: one(farms, {
		fields: [performanceAlerts.farmId],
		references: [farms.id]
	}),
}));

export const prescriptionsRelations = relations(prescriptions, ({one}) => ({
	veterinarian: one(veterinarians, {
		fields: [prescriptions.vetId],
		references: [veterinarians.id]
	}),
}));

export const reportHistoryRelations = relations(reportHistory, ({one}) => ({
	reportSchedule: one(reportSchedules, {
		fields: [reportHistory.scheduleId],
		references: [reportSchedules.id]
	}),
}));

export const reportSchedulesRelations = relations(reportSchedules, ({one, many}) => ({
	reportHistories: many(reportHistory),
	user: one(users, {
		fields: [reportSchedules.userId],
		references: [users.id]
	}),
	farm_farmId: one(farms, {
		fields: [reportSchedules.farmId],
		references: [farms.id],
		relationName: "reportSchedules_farmId_farms_id"
	}),
	farm_farmId: one(farms, {
		fields: [reportSchedules.farmId],
		references: [farms.id],
		relationName: "reportSchedules_farmId_farms_id"
	}),
}));

export const securityAuditMetricsRelations = relations(securityAuditMetrics, ({one}) => ({
	farm: one(farms, {
		fields: [securityAuditMetrics.farmId],
		references: [farms.id]
	}),
}));

export const soilMoistureReadingsRelations = relations(soilMoistureReadings, ({one}) => ({
	irrigationZone: one(irrigationZones, {
		fields: [soilMoistureReadings.zoneId],
		references: [irrigationZones.id]
	}),
	iotDevice: one(iotDevices, {
		fields: [soilMoistureReadings.sensorId],
		references: [iotDevices.id]
	}),
}));

export const iotDevicesRelations = relations(iotDevices, ({many}) => ({
	soilMoistureReadings: many(soilMoistureReadings),
}));

export const telemedicineSessionsRelations = relations(telemedicineSessions, ({one}) => ({
	appointment: one(appointments, {
		fields: [telemedicineSessions.appointmentId],
		references: [appointments.id]
	}),
	veterinarian: one(veterinarians, {
		fields: [telemedicineSessions.vetId],
		references: [veterinarians.id]
	}),
}));

export const userInvitationsRelations = relations(userInvitations, ({one}) => ({
	farm: one(farms, {
		fields: [userInvitations.farmId],
		references: [farms.id]
	}),
}));

export const workerPerformanceRelations = relations(workerPerformance, ({one}) => ({
	farm: one(farms, {
		fields: [workerPerformance.farmId],
		references: [farms.id]
	}),
}));