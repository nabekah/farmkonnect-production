import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";

// Reputation types
interface UserReputation {
  userId: number;
  totalScore: number;
  postsCreated: number;
  likesReceived: number;
  helpfulReplies: number;
  level: number;
  badges: string[];
  lastUpdated: Date;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  type: "posts" | "likes" | "helpful" | "streak";
}

interface LeaderboardEntry {
  rank: number;
  userId: number;
  userName: string;
  totalScore: number;
  level: number;
  badges: number;
}

// Mock data
const mockReputations: Map<number, UserReputation> = new Map([
  [
    1,
    {
      userId: 1,
      totalScore: 2450,
      postsCreated: 156,
      likesReceived: 890,
      helpfulReplies: 45,
      level: 8,
      badges: ["expert", "helpful", "active"],
      lastUpdated: new Date(),
    },
  ],
  [
    2,
    {
      userId: 2,
      totalScore: 2180,
      postsCreated: 142,
      likesReceived: 756,
      helpfulReplies: 38,
      level: 7,
      badges: ["helpful", "active"],
      lastUpdated: new Date(),
    },
  ],
]);

const achievements: Achievement[] = [
  {
    id: "first-post",
    name: "First Post",
    description: "Create your first forum post",
    icon: "📝",
    requirement: 1,
    type: "posts",
  },
  {
    id: "power-poster",
    name: "Power Poster",
    description: "Create 50 forum posts",
    icon: "🚀",
    requirement: 50,
    type: "posts",
  },
  {
    id: "expert",
    name: "Expert",
    description: "Create 100 forum posts",
    icon: "⭐",
    requirement: 100,
    type: "posts",
  },
  {
    id: "helpful",
    name: "Helpful",
    description: "Get 10 helpful replies",
    icon: "🤝",
    requirement: 10,
    type: "helpful",
  },
  {
    id: "popular",
    name: "Popular",
    description: "Get 100 likes on your posts",
    icon: "❤️",
    requirement: 100,
    type: "likes",
  },
  {
    id: "superstar",
    name: "Superstar",
    description: "Get 500 likes on your posts",
    icon: "✨",
    requirement: 500,
    type: "likes",
  },
];

export const reputationRouter = router({
  /**
   * Get user reputation and stats
   */
  getUserReputation: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const reputation = mockReputations.get(input.userId) || {
          userId: input.userId,
          totalScore: 0,
          postsCreated: 0,
          likesReceived: 0,
          helpfulReplies: 0,
          level: 1,
          badges: [],
          lastUpdated: new Date(),
        };

        return reputation;
      } catch (error) {
        console.error("Error fetching user reputation:", error);
        throw error;
      }
    }),

  /**
   * Add reputation points
   */
  addReputation: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        points: z.number(),
        reason: z.enum(["post_created", "like_received", "helpful_reply", "badge_earned"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        let reputation = mockReputations.get(input.userId);

        if (!reputation) {
          reputation = {
            userId: input.userId,
            totalScore: 0,
            postsCreated: 0,
            likesReceived: 0,
            helpfulReplies: 0,
            level: 1,
            badges: [],
            lastUpdated: new Date(),
          };
          mockReputations.set(input.userId, reputation);
        }

        // Add points
        reputation.totalScore += input.points;

        // Update specific counters
        switch (input.reason) {
          case "post_created":
            reputation.postsCreated += 1;
            break;
          case "like_received":
            reputation.likesReceived += 1;
            break;
          case "helpful_reply":
            reputation.helpfulReplies += 1;
            break;
        }

        // Calculate level (every 300 points = 1 level)
        reputation.level = Math.floor(reputation.totalScore / 300) + 1;

        // Check for new badges
        const newBadges = checkNewBadges(reputation);
        reputation.badges = [...new Set([...reputation.badges, ...newBadges])];

        reputation.lastUpdated = new Date();

        return {
          success: true,
          reputation,
          newBadges,
        };
      } catch (error) {
        console.error("Error adding reputation:", error);
        throw error;
      }
    }),

  /**
   * Get user achievements
   */
  getUserAchievements: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const reputation = mockReputations.get(input.userId);

        if (!reputation) {
          return {
            achievements: [],
            earnedCount: 0,
            totalCount: achievements.length,
          };
        }

        const earnedAchievements = achievements.filter((a) => {
          switch (a.type) {
            case "posts":
              return reputation.postsCreated >= a.requirement;
            case "likes":
              return reputation.likesReceived >= a.requirement;
            case "helpful":
              return reputation.helpfulReplies >= a.requirement;
            default:
              return false;
          }
        });

        const progress = achievements.map((a) => {
          let current = 0;
          switch (a.type) {
            case "posts":
              current = reputation.postsCreated;
              break;
            case "likes":
              current = reputation.likesReceived;
              break;
            case "helpful":
              current = reputation.helpfulReplies;
              break;
          }

          return {
            ...a,
            earned: current >= a.requirement,
            progress: Math.min(current, a.requirement),
            percentage: Math.round((current / a.requirement) * 100),
          };
        });

        return {
          achievements: progress,
          earnedCount: earnedAchievements.length,
          totalCount: achievements.length,
        };
      } catch (error) {
        console.error("Error fetching achievements:", error);
        throw error;
      }
    }),

  /**
   * Get leaderboard
   */
  getLeaderboard: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        timeframe: z.enum(["all-time", "month", "week"]).default("all-time"),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const leaderboard: LeaderboardEntry[] = Array.from(mockReputations.values())
          .sort((a, b) => b.totalScore - a.totalScore)
          .slice(0, input.limit)
          .map((rep, index) => ({
            rank: index + 1,
            userId: rep.userId,
            userName: `Farmer ${rep.userId}`, // Would come from users table
            totalScore: rep.totalScore,
            level: rep.level,
            badges: rep.badges.length,
          }));

        return {
          leaderboard,
          timeframe: input.timeframe,
        };
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        throw error;
      }
    }),

  /**
   * Get reputation breakdown
   */
  getReputationBreakdown: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const reputation = mockReputations.get(input.userId);

        if (!reputation) {
          return {
            userId: input.userId,
            breakdown: {
              postsCreated: 0,
              likesReceived: 0,
              helpfulReplies: 0,
            },
            totalScore: 0,
          };
        }

        return {
          userId: input.userId,
          breakdown: {
            postsCreated: reputation.postsCreated * 10, // 10 points per post
            likesReceived: reputation.likesReceived * 5, // 5 points per like
            helpfulReplies: reputation.helpfulReplies * 50, // 50 points per helpful reply
          },
          totalScore: reputation.totalScore,
        };
      } catch (error) {
        console.error("Error fetching reputation breakdown:", error);
        throw error;
      }
    }),

  /**
   * Get top contributors
   */
  getTopContributors: protectedProcedure
    .input(z.object({ limit: z.number().default(5) }))
    .query(async ({ ctx, input }) => {
      try {
        const topContributors = Array.from(mockReputations.values())
          .sort((a, b) => b.postsCreated - a.postsCreated)
          .slice(0, input.limit)
          .map((rep) => ({
            userId: rep.userId,
            userName: `Farmer ${rep.userId}`,
            posts: rep.postsCreated,
            reputation: rep.totalScore,
            level: rep.level,
          }));

        return topContributors;
      } catch (error) {
        console.error("Error fetching top contributors:", error);
        throw error;
      }
    }),

  /**
   * Get reputation statistics
   */
  getReputationStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const allReputations = Array.from(mockReputations.values());

      const totalUsers = allReputations.length;
      const avgScore = allReputations.reduce((sum, r) => sum + r.totalScore, 0) / totalUsers || 0;
      const avgLevel = allReputations.reduce((sum, r) => sum + r.level, 0) / totalUsers || 0;
      const totalPosts = allReputations.reduce((sum, r) => sum + r.postsCreated, 0);
      const totalLikes = allReputations.reduce((sum, r) => sum + r.likesReceived, 0);

      return {
        totalUsers,
        avgScore: Math.round(avgScore),
        avgLevel: Math.round(avgLevel * 10) / 10,
        totalPosts,
        totalLikes,
        achievements,
      };
    } catch (error) {
      console.error("Error fetching reputation stats:", error);
      throw error;
    }
  }),

  /**
   * Get user rank
   */
  getUserRank: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const allReputations = Array.from(mockReputations.values())
          .sort((a, b) => b.totalScore - a.totalScore);

        const userReputation = mockReputations.get(input.userId);

        if (!userReputation) {
          return {
            rank: allReputations.length + 1,
            totalUsers: allReputations.length,
            percentile: 0,
          };
        }

        const rank = allReputations.findIndex((r) => r.userId === input.userId) + 1;
        const percentile = Math.round(((allReputations.length - rank + 1) / allReputations.length) * 100);

        return {
          rank,
          totalUsers: allReputations.length,
          percentile,
        };
      } catch (error) {
        console.error("Error fetching user rank:", error);
        throw error;
      }
    }),
});

/**
 * Helper function to check for new badges
 */
function checkNewBadges(reputation: UserReputation): string[] {
  const newBadges: string[] = [];

  if (reputation.postsCreated >= 1 && !reputation.badges.includes("first-post")) {
    newBadges.push("first-post");
  }
  if (reputation.postsCreated >= 50 && !reputation.badges.includes("power-poster")) {
    newBadges.push("power-poster");
  }
  if (reputation.postsCreated >= 100 && !reputation.badges.includes("expert")) {
    newBadges.push("expert");
  }
  if (reputation.helpfulReplies >= 10 && !reputation.badges.includes("helpful")) {
    newBadges.push("helpful");
  }
  if (reputation.likesReceived >= 100 && !reputation.badges.includes("popular")) {
    newBadges.push("popular");
  }
  if (reputation.likesReceived >= 500 && !reputation.badges.includes("superstar")) {
    newBadges.push("superstar");
  }

  return newBadges;
}
