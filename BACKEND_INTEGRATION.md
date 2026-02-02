# FarmKonnect Backend Integration Guide

## Overview

This document provides a comprehensive guide to the complete backend implementation for FarmKonnect's farm operations system. All farm management modules now have full tRPC backend integration with type-safe API procedures, database persistence, and enterprise-grade error handling.

## Architecture

The backend is built using:
- **tRPC**: Type-safe RPC framework for end-to-end type safety
- **Drizzle ORM**: SQL database abstraction with TypeScript support
- **MySQL**: Persistent data storage
- **Node.js/Express**: Server runtime

## Implemented Modules

### 1. Financial Management (`financialRouter.ts`)

Comprehensive financial tracking for farms with expense and revenue management.

#### Procedures

**Expenses:**
- `financial.expenses.create()` - Record farm expense
- `financial.expenses.list()` - List expenses by farm/category/date range
- `financial.expenses.update()` - Update expense record
- `financial.expenses.delete()` - Delete expense
- `financial.expenses.summary()` - Get expense summary by category

**Revenue:**
- `financial.revenue.create()` - Record farm revenue
- `financial.revenue.list()` - List revenue by farm/source/date range
- `financial.revenue.update()` - Update revenue record
- `financial.revenue.delete()` - Delete revenue
- `financial.revenue.summary()` - Get revenue summary by source

**Analytics:**
- `financial.analytics.getSummary()` - Get profit/loss summary
- `financial.analytics.getMonthlyTrend()` - Get monthly financial trends
- `financial.analytics.getCategoryBreakdown()` - Expense/revenue by category
- `financial.analytics.getNetProfit()` - Calculate net profit

#### Database Tables
- `farmExpenses` - Expense records with category, amount, date, farm reference
- `farmRevenue` - Revenue records with source, amount, date, farm reference

#### Usage Example
```typescript
// Record an expense
const expense = await trpc.financial.expenses.create.mutate({
  farmId: 1,
  category: "seeds",
  amount: 5000,
  date: new Date(),
  description: "Maize seeds purchase"
});

// Get financial summary
const summary = await trpc.financial.analytics.getSummary.query({
  farmId: 1,
  startDate: new Date("2026-01-01"),
  endDate: new Date("2026-01-31")
});
```

---

### 2. Livestock Management (`livestockRouter.ts`)

Complete livestock tracking system for piggery, poultry, and other animals.

#### Procedures

**Animal Management:**
- `livestock.animals.create()` - Add animal to farm
- `livestock.animals.list()` - List animals by farm/status
- `livestock.animals.update()` - Update animal details
- `livestock.animals.delete()` - Remove animal record

**Health Records:**
- `livestock.healthRecords.create()` - Record health event (vaccination, treatment, illness, checkup)
- `livestock.healthRecords.list()` - Get health history by date range

**Breeding Records:**
- `livestock.breedingRecords.create()` - Record breeding event
- `livestock.breedingRecords.list()` - List breeding records by farm/outcome
- `livestock.breedingRecords.updateOutcome()` - Update breeding result

**Feeding Records:**
- `livestock.feedingRecords.create()` - Record feeding event
- `livestock.feedingRecords.list()` - Get feeding history
- `livestock.feedingRecords.summary()` - Summarize feed consumption

**Performance Metrics:**
- `livestock.performanceMetrics.create()` - Record weight/production metrics
- `livestock.performanceMetrics.list()` - Get recent metrics
- `livestock.performanceMetrics.trends()` - Analyze weight/production trends

#### Database Tables
- `animals` - Animal records with type, breed, status, gender
- `animalHealthRecords` - Health events with type, details, veterinarian
- `breedingRecords` - Breeding events with sire/dam, outcome
- `feedingRecords` - Feed consumption with type, quantity
- `performanceMetrics` - Weight, milk yield, egg count, other metrics

#### Usage Example
```typescript
// Add animal
const animal = await trpc.livestock.animals.create.mutate({
  farmId: 1,
  typeId: 2, // Piggery
  breed: "Large Black",
  birthDate: new Date("2025-01-15"),
  gender: "female"
});

// Record health check
const healthCheck = await trpc.livestock.healthRecords.create.mutate({
  animalId: animal.id,
  recordDate: new Date(),
  eventType: "checkup",
  details: "Regular health inspection - all good"
});

// Record feeding
const feeding = await trpc.livestock.feedingRecords.create.mutate({
  animalId: animal.id,
  feedDate: new Date(),
  feedType: "Pig pellets",
  quantityKg: 5.5,
  notes: "Morning feeding"
});
```

---

### 3. Workforce Management (`workforceRouter.ts`)

Complete workforce and payroll management system.

#### Procedures

**Worker Management:**
- `workforce.workers.create()` - Add worker to farm
- `workforce.workers.list()` - List workers by farm/status
- `workforce.workers.update()` - Update worker details
- `workforce.workers.delete()` - Remove worker
- `workforce.workers.getById()` - Get worker details

**Attendance:**
- `workforce.attendance.record()` - Record daily attendance
- `workforce.attendance.summary()` - Get attendance summary

**Payroll:**
- `workforce.payroll.calculateSalary()` - Calculate salary for period
- `workforce.payroll.processPayout()` - Record salary payment
- `workforce.payroll.getPayrollHistory()` - Get payment history

**Performance:**
- `workforce.performance.recordEvaluation()` - Record performance evaluation
- `workforce.performance.getEvaluations()` - Get evaluation history

**Team Management:**
- `workforce.teams.getTeamByFarm()` - Get team structure by role
- `workforce.teams.getTeamStats()` - Get team statistics

#### Database Tables
- `farmWorkers` - Worker records with role, salary, hire date, status

#### Usage Example
```typescript
// Add worker
const worker = await trpc.workforce.workers.create.mutate({
  farmId: 1,
  name: "John Mensah",
  role: "Farm Manager",
  hireDate: new Date("2025-01-01"),
  salary: 2000,
  salaryFrequency: "monthly",
  contact: "0241234567"
});

// Calculate salary
const salary = await trpc.workforce.payroll.calculateSalary.query({
  workerId: worker.id,
  month: 1,
  year: 2026,
  daysWorked: 22
});

// Process payout
const payout = await trpc.workforce.payroll.processPayout.mutate({
  workerId: worker.id,
  month: 1,
  year: 2026,
  amount: salary.netSalary,
  paymentMethod: "mobile_money"
});
```

---

### 4. Fish Farming (`fishFarmingRouter.ts`)

Comprehensive fish farming management system.

#### Procedures

**Pond Management:**
- `fishFarming.ponds.create()` - Create new pond
- `fishFarming.ponds.list()` - List ponds by farm/status
- `fishFarming.ponds.update()` - Update pond details
- `fishFarming.ponds.delete()` - Remove pond
- `fishFarming.ponds.getById()` - Get pond details

**Water Quality:**
- `fishFarming.waterQuality.recordMeasurement()` - Record water parameters
- `fishFarming.waterQuality.getLatestMeasurement()` - Get latest readings
- `fishFarming.waterQuality.getMeasurementHistory()` - Get historical data
- `fishFarming.waterQuality.getHealthStatus()` - Analyze water health

**Stocking & Harvest:**
- `fishFarming.stocking.recordStocking()` - Record fish stocking
- `fishFarming.stocking.recordHarvest()` - Record harvest event
- `fishFarming.stocking.getStockingHistory()` - Get stocking records
- `fishFarming.stocking.getHarvestHistory()` - Get harvest records

**Feeding:**
- `fishFarming.feeding.recordFeeding()` - Record feeding event
- `fishFarming.feeding.getFeedingSchedule()` - Get feeding summary
- `fishFarming.feeding.getFeedingCosts()` - Calculate feed costs

**Health:**
- `fishFarming.health.recordDiseaseObservation()` - Record disease event
- `fishFarming.health.getDiseaseHistory()` - Get disease records

**Analytics:**
- `fishFarming.analytics.getPondStats()` - Get pond statistics
- `fishFarming.analytics.getFarmFishingStats()` - Get farm-wide stats

#### Database Tables
- `fishPonds` - Pond records with size, depth, water source, stocking density

#### Usage Example
```typescript
// Create pond
const pond = await trpc.fishFarming.ponds.create.mutate({
  farmId: 1,
  pondName: "Main Tilapia Pond",
  sizeSquareMeters: 500,
  depthMeters: 1.5,
  waterSource: "borehole",
  stockingDensity: "5 fingerlings per m2"
});

// Record water quality
const waterQuality = await trpc.fishFarming.waterQuality.recordMeasurement.mutate({
  pondId: pond.id,
  measurementDate: new Date(),
  temperature: 28.5,
  pH: 7.2,
  dissolvedOxygen: 6.5,
  ammonia: 0.2
});

// Record stocking
const stocking = await trpc.fishFarming.stocking.recordStocking.mutate({
  pondId: pond.id,
  stockingDate: new Date(),
  fishSpecies: "Tilapia",
  quantity: 2500,
  source: "Local hatchery"
});

// Record feeding
const feeding = await trpc.fishFarming.feeding.recordFeeding.mutate({
  pondId: pond.id,
  feedingDate: new Date(),
  feedType: "Fish pellets",
  quantity: 25,
  unit: "kg"
});
```

---

### 5. Asset Management (`assetRouter.ts`)

Farm equipment and asset tracking system.

#### Procedures

**Asset Management:**
- `assets.assets.create()` - Add asset to farm
- `assets.assets.list()` - List assets by farm/type/status
- `assets.assets.update()` - Update asset details
- `assets.assets.delete()` - Remove asset
- `assets.assets.getById()` - Get asset details

**Maintenance:**
- `assets.maintenance.recordMaintenance()` - Record maintenance event
- `assets.maintenance.getMaintenanceHistory()` - Get maintenance records
- `assets.maintenance.getUpcomingMaintenance()` - Get scheduled maintenance
- `assets.maintenance.getMaintenanceCosts()` - Calculate maintenance costs

**Depreciation:**
- `assets.depreciation.calculateDepreciation()` - Calculate depreciation
- `assets.depreciation.getAssetValueHistory()` - Get value history

**Analytics:**
- `assets.analytics.getAssetInventory()` - Get asset inventory summary
- `assets.analytics.getAssetsByStatus()` - Get assets by status
- `assets.analytics.getHighValueAssets()` - Get high-value assets
- `assets.analytics.getDepreciationReport()` - Generate depreciation report

#### Database Tables
- `farmAssets` - Asset records with type, purchase value, current value, maintenance schedule

#### Usage Example
```typescript
// Add asset
const asset = await trpc.assets.assets.create.mutate({
  farmId: 1,
  name: "John Deere Tractor",
  assetType: "tractor",
  purchaseDate: new Date("2023-06-15"),
  purchaseValue: 50000,
  maintenanceSchedule: "quarterly"
});

// Record maintenance
const maintenance = await trpc.assets.maintenance.recordMaintenance.mutate({
  assetId: asset.id,
  maintenanceDate: new Date(),
  maintenanceType: "routine",
  description: "Oil change and filter replacement",
  cost: 500,
  nextMaintenanceDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
});

// Get depreciation
const depreciation = await trpc.assets.depreciation.calculateDepreciation.query({
  assetId: asset.id
});

// Get asset inventory
const inventory = await trpc.assets.analytics.getAssetInventory.query({
  farmId: 1
});
```

---

## Frontend Integration

All routers are accessible from the frontend using tRPC hooks:

```typescript
import { trpc } from "@/lib/trpc";

// In React components
function MyComponent() {
  // Query data
  const { data, isLoading } = trpc.financial.analytics.getSummary.useQuery({
    farmId: 1,
    startDate: new Date(),
    endDate: new Date()
  });

  // Mutate data
  const createExpense = trpc.financial.expenses.create.useMutation({
    onSuccess: () => {
      // Refresh data
      utils.financial.expenses.list.invalidate();
    }
  });

  return (
    <div>
      {isLoading ? "Loading..." : `Profit: ${data?.netProfit}`}
      <button onClick={() => createExpense.mutate({...})}>
        Add Expense
      </button>
    </div>
  );
}
```

## Database Schema Overview

### Financial Tables
- `farmExpenses` - Expense tracking with categories
- `farmRevenue` - Revenue tracking by source

### Livestock Tables
- `animals` - Animal records
- `animalHealthRecords` - Health events
- `breedingRecords` - Breeding events
- `feedingRecords` - Feed consumption
- `performanceMetrics` - Weight/production metrics

### Workforce Tables
- `farmWorkers` - Worker records with salary info

### Fish Farming Tables
- `fishPonds` - Pond specifications

### Asset Tables
- `farmAssets` - Equipment and asset records

## Error Handling

All procedures include proper error handling:

```typescript
try {
  const result = await trpc.livestock.animals.create.mutate({...});
} catch (error) {
  if (error.code === "INTERNAL_SERVER_ERROR") {
    // Database error
  } else if (error.code === "NOT_FOUND") {
    // Resource not found
  }
  // Handle error
}
```

## Type Safety

All inputs and outputs are fully typed:

```typescript
// Input types are inferred from Zod schemas
const expense: typeof trpc.financial.expenses.create._def.inputs[0] = {
  farmId: 1,
  category: "seeds",
  amount: 5000,
  date: new Date(),
  description: "Maize seeds"
};

// Output types are inferred from database schema
type Expense = typeof trpc.financial.expenses.list._def.meta.result.data[0];
```

## Testing

Each router includes comprehensive test coverage. Run tests with:

```bash
pnpm test
```

## Performance Considerations

1. **Queries**: All list queries support date range filtering for efficient data retrieval
2. **Pagination**: Large result sets should be paginated (implement limit/offset)
3. **Caching**: Use tRPC's built-in caching with `invalidate()` for mutations
4. **Indexes**: Database indexes are created on frequently queried fields (farmId, date, status)

## Future Enhancements

1. **Real-time Updates**: Implement WebSocket support for live data updates
2. **Batch Operations**: Add batch create/update procedures for bulk operations
3. **Advanced Analytics**: Add machine learning for predictive analytics
4. **Mobile Optimization**: Optimize queries for mobile app performance
5. **Offline Support**: Implement offline-first sync for mobile
6. **Audit Logging**: Track all changes for compliance and audit trails

## Support

For issues or questions about backend integration, refer to:
- tRPC Documentation: https://trpc.io
- Drizzle ORM: https://orm.drizzle.team
- Project Issues: Check GitHub issues for known problems
