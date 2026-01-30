import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Leaf, TrendingUp, Users, BarChart3, Zap, Settings, Cloud, Droplets, ShoppingCart } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-lg bg-green-600 flex items-center justify-center">
                <Leaf className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">FarmKonnect</h1>
            <p className="text-lg text-gray-600">Digital Agriculture Management System for Ghana & West Africa</p>
          </div>

          <div className="space-y-4 text-gray-600 text-center">
            <p className="text-base leading-relaxed">
              FarmKonnect is a comprehensive farm management platform designed for farmers in Ghana and West Africa. 
              Manage your farms, track crops, monitor livestock health, check weather forecasts, and sell your products 
              on our integrated marketplace with data-driven insights.
            </p>
            <p className="text-sm font-medium text-gray-700">
              Keywords: farm management, agriculture, crop tracking, livestock management, weather forecasting, agricultural marketplace
            </p>
          </div>

          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Sign in to Continue
          </Button>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="space-y-2 text-center">
              <Leaf className="h-6 w-6 mx-auto text-green-600" />
              <p className="font-medium">Farm Management</p>
            </div>
            <div className="space-y-2 text-center">
              <TrendingUp className="h-6 w-6 mx-auto text-blue-600" />
              <p className="font-medium">Crop Tracking</p>
            </div>
            <div className="space-y-2 text-center">
              <BarChart3 className="h-6 w-6 mx-auto text-purple-600" />
              <p className="font-medium">Analytics</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Welcome back, {user?.name}!</h1>
        <p className="text-lg text-muted-foreground">Manage your agricultural operations efficiently with FarmKonnect</p>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Quick Actions for Farm Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/farms")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-green-600" />
                Manage Farms
              </CardTitle>
              <CardDescription>Register and manage your farms</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Go to Farms
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/crops")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Track Crops
              </CardTitle>
              <CardDescription>Monitor crop cycles and yields</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Go to Crops
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/livestock")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                Livestock Management
              </CardTitle>
              <CardDescription>Manage animals and health records</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Go to Livestock
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/marketplace")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-purple-600" />
                Agricultural Marketplace
              </CardTitle>
              <CardDescription>Buy and sell agricultural products</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Go to Marketplace
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/analytics")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Analytics & Reports
              </CardTitle>
              <CardDescription>View performance insights</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Go to Analytics
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/weather")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-gray-600" />
                Weather Forecasts
              </CardTitle>
              <CardDescription>Check weather and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Go to Weather
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Key Features of FarmKonnect</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Farm Management System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>✓ Register multiple farms with GPS coordinates</p>
              <p>✓ Track farm size and location in Ghana and West Africa</p>
              <p>✓ Categorize by farm type (crop, livestock, mixed)</p>
              <p>✓ Manage farm details and operations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Crop Tracking & Monitoring</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>✓ Create and manage crop cycles</p>
              <p>✓ Log soil tests and nutrient levels</p>
              <p>✓ Record fertilizer applications</p>
              <p>✓ Track harvest yields and performance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Livestock Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>✓ Register and track animals</p>
              <p>✓ Manage health records and vaccinations</p>
              <p>✓ Track breeding records and due dates</p>
              <p>✓ Monitor feeding schedules and costs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Weather & IoT Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>✓ Real-time weather forecasts</p>
              <p>✓ IoT sensor monitoring and alerts</p>
              <p>✓ Soil moisture tracking</p>
              <p>✓ Smart irrigation recommendations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Agricultural Marketplace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>✓ List and sell agricultural products</p>
              <p>✓ Browse products from other farmers</p>
              <p>✓ Manage orders and inventory</p>
              <p>✓ Track sales and revenue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analytics & Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>✓ Yield distribution charts</p>
              <p>✓ Soil health trends and analysis</p>
              <p>✓ Livestock performance metrics</p>
              <p>✓ Revenue and sales reports</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Why Choose FarmKonnect?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Droplets className="h-5 w-5 text-blue-600" />
                Smart Irrigation
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Optimize water usage with weather-based irrigation recommendations and soil moisture monitoring.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Increase Yields
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Make data-driven decisions to improve crop performance and livestock productivity.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-purple-600" />
                Direct Sales
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Sell your products directly to buyers through our integrated marketplace platform.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                Real-time Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Get instant notifications for critical events like breeding due dates and low stock alerts.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
