import { useEffect, useState } from "react";
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
import { getLoginUrl } from "@/const";
import { Navbar } from "@/components/Navbar";
import { WeatherWidget } from "@/components/WeatherWidget";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { WorkerQuickActions } from "@/components/WorkerQuickActions";
import { FarmComparisonView } from "@/components/FarmComparisonView";
import { FarmAlertsCenter, type FarmAlert } from "@/components/FarmAlertsCenter";
import { FarmRecommendations } from "@/components/FarmRecommendations";
import { trpc } from "@/lib/trpc";

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
      <>
        <Navbar />
        <AuthenticatedHome user={user} setLocation={setLocation} />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <LandingPage />
    </>
  );
}

function AuthenticatedHome({ user, setLocation }: { user: any; setLocation: (path: string) => void }) {
  // Check if onboarding is complete
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const completed = localStorage.getItem("farmkonnect_onboarding_complete");
    return !completed;
  });

  // State for farm filter - null means All Farms
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(() => {
    const saved = localStorage.getItem("farmkonnect_selected_farm");
    return saved ? parseInt(saved) : null;
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Persist farm selection to localStorage
  useEffect(() => {
    if (isInitialized) {
      if (selectedFarmId === null) {
        localStorage.removeItem("farmkonnect_selected_farm");
      } else {
        localStorage.setItem("farmkonnect_selected_farm", selectedFarmId.toString());
      }
    }
  }, [selectedFarmId, isInitialized]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };
  // Fetch KPI data
  const { data: farms } = trpc.farms.list.useQuery();
  const farmId = farms && farms.length > 0 ? farms[0].id : 1;

  // Initialize on first load
  useEffect(() => {
    if (farms && farms.length > 0 && !isInitialized) {
      setIsInitialized(true);
    }
  }, [farms, isInitialized]);

  // Determine which farm ID to use for queries
  const queryFarmId = selectedFarmId || (farms && farms.length > 0 ? farms[0].id : 1);
  const isAllFarmsSelected = selectedFarmId === null;

  // Financial data - use consolidated queries when All Farms selected
  const { data: expenses } = isAllFarmsSelected 
    ? trpc.financial.allExpenses.useQuery()
    : trpc.financial.expenses.list.useQuery({ farmId: queryFarmId });
  const { data: revenue } = isAllFarmsSelected
    ? trpc.financial.allRevenue.useQuery()
    : trpc.financial.revenue.list.useQuery({ farmId: queryFarmId });

  // Livestock data - use consolidated query when All Farms selected
  const { data: animals } = isAllFarmsSelected
    ? trpc.livestock.allAnimals.useQuery()
    : trpc.livestock.animals.list.useQuery({ farmId: queryFarmId });

  // Workforce data - always get all workers, filter based on selection
  const { data: allWorkers } = trpc.workforce.workers.getAllWorkers.useQuery({});
  const { data: farmWorkers } = trpc.workforce.workers.list.useQuery(
    { farmId: queryFarmId },
    { enabled: !!queryFarmId }
  );
  
  // Use all owner's workers if All Farms selected, otherwise use farm-specific workers
  const workers = isAllFarmsSelected ? allWorkers : farmWorkers;

  // Fish farming data
  const { data: ponds } = trpc.fishFarming.ponds.list.useQuery({ farmId: queryFarmId });

  // Assets data - use consolidated query when All Farms selected
  const { data: assets } = isAllFarmsSelected
    ? trpc.assets.allAssets.useQuery()
    : trpc.assets.assets.list.useQuery({ farmId: queryFarmId });

  // Calculate KPIs
  const totalRevenue = revenue?.reduce((sum, r) => sum + parseFloat(r.amount || "0"), 0) || 0;
  const totalExpenses = expenses?.reduce((sum, e) => sum + parseFloat(e.amount || "0"), 0) || 0;
  const netProfit = totalRevenue - totalExpenses;
  const activeAnimals = animals?.filter(a => a.status === "active").length || 0;
  const activeWorkers = workers?.filter(w => w.status === "active").length || 0;
  const activePonds = ponds?.filter(p => p.status === "active").length || 0;
  const activeAssets = assets?.filter(a => a.status === "active").length || 0;

  // Generate farm-specific alerts
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const farmAlerts: FarmAlert[] = [];
  farms?.forEach((farm) => {
    if (netProfit < 0) {
      farmAlerts.push({
        id: `loss-${farm.id}`,
        farmId: farm.id,
        farmName: farm.farmName,
        type: "error",
        title: "Operating at Loss",
        message: `Farm is currently operating at a loss. Review expenses and revenue sources.`,
        timestamp: new Date(),
        actionUrl: "/farm-finance",
        actionLabel: "View Finance",
      });
    }
  });
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
              title="Active Animals"
              value={activeAnimals.toString()}
              trend="neutral"
              trendValue={`${animals?.length || 0} total`}
              icon={<Beef className="w-5 h-5" />}
              color="text-amber-600"
              onClick={() => setLocation("/livestock-management")}
            />
            <KPICard
              title="Net Profit"
              value={`GH₵ ${netProfit.toLocaleString()}`}
              trend={netProfit > 0 ? "up" : netProfit < 0 ? "down" : "neutral"}
              trendValue={netProfit > 0 ? "Profitable" : netProfit < 0 ? "Loss" : "Break-even"}
              icon={<TrendingUp className="w-5 h-5" />}
              color={netProfit > 0 ? "text-green-600" : netProfit < 0 ? "text-red-600" : "text-gray-600"}
              onClick={() => setLocation("/analytics-dashboard")}
            />
          </div>

          {/* Secondary KPI Cards - 3-column layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <KPICard
              title="Active Workers"
              value={activeWorkers.toString()}
              trend="neutral"
              trendValue={`${workers?.length || 0} total`}
              icon={<Users className="w-5 h-5" />}
              color="text-blue-600"
              onClick={() => setLocation("/workforce-management")}
            />
            <KPICard
              title="Fish Ponds"
              value={activePonds.toString()}
              trend="neutral"
              trendValue={`${ponds?.length || 0} total`}
              icon={<Fish className="w-5 h-5" />}
              color="text-cyan-600"
              onClick={() => setLocation("/fish-farming")}
            />
            <KPICard
              title="Farm Assets"
              value={activeAssets.toString()}
              trend="neutral"
              trendValue={`${assets?.length || 0} total`}
              icon={<Wrench className="w-5 h-5" />}
              color="text-purple-600"
              onClick={() => setLocation("/asset-management")}
            />
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <QuickActionCard
              title="Register Animals"
              description="Add new animals to your farm"
              icon={<Beef className="w-6 h-6" />}
              onClick={() => setLocation("/livestock-management")}
              color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
            />
            <QuickActionCard
              title="Health Alerts"
              description="View animal health status"
              icon={<AlertCircle className="w-6 h-6" />}
              onClick={() => setLocation("/health-alerts")}
              color="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
            />
            <QuickActionCard
              title="Task Management"
              description="Assign and track tasks"
              icon={<Clock className="w-6 h-6" />}
              onClick={() => setLocation("/task-management")}
              color="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
            />
            <QuickActionCard
              title="Analytics"
              description="View detailed insights"
              icon={<BarChart3 className="w-6 h-6" />}
              onClick={() => setLocation("/analytics-dashboard")}
              color="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
            />
          </div>

          {/* Alerts Section */}
          {visibleAlerts.length > 0 && (
            <div className="mb-8">
              <FarmAlertsCenter
                alerts={visibleAlerts}
                onDismiss={(id) => setDismissedAlerts(prev => new Set([...prev, id]))}
              />
            </div>
          )}

          {/* Weather Widget */}
          <div className="mb-8">
            <WeatherWidget farmId={queryFarmId} />
          </div>

          {/* Quick Actions */}
          {user.role === "field_worker" && (
            <div className="mb-8">
              <WorkerQuickActions />
            </div>
          )}

          {/* Farm Recommendations */}
          <div className="mb-8">
            <FarmRecommendations farmId={queryFarmId} />
          </div>

          {/* Farm Comparison */}
          {isAllFarmsSelected && (
            <div className="mb-8">
              <FarmComparisonView />
            </div>
          )}
        </div>
      </div>
    </>
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
              <div className="flex flex-col sm:flex-row gap-4">
                <a href={loginUrl} className="inline-block">
                  <Button size="lg" className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white px-8 py-3 rounded-lg w-full sm:w-auto">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
                <Button size="lg" variant="outline" className="px-8 py-3 rounded-lg w-full sm:w-auto">
                  Watch Demo
                  <Play className="ml-2 h-5 w-5" />
                </Button>
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
              icon={<Sprout className="h-8 w-8" />}
              title="Crop Planning"
              description="Plan crop cycles with soil testing, fertilizer tracking, and yield analysis"
              color="text-lime-600"
            />

            {/* Feature 9 */}
            <FeatureCard
              icon={<ShoppingCart className="h-8 w-8" />}
              title="Marketplace"
              description="Buy and sell farm products directly with integrated payment processing"
              color="text-orange-600"
            />

            {/* Feature 10 */}
            <FeatureCard
              icon={<Wrench className="h-8 w-8" />}
              title="Asset Management"
              description="Track farm equipment, maintenance schedules, and asset depreciation"
              color="text-slate-600"
            />

            {/* Feature 11 */}
            <FeatureCard
              icon={<Activity className="h-8 w-8" />}
              title="Activity Tracking"
              description="Log field activities with GPS tracking, photos, and performance metrics"
              color="text-rose-600"
            />

            {/* Feature 12 */}
            <FeatureCard
              icon={<Droplet className="h-8 w-8" />}
              title="Soil & Fertilizer"
              description="Manage soil health, fertilizer applications, and nutrient optimization"
              color="text-amber-700"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 bg-green-50 dark:bg-green-950">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            Ready to Transform Your Farm?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Join thousands of farmers using FarmKonnect to manage their operations more efficiently and profitably.
          </p>
          <a href={loginUrl} className="inline-block">
            <Button size="lg" className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white px-8 py-3 rounded-lg">
              Start Your Free Trial Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon?: React.ReactNode;
  color?: string;
  onClick?: () => void;
}

function KPICard({
  title,
  value,
  trend = "neutral",
  trendValue,
  icon,
  color = "text-gray-600",
  onClick,
}: KPICardProps) {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer hover:shadow-lg transition-all duration-200 border-0 bg-white dark:bg-gray-800 shadow-md hover:shadow-xl"
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</CardTitle>
          {icon && <div className={`${color} opacity-80`}>{icon}</div>}
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
        {trendValue && (
          <div className="flex items-center gap-1">
            {trend === "up" && <TrendingUp className="h-3 w-3 text-green-600" />}
            {trend === "down" && <TrendingDown className="h-3 w-3 text-red-600" />}
            <span className={`text-xs font-medium ${
              trend === "up" ? "text-green-600" :
              trend === "down" ? "text-red-600" :
              "text-gray-600 dark:text-gray-400"
            }`}>
              {trendValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick?: () => void;
  color: string;
}

function QuickActionCard({
  title,
  description,
  icon,
  onClick,
  color,
}: QuickActionCardProps) {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer hover:shadow-lg transition-all duration-200 border-0 bg-white dark:bg-gray-800 shadow-md hover:shadow-xl"
    >
      <CardHeader className="pb-3">
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center mb-3`}>
          {icon}
        </div>
        <CardTitle className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </CardContent>
    </Card>
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
    <Card className="border-l-4 border-l-green-600 hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-r-0 border-t-0 border-b-0">
      <CardHeader>
        <div className={`${color} mb-3`}>{icon}</div>
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
      </CardContent>
    </Card>
  );
}
