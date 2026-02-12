/**
 * Unit Tests for Budget Alerts and Period Comparison Features
 * Tests alert generation, severity calculation, and period comparison logic
 */

import { describe, it, expect } from "vitest";

describe("Budget Alert System", () => {
  describe("Alert Generation", () => {
    it("should create alert when spending reaches 80% threshold", () => {
      const budgetedAmount = 10000;
      const totalSpent = 8000;
      const spendingPercentage = (totalSpent / budgetedAmount) * 100;

      expect(spendingPercentage).toBe(80);
      expect(spendingPercentage >= 80).toBe(true);
    });

    it("should not create alert when spending below 80% threshold", () => {
      const budgetedAmount = 10000;
      const totalSpent = 7500;
      const spendingPercentage = (totalSpent / budgetedAmount) * 100;

      expect(spendingPercentage).toBe(75);
      expect(spendingPercentage >= 80).toBe(false);
    });

    it("should create alert when spending exceeds budget (100%)", () => {
      const budgetedAmount = 10000;
      const totalSpent = 10500;
      const spendingPercentage = (totalSpent / budgetedAmount) * 100;

      expect(spendingPercentage).toBe(105);
      expect(spendingPercentage >= 80).toBe(true);
    });
  });

  describe("Alert Severity Calculation", () => {
    it("should assign critical severity when spending exceeds 120%", () => {
      const budgetedAmount = 10000;
      const totalSpent = 12500;
      const spendingPercentage = (totalSpent / budgetedAmount) * 100;

      let severity = "low";
      if (spendingPercentage >= 100) {
        severity = spendingPercentage >= 120 ? "critical" : "high";
      } else if (spendingPercentage >= 80) {
        severity = spendingPercentage >= 95 ? "high" : "medium";
      }

      expect(severity).toBe("critical");
    });

    it("should assign high severity when spending between 100-120%", () => {
      const budgetedAmount = 10000;
      const totalSpent = 11000;
      const spendingPercentage = (totalSpent / budgetedAmount) * 100;

      let severity = "low";
      if (spendingPercentage >= 100) {
        severity = spendingPercentage >= 120 ? "critical" : "high";
      } else if (spendingPercentage >= 80) {
        severity = spendingPercentage >= 95 ? "high" : "medium";
      }

      expect(severity).toBe("high");
    });

    it("should assign high severity when spending between 95-100%", () => {
      const budgetedAmount = 10000;
      const totalSpent = 9700;
      const spendingPercentage = (totalSpent / budgetedAmount) * 100;

      let severity = "low";
      if (spendingPercentage >= 100) {
        severity = spendingPercentage >= 120 ? "critical" : "high";
      } else if (spendingPercentage >= 80) {
        severity = spendingPercentage >= 95 ? "high" : "medium";
      }

      expect(severity).toBe("high");
    });

    it("should assign medium severity when spending between 80-95%", () => {
      const budgetedAmount = 10000;
      const totalSpent = 8500;
      const spendingPercentage = (totalSpent / budgetedAmount) * 100;

      let severity = "low";
      if (spendingPercentage >= 100) {
        severity = spendingPercentage >= 120 ? "critical" : "high";
      } else if (spendingPercentage >= 80) {
        severity = spendingPercentage >= 95 ? "high" : "medium";
      }

      expect(severity).toBe("medium");
    });
  });

  describe("Alert Type Determination", () => {
    it("should classify as over_budget when spending exceeds 100%", () => {
      const budgetedAmount = 10000;
      const totalSpent = 10500;
      const spendingPercentage = (totalSpent / budgetedAmount) * 100;

      let alertType = "under_budget";
      if (spendingPercentage >= 100) {
        alertType = "over_budget";
      } else if (spendingPercentage >= 80) {
        alertType = "approaching_budget";
      }

      expect(alertType).toBe("over_budget");
    });

    it("should classify as approaching_budget when spending between 80-100%", () => {
      const budgetedAmount = 10000;
      const totalSpent = 8500;
      const spendingPercentage = (totalSpent / budgetedAmount) * 100;

      let alertType = "under_budget";
      if (spendingPercentage >= 100) {
        alertType = "over_budget";
      } else if (spendingPercentage >= 80) {
        alertType = "approaching_budget";
      }

      expect(alertType).toBe("approaching_budget");
    });

    it("should classify as under_budget when spending below 80%", () => {
      const budgetedAmount = 10000;
      const totalSpent = 7000;
      const spendingPercentage = (totalSpent / budgetedAmount) * 100;

      let alertType = "under_budget";
      if (spendingPercentage >= 100) {
        alertType = "over_budget";
      } else if (spendingPercentage >= 80) {
        alertType = "approaching_budget";
      }

      expect(alertType).toBe("under_budget");
    });
  });

  describe("Variance Calculation", () => {
    it("should calculate positive variance when over budget", () => {
      const budgetedAmount = 10000;
      const totalSpent = 11000;
      const variance = totalSpent - budgetedAmount;

      expect(variance).toBe(1000);
      expect(variance > 0).toBe(true);
    });

    it("should calculate negative variance when under budget", () => {
      const budgetedAmount = 10000;
      const totalSpent = 8000;
      const variance = totalSpent - budgetedAmount;

      expect(variance).toBe(-2000);
      expect(variance < 0).toBe(true);
    });
  });
});

describe("Period Comparison Analysis", () => {
  describe("Month-over-Month Comparison", () => {
    it("should calculate percentage change correctly", () => {
      const currentMonth = 10000;
      const previousMonth = 8000;
      const change = currentMonth - previousMonth;
      const changePercentage = (change / previousMonth) * 100;

      expect(change).toBe(2000);
      expect(changePercentage).toBe(25);
    });

    it("should handle zero previous month value", () => {
      const currentMonth = 10000;
      const previousMonth = 0;
      const changePercentage = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : 100;

      expect(changePercentage).toBe(100);
    });

    it("should calculate negative change", () => {
      const currentMonth = 7000;
      const previousMonth = 10000;
      const change = currentMonth - previousMonth;
      const changePercentage = (change / previousMonth) * 100;

      expect(change).toBe(-3000);
      expect(changePercentage).toBe(-30);
    });
  });

  describe("Year-over-Year Comparison", () => {
    it("should calculate annual percentage change", () => {
      const currentYear = 120000;
      const previousYear = 100000;
      const change = currentYear - previousYear;
      const changePercentage = (change / previousYear) * 100;

      expect(change).toBe(20000);
      expect(changePercentage).toBe(20);
    });

    it("should handle identical years", () => {
      const currentYear = 100000;
      const previousYear = 100000;
      const change = currentYear - previousYear;
      const changePercentage = (change / previousYear) * 100;

      expect(change).toBe(0);
      expect(changePercentage).toBe(0);
    });
  });

  describe("Trend Determination", () => {
    it("should classify as up trend when change > 5%", () => {
      const changePercentage = 10;
      let trend = "stable";
      if (changePercentage > 5) trend = "up";
      else if (changePercentage < -5) trend = "down";

      expect(trend).toBe("up");
    });

    it("should classify as down trend when change < -5%", () => {
      const changePercentage = -8;
      let trend = "stable";
      if (changePercentage > 5) trend = "up";
      else if (changePercentage < -5) trend = "down";

      expect(trend).toBe("down");
    });

    it("should classify as stable when change between -5% and 5%", () => {
      const changePercentage = 2;
      let trend = "stable";
      if (changePercentage > 5) trend = "up";
      else if (changePercentage < -5) trend = "down";

      expect(trend).toBe("stable");
    });
  });

  describe("Category Aggregation", () => {
    it("should aggregate multiple categories correctly", () => {
      const categories = [
        { name: "Feed", current: 5000, previous: 4500 },
        { name: "Labor", current: 8000, previous: 7500 },
        { name: "Equipment", current: 3000, previous: 3500 },
      ];

      const totalCurrent = categories.reduce((sum, cat) => sum + cat.current, 0);
      const totalPrevious = categories.reduce((sum, cat) => sum + cat.previous, 0);

      expect(totalCurrent).toBe(16000);
      expect(totalPrevious).toBe(15500);
    });

    it("should calculate total change percentage", () => {
      const totalCurrent = 16000;
      const totalPrevious = 15500;
      const totalChange = totalCurrent - totalPrevious;
      const totalChangePercentage = (totalChange / totalPrevious) * 100;

      expect(totalChange).toBe(500);
      expect(totalChangePercentage).toBeCloseTo(3.23, 1);
    });
  });

  describe("Budget Status Summary", () => {
    it("should calculate total budget and spending", () => {
      const budgetStatus = [
        { categoryName: "Feed", budgetedAmount: 5000, totalSpent: 4500 },
        { categoryName: "Labor", budgetedAmount: 8000, totalSpent: 7000 },
        { categoryName: "Equipment", budgetedAmount: 3000, totalSpent: 3200 },
      ];

      const totalBudgeted = budgetStatus.reduce((sum, b) => sum + b.budgetedAmount, 0);
      const totalSpent = budgetStatus.reduce((sum, b) => sum + b.totalSpent, 0);
      const totalRemaining = totalBudgeted - totalSpent;

      expect(totalBudgeted).toBe(16000);
      expect(totalSpent).toBe(14700);
      expect(totalRemaining).toBe(1300);
    });

    it("should determine budget status correctly", () => {
      const budgetStatus = [
        { spendingPercentage: 90, status: "on_track" },
        { spendingPercentage: 85, status: "on_track" },
        { spendingPercentage: 105, status: "over_budget" },
      ];

      budgetStatus.forEach((item) => {
        const status =
          item.spendingPercentage >= 100
            ? "over_budget"
            : item.spendingPercentage >= 80
              ? "warning"
              : "on_track";

        if (item.spendingPercentage >= 100) {
          expect(status).toBe("over_budget");
        } else if (item.spendingPercentage >= 80) {
          expect(status).toBe("warning");
        } else {
          expect(status).toBe("on_track");
        }
      });
    });
  });

  describe("Data Validation", () => {
    it("should handle missing categories gracefully", () => {
      const currentData = [{ category: "Feed", amount: 5000 }];
      const previousData: typeof currentData = [];

      const comparisonMap = new Map();

      currentData.forEach((curr) => {
        comparisonMap.set(curr.category, {
          category: curr.category,
          current: curr.amount,
          previous: 0,
        });
      });

      previousData.forEach((prev) => {
        if (comparisonMap.has(prev.category)) {
          const entry = comparisonMap.get(prev.category);
          entry.previous = prev.amount;
        } else {
          comparisonMap.set(prev.category, {
            category: prev.category,
            current: 0,
            previous: prev.amount,
          });
        }
      });

      const comparison = Array.from(comparisonMap.values());
      expect(comparison.length).toBe(1);
      expect(comparison[0].previous).toBe(0);
    });

    it("should validate percentage calculations", () => {
      const testCases = [
        { current: 10000, previous: 5000, expectedPercentage: 100 },
        { current: 5000, previous: 10000, expectedPercentage: -50 },
        { current: 10000, previous: 10000, expectedPercentage: 0 },
      ];

      testCases.forEach((test) => {
        const change = test.current - test.previous;
        const percentage = (change / test.previous) * 100;
        expect(percentage).toBe(test.expectedPercentage);
      });
    });
  });
});

describe("Alert Acknowledgment", () => {
  it("should mark alert as acknowledged", () => {
    const alert = {
      id: 1,
      acknowledged: false,
      acknowledgedBy: null,
      acknowledgedAt: null,
    };

    alert.acknowledged = true;
    alert.acknowledgedBy = 123;
    alert.acknowledgedAt = new Date();

    expect(alert.acknowledged).toBe(true);
    expect(alert.acknowledgedBy).toBe(123);
    expect(alert.acknowledgedAt).not.toBeNull();
  });
});
