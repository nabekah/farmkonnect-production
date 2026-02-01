import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Star, TrendingUp, Award, Crown, Medal } from "lucide-react";

export default function SellerLeaderboard() {
  const [period, setPeriod] = useState<"month" | "year" | "all">("all");
  const [category, setCategory] = useState<"revenue" | "ratings" | "sales">("revenue");

  const { data: topSellers = [], isLoading } = trpc.marketplace.getTopSellers.useQuery({
    period,
    category,
    limit: 20,
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />;
    return <span className="text-2xl font-bold text-muted-foreground">#{rank}</span>;
  };

  const getRankBgColor = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50";
    if (rank === 2) return "bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/50";
    if (rank === 3) return "bg-gradient-to-r from-amber-600/20 to-orange-500/20 border-amber-600/50";
    return "bg-card";
  };

  const getCategoryLabel = () => {
    if (category === "revenue") return "Revenue";
    if (category === "ratings") return "Average Rating";
    if (category === "sales") return "Sales Volume";
    return "";
  };

  const getCategoryValue = (seller: any) => {
    if (category === "revenue") return `GH₵${seller.revenue.toFixed(2)}`;
    if (category === "ratings") return `${seller.avgRating.toFixed(1)} ⭐`;
    if (category === "sales") return `${seller.salesVolume} orders`;
    return "";
  };

  return (
    <div className="container max-w-7xl py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Seller Leaderboard</h1>
          <p className="text-muted-foreground">Top performing sellers in the FarmKonnect marketplace</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Customize the leaderboard view</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Time Period</label>
            <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Ranking Category</label>
            <Select value={category} onValueChange={(v: any) => setCategory(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="ratings">Ratings</SelectItem>
                <SelectItem value="sales">Sales Volume</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading leaderboard...</p>
          </CardContent>
        </Card>
      ) : topSellers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No sellers found</h3>
            <p className="text-muted-foreground">
              No seller data available for the selected period
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {topSellers.map((seller: any) => (
            <Card key={seller.id} className={`${getRankBgColor(seller.rank)} transition-all hover:shadow-lg`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  {/* Rank Badge */}
                  <div className="flex-shrink-0 flex items-center justify-center w-16 h-16">
                    {getRankIcon(seller.rank)}
                  </div>

                  {/* Seller Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          {seller.name}
                          {seller.isVerified && (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                              ✓ Verified
                            </Badge>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">{seller.email}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{getCategoryLabel()}</p>
                        <p className="text-2xl font-bold text-primary">{getCategoryValue(seller)}</p>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Revenue</p>
                        <p className="font-semibold">GH₵{seller.revenue.toFixed(2)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Sales</p>
                        <p className="font-semibold">{seller.salesVolume} orders</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Rating</p>
                        <p className="font-semibold flex items-center gap-1">
                          {seller.avgRating.toFixed(1)}
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          <span className="text-xs text-muted-foreground">({seller.totalReviews})</span>
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Products</p>
                        <p className="font-semibold">{seller.totalProducts}</p>
                      </div>
                    </div>

                    {/* Badges */}
                    {seller.badges && seller.badges.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {seller.badges.map((badge: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {badge}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            About Achievement Badges
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>🏆 <strong>Top Seller:</strong> #1 ranked seller in selected category</p>
          <p>🥈 <strong>Second Place:</strong> #2 ranked seller</p>
          <p>🥉 <strong>Third Place:</strong> #3 ranked seller</p>
          <p>⭐ <strong>Customer Favorite:</strong> Average rating of 4.5 or higher</p>
          <p>💰 <strong>High Revenue:</strong> Total revenue exceeds GH₵10,000</p>
          <p>📈 <strong>High Volume:</strong> More than 100 orders completed</p>
          <p>✓ <strong>Verified:</strong> Seller account is verified</p>
        </CardContent>
      </Card>
    </div>
  );
}
