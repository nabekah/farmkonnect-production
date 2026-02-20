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
  AlertCircle,
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
  Key,
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
  Eye,
  Filter,
  Send,
  Library,
  Copy,
  AlertTriangle,
  Lock,
  Shield as ShieldIcon,
  KeyRound,
  Smartphone as PhoneIcon,
  Globe,
  LogIn,
  BarChart as ChartIcon,
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
    title: "Labor Management",
    description: "Workforce scheduling, task assignment, compliance, and analytics",
    collapsible: true,
    defaultExpanded: true,
    items: [
      { icon: Users, label: "Workforce", path: "/workforce-management" },
      { icon: Users, label: "Worker Directory", path: "/labor-management" },
      { icon: ListTodo, label: "Task Assignment", path: "/task-assignment" },
      { icon: CheckCircle, label: "Task Completion", path: "/task-completion-tracking" },
      { icon: FileText, label: "Task Templates", path: "/task-templates" },
      { icon: AlertCircle, label: "Alert Dashboard", path: "/alert-dashboard" },
      { icon: Calendar, label: "Worker Availability", path: "/worker-availability" },
      { icon: TrendingUp, label: "Performance Trends", path: "/performance-trends" },
      { icon: Calendar, label: "Shift Management", path: "/shift-management" },
      { icon: Layers, label: "Bulk Shift Assignment", path: "/bulk-shift-assignment" },
      { icon: Bell, label: "Notification Preferences", path: "/notification-preferences" },
      { icon: BarChart3, label: "Notification Analytics", path: "/notification-analytics" },
      { icon: Shield, label: "Compliance Dashboard", path: "/labor/compliance-dashboard" },
      { icon: Brain, label: "AI Scheduling", path: "/labor/ai-scheduling" },
    ],
  },

  {
    title: "Operations & Management",
    description: "Assets and logistics",
    collapsible: true,
    defaultExpanded: false,
    items: [
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
      { icon: Bell, label: "Notification Center", path: "/notification-center" },
      { icon: Briefcase, label: "Campaign Monitor", path: "/campaign-monitor" },
      { icon: Calendar, label: "Campaign Scheduler", path: "/campaign-scheduler" },
      { icon: Users, label: "Recipient Management", path: "/recipient-management" },
      { icon: FileText, label: "Campaign Templates", path: "/campaign-templates" },
      { icon: Eye, label: "Template Preview", path: "/template-preview" },
      { icon: Filter, label: "Recipient Filters", path: "/recipient-filters" },
      { icon: Send, label: "Bulk Messaging", path: "/bulk-messaging" },
      { icon: Library, label: "Template Library", path: "/template-library" },
      { icon: Smartphone, label: "Push Notifications", path: "/push-notifications" },
      { icon: Zap, label: "Smart Scheduler", path: "/smart-scheduler" },
      { icon: CheckCircle, label: "Approval Workflow", path: "/approval-workflow" },
      { icon: Copy, label: "Notification Templates", path: "/notification-templates", adminOnly: true },
    ],
  },

  {
    title: "System & Administration",
    description: "Admin tools and configuration",
    collapsible: true,
    defaultExpanded: false,
    items: [
      { icon: Database, label: "Data Management", path: "/data-management" },
      { icon: Users, label: "User Approval", path: "/admin/user-approval", adminOnly: true },
      { icon: Shield, label: "Security", path: "/security", adminOnly: true },
      { icon: Shield, label: "Role Management", path: "/role-management", adminOnly: true },
      { icon: CheckCircle, label: "Seller Verification", path: "/admin-verification", adminOnly: true },
      { icon: Settings, label: "Settings", path: "/settings" },
      { icon: Upload, label: "Bulk Operations", path: "/bulk-operations" },
    ],
  },

  {
    title: "Security & Compliance",
    description: "Account security, compliance, and enterprise features",
    collapsible: true,
    defaultExpanded: false,
    items: [
      { icon: Lock, label: "Two-Factor Authentication", path: "/security/2fa" },
      { icon: KeyRound, label: "API Keys", path: "/security/api-keys" },
      { icon: ShieldIcon, label: "Security Audit", path: "/security/audit" },
      { icon: PhoneIcon, label: "Device Trust", path: "/security/devices" },
      { icon: Lock, label: "Account Recovery", path: "/security/recovery" },
      { icon: Globe, label: "IP Management", path: "/security/ip-management" },
      { icon: LogIn, label: "Passwordless Auth", path: "/security/passwordless" },
      { icon: ChartIcon, label: "Login Analytics", path: "/security/login-analytics" },
      { icon: ShieldIcon, label: "Compliance Reports", path: "/compliance/reports" },
      { icon: ShieldIcon, label: "SSO Management", path: "/security/sso" },
    ],
  },
];


// Helper function to get all menu items flattened
export function getAllMenuItems(): MenuItem[] {
  const allItems: MenuItem[] = [];
  navigationStructure.forEach((group) => {
    allItems.push(...group.items);
  });
  return allItems;
}

// Helper function to filter navigation by user role
export function filterNavigationByRole(role?: string): MenuGroup[] {
  return navigationStructure.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (item.adminOnly && role !== "admin") {
        return false;
      }
      return true;
    }),
  })).filter((group) => group.items.length > 0);
}
