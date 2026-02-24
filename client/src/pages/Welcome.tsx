import React, { useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Leaf,
  Zap,
  TrendingUp,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  Sprout,
  Cloud,
  AlertCircle,
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

export function Welcome() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const quickActions: QuickAction[] = [
    {
      id: 'farms',
      title: 'Manage Farms',
      description: 'View and manage your farm properties',
      icon: <Leaf className="w-6 h-6" />,
      href: '/farms',
      color: 'bg-green-100 text-green-700',
    },
    {
      id: 'crops',
      title: 'Track Crops',
      description: 'Monitor crop cycles and yields',
      icon: <Sprout className="w-6 h-6" />,
      href: '/crops',
      color: 'bg-emerald-100 text-emerald-700',
    },
    {
      id: 'livestock',
      title: 'Livestock Management',
      description: 'Track animals and health records',
      icon: <Users className="w-6 h-6" />,
      href: '/livestock',
      color: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'weather',
      title: 'Weather Alerts',
      description: 'Check weather forecasts and alerts',
      icon: <Cloud className="w-6 h-6" />,
      href: '/weather',
      color: 'bg-sky-100 text-sky-700',
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View farm performance metrics',
      icon: <BarChart3 className="w-6 h-6" />,
      href: '/analytics',
      color: 'bg-purple-100 text-purple-700',
    },
    {
      id: 'marketplace',
      title: 'Marketplace',
      description: 'Buy and sell agricultural products',
      icon: <TrendingUp className="w-6 h-6" />,
      href: '/marketplace',
      color: 'bg-orange-100 text-orange-700',
    },
  ];

  const adminActions: QuickAction[] = [
    {
      id: 'admin-approvals',
      title: 'User Approvals',
      description: 'Approve pending user registrations',
      icon: <AlertCircle className="w-6 h-6" />,
      href: '/admin/approvals',
      color: 'bg-red-100 text-red-700',
    },
    {
      id: 'admin-backups',
      title: 'Backup Management',
      description: 'Manage database backups',
      icon: <Zap className="w-6 h-6" />,
      href: '/admin/backups',
      color: 'bg-yellow-100 text-yellow-700',
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">FarmKonnect</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/change-password')}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              Change Password
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-4xl font-bold text-gray-900">
                {getGreeting()}, <span className="text-green-600">{user.name || user.email}</span>!
              </h2>
              <p className="text-gray-600 mt-2">Welcome back to your farm management dashboard</p>
            </div>
            <Badge className="bg-green-100 text-green-800 text-base px-4 py-2">
              {user.role === 'admin' ? '👑 Administrator' : '👨‍🌾 Farmer'}
            </Badge>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Account Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-600">Active</p>
                    <p className="text-xs text-gray-500 mt-1">Account verified</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Leaf className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Last Login</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">Now</p>
                    <p className="text-xs text-gray-500 mt-1">Just now</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Email</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.email}</p>
                    <p className="text-xs text-gray-500 mt-1">Verified</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Card
              key={action.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(action.href)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${action.color}`}>{action.icon}</div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                  <CardTitle className="mt-4">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Admin Actions */}
        {user.role === 'admin' && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Administration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adminActions.map((action) => (
                <Card
                  key={action.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-red-200"
                  onClick={() => navigate(action.href)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-lg ${action.color}`}>{action.icon}</div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <CardTitle className="mt-4">{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Getting Started */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>New to FarmKonnect? Here's how to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </span>
                <span className="text-gray-700">
                  <strong>Create a Farm:</strong> Start by adding your farm details in the Manage Farms section
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </span>
                <span className="text-gray-700">
                  <strong>Add Crops or Livestock:</strong> Register your crops or animals for tracking
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </span>
                <span className="text-gray-700">
                  <strong>Monitor Performance:</strong> Use analytics to track your farm's performance
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </span>
                <span className="text-gray-700">
                  <strong>Explore Marketplace:</strong> Buy and sell products with other farmers
                </span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
