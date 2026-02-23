import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { users } from "../drizzle/schema";
import { desc } from "drizzle-orm";
import { getDb, createUserAccount } from "./db";
import { notificationRouter } from "./notificationRouter";
import { feedingRouter } from "./feedingRouter";
import { marketplaceRouter } from "./marketplaceRouter";
import { iotRouter } from "./iotRouter";
import { weatherRouter } from "./weatherRouter";
import { weatherNotificationRouter } from "./weatherNotificationRouter";
import { cropPlanningRouter } from "./cropPlanningRouter";
import { inventoryRouter } from "./inventoryRouter";
import { roleManagementRouter } from "./roleManagementRouter";
import { trainingRouter } from "./trainingRouter";
import { merlRouter } from "./merlRouter";
import { transportRouter } from "./transportRouter";
import { businessRouter } from "./businessRouter";
import { paymentRouter } from "./paymentRouter";
import { smsRouter } from "./smsRouter";
import { securityRouter } from "./securityRouter";
import { passwordResetRouter } from "./passwordResetRouter";
import { uploadRouter } from "./uploadRouter";
import { financialRouter } from "./financialRouter";
import { livestockRouter } from "./livestockRouter";
import { workforceRouter } from "./workforceRouter";
import { fishFarmingRouter } from "./fishFarmingRouter";
import { assetRouter } from "./assetRouter";
import { reportingRouter } from "./reportingRouter";
import { analyticsRouter } from "./analyticsRouter";
import { notificationSettingsRouter } from "./notificationSettingsRouter";
import { shiftAssignmentWithNotificationsRouter } from "./routers/shiftAssignmentWithNotifications";
import { taskAssignmentWithNotificationsRouter } from "./routers/taskAssignmentWithNotifications";
import { shiftTaskNotificationTriggersRouter } from "./routers/shiftTaskNotificationTriggers";
import { financialAnalysisRouter } from "./routers/financialAnalysis";
import { rbacRouter } from "./routers/rbac";
import { invitationsRouter } from "./routers/invitations";
import { auditLogsRouter } from "./routers/auditLogs";
import { workerPerformanceRouter } from "./routers/workerPerformance";
import { mfaRouter } from "./routers/mfa";
import { userApprovalRouter } from "./routers/userApproval";
import { performanceAlertsRouter } from "./routers/performanceAlerts";
import { securityControlsRouter } from "./routers/securityControls";
import { smsNotificationsRouter } from "./routers/smsNotifications";
import { complianceReportsRouter } from "./routers/complianceReports";
import { deviceFingerprintingRouter } from "./routers/deviceFingerprinting";
import { incidentPlaybooksRouter } from "./routers/incidentPlaybooks";
import { exportRouter } from "./exportRouter";
import { tokenRefreshRouter } from "./routers/tokenRefresh";
import { authAnalyticsRouter } from "./routers/authAnalytics";
import { dashboardRouter } from "./routers/dashboard";
import { emailFeaturesRouter } from "./routers/emailFeatures";
import { emailRouter } from "./routers/email";
import { sendgridWebhookRouter } from "./routers/sendgridWebhook";
import { websocketTokenRouter } from "./routers/websocketToken";
import { suspiciousActivityAlertsRouter } from "./routers/suspiciousActivityAlerts";
import { authRouter } from "./routers/authRouter";
import { logAuthenticationAttempt, logLogoutEvent } from "./_core/authAnalyticsLogger";
import { emailNotifications } from "./_core/emailNotifications";
import { eq } from "drizzle-orm";
import { alertHistoryRouter } from "./alertHistoryRouter";
import { fertilizerRouter } from "./fertilizerRouter";
import { reportSchedulingRouter } from "./routers/reportScheduling";
import { bulkTaskAssignmentRouter } from "./routers/bulkTaskAssignment";
import { taskDependenciesRouter } from "./routers/taskDependencies";
import { taskTemplatesRouter } from "./routers/taskTemplates";
import { reportTemplatesRouter } from "./routers/reportTemplates";
import { reportAnalyticsRouter } from "./routers/reportAnalytics";
import { recipientManagementRouter } from "./routers/recipientManagement";
// import { laborManagementRouter } from "./routers/laborManagement"; // Temporarily disabled
import { reportExportRouter } from "./routers/reportExport";
import { aiShiftSchedulingRouter } from "./routers/aiShiftScheduling";
import { advancedAnalyticsRouter } from "./routers/advancedAnalytics";
import { adminAnalyticsRouter } from "./routers/adminAnalytics";
import { predictiveAnalyticsRouter as predictiveAnalyticsRouterOld } from "./routers/predictiveAnalyticsRouter";
import { predictiveAnalyticsRouter } from "./routers/predictiveAnalytics";
import { veterinaryClinicDirectoryRouter } from "./routers/veterinaryClinicDirectoryClean";
import { prescriptionRefillAutomationRouter } from "./routers/prescriptionRefillAutomationClean";
import { notificationServicesRouter } from "./routers/notificationServicesClean";
import { veterinarianCalendarRouter } from "./routers/veterinarianCalendarClean";
import { telemedicineRouter } from "./routers/telemedicineClean";
import { reportTemplateCustomizationRouter } from "./routers/reportTemplateCustomization";
import { reportExecutionRouter } from "./routers/reportExecution";
import { fertilizerManagementRouter } from "./routers/fertilizerManagement";
import { navigationRouter } from "./routers/navigation";
import { fieldWorkerRouter } from "./routers/fieldWorker";
import { adminRouter } from "./routers/admin";
import { farmPermissionsRouter } from "./farmPermissionsRouter";
import { activityApprovalRouter } from "./routers/activityApproval";
import { animalBulkRegistrationRouter } from "./routers/animalBulkRegistration";
import { animalBulkEditingRouter } from "./routers/animalBulkEditing";
import { animalGenealogyRouter } from "./routers/animalGenealogy";
import { animalHealthDashboardRouter } from "./routers/animalHealthDashboard";
import { tagIdTemplatesRouter } from "./routers/tagIdTemplates";
import { animalPerformanceAnalyticsRouter } from "./routers/animalPerformanceAnalytics";
import { breedingRecommendationEngineRouter } from "./routers/breedingRecommendationEngine";
import { animalMovementTrackingRouter } from "./routers/animalMovementTracking";
import { animalBatchEditingRouter } from "./routers/animalBatchEditing";
import { animalImportWizardRouter } from "./routers/animalImportWizard";
import { animalSearchFiltersRouter } from "./routers/animalSearchFilters";
import { bulkHealthOperationsRouter } from "./routers/bulkHealthOperations";
import { healthAlertsRouter } from "./routers/healthAlerts";
import { vetAppointmentsRouter } from "./routers/vetAppointments";
import { veterinarianAvailabilityRouter } from "./routers/veterinarianAvailability";
import { financialForecastingRouter } from "./routers/financialForecasting";
import { expenseReceiptsRouter } from "./routers/expenseReceipts";
import { animalProfitabilityRouter } from "./routers/animalProfitability";
import { healthReportsRouter } from "./routers/healthReports";
import { medicationTrackingRouter } from "./routers/medicationTracking";
import { healthTrendsAnalyticsRouter } from "./routers/healthTrendsAnalytics";
import { pushNotificationsRouter } from "./routers/pushNotificationsRouter";
import { taskAssignmentDatabaseRouter } from "./routers/taskAssignmentDatabase";
import { taskMigrationRouter } from "./routers/taskMigration";
import { workerRouter } from "./routers/workerRouter";
import { farmTaskFilteringRouter } from "./routers/farmTaskFiltering";
import { taskPriorityEscalationRouter } from "./routers/taskPriorityEscalation";
import { taskReassignmentRouter } from "./routers/taskReassignment";
import { taskCompletionVerificationRouter } from "./routers/taskCompletionVerification";
// import { searchRouter } from "./routers/search";
// import { searchEnhancementsRouter } from "./routers/searchEnhancements";
// import { multiSpeciesRouter } from "./routers/multiSpecies";
import { animalMigrationRouter } from "./routers/animalMigration";
// import { speciesReportsRouter } from "./routers/speciesReports";
import { veterinaryIntegrationRouter } from "./routers/veterinaryIntegration";
import { csvImportRouter } from "./routers/csvImport";
import { ghanaExtensionServicesRouter } from "./routers/ghanaExtensionServices";
import { financialManagementRouter } from "./routers/financialManagement";
import { recurringExpensesRouter } from "./routers/recurringExpenses";
import { budgetAlertsRouter } from "./routers/budgetAlerts";
import { expenseRevenueEntryRouter } from "./routers/expenseRevenueEntry";
import { financialExportRouter } from "./routers/financialExport";
import { farmComparisonRouter } from "./routers/farmComparison";
import { farmConsolidationRouter } from "./routers/farmConsolidation";
import { budgetManagementRouter } from "./routers/budgetManagement";
import { notificationDataRouter } from "./routers/notificationDataRouter";
import { blockchainSupplyChainRouter } from "./routers/blockchainSupplyChain";
import { accountLinkingRouter } from "./routers/accountLinking";
// import { accountingExportRouter } from "./routers/accountingExport";
// import { expenseNotifications } from "./routers/expenseNotifications";
// import { farmAnalytics } from "./routers/farmAnalytics";
// import { vetDirectoryRouter } from "./routers/vetDirectory";
// import { prescriptionManagementRouter } from "./routers/prescriptionManagement";
// import { telemedicineManagementRouter } from "./routers/telemedicineManagement";
// import { insuranceClaimTrackingRouter } from "./routers/insuranceClaimTracking";
// import { prescriptionNotificationsRouter } from "./routers/prescriptionNotifications";
// // import { vetRatingsRouter } from "./routers/vetRatings";
import { veterinaryServicesCleanRouter } from "./routers/veterinaryServicesClean";
import { financialManagementCleanRouter } from "./routers/financialManagementClean";
import { laborManagementCleanRouter } from "./routers/laborManagementClean";
import { trainingCertificationCleanRouter } from "./routers/trainingCertificationClean";
import { equipmentManagementCleanRouter } from "./routers/equipmentManagementClean";
import { certificationRenewalCleanRouter } from "./routers/certificationRenewalClean";
import { maintenanceAlertsCleanRouter } from "./routers/maintenanceAlertsClean";
import { maintenanceSchedulingCleanRouter } from "./routers/maintenanceSchedulingClean";
import { workerPerformanceAnalyticsCleanRouter } from "./routers/workerPerformanceAnalyticsClean";
import { farmProductsMarketplaceCleanRouter } from "./routers/farmProductsMarketplaceClean";
import { realtimeNotificationsCleanRouter } from "./routers/realtimeNotificationsClean";
import { advancedReportingAnalyticsCleanRouter } from "./routers/advancedReportingAnalyticsClean";
import { multiFarmManagementCleanRouter } from "./routers/multiFarmManagementClean";
import { mobileAppIntegrationCleanRouter } from "./routers/mobileAppIntegrationClean";
import { aiRecommendationsEngineCleanRouter } from "./routers/aiRecommendationsEngineClean";
import { supplyChainVendorManagementCleanRouter } from "./routers/supplyChainVendorManagementClean";
import { customerPortalCleanRouter } from "./routers/customerPortalClean";
import { iotSensorIntegrationCleanRouter } from "./routers/iotSensorIntegrationClean";
import { financialManagementCleanRouter } from "./routers/financialManagementClean";
import { mobileAppSyncCleanRouter } from "./routers/mobileAppSyncClean";
import { advancedAnalyticsCleanRouter } from "./routers/advancedAnalyticsClean";
import { cooperativeCommunitiesCleanRouter } from "./routers/cooperativeCommunitiesClean";
import { cropDiseaseDetectionCleanRouter } from "./routers/cropDiseaseDetectionClean";
import { weatherIrrigationAutomationCleanRouter } from "./routers/weatherIrrigationAutomationClean";
import { farmerTrainingCertificationCleanRouter } from "./routers/farmerTrainingCertificationClean";
import { cropInsuranceRiskManagementCleanRouter } from "./routers/cropInsuranceRiskManagementClean";
import { communityForumKnowledgeSharingCleanRouter } from "./routers/communityForumKnowledgeSharingClean";
import { mobileFirstDashboardCleanRouter } from "./routers/mobileFirstDashboardClean";
import { biometricAuthenticationCleanRouter } from "./routers/biometricAuthenticationClean";
import { equipmentRentalMarketplaceCleanRouter } from "./routers/equipmentRentalMarketplaceClean";
import { cropYieldPredictionCleanRouter } from "./routers/cropYieldPredictionClean";
import { farmerCooperativeDashboardCleanRouter } from "./routers/farmerCooperativeDashboardClean";
import { weatherBasedCropInsuranceCleanRouter } from "./routers/weatherBasedCropInsuranceClean";
import { mobileAppReactNativeCleanRouter } from "./routers/mobileAppReactNativeClean";
import { farmerMentorshipProgramCleanRouter } from "./routers/farmerMentorshipProgramClean";
import { advancedReportingDashboardCleanRouter } from "./routers/advancedReportingDashboardClean";
import { pestDiseaseManagementCleanRouter } from "./routers/pestDiseaseManagementClean";
import { farmerDirectoryNetworkingCleanRouter } from "./routers/farmerDirectoryNetworkingClean";
import { cropRotationPlanningCleanRouter } from "./routers/cropRotationPlanningClean";
import { weatherForecastingIntegrationCleanRouter } from "./routers/weatherForecastingIntegrationClean";
import { soilTestingLabIntegrationCleanRouter } from "./routers/soilTestingLabIntegrationClean";
import { pestEarlyWarningSystemCleanRouter } from "./routers/pestEarlyWarningSystemClean";
import { cropVarietyRecommendationCleanRouter } from "./routers/cropVarietyRecommendationClean";
import { farmerToBuyerDirectSalesCleanRouter } from "./routers/farmerToBuyerDirectSalesClean";
import { farmerCooperativeManagementCleanRouter } from "./routers/farmerCooperativeManagementClean";
import { livestockManagementCleanRouter } from "./routers/livestockManagementClean";
import { cropRecommendationRouter } from "./routers/cropRecommendationRouter";
import { forumRouter } from "./routers/forumRouter";
import { reputationRouter } from "./routers/reputationRouter";
import { mobileAppRouter } from "./routers/mobileAppRouter";
import { advancedAnalyticsRouter } from "./routers/advancedAnalyticsRouter";
import { supplyChainRouter } from "./routers/supplyChainRouter";
import { cooperativeRouter } from "./routers/cooperativeRouter";
import { advancedSearchRouter } from "./routers/advancedSearchRouter";
import { sellerDashboardRouter } from "./routers/sellerDashboardRouter";
import { mentorshipRouter } from "./routers/mentorshipRouter";
import { equipmentRentalRouter } from "./routers/equipmentRentalRouter";
import { paymentRouter } from "./routers/paymentRouter";
import { reviewsRouter } from "./routers/reviewsRouter";
import { notificationCenterRouter } from "./routers/notificationCenterRouter";
import { adminRouter } from "./routers/adminRouter";
import { chatbotRouter } from "./routers/chatbotRouter";
import { weatherAlertsRouter } from "./routers/weatherAlertsRouter";
import { pushNotificationIntegrationRouter } from "./routers/pushNotificationIntegration";
import { notificationEventHandlersRouter } from "./routers/notificationEventHandlers";
import { notificationRouter as advancedNotificationRouter } from "./routers/notificationRouter";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  farms,
  farmActivities,
  crops,
  cropCycles,
  soilTests,
  fertilizerApplications,
  yieldRecords,
  cropHealthRecords,
  cropTreatments,
  animals,
  animalTypes,
  animalHealthRecords,
  breedingRecords,
  feedingRecords,
  performanceMetrics,
  themeConfigs,
  notifications,
} from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const appRouter = router({
  system: systemRouter,
  tokenRefresh: tokenRefreshRouter,
  authAnalytics: authAnalyticsRouter,
  dashboard: dashboardRouter,
  email: emailRouter,
  emailFeatures: emailFeaturesRouter,
  sendgridWebhook: sendgridWebhookRouter,
  websocketToken: websocketTokenRouter,
  suspiciousActivityAlerts: suspiciousActivityAlertsRouter,
  rbac: rbacRouter,
  invitations: invitationsRouter,
  auditLogs: auditLogsRouter,
  workerPerformance: workerPerformanceRouter,
  mfa: mfaRouter,
  userApproval: userApprovalRouter,
  performanceAlerts: performanceAlertsRouter,
  securityControls: securityControlsRouter,
  smsNotifications: smsNotificationsRouter,
  complianceReports: complianceReportsRouter,
  deviceFingerprinting: deviceFingerprintingRouter,
  incidentPlaybooks: incidentPlaybooksRouter,
  upload: uploadRouter,
  financial: financialRouter,
  financialAnalysis: financialAnalysisRouter,
  livestock: livestockRouter,
  workforce: workforceRouter,
  fishFarming: fishFarmingRouter,
  assets: assetRouter,
  farmPermissions: farmPermissionsRouter,
  reporting: reportingRouter,
  analytics: analyticsRouter,
  notificationSettings: notificationSettingsRouter,
  export: exportRouter,
  alertHistory: alertHistoryRouter,
  fertilizer: fertilizerRouter,
  reportScheduling: reportSchedulingRouter,
  reportTemplates: reportTemplatesRouter,
  reportAnalytics: reportAnalyticsRouter,
  recipientManagement: recipientManagementRouter,
  reportExport: reportExportRouter,
  adminAnalytics: adminAnalyticsRouter,
  reportTemplateCustomization: reportTemplateCustomizationRouter,
    reportExecution: reportExecutionRouter,
    fertilizerManagement: fertilizerManagementRouter,
  navigation: navigationRouter,
  fieldWorker: fieldWorkerRouter,
  admin: adminRouter,
  // laborManagement: laborManagementRouter, // Temporarily disabled
  aiShiftScheduling: aiShiftSchedulingRouter,
  advancedAnalytics: advancedAnalyticsRouter,
  animalBulkRegistration: animalBulkRegistrationRouter,
  animalBulkEditing: animalBulkEditingRouter,
  animalGenealogy: animalGenealogyRouter,
  animalHealthDashboard: animalHealthDashboardRouter,
  animalPerformanceAnalytics: animalPerformanceAnalyticsRouter,
  breedingRecommendationEngine: breedingRecommendationEngineRouter,
  animalMovementTracking: animalMovementTrackingRouter,
  animalBatchEditing: animalBatchEditingRouter,
  animalImportWizard: animalImportWizardRouter,
  animalSearchFilters: animalSearchFiltersRouter,
  tagIdTemplates: tagIdTemplatesRouter,
  bulkHealthOperations: bulkHealthOperationsRouter,
  healthAlerts: healthAlertsRouter,
  vetAppointments: vetAppointmentsRouter,
  veterinarianAvailability: veterinarianAvailabilityRouter,
  financialForecasting: financialForecastingRouter,
  expenseReceipts: expenseReceiptsRouter,
  animalProfitability: animalProfitabilityRouter,
  healthReports: healthReportsRouter,
  medicationTracking: medicationTrackingRouter,
  healthTrendsAnalytics: healthTrendsAnalyticsRouter,
  pushNotifications: pushNotificationsRouter,
  // search: searchRouter,
  // searchEnhancements: searchEnhancementsRouter,
  // multiSpecies: multiSpeciesRouter,
  animalMigration: animalMigrationRouter,
  // speciesReports: speciesReportsRouter,
  veterinaryIntegration: veterinaryIntegrationRouter,
  csvImport: csvImportRouter,
  ghanaExtensionServices: ghanaExtensionServicesRouter,
  // financialManagement: financialManagementRouter,
  recurringExpenses: recurringExpensesRouter,
  budgetAlerts: budgetAlertsRouter,
  expenseRevenueEntry: expenseRevenueEntryRouter,
  financialExport: financialExportRouter,
  farmComparison: farmComparisonRouter,
  farmConsolidation: farmConsolidationRouter,
  predictiveAnalytics: predictiveAnalyticsRouter,
  notificationData: notificationDataRouter,
  blockchainSupplyChain: blockchainSupplyChainRouter,
  accountLinking: accountLinkingRouter,
  cropRecommendations: cropRecommendationRouter,
  forum: forumRouter,
  reputation: reputationRouter,
  mobileApp: mobileAppRouter,
  supplyChain: supplyChainRouter,
  cooperative: cooperativeRouter,
  advancedSearch: advancedSearchRouter,
  sellerDashboard: sellerDashboardRouter,
  mentorship: mentorshipRouter,
  equipmentRental: equipmentRentalRouter,
  payment: paymentRouter,
  reviews: reviewsRouter,
  notificationCenter: notificationCenterRouter,
  chatbot: chatbotRouter,
  weatherAlerts: weatherAlertsRouter,
  pushNotificationIntegration: pushNotificationIntegrationRouter,
  notificationEventHandlers: notificationEventHandlersRouter,
  advancedNotifications: advancedNotificationRouter,
  // accountingExport: accountingExportRouter,
  // expenseNotifications: expenseNotifications,
  // farmAnalytics: farmAnalytics,
  // vetDirectory: vetDirectoryRouter,
  // prescriptionManagement: prescriptionManagementRouter,
  // telemedicineManagement: telemedicineManagementRouter,
  // insuranceClaims: insuranceClaimTrackingRouter,
  // prescriptionNotifications: prescriptionNotificationsRouter,
  // vetRatings: vetRatingsRouter,
  veterinaryServices: veterinaryServicesCleanRouter,
  financialManagement: financialManagementRouter,
  budgetManagement: budgetManagementRouter,
  // laborManagement: laborManagementCleanRouter, // Removed duplicate - using laborManagementRouter instead
  training: trainingCertificationCleanRouter,
  equipment: equipmentManagementCleanRouter,
  certificationRenewal: certificationRenewalCleanRouter,
  maintenanceAlerts: maintenanceAlertsCleanRouter,
  maintenanceScheduling: maintenanceSchedulingCleanRouter,
  workerPerformanceAnalytics: workerPerformanceAnalyticsCleanRouter,
  farmProductsMarketplace: farmProductsMarketplaceCleanRouter,
  realtimeNotifications: realtimeNotificationsCleanRouter,
  advancedReportingAnalytics: advancedReportingAnalyticsCleanRouter,
  multiFarmManagement: multiFarmManagementCleanRouter,
  mobileAppIntegration: mobileAppIntegrationCleanRouter,
  aiRecommendationsEngine: aiRecommendationsEngineCleanRouter,
  supplyChainVendorManagement: supplyChainVendorManagementCleanRouter,
  customerPortal: customerPortalCleanRouter,
  iotSensorIntegration: iotSensorIntegrationCleanRouter,
  mobileAppSync: mobileAppSyncCleanRouter,
  cooperativeCommunities: cooperativeCommunitiesCleanRouter,
  cropDiseaseDetection: cropDiseaseDetectionCleanRouter,
  weatherIrrigationAutomation: weatherIrrigationAutomationCleanRouter,
  farmerTrainingCertification: farmerTrainingCertificationCleanRouter,
  cropInsuranceRiskManagement: cropInsuranceRiskManagementCleanRouter,
  communityForumKnowledgeSharing: communityForumKnowledgeSharingCleanRouter,
  mobileFirstDashboard: mobileFirstDashboardCleanRouter,
  biometricAuthentication: biometricAuthenticationCleanRouter,
  equipmentRentalMarketplace: equipmentRentalMarketplaceCleanRouter,
  cropYieldPrediction: cropYieldPredictionCleanRouter,
  farmerCooperativeDashboard: farmerCooperativeDashboardCleanRouter,
  weatherBasedCropInsurance: weatherBasedCropInsuranceCleanRouter,
  mobileAppReactNative: mobileAppReactNativeCleanRouter,
  farmerMentorshipProgram: farmerMentorshipProgramCleanRouter,
  advancedReportingDashboard: advancedReportingDashboardCleanRouter,
  pestDiseaseManagement: pestDiseaseManagementCleanRouter,
  farmerDirectoryNetworking: farmerDirectoryNetworkingCleanRouter,
  cropRotationPlanning: cropRotationPlanningCleanRouter,
  weatherForecastingIntegration: weatherForecastingIntegrationCleanRouter,
  soilTestingLabIntegration: soilTestingLabIntegrationCleanRouter,
  pestEarlyWarningSystem: pestEarlyWarningSystemCleanRouter,
  cropVarietyRecommendation: cropVarietyRecommendationCleanRouter,
  farmerToBuyerDirectSales: farmerToBuyerDirectSalesCleanRouter,
  farmerCooperativeManagement: farmerCooperativeManagementCleanRouter,
  livestockManagement: livestockManagementCleanRouter,
  notificationServices: notificationServicesRouter,
  veterinarianCalendar: veterinarianCalendarRouter,
  telemedicine: telemedicineRouter,
  veterinaryClinicDirectory: veterinaryClinicDirectoryRouter,
  prescriptionRefillAutomation: prescriptionRefillAutomationRouter,
  shiftTaskNotificationTriggers: shiftTaskNotificationTriggersRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      
      if (ctx.user?.id) {
        const sessionStartTime = ctx.req.headers['x-session-start-time'] as string;
        const sessionDurationMs = sessionStartTime ? Date.now() - parseInt(sessionStartTime) : 0;
        await logLogoutEvent({
          userId: ctx.user.id,
          sessionDurationMs,
        });
      }
      
      return { success: true } as const;
    }),
    getAllUsers: publicProcedure.query(async () => {
      const db = await getDb();
      const allUsers = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        loginMethod: users.loginMethod,
        approvalStatus: users.approvalStatus,
        accountStatus: users.accountStatus,
        createdAt: users.createdAt,
      }).from(users).orderBy(desc(users.createdAt));
      return allUsers;
    }),
    register: publicProcedure
      .input(
        z.object({
          name: z.string().min(2, "Name must be at least 2 characters"),
          email: z.string().email("Invalid email address"),
          phone: z.string().nullable().optional(),
          role: z.string().default("user"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, input.email))
          .limit(1);

        if (existingUser.length > 0) {
          await logAuthenticationAttempt({
            req: ctx.req,
            loginMethod: "manual",
            success: false,
            failureReason: "Email already registered",
          });
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email already registered. Please sign in or use a different email.",
          });
        }

        // Solution 1: Use raw SQL to avoid Drizzle column mapping issues
        // Use helper function to create user
        let createdUser;
        try {
          const newUser = await createUserAccount({
            name: input.name,
            email: input.email,
            phone: input.phone,
            role: input.role || "user",
          });
          createdUser = [newUser];
          
          await logAuthenticationAttempt({
            req: ctx.req,
            userId: newUser.id,
            loginMethod: "manual",
            success: true,
          });
        } catch (error: any) {
          console.error("Registration Error:", error);
          
          await logAuthenticationAttempt({
            req: ctx.req,
            loginMethod: "manual",
            success: false,
            failureReason: error.message || "Failed to create user account",
          });
          
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "Failed to create user account",
          });
        }

        // Send registration confirmation email
        try {
          await emailNotifications.sendRegistrationConfirmation(input.email, input.name);
        } catch (error) {
          console.error("Failed to send registration confirmation email:", error);
          // Don't throw error - registration should succeed even if email fails
        }

        if (!createdUser || createdUser.length === 0) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create user account",
          });
        }

        return createdUser[0];
      }),
    ...authRouter,
  }),

  // ============================================================================
  // FARM MANAGEMENT
  // ============================================================================
  farms: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(farms).where(eq(farms.farmerUserId, ctx.user.id));
    }),

    create: protectedProcedure
      .input(z.object({
        farmName: z.string().min(1),
        location: z.string().optional(),
        sizeHectares: z.string().optional(),
        farmType: z.enum(["crop", "livestock", "mixed"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        return await db.insert(farms).values({
          farmerUserId: ctx.user.id,
          farmName: input.farmName,
          location: input.location,
          sizeHectares: input.sizeHectares as any,
          farmType: input.farmType || "mixed",
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        farmName: z.string().min(1),
        location: z.string().optional(),
        gpsLatitude: z.string().optional(),
        gpsLongitude: z.string().optional(),
        sizeHectares: z.string().optional(),
        farmType: z.enum(["crop", "livestock", "mixed"]).optional(),
        description: z.string().optional(),
        photoUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Verify ownership
        const [farm] = await db.select().from(farms).where(eq(farms.id, input.id));
        if (!farm || farm.farmerUserId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You can only edit your own farms" });
        }

        const updateData: any = {
          farmName: input.farmName,
          location: input.location,
          gpsLatitude: input.gpsLatitude && input.gpsLatitude.trim() ? parseFloat(input.gpsLatitude) : null,
          gpsLongitude: input.gpsLongitude && input.gpsLongitude.trim() ? parseFloat(input.gpsLongitude) : null,
          sizeHectares: input.sizeHectares && input.sizeHectares.trim() ? parseFloat(input.sizeHectares) : null,
          farmType: input.farmType || "mixed",
          description: input.description,
          photoUrl: input.photoUrl,
        };
        
        return await db.update(farms)
          .set(updateData)
          .where(eq(farms.id, input.id));
      }),

    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Verify ownership
        const [farm] = await db.select().from(farms).where(eq(farms.id, input.id));
        if (!farm || farm.farmerUserId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own farms" });
        }

        return await db.delete(farms).where(eq(farms.id, input.id));
      }),

    getActivities: protectedProcedure
      .input(z.object({
        farmId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return [];

        // Verify ownership
        const [farm] = await db.select().from(farms).where(eq(farms.id, input.farmId));
        if (!farm || farm.farmerUserId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You can only view activities for your own farms" });
        }

        return await db.select()
          .from(farmActivities)
          .where(eq(farmActivities.farmId, input.farmId))
          .orderBy(farmActivities.createdAt);
      }),
  }),

  // ============================================================================
  // CROP MANAGEMENT
  // ============================================================================
  crops: router({
    list: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(crops);
    }),

    cycles: router({
      list: protectedProcedure
        .input(z.object({ farmId: z.number() }))
        .query(async ({ input }) => {
          const db = await getDb();
          if (!db) return [];
          const cycles = await db.select().from(cropCycles).where(eq(cropCycles.farmId, input.farmId));
          // Join with crops to get variety and cultivar parameters
          const cyclesWithCropInfo = await Promise.all(
            cycles.map(async (cycle) => {
              const [crop] = await db.select().from(crops).where(eq(crops.id, cycle.cropId));
              return { ...cycle, crop };
            })
          );
          return cyclesWithCropInfo;
        }),

      create: protectedProcedure
        .input(z.object({
          farmId: z.number(),
          cropId: z.number(),
          varietyName: z.string().optional(),
          plantingDate: z.date(),
          expectedHarvestDate: z.date().optional(),
          areaPlantedHectares: z.string().optional(),
          expectedYieldKg: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

          return await db.insert(cropCycles).values({
            farmId: input.farmId,
            cropId: input.cropId,
            varietyName: input.varietyName,
            plantingDate: input.plantingDate,
            expectedHarvestDate: input.expectedHarvestDate,
            areaPlantedHectares: input.areaPlantedHectares as any,
            expectedYieldKg: input.expectedYieldKg as any,
            status: "planted",
          });
        }),

    }),

    soilTests: router({
      list: protectedProcedure
        .input(z.object({ farmId: z.number() }))
        .query(async ({ input }) => {
          const db = await getDb();
          if (!db) return [];
          return await db.select().from(soilTests).where(eq(soilTests.farmId, input.farmId));
        }),

      create: protectedProcedure
        .input(z.object({
          farmId: z.number(),
          testDate: z.date(),
          phLevel: z.string().optional(),
          nitrogenLevel: z.string().optional(),
          phosphorusLevel: z.string().optional(),
          potassiumLevel: z.string().optional(),
          organicMatter: z.string().optional(),
          recommendations: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

          return await db.insert(soilTests).values({
            farmId: input.farmId,
            testDate: input.testDate,
            phLevel: input.phLevel as any,
            nitrogenLevel: input.nitrogenLevel as any,
            phosphorusLevel: input.phosphorusLevel as any,
            potassiumLevel: input.potassiumLevel as any,
            organicMatter: input.organicMatter as any,
            recommendations: input.recommendations,
          });
        }),
    }),

    fertilizers: router({
      list: protectedProcedure
        .input(z.object({ cycleId: z.number() }))
        .query(async ({ input }) => {
          const db = await getDb();
          if (!db) return [];
          return await db.select().from(fertilizerApplications).where(eq(fertilizerApplications.cycleId, input.cycleId));
        }),

      create: protectedProcedure
        .input(z.object({
          cycleId: z.number(),
          applicationDate: z.date(),
          fertilizerType: z.string(),
          quantityKg: z.string().optional(),
          notes: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

          return await db.insert(fertilizerApplications).values({
            cycleId: input.cycleId,
            applicationDate: input.applicationDate,
            fertilizerType: input.fertilizerType,
            quantityKg: input.quantityKg as any,
            notes: input.notes,
          });
        }),
    }),

    yields: router({
      list: protectedProcedure
        .input(z.object({ cycleId: z.number() }))
        .query(async ({ input }) => {
          const db = await getDb();
          if (!db) return [];

          return await db.select().from(yieldRecords).where(eq(yieldRecords.cycleId, input.cycleId));
        }),

      create: protectedProcedure
        .input(z.object({
          cycleId: z.number(),
          yieldQuantityKg: z.string(),
          qualityGrade: z.string().optional(),
          notes: z.string().optional(),
          recordedDate: z.date(),
        }))
        .mutation(async ({ input }) => {
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

          return await db.insert(yieldRecords).values({
            cycleId: input.cycleId,
            recordedDate: input.recordedDate,
            yieldQuantityKg: input.yieldQuantityKg as any,
            qualityGrade: input.qualityGrade,
            notes: input.notes,
          });
        }),
    }),

    health: router({
      list: protectedProcedure
        .input(z.object({ cycleId: z.number() }))
        .query(async ({ input }) => {
          const db = await getDb();
          if (!db) return [];
          return await db.select().from(cropHealthRecords).where(eq(cropHealthRecords.cycleId, input.cycleId));
        }),

      listByFarm: protectedProcedure
        .input(z.object({ farmId: z.number() }))
        .query(async ({ input }) => {
          const db = await getDb();
          if (!db) return [];
          // Get all cycles for the farm first
          const farmCycles = await db.select().from(cropCycles).where(eq(cropCycles.farmId, input.farmId));
          const cycleIds = farmCycles.map(c => c.id);
          
          // Get all health records for those cycles
          if (cycleIds.length === 0) return [];
          const records = await db.select().from(cropHealthRecords);
          return records.filter(r => cycleIds.includes(r.cycleId));
        }),

      create: protectedProcedure
        .input(z.object({
          cycleId: z.number(),
          recordDate: z.date(),
          issueType: z.enum(["disease", "pest", "nutrient_deficiency", "weather_damage", "other"]),
          issueName: z.string(),
          severity: z.enum(["low", "medium", "high", "critical"]),
          affectedArea: z.string().optional(),
          symptoms: z.string().optional(),
          photoUrls: z.string().optional(),
          notes: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

          return await db.insert(cropHealthRecords).values({
            cycleId: input.cycleId,
            recordDate: input.recordDate,
            issueType: input.issueType,
            issueName: input.issueName,
            severity: input.severity,
            affectedArea: input.affectedArea,
            symptoms: input.symptoms,
            photoUrls: input.photoUrls,
            notes: input.notes,
            status: "active",
          });
        }),

      update: protectedProcedure
        .input(z.object({
          id: z.number(),
          status: z.enum(["active", "treated", "resolved"]).optional(),
          notes: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

          return await db.update(cropHealthRecords)
            .set({ status: input.status, notes: input.notes })
            .where(eq(cropHealthRecords.id, input.id));
        }),
    }),

    treatments: router({
      list: protectedProcedure
        .input(z.object({ healthRecordId: z.number() }))
        .query(async ({ input }) => {
          const db = await getDb();
          if (!db) return [];
          return await db.select().from(cropTreatments).where(eq(cropTreatments.healthRecordId, input.healthRecordId));
        }),

      create: protectedProcedure
        .input(z.object({
          healthRecordId: z.number(),
          treatmentDate: z.date(),
          treatmentType: z.string(),
          productName: z.string().optional(),
          dosage: z.string().optional(),
          applicationMethod: z.string().optional(),
          cost: z.string().optional(),
          notes: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

          return await db.insert(cropTreatments).values({
            healthRecordId: input.healthRecordId,
            treatmentDate: input.treatmentDate,
            treatmentType: input.treatmentType,
            productName: input.productName,
            dosage: input.dosage,
            applicationMethod: input.applicationMethod,
            cost: input.cost as any,
            appliedByUserId: ctx.user?.id,
            notes: input.notes,
          });
        }),

      updateEffectiveness: protectedProcedure
        .input(z.object({
          id: z.number(),
          effectiveness: z.enum(["not_evaluated", "ineffective", "partially_effective", "effective", "very_effective"]),
        }))
        .mutation(async ({ input }) => {
          const db = await getDb();
          if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

          return await db.update(cropTreatments)
            .set({ effectiveness: input.effectiveness })
            .where(eq(cropTreatments.id, input.id));
        }),
    }),
  }),

  // ============================================================================
  // LIVESTOCK MANAGEMENT
  // ============================================================================
  animals: router({
    list: protectedProcedure
      .input(z.object({ farmId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(animals).where(eq(animals.farmId, input.farmId));
      }),

    create: protectedProcedure
      .input(z.object({
        farmId: z.number(),
        typeId: z.number(),
        uniqueTagId: z.string().optional(),
        birthDate: z.date().optional(),
        gender: z.enum(["male", "female", "unknown"]).optional(),
        breed: z.string().optional(),
        status: z.enum(["active", "sold", "culled", "deceased"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        return await db.insert(animals).values({
          farmId: input.farmId,
          typeId: input.typeId,
          uniqueTagId: input.uniqueTagId,
          birthDate: input.birthDate,
          gender: input.gender || "unknown",
          breed: input.breed,
          status: input.status || "active",
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["active", "sold", "culled", "deceased"]).optional(),
        breed: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const updates: any = {};
        if (input.status) updates.status = input.status;
        if (input.breed) updates.breed = input.breed;

        return await db.update(animals).set(updates).where(eq(animals.id, input.id));
      }),
  }),

  healthRecords: router({
    list: protectedProcedure
      .input(z.object({ animalId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(animalHealthRecords).where(eq(animalHealthRecords.animalId, input.animalId));
      }),

    create: protectedProcedure
      .input(z.object({
        animalId: z.number(),
        recordDate: z.date(),
        eventType: z.enum(["vaccination", "treatment", "illness", "checkup", "other"]),
        details: z.string().optional(),
        veterinarianUserId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        return await db.insert(animalHealthRecords).values({
          animalId: input.animalId,
          recordDate: input.recordDate,
          eventType: input.eventType,
          details: input.details,
          veterinarianUserId: input.veterinarianUserId,
        });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        return await db.delete(animalHealthRecords).where(eq(animalHealthRecords.id, input.id));
      }),
  }),

  vaccinations: router({
    listByAnimal: protectedProcedure
      .input(z.object({ animalId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db
          .select()
          .from(animalHealthRecords)
          .where(eq(animalHealthRecords.animalId, input.animalId));
      }),

    record: protectedProcedure
      .input(z.object({
        animalId: z.number(),
        vaccineType: z.string(),
        recordDate: z.date(),
        nextDueDate: z.date().optional(),
        details: z.string().optional(),
        veterinarianUserId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const detailsText = `${input.vaccineType}${input.nextDueDate ? ` - Next due: ${input.nextDueDate.toISOString().split('T')[0]}` : ''}${input.details ? ` - ${input.details}` : ''}`;

        return await db.insert(animalHealthRecords).values({
          animalId: input.animalId,
          recordDate: input.recordDate,
          eventType: "vaccination",
          details: detailsText,
          veterinarianUserId: input.veterinarianUserId,
        });
      }),
  }),

  performanceMetrics: router({
    listByAnimal: protectedProcedure
      .input(z.object({ animalId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(performanceMetrics).where(eq(performanceMetrics.animalId, input.animalId));
      }),

    record: protectedProcedure
      .input(z.object({
        animalId: z.number(),
        metricDate: z.date(),
        weightKg: z.string().optional(),
        milkYieldLiters: z.string().optional(),
        eggCount: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        return await db.insert(performanceMetrics).values({
          animalId: input.animalId,
          metricDate: input.metricDate,
          weightKg: input.weightKg as any,
          milkYieldLiters: input.milkYieldLiters as any,
          eggCount: input.eggCount,
        });
      }),
  }),

  breeding: router({
    listByAnimal: protectedProcedure
      .input(z.object({ animalId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db.select().from(breedingRecords).where(eq(breedingRecords.animalId, input.animalId));
      }),

    create: protectedProcedure
      .input(z.object({
        animalId: z.number(),
        breedingDate: z.date(),
        sireId: z.number().optional(),
        damId: z.number().optional(),
        expectedDueDate: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        return await db.insert(breedingRecords).values({
          animalId: input.animalId,
          breedingDate: input.breedingDate,
          sireId: input.sireId,
          damId: input.damId,
          expectedDueDate: input.expectedDueDate,
          notes: input.notes,
          outcome: "pending",
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        outcome: z.enum(["pending", "successful", "unsuccessful", "aborted"]).optional(),
        expectedDueDate: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const updates: any = {};
        if (input.outcome) updates.outcome = input.outcome;
        if (input.expectedDueDate) updates.expectedDueDate = input.expectedDueDate;
        if (input.notes) updates.notes = input.notes;

        return await db.update(breedingRecords).set(updates).where(eq(breedingRecords.id, input.id));
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        return await db.delete(breedingRecords).where(eq(breedingRecords.id, input.id));
      }),
  }),

  theme: router({
    getTheme: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) return null;
        const theme = await db.select().from(themeConfigs).where(eq(themeConfigs.userId, ctx.user.id)).limit(1);
        return theme[0] || null;
      }),

    updateTheme: protectedProcedure
      .input(z.object({
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        accentColor: z.string().optional(),
        backgroundColor: z.string().optional(),
        textColor: z.string().optional(),
        borderColor: z.string().optional(),
        fontFamily: z.string().optional(),
        fontSize: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const existing = await db.select().from(themeConfigs).where(eq(themeConfigs.userId, ctx.user.id)).limit(1);

        if (existing.length > 0) {
          return await db.update(themeConfigs).set(input).where(eq(themeConfigs.userId, ctx.user.id));
        } else {
          return await db.insert(themeConfigs).values({
            userId: ctx.user.id,
            ...input,
          });
        }
      }),

    resetTheme: protectedProcedure
      .mutation(async ({ ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        return await db.delete(themeConfigs).where(eq(themeConfigs.userId, ctx.user.id));
      }),
  }),

  notifications: notificationRouter,
  feeding: feedingRouter,
  marketplace: marketplaceRouter,
  iot: iotRouter,
  weather: weatherRouter,
  weatherNotifications: weatherNotificationRouter,
  cropPlanning: cropPlanningRouter,
  inventory: inventoryRouter,
  roleManagement: roleManagementRouter,
  merl: merlRouter,
  transport: transportRouter,
  business: businessRouter,
  sms: smsRouter,
  security: securityRouter,
  passwordReset: passwordResetRouter,
  activityApproval: activityApprovalRouter,
  shiftAssignmentWithNotifications: shiftAssignmentWithNotificationsRouter,
  taskAssignmentWithNotifications: taskAssignmentWithNotificationsRouter,
  taskAssignmentDatabase: taskAssignmentDatabaseRouter,
  taskMigration: taskMigrationRouter,
  bulkTaskAssignment: bulkTaskAssignmentRouter,
  taskDependencies: taskDependenciesRouter,
  taskTemplates: taskTemplatesRouter,
  farmTaskFiltering: farmTaskFilteringRouter,
  taskPriorityEscalation: taskPriorityEscalationRouter,
  taskReassignment: taskReassignmentRouter,
  taskCompletionVerification: taskCompletionVerificationRouter,
  workers: workerRouter,
});

export type AppRouter = typeof appRouter;
