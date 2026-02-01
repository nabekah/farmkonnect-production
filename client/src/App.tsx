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

function Router() {
  return (
    <Switch>
       <Route path="/" component={Home} />
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
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <DarkModeProvider>
        <ThemeProvider
          defaultTheme="light"
          // switchable
        >
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </DarkModeProvider>
    </ErrorBoundary>
  );
}

export default App;
