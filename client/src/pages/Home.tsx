import { useLocation } from "wouter";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
  Tractor,
  Sprout,
  Beef,
  ShoppingCart,
  BarChart3,
  Cloud,
  TrendingUp,
  TrendingDown,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Leaf,
  MapPin,
  Play,
  X,
  DollarSign,
  Users,
  Fish,
  Wrench,
  Wallet,
  UserCog,
  PieChart,
  Activity,
  Droplet,
  AlertCircle,
  Clock,
  BookOpen,
  Brain,
  Cpu,
  Truck,
  Briefcase,
  LineChart,
  Target,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl, getGoogleLoginUrl } from "@/const";
import { Navbar } from "@/components/Navbar";
import { WeatherWidget } from "@/components/WeatherWidget";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { WorkerQuickActions } from "@/components/WorkerQuickActions";
import { FarmComparisonView } from "@/components/FarmComparisonView";
import { FarmAlertsCenter, type FarmAlert } from "@/components/FarmAlertsCenter";
import { FarmRecommendations } from "@/components/FarmRecommendations";
import { FarmQuickActions } from "@/components/FarmQuickActions";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Set page title and meta tags for SEO
  useEffect(() => {
    document.title = "FarmKonnect - Smart Agricultural Management Platform";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "FarmKonnect is a comprehensive farm management platform for tracking crops, livestock, weather, and marketplace sales across Ghana and West Africa."
      );
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <AuthenticatedHome user={user} setLocation={setLocation} />
    );
  }

  return (
    <LandingPage />
  );
}

function AuthenticatedHome({ user, setLocation }: { user: any; setLocation: (path: string) => void }) {
  // Check if onboarding is complete
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const completed = localStorage.getItem("farmkonnect_onboarding_complete");
    return !completed;
  });

  const handleOnboardingComplete = () => {
    localStorage.setItem("farmkonnect_onboarding_complete", "true");
    setShowOnboarding(false);
  };

  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Fetch farms
  const { data: farms = [] } = trpc.farm.getFarms.useQuery(undefined, {
    enabled: !!user,
  });

  // Fetch expenses
  const { data: expenses = [] } = trpc.farm.getExpenses.useQuery(
    { farmId: selectedFarmId },
    { enabled: !!user && !!selectedFarmId }
  );

  // Fetch revenue
  const { data: revenue = [] } = trpc.farm.getRevenue.useQuery(
    { farmId: selectedFarmId },
    { enabled: !!user && !!selectedFarmId }
  );

  // Fetch farm alerts
  const { data: farmAlerts = [] } = trpc.farm.getFarmAlerts.useQuery(
    { farmId: selectedFarmId },
    { enabled: !!user && !!selectedFarmId }
  );

  const totalRevenue = revenue.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  const visibleAlerts = farmAlerts.filter(a => !dismissedAlerts.has(a.id));

  return (
    <>
      <OnboardingWizard
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {user.name}!</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your agricultural operations efficiently</p>
          </div>

          {/* Farm Filter */}
          <div className="mb-6 flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Farm:</label>
            <select
              value={selectedFarmId || ""}
              onChange={(e) => setSelectedFarmId(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Farms</option>
              {farms?.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.farmName}
                </option>
              ))}
            </select>
          </div>

          {/* KPI Cards Grid - Compact 4-column layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KPICard
              title="Total Revenue"
              value={`GH₵ ${totalRevenue.toLocaleString()}`}
              trend={totalRevenue > totalExpenses ? "up" : "down"}
              trendValue={totalRevenue > 0 ? `${((netProfit / totalRevenue) * 100).toFixed(1)}%` : "0%"}
              icon={<DollarSign className="w-5 h-5" />}
              color="text-green-600"
              onClick={() => setLocation("/farm-finance")}
            />
            <KPICard
              title="Total Expenses"
              value={`GH₵ ${totalExpenses.toLocaleString()}`}
              trend="neutral"
              trendValue={`${expenses?.length || 0} transactions`}
              icon={<Wallet className="w-5 h-5" />}
              color="text-red-600"
              onClick={() => setLocation("/farm-finance")}
            />
            <KPICard
              title="Net Profit"
              value={`GH₵ ${netProfit.toLocaleString()}`}
              trend={netProfit > 0 ? "up" : "down"}
              trendValue={netProfit > 0 ? `+${((netProfit / totalRevenue) * 100).toFixed(1)}%` : "0%"}
              icon={<TrendingUp className="w-5 h-5" />}
              color="text-blue-600"
              onClick={() => setLocation("/farm-finance")}
            />
            <KPICard
              title="Active Farms"
              value={farms?.length || 0}
              trend="neutral"
              trendValue="Total farms"
              icon={<Sprout className="w-5 h-5" />}
              color="text-purple-600"
              onClick={() => setLocation("/farm-management")}
            />
          </div>

          {/* Alerts Section */}
          {visibleAlerts.length > 0 && (
            <div className="mb-8">
              <FarmAlertsCenter
                alerts={visibleAlerts}
                onDismiss={(id) => {
                  const newDismissed = new Set(dismissedAlerts);
                  newDismissed.add(id);
                  setDismissedAlerts(newDismissed);
                }}
              />
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Widgets */}
            <div className="lg:col-span-2 space-y-6">
              <WeatherWidget />
              <FarmQuickActions />
              <FarmRecommendations />
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              <WorkerQuickActions />
              <FarmComparisonView />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

interface KPICardProps {
  title: string;
  value: string | number;
  trend: "up" | "down" | "neutral";
  trendValue: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

function KPICard({ title, value, trend, trendValue, icon, color, onClick }: KPICardProps) {
  return (
    <Card className="border-l-4 border-l-green-600 hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-r-0 border-t-0 border-b-0 cursor-pointer" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
            <div className="flex items-center gap-1 mt-2">
              {trend === "up" && <TrendingUp className={`w-4 h-4 ${color}`} />}
              {trend === "down" && <TrendingDown className={`w-4 h-4 ${color}`} />}
              <span className="text-xs text-gray-600 dark:text-gray-400">{trendValue}</span>
            </div>
          </div>
          <div className={`${color} opacity-20`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function LandingPage() {
  const loginUrl = getLoginUrl();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-green-950 dark:via-gray-900 dark:to-green-950">
      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 md:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className="space-y-6 md:space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                  Smart Farm Management Made Simple
                </h1>
                <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300">
                  Real-time monitoring, livestock tracking, and analytics for modern farming operations across West Africa.
                </p>
              </div>
              
              {/* Auth Buttons - Google and Manus as Primary Options */}
              <div className="flex flex-col gap-4 pt-6">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Get Started:</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a href={getGoogleLoginUrl()} className="flex-1">
                    <Button size="lg" className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 px-6 py-3 rounded-lg w-full flex items-center justify-center gap-2 font-semibold">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Sign in with Google
                    </Button>
                  </a>
                  <a href={loginUrl} className="flex-1">
                    <Button size="lg" className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white px-6 py-3 rounded-lg w-full flex items-center justify-center gap-2 font-semibold">
                      <Sprout className="w-5 h-5" />
                      Sign in with Manus
                    </Button>
                  </a>
                </div>
              </div>
            </div>

            {/* Right: Hero Image */}
            <div className="relative h-80 sm:h-96 bg-gradient-to-br from-green-200 to-green-100 dark:from-green-900 dark:to-green-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Tractor className="h-32 w-32 text-green-700 dark:text-green-300 mx-auto mb-4" />
                  <p className="text-green-700 dark:text-green-300 font-semibold">Farm Management Platform</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features for Every Farm
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Everything you need to manage your agricultural operations efficiently
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <FeatureCard
              icon={<Beef className="h-8 w-8" />}
              title="Livestock Management"
              description="Track animal health, breeding, and productivity with comprehensive genealogy records"
              color="text-blue-600"
            />

            {/* Feature 2 */}
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8" />}
              title="Real-time Analytics"
              description="Monitor farm performance with live dashboards and detailed insights"
              color="text-green-600"
            />

            {/* Feature 3 */}
            <FeatureCard
              icon={<Cloud className="h-8 w-8" />}
              title="Weather Integration"
              description="Get weather forecasts and alerts to optimize farming operations"
              color="text-cyan-600"
            />

            {/* Feature 4 */}
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="Workforce Management"
              description="Assign tasks, track activities, and manage your farm team efficiently"
              color="text-purple-600"
            />

            {/* Feature 5 */}
            <FeatureCard
              icon={<DollarSign className="h-8 w-8" />}
              title="Financial Tracking"
              description="Monitor expenses, revenue, and profitability in real-time"
              color="text-amber-600"
            />

            {/* Feature 6 */}
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title="Data Security"
              description="Enterprise-grade security with encrypted data storage and access control"
              color="text-red-600"
            />

            {/* Feature 7 */}
            <FeatureCard
              icon={<Fish className="h-8 w-8" />}
              title="Fish Farming"
              description="Comprehensive aquaculture management with pond monitoring and health tracking"
              color="text-teal-600"
            />

            {/* Feature 8 */}
            <FeatureCard
              icon={<MapPin className="h-8 w-8" />}
              title="GPS Tracking"
              description="Track field locations, equipment, and worker movements in real-time"
              color="text-indigo-600"
            />

            {/* Feature 9 */}
            <FeatureCard
              icon={<Zap className="h-8 w-8" />}
              title="IoT Integration"
              description="Connect sensors and devices for automated monitoring and alerts"
              color="text-yellow-600"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-green-600 to-green-700 dark:from-green-700 dark:to-green-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Ready to Transform Your Farm?
          </h2>
          <p className="text-lg text-green-100 mb-8">
            Join thousands of farmers already using FarmKonnect to optimize their operations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={getGoogleLoginUrl()}>
              <Button size="lg" className="bg-white hover:bg-gray-100 text-green-600 px-8 py-3 rounded-lg font-semibold">
                Sign up with Google
              </Button>
            </a>
            <a href={loginUrl}>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-green-700 px-8 py-3 rounded-lg font-semibold">
                Sign up with Manus
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-400 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <p>&copy; 2026 FarmKonnect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

function FeatureCard({ icon, title, description, color }: FeatureCardProps) {
  return (
    <Card className="bg-gray-50 dark:bg-gray-800 border-0 hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className={`${color} mb-4`}>{icon}</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
      </CardContent>
    </Card>
  );
}
