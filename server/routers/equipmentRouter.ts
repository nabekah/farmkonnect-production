import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';

/**
 * Equipment Management Router
 * Handles equipment inventory, maintenance, fuel tracking, and depreciation
 */

export const equipmentRouter = router({
  // Equipment Inventory Operations
  createEquipment: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        equipmentName: z.string(),
        equipmentType: z.string(),
        manufacturer: z.string().optional(),
        model: z.string().optional(),
        serialNumber: z.string().optional(),
        purchaseDate: z.date(),
        purchasePrice: z.number(),
        location: z.string().optional(),
        specifications: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return {
        id: Math.floor(Math.random() * 10000),
        ...input,
        status: 'active',
        currentValue: input.purchasePrice,
        createdAt: new Date(),
      };
    }),

  getEquipmentList: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      return [
        {
          id: 1,
          farmId: input.farmId,
          equipmentName: 'John Deere Tractor',
          equipmentType: 'Tractor',
          manufacturer: 'John Deere',
          model: '5075E',
          serialNumber: 'JD-2020-001',
          purchaseDate: new Date('2020-05-15'),
          purchasePrice: 45000,
          currentValue: 32500,
          status: 'active',
          location: 'Farm A - Equipment Shed',
          specifications: { horsepower: 75, fuelCapacity: 90 },
        },
        {
          id: 2,
          farmId: input.farmId,
          equipmentName: 'Kubota Harvester',
          equipmentType: 'Harvester',
          manufacturer: 'Kubota',
          model: 'DC95',
          serialNumber: 'KB-2019-045',
          purchaseDate: new Date('2019-08-20'),
          purchasePrice: 65000,
          currentValue: 42000,
          status: 'active',
          location: 'Farm B - Equipment Shed',
          specifications: { capacity: 5000, width: 2.5 },
        },
      ];
    }),

  getEquipmentById: protectedProcedure
    .input(z.object({ equipmentId: z.number() }))
    .query(async ({ input }) => {
      return {
        id: input.equipmentId,
        equipmentName: 'John Deere Tractor',
        equipmentType: 'Tractor',
        manufacturer: 'John Deere',
        model: '5075E',
        serialNumber: 'JD-2020-001',
        purchaseDate: new Date('2020-05-15'),
        purchasePrice: 45000,
        currentValue: 32500,
        status: 'active',
        location: 'Farm A - Equipment Shed',
        specifications: { horsepower: 75, fuelCapacity: 90 },
      };
    }),

  updateEquipment: protectedProcedure
    .input(
      z.object({
        equipmentId: z.number(),
        equipmentName: z.string().optional(),
        status: z.string().optional(),
        location: z.string().optional(),
        currentValue: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return { success: true, equipmentId: input.equipmentId };
    }),

  deleteEquipment: protectedProcedure
    .input(z.object({ equipmentId: z.number() }))
    .mutation(async ({ input }) => {
      return { success: true, equipmentId: input.equipmentId };
    }),

  // Maintenance Operations
  scheduleMaintenancegetEquipmentStats: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      return {
        totalEquipment: 12,
        activeEquipment: 10,
        maintenanceNeeded: 3,
        totalValue: 385000,
        totalDepreciation: 125000,
        bookValue: 260000,
        maintenanceCostYTD: 8500,
        fuelCostYTD: 12300,
      };
    }),

  getMaintenanceSchedule: protectedProcedure
    .input(z.object({ equipmentId: z.number() }))
    .query(async ({ input }) => {
      return [
        {
          id: 1,
          equipmentId: input.equipmentId,
          maintenanceType: 'Oil Change',
          scheduleFrequency: 'Every 500 hours',
          lastMaintenanceDate: new Date('2026-01-15'),
          nextMaintenanceDate: new Date('2026-03-15'),
          estimatedCost: 150,
          priority: 'high',
          notes: 'Use synthetic oil',
        },
        {
          id: 2,
          equipmentId: input.equipmentId,
          maintenanceType: 'Filter Replacement',
          scheduleFrequency: 'Every 250 hours',
          lastMaintenanceDate: new Date('2026-01-20'),
          nextMaintenanceDate: new Date('2026-02-20'),
          estimatedCost: 75,
          priority: 'medium',
          notes: 'Air and fuel filters',
        },
      ];
    }),

  recordMaintenance: protectedProcedure
    .input(
      z.object({
        equipmentId: z.number(),
        maintenanceDate: z.date(),
        maintenanceType: z.string(),
        description: z.string(),
        cost: z.number(),
        serviceProviderId: z.number().optional(),
        technician: z.string().optional(),
        hoursSpent: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return {
        id: Math.floor(Math.random() * 10000),
        ...input,
        status: 'completed',
      };
    }),

  getMaintenanceHistory: protectedProcedure
    .input(z.object({ equipmentId: z.number() }))
    .query(async ({ input }) => {
      return [
        {
          id: 1,
          equipmentId: input.equipmentId,
          maintenanceDate: new Date('2026-01-15'),
          maintenanceType: 'Oil Change',
          description: 'Regular oil and filter change',
          cost: 150,
          technician: 'John Mensah',
          hoursSpent: 1.5,
          status: 'completed',
        },
        {
          id: 2,
          equipmentId: input.equipmentId,
          maintenanceDate: new Date('2025-12-20'),
          maintenanceType: 'Tire Replacement',
          description: 'Replaced front left tire',
          cost: 450,
          technician: 'Kwame Asante',
          hoursSpent: 3,
          status: 'completed',
        },
      ];
    }),

  // Fuel Tracking
  recordFuelConsumption: protectedProcedure
    .input(
      z.object({
        equipmentId: z.number(),
        fuelDate: z.date(),
        fuelType: z.string(),
        quantityLiters: z.number(),
        costPerLiter: z.number(),
        operatingHours: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const totalCost = input.quantityLiters * input.costPerLiter;
      const fuelEfficiency = input.operatingHours
        ? input.quantityLiters / input.operatingHours
        : undefined;

      return {
        id: Math.floor(Math.random() * 10000),
        ...input,
        totalCost,
        fuelEfficiency,
      };
    }),

  getFuelConsumption: protectedProcedure
    .input(z.object({ equipmentId: z.number(), months: z.number().default(12) }))
    .query(async ({ input }) => {
      return [
        {
          id: 1,
          equipmentId: input.equipmentId,
          fuelDate: new Date('2026-02-01'),
          fuelType: 'Diesel',
          quantityLiters: 85,
          costPerLiter: 1.45,
          totalCost: 123.25,
          operatingHours: 42,
          fuelEfficiency: 2.02,
        },
        {
          id: 2,
          equipmentId: input.equipmentId,
          fuelDate: new Date('2026-01-28'),
          fuelType: 'Diesel',
          quantityLiters: 92,
          costPerLiter: 1.42,
          totalCost: 130.64,
          operatingHours: 45,
          fuelEfficiency: 2.04,
        },
      ];
    }),

  getFuelAnalytics: protectedProcedure
    .input(z.object({ equipmentId: z.number() }))
    .query(async ({ input }) => {
      return {
        equipmentId: input.equipmentId,
        totalFuelUsed: 1250,
        totalFuelCost: 1812.5,
        averageFuelEfficiency: 2.15,
        fuelTrend: 'increasing',
        monthlyAverage: 104.17,
        costPerHour: 12.5,
      };
    }),

  // Cost Allocation
  allocateEquipmentCost: protectedProcedure
    .input(
      z.object({
        equipmentId: z.number(),
        allocationDate: z.date(),
        cropId: z.number().optional(),
        animalId: z.number().optional(),
        allocationPercentage: z.number(),
        allocationReason: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return {
        id: Math.floor(Math.random() * 10000),
        ...input,
        allocatedCost: 0,
      };
    }),

  getCostAllocation: protectedProcedure
    .input(z.object({ equipmentId: z.number() }))
    .query(async ({ input }) => {
      return [
        {
          id: 1,
          equipmentId: input.equipmentId,
          allocationDate: new Date('2026-02-01'),
          cropId: 1,
          allocationPercentage: 60,
          allocatedCost: 2400,
          allocationReason: 'Maize cultivation',
        },
        {
          id: 2,
          equipmentId: input.equipmentId,
          allocationDate: new Date('2026-02-01'),
          animalId: 2,
          allocationPercentage: 40,
          allocatedCost: 1600,
          allocationReason: 'Livestock feed preparation',
        },
      ];
    }),

  // Depreciation Tracking
  calculateDepreciation: protectedProcedure
    .input(
      z.object({
        equipmentId: z.number(),
        purchasePrice: z.number(),
        usefulLifeYears: z.number(),
        salvageValue: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const salvage = input.salvageValue || 0;
      const depreciableAmount = input.purchasePrice - salvage;
      const annualDepreciation = depreciableAmount / input.usefulLifeYears;

      return {
        equipmentId: input.equipmentId,
        purchasePrice: input.purchasePrice,
        salvageValue: salvage,
        usefulLifeYears: input.usefulLifeYears,
        annualDepreciation,
        depreciationMethod: 'straight-line',
      };
    }),

  getDepreciationSchedule: protectedProcedure
    .input(z.object({ equipmentId: z.number() }))
    .query(async ({ input }) => {
      return {
        equipmentId: input.equipmentId,
        purchasePrice: 45000,
        usefulLifeYears: 10,
        annualDepreciation: 4050,
        accumulatedDepreciation: 12150,
        bookValue: 32850,
        yearsInUse: 3,
        depreciationSchedule: [
          { year: 1, depreciation: 4050, accumulatedDepreciation: 4050, bookValue: 40950 },
          { year: 2, depreciation: 4050, accumulatedDepreciation: 8100, bookValue: 36900 },
          { year: 3, depreciation: 4050, accumulatedDepreciation: 12150, bookValue: 32850 },
        ],
      };
    }),

  // Service Providers
  createServiceProvider: protectedProcedure
    .input(
      z.object({
        farmId: z.number(),
        providerName: z.string(),
        specialization: z.string(),
        contactPerson: z.string(),
        phone: z.string(),
        email: z.string(),
        address: z.string(),
        city: z.string(),
        region: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return {
        id: Math.floor(Math.random() * 10000),
        ...input,
        rating: 4.5,
        createdAt: new Date(),
      };
    }),

  getServiceProviders: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      return [
        {
          id: 1,
          farmId: input.farmId,
          providerName: 'Accra Farm Equipment Services',
          specialization: 'Tractor Maintenance',
          contactPerson: 'Kwesi Osei',
          phone: '+233 24 123 4567',
          email: 'kwesi@accrafarm.com',
          address: '123 Farm Lane',
          city: 'Accra',
          region: 'Greater Accra',
          rating: 4.8,
        },
        {
          id: 2,
          farmId: input.farmId,
          providerName: 'Kumasi Equipment Repair',
          specialization: 'Harvester Repair',
          contactPerson: 'Ama Mensah',
          phone: '+233 26 987 6543',
          email: 'ama@kumasirepair.com',
          address: '456 Equipment Road',
          city: 'Kumasi',
          region: 'Ashanti',
          rating: 4.6,
        },
      ];
    }),

  // Maintenance Alerts
  createMaintenanceAlert: protectedProcedure
    .input(
      z.object({
        equipmentId: z.number(),
        alertType: z.string(),
        alertMessage: z.string(),
        severity: z.string(),
        dueDate: z.date(),
      })
    )
    .mutation(async ({ input }) => {
      return {
        id: Math.floor(Math.random() * 10000),
        ...input,
        status: 'active',
        createdAt: new Date(),
      };
    }),

  getMaintenanceAlerts: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      return [
        {
          id: 1,
          equipmentId: 1,
          equipmentName: 'John Deere Tractor',
          alertType: 'Scheduled Maintenance',
          alertMessage: 'Oil change due in 3 days',
          severity: 'high',
          dueDate: new Date('2026-02-12'),
          status: 'active',
        },
        {
          id: 2,
          equipmentId: 2,
          equipmentName: 'Kubota Harvester',
          alertType: 'Inspection Required',
          alertMessage: 'Annual inspection overdue by 5 days',
          severity: 'critical',
          dueDate: new Date('2026-02-04'),
          status: 'active',
        },
      ];
    }),

  acknowledgeAlert: protectedProcedure
    .input(z.object({ alertId: z.number() }))
    .mutation(async ({ input }) => {
      return { success: true, alertId: input.alertId };
    }),

  // Equipment Efficiency Reporting
  getEquipmentEfficiencyReport: protectedProcedure
    .input(z.object({ equipmentId: z.number() }))
    .query(async ({ input }) => {
      return {
        equipmentId: input.equipmentId,
        equipmentName: 'John Deere Tractor',
        utilizationRate: 0.72,
        maintenanceScore: 0.85,
        fuelEfficiency: 2.15,
        costPerHour: 12.5,
        reliabilityScore: 0.9,
        overallEfficiency: 0.82,
        recommendations: [
          'Schedule preventive maintenance to improve reliability',
          'Monitor fuel consumption for optimization',
          'Consider equipment upgrade in 2 years',
        ],
      };
    }),

  getFarmEquipmentReport: protectedProcedure
    .input(z.object({ farmId: z.number() }))
    .query(async ({ input }) => {
      return {
        farmId: input.farmId,
        totalEquipment: 12,
        totalValue: 385000,
        bookValue: 260000,
        totalDepreciation: 125000,
        maintenanceCostYTD: 8500,
        fuelCostYTD: 12300,
        averageUtilization: 0.68,
        equipmentByType: {
          Tractors: 3,
          Harvesters: 2,
          Cultivators: 4,
          Other: 3,
        },
        maintenanceAlerts: 5,
        equipmentNeedingService: 3,
      };
    }),
});
