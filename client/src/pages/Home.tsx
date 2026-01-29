import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Leaf, TrendingUp, Users, BarChart3, Zap, Settings } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

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
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-lg bg-green-600 flex items-center justify-center">
                <Leaf className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">FarmKonnect</h1>
            <p className="text-lg text-gray-600">Digital Agriculture Management System</p>
          </div>

          <div className="space-y-4 text-gray-600">
            <p className="text-sm">
              Manage your farms, track crops, monitor soil health, and optimize your agricultural operations with data-driven insights.
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

          <div className="pt-8 grid grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <Leaf className="h-6 w-6 mx-auto text-green-600" />
              <p className="font-medium">Farm Management</p>
            </div>
            <div className="space-y-2">
              <TrendingUp className="h-6 w-6 mx-auto text-blue-600" />
              <p className="font-medium">Crop Tracking</p>
            </div>
            <div className="space-y-2">
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
        <p className="text-lg text-muted-foreground">Manage your agricultural operations efficiently</p>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Quick Actions</h2>
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
                Livestock
              </CardTitle>
              <CardDescription>Manage animals and health records</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Go to Livestock
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Marketplace
              </CardTitle>
              <CardDescription>Buy and sell agricultural products</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                Analytics
              </CardTitle>
              <CardDescription>View performance insights</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-600" />
                Settings
              </CardTitle>
              <CardDescription>Configure your preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Farm Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>✓ Register multiple farms</p>
              <p>✓ Track farm size and location</p>
              <p>✓ Categorize by farm type</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Crop Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>✓ Create crop cycles</p>
              <p>✓ Log soil tests</p>
              <p>✓ Record harvest yields</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Soil Health Monitoring</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>✓ Track pH levels</p>
              <p>✓ Monitor nutrient levels</p>
              <p>✓ View soil trends</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>✓ Yield distribution charts</p>
              <p>✓ Soil pH trends</p>
              <p>✓ Harvest records</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
