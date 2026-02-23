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
import DashboardLayout from "@/components/DashboardLayout";
import { AuthErrorPage } from "@/components/AuthErrorPage";
import { WeatherWidget } from "@/components/WeatherWidget";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { WorkerQuickActions } from "@/components/WorkerQuickActions";
import { FarmComparisonView } from "@/components/FarmComparisonView";
import { FarmAlertsCenter, type FarmAlert } from "@/components/FarmAlertsCenter";
import { FarmRecommendations } from "@/components/FarmRecommendations";
import { FarmQuickActions } from "@/components/FarmQuickActions";
import { RegistrationForm } from "@/components/RegistrationForm";
import { SocialProof } from "@/components/SocialProof";
import { WelcomeDashboard } from "@/components/WelcomeDashboard";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useSessionTimeout } from "@/_core/hooks/useSessionTimeout";
import { useRememberMe } from "@/_core/hooks/useRememberMe";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const [showContent, setShowContent] = useState(true);
  const params = new URLSearchParams(location.split("?")[1] || "");
  const authError = params.get("auth_error");

  // Don't redirect authenticated users - show welcome dashboard instead

  // Show authentication error if present
  if (authError) {
    return <AuthErrorPage />;
  }

  // Initialize session timeout and remember me features
  // These hooks are safe to call unconditionally - they handle auth state internally
  useSessionTimeout();
  useRememberMe();

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

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  // Don't show content if still loading
  if (!showContent) {
    return null;
  }

  // Show welcome dashboard for authenticated users
  if (isAuthenticated && user) {
    return (
      <DashboardLayout>
        <WelcomeDashboard />
      </DashboardLayout>
    );
  }

  // Show landing page for unauthenticated users
  return (
    <LandingPage />
  );
}

function AuthenticatedHome({ user }: { user: any }) {
  // Check if onboarding is complete
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const completed = localStorage.getItem("farmkonnect_onboarding_complete");
    return !completed;
  });

  const handleOnboardingComplete = () => {
    localStorage.setItem("farmkonnect_onboarding_complete", "true");
    setShowOnboarding(false);
  };

  if (showOnboarding) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user?.name || "Farmer"}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here is your farm overview and quick actions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <FarmQuickActions />
          </div>
          <div>
            <WeatherWidget />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FarmAlertsCenter alerts={[]} />
          <FarmRecommendations />
        </div>
      </div>
    </DashboardLayout>
  );
}

function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">Welcome to FarmKonnect</span>
              <h1 className="text-6xl font-bold text-gray-900 leading-tight">
                Smart Farm Management for Modern Farmers
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Manage crops, livestock, weather, and marketplace sales all in one place. Increase productivity and profitability with data-driven insights.
              </p>
            </div>
            <div className="flex gap-4 flex-col sm:flex-row">
              <a
                href="/register"
                className="px-8 py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition shadow-lg hover:shadow-xl text-center"
              >
                Get Started Free
              </a>
              <a
                href="/login"
                className="px-8 py-4 bg-white text-gray-900 border-2 border-gray-300 rounded-lg font-semibold hover:border-green-600 hover:text-green-600 transition text-center"
              >
                Sign In
              </a>
            </div>
            <div className="flex gap-8 pt-4">
              <div>
                <p className="text-3xl font-bold text-green-600">10K+</p>
                <p className="text-gray-600">Active Farmers</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">50M+</p>
                <p className="text-gray-600">Data Points</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">99.9%</p>
                <p className="text-gray-600">Uptime</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl blur-2xl opacity-30"></div>
            <div className="relative bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl p-12 text-white shadow-2xl">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <Sprout className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold">Crop Tracking</p>
                    <p className="text-sm text-green-100">Real-time monitoring</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <Beef className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold">Livestock Mgmt</p>
                    <p className="text-sm text-green-100">Health and breeding</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <Cloud className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold">Weather Alerts</p>
                    <p className="text-sm text-green-100">Forecasts and insights</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold">Marketplace</p>
                    <p className="text-sm text-green-100">Direct sales</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features for Every Farmer</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Everything you need to manage your farm efficiently</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Sprout className="h-8 w-8" />}
              title="Crop Tracking"
              description="Monitor crop health, growth stages, and yield predictions"
            />
            <FeatureCard
              icon={<Beef className="h-8 w-8" />}
              title="Livestock Management"
              description="Track animal health, breeding, and production metrics"
            />
            <FeatureCard
              icon={<Cloud className="h-8 w-8" />}
              title="Weather Integration"
              description="Get real-time weather alerts and forecasts for your farm"
            />
            <FeatureCard
              icon={<ShoppingCart className="h-8 w-8" />}
              title="Marketplace"
              description="Connect with buyers and sell your produce directly"
            />
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8" />}
              title="Analytics"
              description="Gain insights into your farm's performance and profitability"
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title="Security"
              description="Enterprise-grade security for your farm data"
            />
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <SocialProof />

      {/* Registration Section */}
      <section id="registration-section" className="bg-white py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <RegistrationForm />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold text-white mb-6">Ready to Transform Your Farm?</h2>
          <p className="text-xl text-green-100 mb-10 leading-relaxed">Join thousands of farmers already using FarmKonnect to optimize their operations.</p>
          <div className="flex gap-4 justify-center flex-col sm:flex-row">
            <a
              href="/register"
              className="px-8 py-4 bg-white text-green-600 rounded-lg font-semibold hover:bg-gray-100 transition shadow-lg"
            >
              Start Your Free Trial
            </a>
            <a
              href="/login"
              className="px-8 py-4 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 transition shadow-lg"
            >
              Sign In to Your Account
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group bg-white p-8 rounded-xl border border-gray-200 hover:border-green-500 hover:shadow-xl transition duration-300">
      <div className="text-green-600 mb-4 text-4xl group-hover:scale-110 transition duration-300">{icon}</div>
      <h3 className="text-xl font-bold mb-3 text-gray-900">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}
