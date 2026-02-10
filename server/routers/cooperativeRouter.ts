import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { eq, desc } from "drizzle-orm";

// Mock data structures
interface Cooperative {
  id: number;
  name: string;
  description: string;
  founderId: number;
  memberCount: number;
  totalRevenue: number;
  createdAt: Date;
}

interface CooperativeMember {
  id: number;
  cooperativeId: number;
  userId: number;
  joinDate: Date;
  role: "founder" | "admin" | "member";
  sharesOwned: number;
  contributionAmount: number;
}

interface SharedResource {
  id: number;
  cooperativeId: number;
  name: string;
  type: string;
  quantity: number;
  owner: string;
  availableQuantity: number;
  rentalPrice: number;
}

const mockCooperatives: Map<number, Cooperative> = new Map();
const mockMembers: CooperativeMember[] = [];
const mockResources: SharedResource[] = [];

let cooperativeIdCounter = 1;

export const cooperativeRouter = router({
  /**
   * Create a new cooperative
   */
  createCooperative: protectedProcedure
    .input(
      z.object({
        name: z.string().min(3),
        description: z.string(),
        location: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const cooperativeId = cooperativeIdCounter++;

        const cooperative: Cooperative = {
          id: cooperativeId,
          name: input.name,
          description: input.description,
          founderId: ctx.user.id,
          memberCount: 1,
          totalRevenue: 0,
          createdAt: new Date(),
        };

        mockCooperatives.set(cooperativeId, cooperative);

        // Add founder as member
        mockMembers.push({
          id: mockMembers.length + 1,
          cooperativeId,
          userId: ctx.user.id,
          joinDate: new Date(),
          role: "founder",
          sharesOwned: 100,
          contributionAmount: 0,
        });

        return {
          success: true,
          cooperativeId,
          message: "Cooperative created successfully",
        };
      } catch (error) {
        console.error("Error creating cooperative:", error);
        throw error;
      }
    }),

  /**
   * Get cooperative details
   */
  getCooperative: protectedProcedure
    .input(z.object({ cooperativeId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const cooperative = mockCooperatives.get(input.cooperativeId);

        if (!cooperative) {
          throw new Error("Cooperative not found");
        }

        const members = mockMembers.filter(m => m.cooperativeId === input.cooperativeId);
        const resources = mockResources.filter(r => r.cooperativeId === input.cooperativeId);

        return {
          cooperative: {
            id: cooperative.id,
            name: cooperative.name,
            description: cooperative.description,
            memberCount: members.length,
            totalRevenue: cooperative.totalRevenue,
            createdAt: cooperative.createdAt,
          },
          members: members.length,
          resources: resources.length,
          totalShares: members.reduce((sum, m) => sum + m.sharesOwned, 0),
        };
      } catch (error) {
        console.error("Error fetching cooperative:", error);
        throw error;
      }
    }),

  /**
   * Add member to cooperative
   */
  addMember: protectedProcedure
    .input(
      z.object({
        cooperativeId: z.number(),
        userId: z.number(),
        initialContribution: z.number().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const cooperative = mockCooperatives.get(input.cooperativeId);

        if (!cooperative) {
          throw new Error("Cooperative not found");
        }

        // Check if user is already a member
        const existingMember = mockMembers.find(
          m => m.cooperativeId === input.cooperativeId && m.userId === input.userId
        );

        if (existingMember) {
          throw new Error("User is already a member");
        }

        const newMember: CooperativeMember = {
          id: mockMembers.length + 1,
          cooperativeId: input.cooperativeId,
          userId: input.userId,
          joinDate: new Date(),
          role: "member",
          sharesOwned: 10,
          contributionAmount: input.initialContribution,
        };

        mockMembers.push(newMember);
        cooperative.memberCount += 1;

        return {
          success: true,
          memberId: newMember.id,
          message: "Member added successfully",
        };
      } catch (error) {
        console.error("Error adding member:", error);
        throw error;
      }
    }),

  /**
   * Add shared resource
   */
  addSharedResource: protectedProcedure
    .input(
      z.object({
        cooperativeId: z.number(),
        name: z.string(),
        type: z.string(),
        quantity: z.number(),
        rentalPrice: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const cooperative = mockCooperatives.get(input.cooperativeId);

        if (!cooperative) {
          throw new Error("Cooperative not found");
        }

        const resource: SharedResource = {
          id: mockResources.length + 1,
          cooperativeId: input.cooperativeId,
          name: input.name,
          type: input.type,
          quantity: input.quantity,
          owner: `Member-${ctx.user.id}`,
          availableQuantity: input.quantity,
          rentalPrice: input.rentalPrice,
        };

        mockResources.push(resource);

        return {
          success: true,
          resourceId: resource.id,
          message: "Resource added to cooperative inventory",
        };
      } catch (error) {
        console.error("Error adding resource:", error);
        throw error;
      }
    }),

  /**
   * Get shared resources
   */
  getSharedResources: protectedProcedure
    .input(z.object({ cooperativeId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const resources = mockResources.filter(r => r.cooperativeId === input.cooperativeId);

        return {
          resources: resources.map(r => ({
            id: r.id,
            name: r.name,
            type: r.type,
            quantity: r.quantity,
            available: r.availableQuantity,
            rentalPrice: r.rentalPrice,
            owner: r.owner,
          })),
          totalResources: resources.length,
        };
      } catch (error) {
        console.error("Error fetching shared resources:", error);
        throw error;
      }
    }),

  /**
   * Rent a resource
   */
  rentResource: protectedProcedure
    .input(
      z.object({
        resourceId: z.number(),
        quantity: z.number(),
        rentalDays: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const resource = mockResources.find(r => r.id === input.resourceId);

        if (!resource) {
          throw new Error("Resource not found");
        }

        if (resource.availableQuantity < input.quantity) {
          throw new Error("Insufficient quantity available");
        }

        resource.availableQuantity -= input.quantity;

        const totalCost = resource.rentalPrice * input.quantity * input.rentalDays;

        return {
          success: true,
          rentalId: `RENTAL-${Date.now()}`,
          resource: resource.name,
          quantity: input.quantity,
          rentalDays: input.rentalDays,
          totalCost,
          message: "Resource rented successfully",
        };
      } catch (error) {
        console.error("Error renting resource:", error);
        throw error;
      }
    }),

  /**
   * Get cooperative marketplace
   */
  getCooperativeMarketplace: protectedProcedure
    .input(z.object({ cooperativeId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const cooperative = mockCooperatives.get(input.cooperativeId);

        if (!cooperative) {
          throw new Error("Cooperative not found");
        }

        // Mock marketplace products from member farms
        const marketplaceProducts = [
          {
            id: 1,
            name: "Organic Maize",
            producer: "Member Farm 1",
            quantity: 500,
            unit: "kg",
            price: 50,
            quality: "Grade A",
          },
          {
            id: 2,
            name: "Fresh Tomatoes",
            producer: "Member Farm 2",
            quantity: 200,
            unit: "kg",
            price: 80,
            quality: "Grade A",
          },
          {
            id: 3,
            name: "Beans",
            producer: "Member Farm 3",
            quantity: 300,
            unit: "kg",
            price: 120,
            quality: "Grade B",
          },
        ];

        return {
          cooperativeId: input.cooperativeId,
          products: marketplaceProducts,
          totalProducts: marketplaceProducts.length,
          totalValue: marketplaceProducts.reduce((sum, p) => sum + p.price * p.quantity, 0),
        };
      } catch (error) {
        console.error("Error fetching marketplace:", error);
        throw error;
      }
    }),

  /**
   * Calculate revenue sharing
   */
  calculateRevenueSharing: protectedProcedure
    .input(
      z.object({
        cooperativeId: z.number(),
        totalRevenue: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const members = mockMembers.filter(m => m.cooperativeId === input.cooperativeId);
        const totalShares = members.reduce((sum, m) => sum + m.sharesOwned, 0);

        const distribution = members.map(m => ({
          userId: m.userId,
          sharesOwned: m.sharesOwned,
          sharePercentage: (m.sharesOwned / totalShares) * 100,
          revenue: (m.sharesOwned / totalShares) * input.totalRevenue,
        }));

        return {
          cooperativeId: input.cooperativeId,
          totalRevenue: input.totalRevenue,
          distribution,
          totalMembers: members.length,
        };
      } catch (error) {
        console.error("Error calculating revenue sharing:", error);
        throw error;
      }
    }),

  /**
   * Get cooperative dashboard
   */
  getCooperativeDashboard: protectedProcedure
    .input(z.object({ cooperativeId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const cooperative = mockCooperatives.get(input.cooperativeId);

        if (!cooperative) {
          throw new Error("Cooperative not found");
        }

        const members = mockMembers.filter(m => m.cooperativeId === input.cooperativeId);
        const resources = mockResources.filter(r => r.cooperativeId === input.cooperativeId);

        return {
          cooperativeId: input.cooperativeId,
          name: cooperative.name,
          memberCount: members.length,
          resourceCount: resources.length,
          totalRevenue: cooperative.totalRevenue,
          totalShares: members.reduce((sum, m) => sum + m.sharesOwned, 0),
          recentMembers: members.slice(-5),
          topResources: resources.slice(0, 3),
        };
      } catch (error) {
        console.error("Error fetching cooperative dashboard:", error);
        throw error;
      }
    }),

  /**
   * Get cooperative members
   */
  getMembers: protectedProcedure
    .input(z.object({ cooperativeId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const members = mockMembers.filter(m => m.cooperativeId === input.cooperativeId);

        return {
          cooperativeId: input.cooperativeId,
          members: members.map(m => ({
            id: m.id,
            userId: m.userId,
            joinDate: m.joinDate,
            role: m.role,
            sharesOwned: m.sharesOwned,
            contribution: m.contributionAmount,
          })),
          totalMembers: members.length,
        };
      } catch (error) {
        console.error("Error fetching members:", error);
        throw error;
      }
    }),

  /**
   * Get cooperative analytics
   */
  getCooperativeAnalytics: protectedProcedure
    .input(z.object({ cooperativeId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const cooperative = mockCooperatives.get(input.cooperativeId);

        if (!cooperative) {
          throw new Error("Cooperative not found");
        }

        const members = mockMembers.filter(m => m.cooperativeId === input.cooperativeId);
        const resources = mockResources.filter(r => r.cooperativeId === input.cooperativeId);

        return {
          cooperativeId: input.cooperativeId,
          analytics: {
            memberGrowth: members.length,
            resourceUtilization: (resources.reduce((sum, r) => sum + (r.quantity - r.availableQuantity), 0) / 
              resources.reduce((sum, r) => sum + r.quantity, 1)) * 100,
            averageContribution: members.length > 0 
              ? members.reduce((sum, m) => sum + m.contributionAmount, 0) / members.length 
              : 0,
            totalAssets: resources.length,
          },
        };
      } catch (error) {
        console.error("Error fetching cooperative analytics:", error);
        throw error;
      }
    }),
});
