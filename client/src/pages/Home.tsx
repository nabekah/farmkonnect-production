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
import { RegistrationForm } from "@/components/RegistrationForm";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useSessionTimeout } from "@/_core/hooks/useSessionTimeout";
import { useRememberMe } from "@/_core/hooks/useRememberMe";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [showContent, setShowContent] = useState(false);

  // Initialize session timeout and remember me features
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

  // Show content only after auth state is determined
  useEffect(() => {
    // Add a small delay to ensure smooth transition
    const timer = setTimeout(() => {
      if (!loading) {
        setShowContent(true);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [loading]);

  // Show loading state while checking authentication
  if (loading || !showContent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <AuthenticatedHome user={user} />
    );
  }

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user?.name || "Farmer"}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's your farm overview and quick actions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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
    </div>
  );
}

function LandingPage() {
  const [showRegistration, setShowRegistration] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Smart Agricultural Management for Modern Farmers
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              FarmKonnect helps you manage crops, livestock, weather, marketplace sales, and finances all in one platform. Trusted by farmers across Ghana and West Africa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href={getLoginUrl()}>
                <button className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors">
                  Sign In with Manus
                </button>
              </a>
              <a href={getGoogleLoginUrl()}>
                <button className="px-8 py-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-lg border-2 border-gray-300 transition-colors flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign In with Google
                </button>
              </a>
            </div>
            <button
              onClick={() => setShowRegistration(!showRegistration)}
              className="mt-4 text-green-600 hover:text-green-700 font-semibold underline"
            >
              {showRegistration ? "Already have an account?" : "New to FarmKonnect? Register here"}
            </button>
          </div>
          <div className="hidden lg:block">
            <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-8 text-white shadow-2xl">
              <Tractor className="w-24 h-24 mb-6" />
              <h3 className="text-2xl font-bold mb-4">Farm Management Made Easy</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Track crops and yields</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Manage livestock health</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Monitor weather patterns</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Sell in marketplace</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Form */}
      {showRegistration && (
        <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Create Your Account</CardTitle>
              <CardDescription>Join FarmKonnect today and start managing your farm</CardDescription>
            </CardHeader>
            <CardContent>
              <RegistrationForm onSuccess={() => setShowRegistration(false)} />
            </CardContent>
          </Card>
        </section>
      )}

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">
          Powerful Features for Modern Farming
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { icon: Sprout, title: "Crop Management", desc: "Track planting, growth, and harvest cycles" },
            { icon: Beef, title: "Livestock Tracking", desc: "Monitor animal health and breeding records" },
            { icon: Cloud, title: "Weather Integration", desc: "Get real-time weather alerts and forecasts" },
            { icon: ShoppingCart, title: "Marketplace", desc: "Sell your products to buyers directly" },
            { icon: BarChart3, title: "Analytics", desc: "Detailed insights into farm performance" },
            { icon: Wallet, title: "Financial Management", desc: "Track expenses and income" },
          ].map((feature, i) => (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <feature.icon className="w-8 h-8 text-green-600 mb-2" />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-green-600 dark:bg-green-900 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Farm?</h2>
          <p className="text-green-100 mb-8 text-lg">
            Join thousands of farmers using FarmKonnect to increase productivity and profitability
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={getLoginUrl()}>
              <button className="px-8 py-3 bg-white hover:bg-gray-100 text-green-600 font-semibold rounded-lg transition-colors">
                Sign In
              </button>
            </a>
            <a href={getGoogleLoginUrl()}>
              <button className="px-8 py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg transition-colors">
                Get Started
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-semibold mb-4">FarmKonnect</h3>
              <p className="text-sm">Smart agricultural management for modern farmers</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 FarmKonnect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
