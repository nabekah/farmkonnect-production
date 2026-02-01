import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Package, Star, DollarSign, ShoppingCart, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function SellerAnalytics() {
  const [timeRange, setTimeRange] = useState("month");
  const [rankPeriod, setRankPeriod] = useState<"month" | "year" | "all">("all");
  const [rankCategory, setRankCategory] = useState<"revenue" | "ratings" | "sales">("revenue");
  
  const { data: sellerRank } = trpc.marketplace.getSellerRank.useQuery({
    period: rankPeriod,
    category: rankCategory,
  });

  const { data: sellerStats } = trpc.marketplace.getSellerStats.useQuery();
  const { data: orders = [] } = trpc.marketplace.listOrders.useQuery({ role: "seller" });
  const { data: products = [] } = trpc.marketplace.listProducts.useQuery({ limit: 100 });

  // Calculate analytics
  const totalRevenue = orders
    .filter((o: any) => o.status === "delivered")
    .reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount), 0);

  const pendingOrders = orders.filter((o: any) => o.status === "pending").length;
  const completedOrders = orders.filter((o: any) => o.status === "delivered").length;

  // Product performance
  const productPerformance = products.map((p: any) => {
    const productOrders = orders.filter((o: any) =>
      o.items?.some((item: any) => item.productId === p.id)
    );
    const sales = productOrders.reduce((sum: number, o: any) => {
      const item = o.items?.find((i: any) => i.productId === p.id);
      return sum + (item?.quantity || 0);
    }, 0);
    const revenue = productOrders.reduce((sum: number, o: any) => {
      const item = o.items?.find((i: any) => i.productId === p.id);
      return sum + (item?.quantity || 0) * parseFloat(p.price);
    }, 0);

    return {
      ...p,
      sales,
      revenue,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // Low stock products
  const lowStockProducts = products.filter((p: any) => parseFloat(p.quantity) < 10);

  // Revenue by time period
  const getRevenueByPeriod = () => {
    const now = new Date();
    const periods: { label: string; revenue: number }[] = [];

    if (timeRange === "week") {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayOrders = orders.filter((o: any) => {
          const orderDate = new Date(o.createdAt);
          return orderDate.toDateString() === date.toDateString() && o.status === "delivered";
        });
        const dayRevenue = dayOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount), 0);
        periods.push({
          label: date.toLocaleDateString("en-US", { weekday: "short" }),
          revenue: dayRevenue,
        });
      }
    } else if (timeRange === "month") {
      // Last 30 days grouped by week
      for (let i = 3; i >= 0; i--) {
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - (i + 1) * 7);
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() - i * 7);

        const weekOrders = orders.filter((o: any) => {
          const orderDate = new Date(o.createdAt);
          return orderDate >= startDate && orderDate < endDate && o.status === "delivered";
        });
        const weekRevenue = weekOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount), 0);
        periods.push({
          label: `Week ${4 - i}`,
          revenue: weekRevenue,
        });
      }
    } else {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const monthOrders = orders.filter((o: any) => {
          const orderDate = new Date(o.createdAt);
          return (
            orderDate.getMonth() === date.getMonth() &&
            orderDate.getFullYear() === date.getFullYear() &&
            o.status === "delivered"
          );
        });
        const monthRevenue = monthOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount), 0);
        periods.push({
          label: date.toLocaleDateString("en-US", { month: "short" }),
          revenue: monthRevenue,
        });
      }
    }

    return periods;
  };

  const revenueData = getRevenueByPeriod();
  const maxRevenue = Math.max(...revenueData.map((d) => d.revenue), 1);

  // Calculate average rating from reviews (if needed in future)
  const avgRating = 0; // TODO: Add review aggregation
  const totalReviews = 0; // TODO: Add review count

  return (
    <div className="container py-4 sm:py-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Seller Analytics</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Track your marketplace performance</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Link href="/seller-payouts" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">View Payouts</Button>
          </Link>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="year">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Seller Rank Card */}
      {sellerRank && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Your Seller Ranking
            </CardTitle>
            <CardDescription>See how you compare to other sellers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Rank</p>
                <p className="text-4xl font-bold">#{sellerRank.rank}</p>
                <p className="text-xs text-muted-foreground">out of {sellerRank.total} sellers</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Percentile</p>
                <p className="text-2xl font-bold text-primary">{sellerRank.percentile}%</p>
                <p className="text-xs text-muted-foreground">Top {100 - sellerRank.percentile}%</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={rankPeriod} onValueChange={(v: any) => setRankPeriod(v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
              <Select value={rankCategory} onValueChange={(v: any) => setRankCategory(v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="ratings">Ratings</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => window.location.href = "/seller-leaderboard"} className="w-full" variant="outline">
              View Full Leaderboard
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">GH₵{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From {completedOrders} completed orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{avgRating.toFixed(1)} ⭐</div>
            <p className="text-xs text-muted-foreground">From {totalReviews} reviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">{lowStockProducts.length} low stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Your earnings over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-end gap-2">
            {revenueData.map((period, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-primary/20 rounded-t relative" style={{ height: `${(period.revenue / maxRevenue) * 250}px`, minHeight: "10px" }}>
                  <div className="absolute -top-6 left-0 right-0 text-center text-xs font-medium">
                    GH₵{period.revenue.toFixed(0)}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{period.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Product Performance</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Best Selling Products</CardTitle>
              <CardDescription>Top products by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productPerformance.slice(0, 10).map((product: any) => (
                  <div key={product.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div className="flex items-center gap-4">
                      {product.imageUrl && (
                        <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded" />
                      )}
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.category}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">GH₵{product.revenue.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">{product.sales} sold</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Alerts</CardTitle>
              <CardDescription>Products that need restocking</CardDescription>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>All products are well stocked!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lowStockProducts.map((product: any) => (
                    <div key={product.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div className="flex items-center gap-4">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">{product.category}</div>
                        </div>
                      </div>
                      <Badge variant={parseFloat(product.quantity) < 5 ? "destructive" : "secondary"}>
                        {product.quantity} {product.unit} left
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
