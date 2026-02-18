import { Toaster } from "@/components/ui/sonner";
import { useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DarkModeProvider } from "./contexts/DarkModeContext";
import Home from "./pages/Home";
import DashboardLayout from "./components/DashboardLayout";
import FarmManagement from "./pages/FarmManagement";
import CropTracking from "./pages/CropTracking";
import Livestock from "./pages/Livestock";
import ThemeAdmin from "./components/ThemeAdmin";
import { Analytics } from "./pages/Analytics";
import Marketplace from "./pages/Marketplace";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import SellerAnalytics from "./pages/SellerAnalytics";
import SellerPayouts from "./pages/SellerPayouts";
import Wishlist from "./pages/Wishlist";
import OrderTracking from "./pages/OrderTracking";
import SellerVerification from "./pages/SellerVerification";
import InventoryAlerts from "./pages/InventoryAlerts";
import SellerLeaderboard from "./pages/SellerLeaderboard";
import AdminVerification from "./pages/AdminVerification";
import Training from "./pages/Training";
import MERL from "./pages/MERL";
import IoTManagement from "./pages/IoTManagement";
import TransportManagement from "./pages/TransportManagement";
import BusinessStrategy from "./pages/BusinessStrategy";
import WeatherAlerts from "./pages/WeatherAlerts";
import WeatherTrends from "./pages/WeatherTrends";
import Settings from "./pages/Settings";
import CropPlanning from "./pages/CropPlanning";
import RoleManagement from "./pages/RoleManagement";
import SecurityDashboard from "./pages/SecurityDashboard";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import DataManagement from "./pages/DataManagement";
import { FarmFinance } from "./pages/FarmFinance";
import { FinancialManagementPage } from "./pages/FinancialManagementPage";
import LivestockManagement from "./pages/LivestockManagement";
import WorkforceManagement from "./pages/WorkforceManagement";
import FishFarming from "./pages/FishFarming";
import AssetManagement from "./pages/AssetManagement";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import PredictiveAnalytics from "./pages/PredictiveAnalytics";
import PredictionDashboard from "./pages/PredictionDashboard";
import PredictionHistoryComparison from "./pages/PredictionHistoryComparison";
import OutcomeRecordingForm from "./pages/OutcomeRecordingForm";
import NotificationSettings from "./pages/NotificationSettings";
import AlertHistory from "./pages/AlertHistory";
import FertilizerTracking from "./pages/FertilizerTracking";
import NotificationPreferencesPage from "./pages/NotificationPreferencesPage";
import NotificationHistoryPage from "./pages/NotificationHistoryPage";
import ReportManagement from "./pages/ReportManagement";
import ReportTemplates from "./pages/ReportTemplates";
import ReportAnalyticsDashboard from "./pages/ReportAnalyticsDashboard";
import AdvancedReportScheduling from "./pages/AdvancedReportScheduling";
import RecipientGroupManagement from "./pages/RecipientGroupManagement";
import ReportHistoryExport from "./pages/ReportHistoryExport";
import ReportTemplateCustomization from "./pages/ReportTemplateCustomization";
import { InventoryManagement } from "./pages/InventoryManagement";
import { SoilHealthRecommendations } from "./pages/SoilHealthRecommendations";
import { FertilizerCostDashboard } from "./pages/FertilizerCostDashboard";
import { IrrigationCostAnalysisUI } from "./components/IrrigationCostAnalysisUI";
import { CampaignSchedulerUI } from "./components/CampaignSchedulerUI";
import { CampaignMonitorUI } from "./components/CampaignMonitorUI";
import { PestDiseaseManagementUI } from "./components/PestDiseaseManagementUI";
import { ImageUploadDiseaseAnalysis } from "./components/ImageUploadDiseaseAnalysis";
import { ResistanceMonitoringDashboard } from "./components/ResistanceMonitoringDashboard";
import { ChemicalInventoryUI } from "./components/ChemicalInventoryUI";
import { WeatherIntegrationUI } from "./components/WeatherIntegrationUI";
import { FinancialAnalyticsDashboard } from "./components/FinancialAnalyticsDashboard";
import { LaborManagementUI } from "./components/LaborManagementUI";
import { BudgetVsActualDashboard } from "./components/BudgetVsActualDashboard";
import { FloatingElements } from "./components/FloatingElements";
import { BreadcrumbProvider } from "./contexts/BreadcrumbContext";
import { CommandPalette } from "./components/CommandPalette";
import { Breadcrumb } from "./components/Breadcrumb";
import { ThemeSelector } from "./components/ThemeSelector";
import { MobileDrawer } from "./components/MobileDrawer";
import { NotificationCenter } from "./components/NotificationCenter";
import { NotificationAnalyticsDashboard } from "./pages/NotificationAnalyticsDashboard";
import { FieldWorkerDashboard } from "./pages/FieldWorkerDashboard";
import { ActivityLogger } from './pages/ActivityLogger';
import { ViewAllTasks } from './pages/ViewAllTasks';
import { ViewAllActivities } from './pages/ViewAllActivities';
import { ManagerTaskAssignment } from './pages/ManagerTaskAssignment';
import { BatchTaskImport } from "./pages/BatchTaskImport";
import { ActivityAnalyticsDashboard } from "./pages/ActivityAnalyticsDashboard";
import { GPSTracking } from "./pages/GPSTracking";
import { ActivityPhotoGallery } from "./pages/ActivityPhotoGallery";
import { TaskPerformanceAnalytics } from "./pages/TaskPerformanceAnalytics";
import { BlockchainSupplyChain } from "./pages/BlockchainSupplyChain";
import { FarmerDashboard } from "./pages/FarmerDashboard";
import { ActivityHistory } from "./pages/ActivityHistory";
import { ActivityApprovalManager } from "./pages/ActivityApprovalManager";
import { TimeTrackerReporting } from "./pages/TimeTrackerReporting";
import FieldWorkerHome from "./pages/FieldWorkerHome";
import FieldWorkerTaskDetail from "./pages/FieldWorkerTaskDetail";
import FieldWorkerTaskList from "./pages/FieldWorkerTaskList";
import WorkerPerformanceDashboard from "./pages/WorkerPerformanceDashboard";
import WorkerStatusDashboard from "./pages/WorkerStatusDashboard";
import { TaskDetail } from "./pages/TaskDetail";
import AdminDataSettings from "./pages/AdminDataSettings";
import { SpeciesSelectionWizard } from "./components/SpeciesSelectionWizard";
import { SpeciesProductionDashboard } from "./pages/SpeciesProductionDashboard";
import { BreedComparison } from "./pages/BreedComparison";
import { BulkAnimalRegistration } from "./pages/BulkAnimalRegistration";
import { AnimalInventory } from "./pages/AnimalInventory";
import { NotificationProvider } from "./contexts/NotificationContext";
import { TimeTrackerProvider } from "./contexts/TimeTrackerContext";
import { ActivityNotificationContainer } from "./components/ActivityNotificationToast";
import { WebSocketStatus } from "./components/WebSocketStatus";
import { useNotification } from "./contexts/NotificationContext";
import { useWebSocket } from "./hooks/useWebSocket";
import { LoadingProvider } from "./contexts/LoadingContext";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { FinancialDashboard } from "./pages/FinancialDashboard";
import { FinancialManagement } from "./pages/FinancialManagement";
import { FinancialForecastingDashboard } from "./pages/FinancialForecastingDashboard";
import { GhanaExtensionServicesDashboard } from "./pages/GhanaExtensionServicesDashboard";
import { InvoiceAndTaxReporting } from "./pages/InvoiceAndTaxReporting";
import VeterinaryDirectory from "./pages/VeterinaryDirectory";
import VeterinaryAppointments from "./pages/VeterinaryAppointments";
import VeterinaryPrescriptions from "./pages/VeterinaryPrescriptions";
import VeterinaryTelemedicine from "./pages/VeterinaryTelemedicine";
import VeterinaryHealthRecords from "./pages/VeterinaryHealthRecords";
import VeterinaryAlerts from "./pages/VeterinaryAlerts";
import ExtensionAgents from "./pages/ExtensionAgents";
import TemplateManagementPage from "./pages/TemplateManagementPage";
import NotificationDeliveryTrackingDashboard from "./pages/NotificationDeliveryTrackingDashboard";
import AdminSchedulerControlPanel from "./pages/AdminSchedulerControlPanel";
import CropRecommendationPage from "./pages/CropRecommendationPage";
import FarmerCommunityForum from "./pages/FarmerCommunityForum";
import SupplyChainDashboard from "./pages/SupplyChainDashboard";
import CooperativeDashboard from "./pages/CooperativeDashboard";
import { FarmComparison } from "./components/FarmComparison";
import { FarmConsolidationDashboard } from "./components/FarmConsolidationDashboard";
import { FarmDetailedAnalytics } from "./components/FarmDetailedAnalytics";
import { TaskAssignmentUI } from "./components/TaskAssignmentUI";
import { TaskAssignmentUIWithDatabase } from "./components/TaskAssignmentUIWithDatabase";
import { TaskCompletionTracking } from "./components/TaskCompletionTracking";
import { TaskTemplatesUI } from "./components/TaskTemplatesUI";
import { AlertDashboard } from "./components/AlertDashboard";
import { WorkerAvailabilityCalendar } from "./components/WorkerAvailabilityCalendar";
import { WorkerPerformanceTrends } from "./components/WorkerPerformanceTrends";
import { ShiftManagement } from "./components/ShiftManagement";
import { BulkShiftAssignment } from "./components/labor/BulkShiftAssignment";
import { ComplianceDashboard } from "./components/ComplianceDashboard";
import AdvancedAnalyticsDashboard from "./pages/AdvancedAnalyticsDashboard";
import AISchedulingDashboard from "./pages/AISchedulingDashboard";
import { ResponsiveZoomManager } from "./components/ResponsiveZoomManager";
import { useZoomKeyboardShortcuts } from "./hooks/useZoomKeyboardShortcuts";

function Router() {
  return (
    <Switch>
       <Route path="/" component={Home} />
      <Route path="/report-management">
        {() => (
          <DashboardLayout>
            <ReportManagement />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/report-templates">
        {() => (
          <DashboardLayout>
            <ReportTemplates />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/report-analytics">
        {() => (
          <DashboardLayout>
            <ReportAnalyticsDashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/advanced-report-scheduling">
        {() => (
          <DashboardLayout>
            <AdvancedReportScheduling />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/recipient-groups">
        {() => (
          <DashboardLayout>
            <RecipientGroupManagement />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/report-history-export">
        {() => (
          <DashboardLayout>
            <ReportHistoryExport />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/report-template-customization">
        {() => (
          <DashboardLayout>
            <ReportTemplateCustomization />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/farm-comparison">
        {() => (
          <DashboardLayout>
            <FarmComparison />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/farm-consolidation">
        {() => (
          <DashboardLayout>
            <FarmConsolidationDashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/farm/:farmId/analytics">
        {() => (
          <DashboardLayout>
            <FarmDetailedAnalytics />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/inventory-management">
        {() => (
          <DashboardLayout>
            <InventoryManagement />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/soil-health-recommendations">
        {() => (
          <DashboardLayout>
            <SoilHealthRecommendations />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/fertilizer-cost-dashboard">
        {() => (
          <DashboardLayout>
            <FertilizerCostDashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/irrigation-cost-analysis">
        {() => (
          <DashboardLayout>
            <IrrigationCostAnalysisUI />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/campaign-scheduler">
        {() => (
          <DashboardLayout>
            <CampaignSchedulerUI />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/campaign-monitor">
        {() => (
          <DashboardLayout>
            <CampaignMonitorUI />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/pest-disease-management">
        {() => (
          <DashboardLayout>
            <PestDiseaseManagementUI />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/disease-analysis">
        {() => (
          <DashboardLayout>
            <ImageUploadDiseaseAnalysis />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/resistance-monitoring">
        {() => (
          <DashboardLayout>
            <ResistanceMonitoringDashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/chemical-inventory">
        {() => (
          <DashboardLayout>
            <ChemicalInventoryUI />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/weather-integration">
        {() => (
          <DashboardLayout>
            <WeatherIntegrationUI />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/financial-analytics">
        {() => (
          <DashboardLayout>
            <FinancialAnalyticsDashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/labor-management">
        {() => (
          <DashboardLayout>
            <LaborManagementUI />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/task-assignment">
        {() => (
          <DashboardLayout>
            <TaskAssignmentUI />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/task-completion-tracking">
        {() => (
          <DashboardLayout>
            <TaskCompletionTracking />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/task-templates">
        {() => (
          <DashboardLayout>
            <TaskTemplatesUI />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/alert-dashboard">
        {() => (
          <DashboardLayout>
            <AlertDashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/worker-availability">
        {() => (
          <DashboardLayout>
            <WorkerAvailabilityCalendar />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/performance-trends">
        {() => (
          <DashboardLayout>
            <WorkerPerformanceTrends />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/shift-management">
        {() => (
          <DashboardLayout>
            <ShiftManagement />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/bulk-shift-assignment">
        {() => (
          <DashboardLayout>
            <BulkShiftAssignment />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/budget-vs-actual">
        {() => (
          <DashboardLayout>
            <BudgetVsActualDashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/notification-analytics">
        {() => (
          <DashboardLayout>
            <NotificationAnalyticsDashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/prediction-dashboard">
        {() => (
          <DashboardLayout>
            <PredictionDashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/prediction-history">
        {() => (
          <DashboardLayout>
            <PredictionHistoryComparison />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/outcome-recording">
        {() => (
          <DashboardLayout>
            <OutcomeRecordingForm />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/data-management">
        {() => (
          <DashboardLayout>
            <DataManagement />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/farms">
        {() => (
          <DashboardLayout>
            <FarmManagement />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/financial-management">
        {() => <FinancialManagementPage />}
      </Route>
      <Route path="/crops">
        {() => (
          <DashboardLayout>
            <CropTracking />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/livestock">
        {() => (
          <DashboardLayout>
            <Livestock />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/bulk-animal-registration">
        {() => (
          <DashboardLayout>
            <BulkAnimalRegistration />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/animal-inventory">
        {() => (
          <DashboardLayout>
            <AnimalInventory />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/multi-species">
        {() => (
          <DashboardLayout>
            <Livestock />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/species-production-dashboard">
        {() => (
          <DashboardLayout>
            <SpeciesProductionDashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/breed-comparison">
        {() => (
          <DashboardLayout>
            <BreedComparison />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/species-wizard">
        {() => (
          <DashboardLayout>
            <SpeciesSelectionWizard onComplete={() => {}} onCancel={() => {}} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/financial-dashboard">
        {() => (
          <DashboardLayout>
            <FinancialDashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/financial-management">
        {() => (
          <DashboardLayout>
            <FinancialManagement />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/financial-forecasting">
        {() => (
          <DashboardLayout>
            <FinancialForecastingDashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/ghana-extension-services">
        {() => (
          <DashboardLayout>
            <GhanaExtensionServicesDashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/veterinary/directory">
        {() => (
          <DashboardLayout>
            <VeterinaryDirectory />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/veterinary/appointments">
        {() => (
          <DashboardLayout>
            <VeterinaryAppointments />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/veterinary/prescriptions">
        {() => (
          <DashboardLayout>
            <VeterinaryPrescriptions />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/veterinary/telemedicine">
        {() => (
          <DashboardLayout>
            <VeterinaryTelemedicine />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/veterinary/health-records">
        {() => (
          <DashboardLayout>
            <VeterinaryHealthRecords />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/veterinary/alerts">
        {() => (
          <DashboardLayout>
            <VeterinaryAlerts />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/extension/agents">
        {() => (
          <DashboardLayout>
            <ExtensionAgents />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/invoicing-tax-reporting">
        {() => (
          <DashboardLayout>
            <InvoiceAndTaxReporting />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/analytics">
        {() => (
          <DashboardLayout>
            <Analytics />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/marketplace">
        {() => (
          <DashboardLayout>
            <Marketplace />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/checkout">
        {() => (
          <DashboardLayout>
            <Checkout />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/orders">
        {() => (
          <DashboardLayout>
            <Orders />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/seller-analytics">
        {() => (
          <DashboardLayout>
            <SellerAnalytics />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/seller-payouts">
        {() => (
          <DashboardLayout>
            <SellerPayouts />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/wishlist">
        {() => (
          <DashboardLayout>
            <Wishlist />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/track-order/:id">
        {() => (
          <DashboardLayout>
            <OrderTracking />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/seller-verification">
        {() => (
          <DashboardLayout>
            <SellerVerification />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/inventory-alerts">
        {() => (
          <DashboardLayout>
            <InventoryAlerts />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/seller-leaderboard">
        {() => (
          <DashboardLayout>
            <SellerLeaderboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/admin-verification">
        {() => (
          <DashboardLayout>
            <AdminVerification />
          </DashboardLayout>
        )}
      </Route>
          <Route path="/theme">
        {() => (
          <DashboardLayout>
            <ThemeAdmin />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/training">
        {() => (
          <DashboardLayout>
            <Training />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/merl">
        {() => (
          <DashboardLayout>
            <MERL />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/iot">
        {() => (
          <DashboardLayout>
            <IoTManagement />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/transport">
        {() => (
          <DashboardLayout>
            <TransportManagement />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/business">
        {() => (
          <DashboardLayout>
            <BusinessStrategy />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/weather-alerts">
        {() => (
          <DashboardLayout>
            <WeatherAlerts />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/weather-trends">
        {() => (
          <DashboardLayout>
            <WeatherTrends />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/settings">
        {() => (
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/crop-planning">
        {() => (
          <DashboardLayout>
            <CropPlanning />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/security">
        {() => (
          <DashboardLayout>
            <SecurityDashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/role-management">
        {() => (
          <DashboardLayout>
            <RoleManagement />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/farm-finance">
        {() => (
          <DashboardLayout>
            <FarmFinance />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/livestock-management">
        {() => (
          <DashboardLayout>
            <LivestockManagement />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/workforce-management">
        {() => (
          <DashboardLayout>
            <WorkforceManagement />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/fish-farming">
        {() => (
          <DashboardLayout>
            <FishFarming />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/asset-management">
        {() => (
          <DashboardLayout>
            <AssetManagement />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/analytics-dashboard">
        {() => (
          <DashboardLayout>
            <AnalyticsDashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/predictive-analytics">
        {() => (
          <DashboardLayout>
            <PredictiveAnalytics />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/notification-settings">
        {() => (
          <DashboardLayout>
            <NotificationSettings />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/alert-history">
        {() => (
          <DashboardLayout>
            <AlertHistory />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/fertilizer-tracking">
        {() => (
          <DashboardLayout>
            <FertilizerTracking />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/field-worker">
        {() => (
          <FieldWorkerHome />
        )}
      </Route>
      <Route path="/field-worker/dashboard">
        {() => (
          <DashboardLayout>
            <FieldWorkerDashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/field-worker/activity-log">
        {() => (
          <DashboardLayout>
            <ActivityLogger />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/field-worker/tasks/:id">
        {() => (
          <FieldWorkerTaskDetail />
        )}
      </Route>
      <Route path="/field-worker/tasks">
        {() => (
          <FieldWorkerTaskList />
        )}
      </Route>
      <Route path="/field-worker/activities">
        {() => (
          <DashboardLayout>
            <ViewAllActivities />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/field-worker/activity-history">
        {() => (
          <DashboardLayout>
            <ActivityHistory />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/field-worker/activity-approval">
        {() => (
          <DashboardLayout>
            <ActivityApprovalManager />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/manager/tasks">
        {() => (
          <DashboardLayout>
            <ManagerTaskAssignment />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/manager/batch-import">
        {() => (
          <DashboardLayout>
            <BatchTaskImport />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/manager/analytics">
        {() => (
          <DashboardLayout>
            <ActivityAnalyticsDashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/field-worker/gps-tracking">
        {() => (
          <DashboardLayout>
            <GPSTracking />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/field-worker/photo-gallery">
        {() => (
          <DashboardLayout>
            <ActivityPhotoGallery />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/reporting/time-tracker">
        {() => (
          <DashboardLayout>
            <TimeTrackerReporting />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/reporting/worker-performance">
        {() => (
          <DashboardLayout>
            <WorkerPerformanceDashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/reporting/worker-status">
        {() => (
          <DashboardLayout>
            <WorkerStatusDashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/labor/compliance-dashboard">
        {() => (
          <DashboardLayout>
            <ComplianceDashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/labor/shift-management">
        {() => (
          <DashboardLayout>
            <ShiftManagement />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/labor/advanced-analytics">
        {() => (
          <DashboardLayout>
            <AdvancedAnalyticsDashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/labor/ai-scheduling">
        {() => (
          <DashboardLayout>
            <AISchedulingDashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/labor/worker-performance">
        {() => (
          <DashboardLayout>
            <WorkerPerformanceTrends />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/manager/performance">
        {() => (
          <DashboardLayout>
            <TaskPerformanceAnalytics />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/admin/data-settings">
        {() => (
          <DashboardLayout>
            <AdminDataSettings />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/notification-preferences">
        {() => (
          <DashboardLayout>
            <NotificationPreferencesPage />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/notification-history">
        {() => (
          <DashboardLayout>
            <NotificationHistoryPage />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/notification-templates">
        {() => (
          <DashboardLayout>
            <TemplateManagementPage />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/notification-delivery-tracking">
        {() => (
          <DashboardLayout>
            <NotificationDeliveryTrackingDashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/admin/scheduler">
        {() => (
          <DashboardLayout>
            <AdminSchedulerControlPanel />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/blockchain-supply-chain">
        {() => (
          <DashboardLayout>
            <BlockchainSupplyChain />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/farmer-dashboard">
        {() => (
          <DashboardLayout>
            <FarmerDashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/crop-recommendations">
        {() => (
          <DashboardLayout>
            <CropRecommendationPage />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/community-forum">
        {() => (
          <DashboardLayout>
            <FarmerCommunityForum />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/supply-chain">
        {() => (
          <DashboardLayout>
            <SupplyChainDashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/cooperative">
        {() => (
          <DashboardLayout>
            <CooperativeDashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function AppContent() {
  const { notifications, removeNotification } = useNotification();
  const { isConnected, isReconnecting } = useWebSocket();
  useZoomKeyboardShortcuts();

  // Initialize theme on app load
  useEffect(() => {
    import('@/services/themeService').then(({ initializeTheme }) => {
      initializeTheme();
    });
  }, []);

  return (
    <ErrorBoundary>
      <DarkModeProvider>
        <ThemeProvider
          defaultTheme="light"
          switchable
        >
          <BreadcrumbProvider>
            <TooltipProvider>
              <ResponsiveZoomManager />
              <div className="min-h-screen flex flex-col bg-background">
                {/* Offline Indicator */}
                <OfflineIndicator />

                {/* Top Navigation Bar */}
                <nav className="border-b bg-background sticky top-0 z-40 shadow-sm">
                  <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1">
                      <h1 className="text-xl font-bold text-foreground">FarmKonnect</h1>
                    </div>
                    <div className="hidden md:flex items-center gap-4">
                      <CommandPalette />
                      <NotificationCenter />
                      <ThemeSelector />
                    </div>
                    <MobileDrawer
                      items={[
                        { label: "Home", href: "/" },
                        { label: "Farms", href: "/farms" },
                        { label: "Crops", href: "/crops" },
                        { label: "Livestock", href: "/livestock" },
                        { label: "Marketplace", href: "/marketplace" },
                        { label: "Analytics", href: "/analytics" },
                        { label: "Settings", href: "/settings" },
                      ]}
                      title="FarmKonnect"
                    />
                  </div>
                </nav>

                {/* Breadcrumb Navigation */}
                <div className="border-b bg-muted/30">
                  <div className="container mx-auto px-4 py-2">
                    <Breadcrumb />
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-auto">
                  <Toaster />
                  <FloatingElements />
                  <WebSocketStatus isConnected={isConnected} isReconnecting={isReconnecting} />
                  <ActivityNotificationContainer
                    notifications={notifications}
                    onDismiss={removeNotification}
                    position="top-right"
                  />
                  <Router />
                </div>
              </div>
            </TooltipProvider>
          </BreadcrumbProvider>
        </ThemeProvider>
      </DarkModeProvider>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <LoadingProvider>
      <NotificationProvider>
        <TimeTrackerProvider>
          <AppContent />
        </TimeTrackerProvider>
      </NotificationProvider>
    </LoadingProvider>
  );
}

export default App;
