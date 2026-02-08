import { Toaster } from "@/components/ui/sonner";
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
import LivestockManagement from "./pages/LivestockManagement";
import WorkforceManagement from "./pages/WorkforceManagement";
import FishFarming from "./pages/FishFarming";
import AssetManagement from "./pages/AssetManagement";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import PredictiveAnalytics from "./pages/PredictiveAnalytics";
import NotificationSettings from "./pages/NotificationSettings";
import AlertHistory from "./pages/AlertHistory";
import FertilizerTracking from "./pages/FertilizerTracking";
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
import { FloatingElements } from "./components/FloatingElements";
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
import { ActivityHistory } from "./pages/ActivityHistory";
import { ActivityApprovalManager } from "./pages/ActivityApprovalManager";
import { TimeTrackerReporting } from "./pages/TimeTrackerReporting";
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
import { FinancialDashboard } from "./pages/FinancialDashboard";
import { GhanaExtensionServicesDashboard } from "./pages/GhanaExtensionServicesDashboard";
import { InvoiceAndTaxReporting } from "./pages/InvoiceAndTaxReporting";

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
            <FinancialDashboard farmId="1" />
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
      <Route path="/invoicing-tax-reporting">
        {() => (
          <DashboardLayout>
            <InvoiceAndTaxReporting farmId="1" />
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
          <DashboardLayout>
            <TaskDetail />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/field-worker/tasks">
        {() => (
          <DashboardLayout>
            <ViewAllTasks />
          </DashboardLayout>
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

  return (
    <ErrorBoundary>
      <DarkModeProvider>
        <ThemeProvider
          defaultTheme="light"
          // switchable
        >
          <TooltipProvider>
            <Toaster />
            <FloatingElements />
            <WebSocketStatus isConnected={isConnected} isReconnecting={isReconnecting} />
            <ActivityNotificationContainer
              notifications={notifications}
              onDismiss={removeNotification}
              position="top-right"
            />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </DarkModeProvider>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <NotificationProvider>
      <TimeTrackerProvider>
        <AppContent />
      </TimeTrackerProvider>
    </NotificationProvider>
  );
}

export default App;
