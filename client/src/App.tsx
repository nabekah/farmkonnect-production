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

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
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
      <Route path="/role-management">
        {() => (
          <DashboardLayout>
            <RoleManagement />
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
