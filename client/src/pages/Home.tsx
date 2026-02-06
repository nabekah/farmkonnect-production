import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
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
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { WeatherWidget } from "@/components/WeatherWidget";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { WorkerQuickActions } from "@/components/WorkerQuickActions";
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <AuthenticatedHome user={user} setLocation={setLocation} />
    );
  }

  return <LandingPage />;
}

function AuthenticatedHome({ user, setLocation }: { user: any; setLocation: (path: string) => void }) {
  // Check if onboarding is complete
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const completed = localStorage.getItem("farmkonnect_onboarding_complete");
    return !completed;
  });

  // State for farm filter
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };
  // Fetch KPI data
  const { data: farms } = trpc.farms.list.useQuery();
  const farmId = farms && farms.length > 0 ? farms[0].id : 1;

  // Set default farm on first load
  useEffect(() => {
    if (farms && farms.length > 0 && !selectedFarmId) {
      setSelectedFarmId(farms[0].id);
    }
  }, [farms, selectedFarmId]);

  // Financial data
  const { data: expenses } = trpc.financial.expenses.list.useQuery({ farmId });
  const { data: revenue } = trpc.financial.revenue.list.useQuery({ farmId });

  // Livestock data
  const { data: animals } = trpc.livestock.animals.list.useQuery({ farmId });

  // Workforce data - get workers for selected farm or all workers
  const { data: allWorkers } = trpc.workforce.workers.getAllWorkers.useQuery({});
  const { data: farmWorkers } = trpc.workforce.workers.list.useQuery(
    selectedFarmId ? { farmId: selectedFarmId } : { farmId: farmId },
    { enabled: !!selectedFarmId || !!farmId }
  );
  
  // Use farm-specific workers if farm is selected, otherwise use all workers
  const workers = selectedFarmId ? farmWorkers : allWorkers;

  // Fish farming data
  const { data: ponds } = trpc.fishFarming.ponds.list.useQuery({ farmId });

  // Assets data
  const { data: assets } = trpc.assets.assets.list.useQuery({ farmId });

  // Calculate KPIs
  const totalRevenue = revenue?.reduce((sum, r) => sum + parseFloat(r.amount || "0"), 0) || 0;
  const totalExpenses = expenses?.reduce((sum, e) => sum + parseFloat(e.amount || "0"), 0) || 0;
  const netProfit = totalRevenue - totalExpenses;
  const activeAnimals = animals?.filter(a => a.status === "active").length || 0;
  const activeWorkers = workers?.filter(w => w.status === "active").length || 0;
  const activePonds = ponds?.filter(p => p.status === "active").length || 0;
  const activeAssets = assets?.filter(a => a.status === "active").length || 0;

  return (
    <>
      <OnboardingWizard
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Welcome back, {user.name}!</h1>
        <p className="text-base md:text-lg text-muted-foreground">Manage your agricultural operations efficiently with FarmKonnect</p>
      </div>

      {/* Farm Filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Filter by Farm:</label>
        <select
          value={selectedFarmId || ""}
          onChange={(e) => setSelectedFarmId(e.target.value ? parseInt(e.target.value) : null)}
          className="px-3 py-2 border border-input rounded-md bg-background text-sm"
        >
          <option value="">All Farms</option>
          {farms?.map((farm) => (
            <option key={farm.id} value={farm.id}>
              {farm.farmName}
            </option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
        <KPICard
          title="Total Revenue"
          value={`GH₵ ${totalRevenue.toLocaleString()}`}
          trend={totalRevenue > totalExpenses ? "up" : "down"}
          trendValue={totalRevenue > 0 ? `${((netProfit / totalRevenue) * 100).toFixed(1)}%` : "0%"}
          icon={<DollarSign className="w-6 h-6" />}
          color="text-green-600"
          onClick={() => setLocation("/farm-finance")}
        />
        <KPICard
          title="Total Expenses"
          value={`GH₵ ${totalExpenses.toLocaleString()}`}
          trend="neutral"
          trendValue={`${expenses?.length || 0} transactions`}
          icon={<Wallet className="w-6 h-6" />}
          color="text-red-600"
          onClick={() => setLocation("/farm-finance")}
        />
        <KPICard
          title="Active Animals"
          value={activeAnimals.toString()}
          trend="neutral"
          trendValue={`${animals?.length || 0} total`}
          icon={<Beef className="w-6 h-6" />}
          color="text-amber-600"
          onClick={() => setLocation("/livestock-management")}
        />
        <KPICard
          title="Active Workers"
          value={activeWorkers.toString()}
          trend="neutral"
          trendValue={`${workers?.length || 0} total`}
          icon={<Users className="w-6 h-6" />}
          color="text-blue-600"
          onClick={() => setLocation("/workforce-management")}
        />
        <KPICard
          title="Fish Ponds"
          value={activePonds.toString()}
          trend="neutral"
          trendValue={`${ponds?.length || 0} total`}
          icon={<Fish className="w-6 h-6" />}
          color="text-cyan-600"
          onClick={() => setLocation("/fish-farming")}
        />
        <KPICard
          title="Farm Assets"
          value={activeAssets.toString()}
          trend="neutral"
          trendValue={`${assets?.length || 0} total`}
          icon={<Wrench className="w-6 h-6" />}
          color="text-purple-600"
          onClick={() => setLocation("/asset-management")}
        />
        <KPICard
          title="Net Profit"
          value={`GH₵ ${netProfit.toLocaleString()}`}
          trend={netProfit > 0 ? "up" : netProfit < 0 ? "down" : "neutral"}
          trendValue={netProfit > 0 ? "Profitable" : netProfit < 0 ? "Loss" : "Break-even"}
          icon={<TrendingUp className="w-6 h-6" />}
          color={netProfit > 0 ? "text-green-600" : netProfit < 0 ? "text-red-600" : "text-gray-600"}
          onClick={() => setLocation("/analytics-dashboard")}
        />
        <KPICard
          title="Analytics"
          value="View"
          trend="neutral"
          trendValue="Detailed insights"
          icon={<PieChart className="w-6 h-6" />}
          color="text-indigo-600"
          onClick={() => setLocation("/analytics-dashboard")}
        />
      </div>

      {/* Weather Widget */}
      <div className="mb-8">
        <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
          <WeatherWidget
            latitude={5.6037}
            longitude={-0.1870}
            showForecast={true}
          />
        </div>
      </div>

      {/* Worker Quick Actions */}
      <WorkerQuickActions
        workers={workers}
        onAssignTask={(worker) => {
          console.log("Assign task to:", worker);
        }}
        onViewSchedule={(worker) => {
          console.log("View schedule for:", worker);
        }}
      />

      {/* Quick Actions Grid */}
      <div className="space-y-4">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold">Quick Actions for Farm Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
          <QuickActionCard
            icon={<Wallet className="w-8 h-8" />}
            title="Farm Finance"
            description="Track expenses and revenue"
            onClick={() => setLocation("/farm-finance")}
            color="bg-green-500"
          />
          <QuickActionCard
            icon={<Beef className="w-8 h-8" />}
            title="Livestock Management"
            description="Manage animals and health records"
            onClick={() => setLocation("/livestock-management")}
            color="bg-amber-500"
          />
          <QuickActionCard
            icon={<UserCog className="w-8 h-8" />}
            title="Workforce Management"
            description="Manage workers and payroll"
            onClick={() => setLocation("/workforce-management")}
            color="bg-blue-500"
          />
          <QuickActionCard
            icon={<Fish className="w-8 h-8" />}
            title="Fish Farming"
            description="Monitor ponds and water quality"
            onClick={() => setLocation("/fish-farming")}
            color="bg-cyan-500"
          />
          <QuickActionCard
            icon={<Wrench className="w-8 h-8" />}
            title="Asset Management"
            description="Track equipment and maintenance"
            onClick={() => setLocation("/asset-management")}
            color="bg-purple-500"
          />
          <QuickActionCard
            icon={<PieChart className="w-8 h-8" />}
            title="Analytics Dashboard"
            description="View comprehensive insights"
            onClick={() => setLocation("/analytics-dashboard")}
            color="bg-indigo-500"
          />
          <QuickActionCard
            icon={<Tractor className="w-8 h-8" />}
            title="Manage Farms"
            description="Register and manage your farms"
            onClick={() => setLocation("/farms")}
            color="bg-green-500"
          />
          <QuickActionCard
            icon={<Sprout className="w-8 h-8" />}
            title="Track Crops"
            description="Monitor crop cycles and yields"
            onClick={() => setLocation("/crops")}
            color="bg-emerald-500"
          />
          <QuickActionCard
            icon={<ShoppingCart className="w-8 h-8" />}
            title="Agricultural Marketplace"
            description="Buy and sell agricultural products"
            onClick={() => setLocation("/marketplace")}
            color="bg-blue-500"
          />
          <QuickActionCard
            icon={<BarChart3 className="w-8 h-8" />}
            title="Analytics"
            description="View farm performance analytics"
            onClick={() => setLocation("/analytics")}
            color="bg-violet-500"
          />
          <QuickActionCard
            icon={<Cloud className="w-8 h-8" />}
            title="Weather Alerts"
            description="Monitor weather conditions"
            onClick={() => setLocation("/weather-alerts")}
            color="bg-sky-500"
          />
          <QuickActionCard
            icon={<Shield className="w-8 h-8" />}
            title="Security Dashboard"
            description="Monitor system security"
            onClick={() => setLocation("/security")}
            color="bg-red-500"
          />
        </div>
      </div>
      </div>
    </>
  );
}

function KPICard({
  title,
  value,
  trend,
  trendValue,
  icon,
  color,
  onClick,
}: {
  title: string;
  value: string;
  trend: "up" | "down" | "neutral";
  trendValue: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}) {
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={color}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          {trend === "up" && <TrendingUp className="w-3 h-3 text-green-600" />}
          {trend === "down" && <TrendingDown className="w-3 h-3 text-red-600" />}
          <span>{trendValue}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionCard({
  icon,
  title,
  description,
  onClick,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
      onClick={onClick}
    >
      <CardHeader>
        <div className={`w-12 h-12 rounded-lg ${color} text-white flex items-center justify-center mb-2`}>
          {icon}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function LandingPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900">
            Welcome to <span className="text-green-600">FarmKonnect</span>
          </h1>
          <p className="text-xl text-gray-600">
            Comprehensive agricultural management platform for modern farmers across Ghana and West Africa
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => {
                window.location.href = getLoginUrl();
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Get Started <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => setLocation("/marketplace")}>
              Explore Marketplace
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Wallet className="w-10 h-10" />}
            title="Financial Management"
            description="Track expenses, revenue, and profitability with detailed financial analytics"
          />
          <FeatureCard
            icon={<Beef className="w-10 h-10" />}
            title="Livestock Management"
            description="Monitor animal health, breeding records, and performance metrics"
          />
          <FeatureCard
            icon={<Fish className="w-10 h-10" />}
            title="Fish Farming"
            description="Manage fish ponds, water quality, and harvest tracking"
          />
          <FeatureCard
            icon={<UserCog className="w-10 h-10" />}
            title="Workforce Management"
            description="Manage workers, payroll, attendance, and performance"
          />
          <FeatureCard
            icon={<Wrench className="w-10 h-10" />}
            title="Asset Management"
            description="Track equipment, maintenance schedules, and depreciation"
          />
          <FeatureCard
            icon={<PieChart className="w-10 h-10" />}
            title="Advanced Analytics"
            description="Comprehensive insights with charts and predictive analytics"
          />
          <FeatureCard
            icon={<Sprout className="w-10 h-10" />}
            title="Crop Tracking"
            description="Monitor crop cycles, soil health, and yield predictions"
          />
          <FeatureCard
            icon={<ShoppingCart className="w-10 h-10" />}
            title="Marketplace"
            description="Buy and sell agricultural products with integrated payment"
          />
          <FeatureCard
            icon={<Cloud className="w-10 h-10" />}
            title="Weather Integration"
            description="Real-time weather data and farming recommendations"
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="w-16 h-16 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mb-4">
          {icon}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
