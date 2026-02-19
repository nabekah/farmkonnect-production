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
import { WeatherWidget } from "@/components/WeatherWidget";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { WorkerQuickActions } from "@/components/WorkerQuickActions";
import { FarmComparisonView } from "@/components/FarmComparisonView";
import { FarmAlertsCenter, type FarmAlert } from "@/components/FarmAlertsCenter";
import { FarmRecommendations } from "@/components/FarmRecommendations";
import { FarmQuickActions } from "@/components/FarmQuickActions";
import { RegistrationForm } from "@/components/RegistrationForm";
import { SocialProof } from "@/components/SocialProof";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useSessionTimeout } from "@/_core/hooks/useSessionTimeout";
import { useRememberMe } from "@/_core/hooks/useRememberMe";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [showContent, setShowContent] = useState(true);

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

  // Show authenticated home if user is logged in
  if (isAuthenticated && user) {
    return (
      <AuthenticatedHome user={user} />
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Smart Farm Management for Modern Farmers
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              FarmKonnect helps you manage crops, livestock, weather, and marketplace sales all in one place. Increase productivity and profitability with data-driven insights.
            </p>
            <div className="flex gap-4 flex-wrap">
              <a
                href={getLoginUrl()}
                className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Sign In with Manus
              </a>
              <a
                href={getGoogleLoginUrl()}
                className="px-8 py-3 bg-white text-gray-900 border-2 border-gray-300 rounded-lg font-semibold hover:border-gray-400 transition"
              >
                Sign In with Google
              </a>
              <button
                onClick={() => {
                  const elem = document.getElementById('registration-section');
                  if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Create Account
              </button>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-400 to-blue-500 rounded-lg p-8 text-white">
            <Tractor className="h-24 w-24 mb-4" />
            <h3 className="text-2xl font-bold mb-4">Start Managing Your Farm Today</h3>
            <p>Join thousands of farmers using FarmKonnect to optimize their operations.</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">Key Features</h2>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Your Farm?</h2>
          <p className="text-xl text-green-100 mb-8">Join FarmKonnect today and start optimizing your agricultural operations.</p>
          <div className="flex gap-4 justify-center">
            <a
              href={getLoginUrl()}
              className="px-8 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Get Started with Manus
            </a>
            <a
              href={getGoogleLoginUrl()}
              className="px-8 py-3 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 transition"
            >
              Sign Up with Google
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-gray-50 p-6 rounded-lg hover:shadow-lg transition">
      <div className="text-green-600 mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
