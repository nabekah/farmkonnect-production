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
      { icon: Fish, label: "Fish Farming", path: "/fish-farming" },
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
      { icon: Users, label: "Recipient Groups", path: "/recipient-groups" },
      { icon: Download, label: "Export History", path: "/report-history-export" },
      { icon: Palette, label: "Report Customization", path: "/report-template-customization" },
      { icon: LineChart, label: "Health Trends", path: "/health-trends" },
      { icon: Brain, label: "Breeding Recommendations", path: "/breeding-recommendations" },
    ],
  },

  {
    title: "Marketplace",
    description: "Buy, sell, and trade",
    collapsible: true,
    defaultExpanded: false,
    items: [
      { icon: ShoppingCart, label: "Browse Products", path: "/marketplace" },
      { icon: Heart, label: "Wishlist", path: "/wishlist" },
      { icon: DollarSign, label: "Seller Payouts", path: "/seller-payouts" },
      { icon: ShoppingCart, label: "Orders", path: "/orders" },
      { icon: BarChart3, label: "Seller Analytics", path: "/seller-analytics" },
    ],
  },

  {
    title: "Financial Management",
    description: "Finance and budgeting",
    collapsible: true,
    defaultExpanded: false,
    items: [
      { icon: Wallet, label: "Farm Finance", path: "/farm-finance" },
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
