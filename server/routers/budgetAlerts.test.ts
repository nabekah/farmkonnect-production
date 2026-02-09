import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTRPCMsw } from "msw-trpc";
import { appRouter } from "../routers";

describe("Budget Alerts Router", () => {
  it("should check budgets and return alerts", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, email: "test@example.com", role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.budgetAlerts.checkBudgets({
      farmId: "1",
      warningThreshold: 80,
      criticalThreshold: 95
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.alerts).toBeInstanceOf(Array);
  });

  it("should get budget alerts for a farm", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, email: "test@example.com", role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.budgetAlerts.getAlerts({
      farmId: "1",
      includeRead: false
    });

    expect(result).toBeInstanceOf(Array);
  });

  it("should get budget summary", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, email: "test@example.com", role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.budgetAlerts.getBudgetSummary({
      farmId: "1"
    });

    expect(result).toBeDefined();
    expect(result.totalBudgets).toBeDefined();
    expect(result.totalAllocated).toBeDefined();
    expect(result.totalSpent).toBeDefined();
    expect(result.percentageUsed).toBeDefined();
  });

  it("should get budget vs actual", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, email: "test@example.com", role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.budgetAlerts.getBudgetVsActual({
      farmId: "1"
    });

    expect(result).toBeInstanceOf(Array);
  });

  it("should mark alert as read", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, email: "test@example.com", role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.budgetAlerts.markAsRead({
      alertId: "1"
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
});
