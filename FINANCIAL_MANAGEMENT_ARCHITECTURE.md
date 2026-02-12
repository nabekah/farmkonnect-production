# Financial Management System Architecture

This document provides a comprehensive overview of the financial management system from UI to database, showing all files, their relationships, and data flow.

## System Overview

The financial management system is built with a three-tier architecture:
- **Frontend (React/TypeScript)** - User interface components
- **Backend (tRPC/Express)** - API procedures and business logic
- **Database (MySQL/Drizzle ORM)** - Data persistence layer

---

## Directory Structure

```
farmkonnect_app/
├── client/
│   └── src/
│       ├── pages/
│       │   └── FinancialManagement.tsx          [Main financial dashboard page]
│       │
│       └── components/
│           ├── BudgetVisualization.tsx          [Budget vs actual charts]
│           ├── BudgetCreationForm.tsx           [Budget creation dialog]
│           ├── BudgetComparisonReports.tsx      [Budget comparison & export]
│           ├── BudgetForecasting.tsx            [Spending forecasts]
│           ├── DashboardLayout.tsx              [Layout wrapper]
│           └── ui/                              [shadcn/ui components]
│               ├── card.tsx
│               ├── button.tsx
│               ├── dialog.tsx
│               ├── select.tsx
│               └── input.tsx
│
├── server/
│   ├── routers/
│   │   ├── financialManagement.ts               [Financial operations]
│   │   ├── budgetManagement.ts                  [Budget operations]
│   │   └── routers.ts                           [Main router export]
│   │
│   ├── db.ts                                    [Database connection]
│   ├── _core/
│   │   ├── trpc.ts                              [tRPC setup]
│   │   ├── context.ts                           [Request context]
│   │   ├── env.ts                               [Environment variables]
│   │   └── index.ts                             [Server entry point]
│   │
│   ├── budgetVisualization.test.ts              [Budget viz tests]
│   ├── budgetManagement.test.ts                 [Budget mgmt tests]
│   └── auth.logout.test.ts                      [Auth tests]
│
├── drizzle/
│   ├── schema.ts                                [Database schema]
│   └── migrations/                              [Database migrations]
│
└── shared/
    └── constants.ts                             [Shared constants]
```

---

## File Descriptions & Relationships

### Frontend Layer

#### **FinancialManagement.tsx** (Main Dashboard Page)
**Location:** `client/src/pages/FinancialManagement.tsx`

**Purpose:** Central hub for all financial management features

**Key Features:**
- View mode selector (dashboard, expenses, revenue, profitability, budget, reports)
- Farm selection dropdown
- Date range picker
- Integration of all financial components

**Imports:**
```typescript
import { BudgetVisualization } from "@/components/BudgetVisualization";
import { BudgetCreationForm } from "@/components/BudgetCreationForm";
import { BudgetComparisonReports } from "@/components/BudgetComparisonReports";
import { trpc } from "@/lib/trpc";
```

**tRPC Queries Used:**
- `trpc.farms.list.useQuery()` - Get user's farms
- `trpc.financialManagement.getSummary.useQuery()` - Get financial summary
- `trpc.financialManagement.getExpenses.useQuery()` - Get expenses
- `trpc.financialManagement.getRevenue.useQuery()` - Get revenue
- `trpc.financialManagement.getBudgetVsActualDetailed.useQuery()` - Get budget data
- `trpc.financialManagement.getBudgetTrendAnalysis.useQuery()` - Get trend data
- `trpc.financialManagement.getBudgetPerformanceMetrics.useQuery()` - Get metrics
- `trpc.financialManagement.getBudgetAlerts.useQuery()` - Get alerts

**Data Flow:**
```
FinancialManagement.tsx
    ↓
    ├→ BudgetVisualization.tsx
    │   ↓
    │   └→ trpc.financialManagement.getBudgetVsActualDetailed
    │       ↓
    │       └→ server/routers/financialManagement.ts
    │           ↓
    │           └→ drizzle/schema.ts (budgets, expenses)
    │
    ├→ BudgetCreationForm.tsx
    │   ↓
    │   └→ trpc.budgetManagement.createBudget
    │       ↓
    │       └→ server/routers/budgetManagement.ts
    │           ↓
    │           └→ drizzle/schema.ts (budgets, budgetLineItems)
    │
    └→ BudgetComparisonReports.tsx
        ↓
        └→ trpc.budgetManagement.compareBudgets
            ↓
            └→ server/routers/budgetManagement.ts
                ↓
                └→ drizzle/schema.ts (budgets, expenses)
```

---

#### **BudgetVisualization.tsx** (Budget Charts)
**Location:** `client/src/components/BudgetVisualization.tsx`

**Purpose:** Display budget vs actual spending visualizations

**Components:**
- Performance metrics cards (Total Budget, Spent, Remaining, Utilization %)
- Budget alerts panel
- Budget vs Actual bar chart
- Budget variance chart
- Budget utilization progress bars
- Trend analysis composed chart
- Summary statistics

**Props:**
```typescript
interface BudgetVisualizationProps {
  data?: BudgetVsActualItem[];
  trendData?: BudgetTrendItem[];
  alerts?: BudgetAlert[];
  metrics?: BudgetPerformanceMetrics;
  isLoading?: boolean;
}
```

**Data Dependencies:**
- Receives data from `FinancialManagement.tsx`
- Uses Recharts for visualization
- Formats currency with GHS locale

**Rendering Logic:**
```
BudgetVisualization
├── Performance Metrics Cards
│   ├── Total Budget Card
│   ├── Total Spent Card
│   ├── Remaining Card
│   └── Utilization % Card
├── Budget Alerts Panel
│   └── Alert items with severity levels
├── Budget vs Actual Bar Chart
│   └── Category-wise comparison
├── Budget Variance Chart
│   └── Remaining vs Overspending
├── Budget Utilization Progress Bars
│   └── Category utilization
├── Trend Analysis Composed Chart
│   └── Bars + Line chart
└── Summary Statistics
    └── Key metrics display
```

---

#### **BudgetCreationForm.tsx** (Budget Creation)
**Location:** `client/src/components/BudgetCreationForm.tsx`

**Purpose:** Allow users to create new budgets with line items

**Features:**
- Dialog-based form
- Budget name input
- Budget type selector (monthly, quarterly, annual, custom)
- Date range picker
- Dynamic line item management
- Real-time total calculation
- Form validation

**Form Structure:**
```
BudgetCreationForm
├── Budget Header
│   ├── Budget Name Input
│   ├── Budget Type Select
│   ├── Start Date Picker
│   └── End Date Picker
├── Budget Line Items
│   ├── Add Category Button
│   └── Line Item Rows (repeating)
│       ├── Expense Category Select
│       ├── Amount Input
│       ├── Description Input
│       └── Remove Button
├── Budget Summary Card
│   ├── Total Budget Allocation
│   └── Category Count
└── Action Buttons
    ├── Cancel
    └── Create Budget
```

**Expense Categories:**
- Animal Feed
- Labor Costs
- Equipment & Maintenance
- Utilities
- Fertilizer & Soil
- Pesticides & Herbicides
- Seeds & Seedlings
- Water & Irrigation
- Veterinary Services
- Transport & Logistics
- Storage & Processing
- Other Expenses

**tRPC Mutation:**
```typescript
trpc.budgetManagement.createBudget.useMutation({
  onSuccess: () => {
    toast.success("Budget created successfully");
    // Refresh data
  },
  onError: (error) => {
    toast.error(`Failed to create budget: ${error.message}`);
  }
});
```

---

#### **BudgetComparisonReports.tsx** (Comparison & Export)
**Location:** `client/src/components/BudgetComparisonReports.tsx`

**Purpose:** Compare budgets across periods and export reports

**Features:**
- Budget selection interface
- Year-over-year comparison
- Period-over-period comparison
- Variance analysis
- Trend identification
- CSV export
- PDF export
- Comparative charts

**Comparison Metrics:**
```
Period 1 vs Period 2:
├── Budgeted Amount
├── Actual Spent
├── Variance
├── Variance %
├── Utilization %
└── Trend (increase/decrease/stable)
```

**Export Formats:**
- **CSV:** Comma-separated values with headers
- **PDF:** Text-based report with formatting

**tRPC Queries:**
```typescript
trpc.budgetManagement.listBudgets.useQuery()
trpc.budgetManagement.compareBudgets.useMutation()
```

---

#### **BudgetForecasting.tsx** (Spending Forecasts)
**Location:** `client/src/components/BudgetForecasting.tsx`

**Purpose:** Display spending forecasts based on historical patterns

**Features:**
- 6-month forecast generation
- Confidence intervals
- Trend analysis
- Historical average calculation
- Forecast alerts
- Detailed forecast table

**Forecast Calculation:**
```
Forecast = Historical Average × (1 + (period × 0.05))
Confidence = max(0.6, 1 - (period × 0.1))
```

**Display Components:**
- Performance metrics cards
- 6-month trend chart
- Detailed forecast table
- Forecast insights panel

---

### Backend Layer

#### **financialManagement.ts** (Financial Operations Router)
**Location:** `server/routers/financialManagement.ts`

**Purpose:** Handle all financial management operations

**Procedures:**

1. **getSummary**
   - Input: `{ farmId: string, startDate: Date, endDate: Date }`
   - Output: Financial summary metrics
   - Database: `expenses`, `revenue` tables

2. **getExpenses**
   - Input: `{ farmId: string, startDate: Date, endDate: Date }`
   - Output: List of expenses
   - Database: `expenses` table

3. **getRevenue**
   - Input: `{ farmId: string, startDate: Date, endDate: Date }`
   - Output: List of revenue entries
   - Database: `revenue` table

4. **createExpense**
   - Input: Expense data
   - Output: Created expense
   - Database: Insert into `expenses`

5. **createRevenue**
   - Input: Revenue data
   - Output: Created revenue
   - Database: Insert into `revenue`

6. **getBudgetVsActualDetailed**
   - Input: `{ farmId: string, startDate: Date, endDate: Date }`
   - Output: Budget vs actual comparison
   - Database: `budgets`, `budgetLineItems`, `expenses`
   - Logic: Joins budget data with actual expenses

7. **getBudgetTrendAnalysis**
   - Input: `{ farmId: string, startDate: Date, endDate: Date, groupBy: 'week'|'month'|'quarter' }`
   - Output: Trend data
   - Database: `budgets`, `expenses`
   - Logic: Groups expenses by period

8. **getBudgetPerformanceMetrics**
   - Input: `{ farmId: string, startDate: Date, endDate: Date }`
   - Output: Performance metrics
   - Database: `budgets`, `expenses`
   - Logic: Calculates utilization, health status

9. **getBudgetAlerts**
   - Input: `{ farmId: string, thresholdPercent: number }`
   - Output: Budget alerts
   - Database: `budgets`, `budgetLineItems`, `expenses`
   - Logic: Identifies overspending categories

**Code Structure:**
```typescript
export const financialManagementRouter = router({
  getSummary: protectedProcedure.input(...).query(...),
  getExpenses: protectedProcedure.input(...).query(...),
  getRevenue: protectedProcedure.input(...).query(...),
  createExpense: protectedProcedure.input(...).mutation(...),
  createRevenue: protectedProcedure.input(...).mutation(...),
  getBudgetVsActualDetailed: protectedProcedure.input(...).query(...),
  getBudgetTrendAnalysis: protectedProcedure.input(...).query(...),
  getBudgetPerformanceMetrics: protectedProcedure.input(...).query(...),
  getBudgetAlerts: protectedProcedure.input(...).query(...),
});
```

---

#### **budgetManagement.ts** (Budget Operations Router)
**Location:** `server/routers/budgetManagement.ts`

**Purpose:** Handle budget creation, forecasting, and comparison

**Procedures:**

1. **createBudget**
   - Input: Budget data with line items
   - Output: Created budget ID and details
   - Database: Insert into `budgets` and `budgetLineItems`
   - Validation: Positive amounts, valid dates

2. **getBudgetForecasts**
   - Input: `{ budgetId: string, farmId: string, forecastPeriods: number }`
   - Output: Forecast data with confidence intervals
   - Database: `budgets`, `expenses` (historical)
   - Logic: Linear regression with trend

3. **compareBudgets**
   - Input: `{ budgetId1: string, budgetId2: string, farmId: string }`
   - Output: Comparison metrics
   - Database: `budgets`, `expenses`
   - Logic: Calculates variance, trend, utilization

4. **listBudgets**
   - Input: `{ farmId: string }`
   - Output: List of budgets
   - Database: `budgets` table

5. **getBudgetDetails**
   - Input: `{ budgetId: string }`
   - Output: Budget with line items
   - Database: `budgets`, `budgetLineItems`

6. **deleteBudget**
   - Input: `{ budgetId: string }`
   - Output: Success status
   - Database: Delete from `budgets` and `budgetLineItems`

**Code Structure:**
```typescript
export const budgetManagementRouter = router({
  createBudget: protectedProcedure.input(...).mutation(...),
  getBudgetForecasts: protectedProcedure.input(...).query(...),
  compareBudgets: protectedProcedure.input(...).query(...),
  listBudgets: protectedProcedure.input(...).query(...),
  getBudgetDetails: protectedProcedure.input(...).query(...),
  deleteBudget: protectedProcedure.input(...).mutation(...),
});
```

---

#### **routers.ts** (Main Router Export)
**Location:** `server/routers.ts`

**Purpose:** Combine all routers into main appRouter

**Structure:**
```typescript
export const appRouter = router({
  financialManagement: financialManagementRouter,
  budgetManagement: budgetManagementRouter,
  // ... other routers
});

export type AppRouter = typeof appRouter;
```

**Router Hierarchy:**
```
appRouter
├── financialManagement
│   ├── getSummary
│   ├── getExpenses
│   ├── getRevenue
│   ├── createExpense
│   ├── createRevenue
│   ├── getBudgetVsActualDetailed
│   ├── getBudgetTrendAnalysis
│   ├── getBudgetPerformanceMetrics
│   └── getBudgetAlerts
│
└── budgetManagement
    ├── createBudget
    ├── getBudgetForecasts
    ├── compareBudgets
    ├── listBudgets
    ├── getBudgetDetails
    └── deleteBudget
```

---

#### **db.ts** (Database Connection)
**Location:** `server/db.ts`

**Purpose:** Manage database connection and provide query helpers

**Key Functions:**
```typescript
export async function getDb() {
  // Returns drizzle database instance
  // Lazy loads connection
  // Handles connection errors
}

export async function upsertUser(user: InsertUser) {
  // Upserts user record
}

export async function getUserByOpenId(openId: string) {
  // Retrieves user by OpenID
}
```

**Connection Details:**
- **Driver:** MySQL2
- **ORM:** Drizzle ORM
- **Connection String:** `process.env.DATABASE_URL`
- **Error Handling:** Graceful fallback if DB unavailable

---

#### **_core/trpc.ts** (tRPC Setup)
**Location:** `server/_core/trpc.ts`

**Purpose:** Configure tRPC and define procedure builders

**Key Exports:**
```typescript
export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx });
});
```

---

#### **_core/context.ts** (Request Context)
**Location:** `server/_core/context.ts`

**Purpose:** Build context for each tRPC request

**Context Structure:**
```typescript
interface Context {
  user?: {
    id: string;
    openId: string;
    email?: string;
    role: 'admin' | 'user';
  };
  req?: IncomingMessage;
  res?: ServerResponse;
}
```

---

### Database Layer

#### **schema.ts** (Database Schema)
**Location:** `drizzle/schema.ts`

**Key Tables for Financial Management:**

1. **budgets**
   ```typescript
   export const budgets = mysqlTable('budgets', {
     id: varchar('id', { length: 255 }).primaryKey(),
     farmId: varchar('farm_id', { length: 255 }).notNull(),
     budgetName: varchar('budget_name', { length: 255 }).notNull(),
     budgetType: varchar('budget_type', { length: 50 }).notNull(),
     startDate: datetime('start_date').notNull(),
     endDate: datetime('end_date').notNull(),
     totalBudget: decimal('total_budget', { precision: 12, scale: 2 }).notNull(),
     currency: varchar('currency', { length: 10 }).default('GHS'),
     status: varchar('status', { length: 50 }).default('active'),
     createdAt: datetime('created_at').defaultNow(),
     updatedAt: datetime('updated_at').defaultNow(),
   });
   ```

2. **budgetLineItems**
   ```typescript
   export const budgetLineItems = mysqlTable('budget_line_items', {
     id: varchar('id', { length: 255 }).primaryKey(),
     budgetId: varchar('budget_id', { length: 255 }).notNull(),
     expenseType: varchar('expense_type', { length: 100 }).notNull(),
     budgetedAmount: decimal('budgeted_amount', { precision: 12, scale: 2 }).notNull(),
     description: text('description'),
     createdAt: datetime('created_at').defaultNow(),
   });
   ```

3. **expenses**
   ```typescript
   export const expenses = mysqlTable('expenses', {
     id: varchar('id', { length: 255 }).primaryKey(),
     farmId: varchar('farm_id', { length: 255 }).notNull(),
     expenseType: varchar('expense_type', { length: 100 }).notNull(),
     amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
     description: text('description'),
     date: datetime('date').notNull(),
     createdAt: datetime('created_at').defaultNow(),
   });
   ```

4. **revenue**
   ```typescript
   export const revenue = mysqlTable('revenue', {
     id: varchar('id', { length: 255 }).primaryKey(),
     farmId: varchar('farm_id', { length: 255 }).notNull(),
     revenueType: varchar('revenue_type', { length: 100 }).notNull(),
     amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
     description: text('description'),
     date: datetime('date').notNull(),
     createdAt: datetime('created_at').defaultNow(),
   });
   ```

5. **farms**
   ```typescript
   export const farms = mysqlTable('farms', {
     id: varchar('id', { length: 255 }).primaryKey(),
     userId: varchar('user_id', { length: 255 }).notNull(),
     farmName: varchar('farm_name', { length: 255 }).notNull(),
     location: varchar('location', { length: 255 }),
     createdAt: datetime('created_at').defaultNow(),
   });
   ```

**Relationships:**
```
budgets ──→ farms (via farmId)
budgets ──→ budgetLineItems (1:N via budgetId)
budgetLineItems ──→ expenses (via expenseType matching)
expenses ──→ farms (via farmId)
revenue ──→ farms (via farmId)
```

---

## Data Flow Examples

### Example 1: Create Budget
```
User clicks "Create Budget"
    ↓
BudgetCreationForm Dialog Opens
    ↓
User fills form:
  - Budget Name: "Q1 2026"
  - Type: "Quarterly"
  - Dates: Jan 1 - Mar 31
  - Line Items: Feed (15000), Labor (12000), etc.
    ↓
User clicks "Create Budget"
    ↓
trpc.budgetManagement.createBudget.useMutation()
    ↓
POST /api/trpc/budgetManagement.createBudget
    ↓
server/routers/budgetManagement.ts → createBudget procedure
    ↓
Validation:
  - Budget name not empty ✓
  - All amounts > 0 ✓
  - End date > start date ✓
    ↓
Database Operations:
  1. INSERT INTO budgets (id, farmId, budgetName, ...) VALUES (...)
  2. INSERT INTO budgetLineItems (budgetId, expenseType, budgetedAmount) VALUES (...)
  3. INSERT INTO budgetLineItems (budgetId, expenseType, budgetedAmount) VALUES (...)
  ... (repeat for each line item)
    ↓
Return: { id: "budget-123", budgetName: "Q1 2026", totalBudget: 50000 }
    ↓
Frontend receives response
    ↓
toast.success("Budget created successfully")
    ↓
Reset form and close dialog
    ↓
Refresh budget list
```

### Example 2: View Budget vs Actual
```
User navigates to Financial Management → Budget Tab
    ↓
FinancialManagement.tsx loads
    ↓
useQuery: trpc.financialManagement.getBudgetVsActualDetailed
    ↓
GET /api/trpc/financialManagement.getBudgetVsActualDetailed?input={farmId, dates}
    ↓
server/routers/financialManagement.ts → getBudgetVsActualDetailed procedure
    ↓
Database Query:
  SELECT b.*, bli.*, SUM(e.amount) as actual
  FROM budgets b
  JOIN budgetLineItems bli ON b.id = bli.budgetId
  LEFT JOIN expenses e ON e.expenseType = bli.expenseType
    AND e.farmId = b.farmId
    AND e.date BETWEEN b.startDate AND b.endDate
  WHERE b.farmId = ?
  GROUP BY bli.id
    ↓
Calculate metrics for each line item:
  - variance = budgeted - actual
  - variancePercent = (variance / budgeted) * 100
  - percentageUsed = (actual / budgeted) * 100
  - isOverBudget = actual > budgeted
    ↓
Return array of BudgetVsActualItem
    ↓
Frontend receives data
    ↓
BudgetVisualization.tsx renders:
  - Performance metrics cards
  - Budget vs Actual bar chart
  - Variance chart
  - Utilization progress bars
  - Alerts for overspending
```

### Example 3: Compare Two Budgets
```
User selects two budgets in BudgetComparisonReports
    ↓
trpc.budgetManagement.compareBudgets.useQuery()
    ↓
GET /api/trpc/budgetManagement.compareBudgets?input={budgetId1, budgetId2, farmId}
    ↓
server/routers/budgetManagement.ts → compareBudgets procedure
    ↓
Database Queries:
  1. SELECT * FROM budgets WHERE id = budgetId1
  2. SELECT * FROM budgets WHERE id = budgetId2
  3. SELECT SUM(amount) FROM expenses
     WHERE farmId = ? AND date BETWEEN budget1.startDate AND budget1.endDate
  4. SELECT SUM(amount) FROM expenses
     WHERE farmId = ? AND date BETWEEN budget2.startDate AND budget2.endDate
    ↓
Calculate comparison metrics:
  - variance = period2.actual - period1.actual
  - variancePercent = (variance / period1.actual) * 100
  - trend = variance > 0 ? "increase" : "decrease"
  - utilizationDiff = period2.utilization - period1.utilization
    ↓
Return ComparisonResult
    ↓
Frontend receives data
    ↓
BudgetComparisonReports.tsx renders:
  - Summary cards with variance
  - Comparative bar chart
  - Utilization line chart
  - Detailed comparison table
  - Export buttons (CSV, PDF)
```

---

## API Endpoint Summary

### Financial Management Endpoints

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `/api/trpc/financialManagement.getSummary` | GET | farmId, dates | Summary metrics |
| `/api/trpc/financialManagement.getExpenses` | GET | farmId, dates | Expense list |
| `/api/trpc/financialManagement.getRevenue` | GET | farmId, dates | Revenue list |
| `/api/trpc/financialManagement.createExpense` | POST | Expense data | Created expense |
| `/api/trpc/financialManagement.createRevenue` | POST | Revenue data | Created revenue |
| `/api/trpc/financialManagement.getBudgetVsActualDetailed` | GET | farmId, dates | Budget comparison |
| `/api/trpc/financialManagement.getBudgetTrendAnalysis` | GET | farmId, dates, groupBy | Trend data |
| `/api/trpc/financialManagement.getBudgetPerformanceMetrics` | GET | farmId, dates | Performance metrics |
| `/api/trpc/financialManagement.getBudgetAlerts` | GET | farmId, threshold | Alert list |

### Budget Management Endpoints

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `/api/trpc/budgetManagement.createBudget` | POST | Budget data | Created budget |
| `/api/trpc/budgetManagement.getBudgetForecasts` | GET | budgetId, farmId, periods | Forecast data |
| `/api/trpc/budgetManagement.compareBudgets` | GET | budgetId1, budgetId2, farmId | Comparison |
| `/api/trpc/budgetManagement.listBudgets` | GET | farmId | Budget list |
| `/api/trpc/budgetManagement.getBudgetDetails` | GET | budgetId | Budget with items |
| `/api/trpc/budgetManagement.deleteBudget` | POST | budgetId | Success status |

---

## Testing Structure

### Unit Tests

**Location:** `server/budgetManagement.test.ts`

**Test Categories:**
- Budget Creation (4 tests)
- Budget Forecasting (4 tests)
- Budget Comparison (5 tests)
- Budget Performance Metrics (4 tests)
- Budget Export (3 tests)
- Budget Validation (4 tests)

**Total:** 24 tests (all passing)

---

## Security & Authentication

All procedures use `protectedProcedure` which:
1. Validates user authentication
2. Injects `ctx.user` into context
3. Throws `UNAUTHORIZED` error if user not authenticated

Example:
```typescript
protectedProcedure
  .input(z.object({ farmId: z.string() }))
  .query(async ({ ctx, input }) => {
    // ctx.user is guaranteed to exist here
    // Only return data for user's farms
  })
```

---

## Performance Considerations

1. **Query Optimization:**
   - Use indexes on `farmId`, `budgetId`, `expenseType`
   - Batch queries where possible
   - Use aggregation at database level

2. **Caching:**
   - tRPC queries are cached by React Query
   - Invalidate cache on mutations
   - Use `staleTime` for frequently accessed data

3. **Pagination:**
   - Implement for large expense/revenue lists
   - Use cursor-based pagination for better performance

4. **Database Connections:**
   - Lazy load database connection
   - Reuse connection across requests
   - Handle connection errors gracefully

---

## Future Enhancements

1. **Budget Approval Workflow**
   - Multi-level approval process
   - Role-based access control
   - Notification system

2. **Budget Templates**
   - Save and reuse budget templates
   - Seasonal budget patterns
   - Template library

3. **Real-time Alerts**
   - Push notifications for budget overruns
   - Email alerts
   - SMS alerts

4. **Advanced Analytics**
   - Machine learning forecasts
   - Anomaly detection
   - Predictive budgeting

5. **Integration**
   - Export to accounting software
   - Bank feed integration
   - Multi-currency support

---

## Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] API endpoints tested
- [ ] Frontend components tested
- [ ] Unit tests passing (24/24)
- [ ] TypeScript compilation successful
- [ ] Build process verified
- [ ] Production deployment ready

---

## Support & Troubleshooting

### Common Issues

**Issue:** Budget creation fails
- Check: Farm ID is valid
- Check: All amounts are positive numbers
- Check: End date is after start date

**Issue:** Budget visualizations not showing
- Check: Budget data exists in database
- Check: Expenses are recorded for the budget period
- Check: Date ranges are correct

**Issue:** API returns 401 Unauthorized
- Check: User is authenticated
- Check: Session cookie is valid
- Check: User has access to the farm

---

**Last Updated:** February 12, 2026
**Version:** 1.0.0
