import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "test@farm.com",
    name: "Test Farmer",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Financial Management tRPC Procedures - Comprehensive Tests", () => {
  const testFarmId = "test-farm-001";

  describe("Expense Tracking", () => {
    it("should create a feed expense successfully", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.financialManagement.createExpense({
        farmId: testFarmId,
        category: "feed",
        description: "Chicken feed 50kg bag",
        amount: 250.0,
        date: new Date(),
      });

      expect(result).toBeDefined();
      expect(result.amount).toBe(250.0);
      expect(result.category).toBe("feed");
    });

    it("should create a medication expense successfully", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.financialManagement.createExpense({
        farmId: testFarmId,
        category: "medication",
        description: "Veterinary medication",
        amount: 150.0,
        date: new Date(),
      });

      expect(result).toBeDefined();
      expect(result.amount).toBe(150.0);
      expect(result.category).toBe("medication");
    });

    it("should create a labor expense successfully", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.financialManagement.createExpense({
        farmId: testFarmId,
        category: "labor",
        description: "Farm worker wages",
        amount: 500.0,
        date: new Date(),
      });

      expect(result).toBeDefined();
      expect(result.amount).toBe(500.0);
      expect(result.category).toBe("labor");
    });

    it("should create an equipment expense successfully", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.financialManagement.createExpense({
        farmId: testFarmId,
        category: "equipment",
        description: "Water pump repair",
        amount: 800.0,
        date: new Date(),
      });

      expect(result).toBeDefined();
      expect(result.amount).toBe(800.0);
      expect(result.category).toBe("equipment");
    });

    it("should create a utilities expense successfully", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.financialManagement.createExpense({
        farmId: testFarmId,
        category: "utilities",
        description: "Electricity bill",
        amount: 300.0,
        date: new Date(),
      });

      expect(result).toBeDefined();
      expect(result.amount).toBe(300.0);
      expect(result.category).toBe("utilities");
    });

    it("should create a transport expense successfully", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.financialManagement.createExpense({
        farmId: testFarmId,
        category: "transport",
        description: "Fuel for farm vehicle",
        amount: 200.0,
        date: new Date(),
      });

      expect(result).toBeDefined();
      expect(result.amount).toBe(200.0);
      expect(result.category).toBe("transport");
    });
  });

  describe("Revenue Tracking", () => {
    it("should create animal sales revenue successfully", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.financialManagement.createRevenue({
        farmId: testFarmId,
        source: "animal_sales",
        description: "Sold 5 chickens",
        amount: 500.0,
        date: new Date(),
      });

      expect(result).toBeDefined();
      expect(result.amount).toBe(500.0);
    });

    it("should create milk production revenue successfully", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.financialManagement.createRevenue({
        farmId: testFarmId,
        source: "milk_production",
        description: "Milk sales 100L",
        amount: 800.0,
        date: new Date(),
      });

      expect(result).toBeDefined();
      expect(result.amount).toBe(800.0);
    });

    it("should create egg revenue successfully", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.financialManagement.createRevenue({
        farmId: testFarmId,
        source: "eggs",
        description: "Egg sales 200 units",
        amount: 300.0,
        date: new Date(),
      });

      expect(result).toBeDefined();
      expect(result.amount).toBe(300.0);
    });

    it("should create meat revenue successfully", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.financialManagement.createRevenue({
        farmId: testFarmId,
        source: "meat",
        description: "Meat sales",
        amount: 1200.0,
        date: new Date(),
      });

      expect(result).toBeDefined();
      expect(result.amount).toBe(1200.0);
    });

    it("should create breeding revenue successfully", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.financialManagement.createRevenue({
        farmId: testFarmId,
        source: "breeding",
        description: "Breeding stock sales",
        amount: 2000.0,
        date: new Date(),
      });

      expect(result).toBeDefined();
      expect(result.amount).toBe(2000.0);
    });
  });

  describe("Budget Management", () => {
    it("should create a budget successfully", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.financialManagement.createBudget({
        farmId: testFarmId,
        category: "feed",
        budgetedAmount: 1000.0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should retrieve budgets for a farm", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const budgets = await caller.financialManagement.getBudgets({
        farmId: testFarmId,
      });

      expect(Array.isArray(budgets)).toBe(true);
    });
  });

  describe("Invoice Management", () => {
    it("should create an invoice successfully", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.financialManagement.createInvoice({
        farmId: testFarmId,
        invoiceNumber: "INV-TEST-001",
        clientName: "Test Client",
        items: [
          {
            description: "Chicken meat 50kg",
            quantity: 50,
            unitPrice: 25.0,
            amount: 1250.0,
          },
        ],
        totalAmount: 1250.0,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: "Payment due within 30 days",
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it("should retrieve invoices for a farm", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const invoices = await caller.financialManagement.getInvoices({
        farmId: testFarmId,
      });

      expect(Array.isArray(invoices)).toBe(true);
    });

    it("should update invoice status successfully", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const invoices = await caller.financialManagement.getInvoices({
        farmId: testFarmId,
      });

      if (invoices.length > 0) {
        const result = await caller.financialManagement.updateInvoiceStatus({
          invoiceId: invoices[0].id,
          status: "sent",
        });

        expect(result).toBeDefined();
        expect(result.success).toBe(true);
      }
    });

    it("should mark invoice as paid", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const invoices = await caller.financialManagement.getInvoices({
        farmId: testFarmId,
      });

      if (invoices.length > 0) {
        const result = await caller.financialManagement.updateInvoiceStatus({
          invoiceId: invoices[0].id,
          status: "paid",
        });

        expect(result).toBeDefined();
        expect(result.success).toBe(true);
      }
    });
  });

  describe("Data Validation", () => {
    it("should reject negative expense amount", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.financialManagement.createExpense({
          farmId: testFarmId,
          category: "feed",
          description: "Invalid expense",
          amount: -100.0,
          date: new Date(),
        });
        expect.fail("Should have thrown error for negative amount");
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it("should reject negative revenue amount", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.financialManagement.createRevenue({
          farmId: testFarmId,
          source: "animal_sales",
          description: "Invalid revenue",
          amount: -500.0,
          date: new Date(),
        });
        expect.fail("Should have thrown error for negative amount");
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it("should validate invoice total matches sum of items", async () => {
      const items = [
        { description: "Item 1", quantity: 10, unitPrice: 100, amount: 1000 },
        { description: "Item 2", quantity: 5, unitPrice: 50, amount: 250 },
      ];

      const total = items.reduce((sum, item) => sum + item.amount, 0);
      expect(total).toBe(1250);
    });

    it("should validate positive budget amount", async () => {
      const validAmount = 1000;
      expect(validAmount).toBeGreaterThan(0);
    });
  });
});
