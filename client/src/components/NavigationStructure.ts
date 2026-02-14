import {
  LayoutDashboard,
  Leaf,
  TrendingUp,
  Users,
  Wallet,
  UserCog,
  Fish,
  Wrench,
  PieChart,
  Brain,
  ShoppingCart,
  Heart,
  DollarSign,
  BookOpen,
  Target,
  Cpu,
  Truck,
  Briefcase,
  CloudRain,
  LineChart,
  Sprout,
  Shield,
  CheckCircle,
  Bell,
  History,
  Droplets,
  FileText,
  Calendar,
  Download,
  Palette,
  BarChart3,
  Database,
  Settings,
  LucideIcon,
  Smartphone,
  MapPin,
  Clock,
  Camera,
  ListTodo,
  Upload,
  Image as ImageIcon,
  Zap,
  Layers,
  Calculator,
} from "lucide-react";

export interface MenuItem {
  icon: LucideIcon;
  label: string;
  path: string;
  adminOnly?: boolean;
  badge?: string | number;
}

export interface MenuGroup {
  title: string;
  description?: string;
  icon?: LucideIcon;
  items: MenuItem[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export const navigationStructure: MenuGroup[] = [
  {
    title: "Dashboard",
    description: "Overview and quick access",
    collapsible: false,
    items: [
      { icon: LayoutDashboard, label: "Home", path: "/" },
    ],
  },

  {
    title: "Field Worker",
    description: "Field operations and activity tracking",
    collapsible: true,
    defaultExpanded: true,
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/field-worker/dashboard" },
      { icon: Camera, label: "Activity Logger", path: "/field-worker/activity-log" },
      { icon: History, label: "Activity History", path: "/field-worker/activity-history" },
      { icon: ListTodo, label: "All Activities", path: "/field-worker/activities" },
      { icon: Clock, label: "Time Tracking", path: "/field-worker/dashboard" },
      { icon: MapPin, label: "GPS Tracking", path: "/field-worker/gps-tracking" },
      { icon: ImageIcon, label: "Photo Gallery", path: "/field-worker/photo-gallery" },
    ],
  },

  {
    title: "Task Management",
    description: "Task assignment and tracking",
    collapsible: true,
    defaultExpanded: true,
    items: [
      { icon: ListTodo, label: "Tasks", path: "/manager/tasks" },
      { icon: Upload, label: "Batch Import", path: "/manager/batch-import" },
      { icon: BarChart3, label: "Analytics", path: "/manager/analytics" },
    ],
  },

  {
    title: "Farm Operations",
    description: "Core farming activities",
    collapsible: true,
    defaultExpanded: true,
    items: [
      { icon: Leaf, label: "Farms", path: "/farms" },
      { icon: TrendingUp, label: "Crops", path: "/crops" },
      { icon: Sprout, label: "Crop Planning", path: "/crop-planning" },
      { icon: Users, label: "Livestock", path: "/livestock" },
      { icon: Users, label: "Bulk Animal Registration", path: "/bulk-animal-registration" },
      { icon: Fish, label: "Fish Farming", path: "/fish-farming" },
      { icon: Users, label: "Multi-Species Management", path: "/multi-species" },
      { icon: TrendingUp, label: "Species Production", path: "/species-production-dashboard" },
      { icon: Brain, label: "Breed Comparison", path: "/breed-comparison" },
      { icon: CloudRain, label: "Weather Alerts", path: "/weather-alerts" },
      { icon: LineChart, label: "Weather Trends", path: "/weather-trends" },
      { icon: Heart, label: "Health Alerts", path: "/health-alerts" },
    ],
  },

  {
    title: "Soil & Fertilizer",
    description: "Soil health and fertilizer management",
    collapsible: true,
    defaultExpanded: true,
    items: [
      { icon: Droplets, label: "Fertilizer Tracking", path: "/fertilizer-tracking" },
      { icon: Droplets, label: "Inventory Management", path: "/inventory-management" },
      { icon: Leaf, label: "Soil Health", path: "/soil-health-recommendations" },
      { icon: TrendingUp, label: "Cost Analysis", path: "/fertilizer-cost-dashboard" },
    ],
  },

  {
    title: "Irrigation Management",
    description: "Water management and irrigation optimization",
    collapsible: true,
    defaultExpanded: true,
    items: [
      { icon: Droplets, label: "Irrigation Scheduling", path: "/irrigation-scheduling" },
      { icon: Zap, label: "Cost Analysis", path: "/irrigation-cost-analysis" },
      { icon: TrendingUp, label: "Efficiency Metrics", path: "/irrigation-efficiency" },
      { icon: Calculator, label: "Water Requirements", path: "/water-requirements" },
    ],
  },

  {
    title: "Reporting & Analytics",
    description: "Reports, analytics, and insights",
    collapsible: true,
    defaultExpanded: true,
    items: [
      { icon: BarChart3, label: "Analytics Dashboard", path: "/analytics-dashboard" },
      { icon: Brain, label: "Predictive Analytics", path: "/predictive-analytics" },
      { icon: PieChart, label: "Farm Analytics", path: "/analytics" },
      { icon: Clock, label: "Time Tracker", path: "/reporting/time-tracker" },
      { icon: Users, label: "Worker Performance", path: "/reporting/worker-performance" },
      { icon: FileText, label: "Report Management", path: "/report-management" },
      { icon: FileText, label: "Report Templates", path: "/report-templates" },
      { icon: BarChart3, label: "Report Analytics", path: "/report-analytics" },
      { icon: Calendar, label: "Schedule Reports", path: "/advanced-report-scheduling" },
    ],
  },

  {
    title: "Marketplace",
    description: "Buy and sell farm products",
    collapsible: true,
    defaultExpanded: true,
    items: [
      { icon: ShoppingCart, label: "Marketplace", path: "/marketplace" },
      { icon: Wallet, label: "My Orders", path: "/my-orders" },
      { icon: ShoppingCart, label: "My Products", path: "/my-products" },
      { icon: TrendingUp, label: "Sales Analytics", path: "/sales-analytics" },
    ],
  },

  {
    title: "Extension Services",
    description: "Agricultural extension, training, and market linkage",
    collapsible: true,
    defaultExpanded: false,
    items: [
      { icon: BookOpen, label: "Extension Agents", path: "/extension/agents" },
      { icon: Target, label: "Training Programs", path: "/extension/training" },
      { icon: Briefcase, label: "Business Development", path: "/extension/business" },
      { icon: LineChart, label: "Market Linkage", path: "/extension/market-linkage" },
      { icon: Users, label: "Farmer Groups", path: "/extension/farmer-groups" },
      { icon: Leaf, label: "Technology Adoption", path: "/extension/technology" },
    ],
  },

  {
    title: "Ghana Services",
    description: "Ghana-specific agricultural support and resources",
    collapsible: true,
    defaultExpanded: false,
    items: [
      { icon: BookOpen, label: "Ghana Extension Services", path: "/ghana-extension-services" },
    ],
  },

  {
    title: "Operations & Management",
    description: "Workforce, assets, and logistics",
    collapsible: true,
    defaultExpanded: false,
    items: [
      { icon: UserCog, label: "Workforce", path: "/workforce-management" },
      { icon: Wrench, label: "Asset Management", path: "/asset-management" },
      { icon: Truck, label: "Transport & Logistics", path: "/transport" },
      { icon: Heart, label: "Health Management", path: "/health-management" },
      { icon: Zap, label: "Medication Tracking", path: "/medication-tracking" },
      { icon: CheckCircle, label: "Vet Appointments", path: "/vet-appointments" },
    ],
  },

  {
    title: "Training & Development",
    description: "Learning and capacity building",
    collapsible: true,
    defaultExpanded: false,
    items: [
      { icon: BookOpen, label: "Training Programs", path: "/training" },
      { icon: Target, label: "MERL Monitoring", path: "/merl" },
    ],
  },

  {
    title: "Technology & IoT",
    description: "Smart devices and automation",
    collapsible: true,
    defaultExpanded: false,
    items: [
      { icon: Cpu, label: "IoT Devices", path: "/iot" },
    ],
  },

  {
    title: "Business Strategy",
    description: "Strategic planning and analysis",
    collapsible: true,
    defaultExpanded: false,
    items: [
      { icon: Briefcase, label: "Business Planning", path: "/business" },
    ],
  },

  {
    title: "Notifications & Alerts",
    description: "Messages and notifications",
    collapsible: true,
    defaultExpanded: false,
    items: [
      { icon: Bell, label: "Notification Settings", path: "/notification-settings" },
      { icon: History, label: "Alert History", path: "/alert-history" },
    ],
  },

  {
    title: "System & Administration",
    description: "Admin tools and configuration",
    collapsible: true,
    defaultExpanded: false,
    items: [
      { icon: Database, label: "Data Management", path: "/data-management" },
      { icon: Shield, label: "Security", path: "/security", adminOnly: true },
      { icon: Shield, label: "Role Management", path: "/role-management", adminOnly: true },
      { icon: CheckCircle, label: "Seller Verification", path: "/admin-verification", adminOnly: true },
      { icon: Settings, label: "Settings", path: "/settings" },
      { icon: Upload, label: "Bulk Operations", path: "/bulk-operations" },
      { icon: History, label: "Operation History", path: "/operation-history" },
    ],
  },

  {
    title: "Analytics & Insights",
    description: "Dashboards and analytics",
    collapsible: true,
    defaultExpanded: false,
    items: [
      { icon: BarChart3, label: "Farmer Dashboard", path: "/farmer-dashboard" },
      { icon: TrendingUp, label: "Blockchain Supply Chain", path: "/blockchain-supply-chain" },
      { icon: Brain, label: "Prediction Dashboard", path: "/prediction-dashboard" },
      { icon: History, label: "Prediction History", path: "/prediction-history" },
      { icon: CheckCircle, label: "Record Outcomes", path: "/outcome-recording" },
    ],
  },

  {
    title: "Community & Recommendations",
    description: "Farmer community and AI recommendations",
    collapsible: true,
    defaultExpanded: false,
    items: [
      { icon: Brain, label: "Crop Recommendations", path: "/crop-recommendations" },
      { icon: Users, label: "Community Forum", path: "/community-forum" },
      { icon: TrendingUp, label: "Supply Chain", path: "/supply-chain" },
      { icon: Users, label: "Cooperative", path: "/cooperative" },
    ],
  },

  {
    title: "Financial Management",
    description: "Income, expenses, budgets, and financial planning",
    collapsible: true,
    defaultExpanded: true,
    items: [
      { icon: DollarSign, label: "Financial Dashboard", path: "/financial-dashboard" },
      { icon: BarChart3, label: "Cost & Profitability Analysis", path: "/financial-management" },
      { icon: TrendingUp, label: "Financial Forecasting", path: "/financial-forecasting" },
      { icon: Wallet, label: "Income & Expenses", path: "/income-expenses" },
      { icon: BarChart3, label: "Budget Planning", path: "/budget-planning" },
      { icon: TrendingUp, label: "Loan Management", path: "/loan-management" },
      { icon: History, label: "Payment History", path: "/payment-history" },
      { icon: FileText, label: "Financial Reports", path: "/financial-reports" },
      { icon: Calculator, label: "Tax Planning", path: "/tax-planning" },
      { icon: Shield, label: "Insurance Management", path: "/insurance-management" },
      { icon: BarChart3, label: "Farm Comparison", path: "/farm-comparison" },
      { icon: LineChart, label: "Farm Consolidation", path: "/farm-consolidation" },
    ],
  },
];

export function getAllMenuItems(): MenuItem[] {
  return navigationStructure.reduce((acc: MenuItem[], group) => [...acc, ...group.items], []);
}

export function getMenuGroupItems(groupTitle: string): MenuItem[] {
  const group = navigationStructure.find((g) => g.title === groupTitle);
  return group?.items ?? [];
}

export function filterMenuItemsByRole(
  items: MenuItem[],
  isAdmin: boolean
): MenuItem[] {
  return items.filter((item) => {
    if (item.adminOnly && !isAdmin) {
      return false;
    }
    return true;
  });
}

export function filterNavigationByRole(
  isAdmin: boolean
): MenuGroup[] {
  return navigationStructure.map((group) => ({
    ...group,
    items: filterMenuItemsByRole(group.items, isAdmin),
  })).filter((group) => group.items.length > 0);
}
