import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { expenses, revenue } from '../../drizzle/schema';
import { TRPCError } from '@trpc/server';

// Validation schemas
const addExpenseSchema = z.object({
  farmId: z.number().positive('Farm ID must be positive'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  amount: z.number().positive('Amount must be greater than 0'),
  date: z.date().or(z.string().transform(str => new Date(str))),
  quantity: z.number().optional(),
  notes: z.string().optional(),
});

const addRevenueSchema = z.object({
  farmId: z.number().positive('Farm ID must be positive'),
  type: z.string().min(1, 'Revenue type is required'),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  amount: z.number().positive('Amount must be greater than 0'),
  date: z.date().or(z.string().transform(str => new Date(str))),
  quantity: z.number().optional(),
  buyer: z.string().optional(),
  invoiceNumber: z.string().optional(),
  paymentStatus: z.enum(['pending', 'paid', 'partial']).default('pending'),
});

export const expenseRevenueEntryRouter = router({
  // Add expense
  addExpense: protectedProcedure
    .input(addExpenseSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();

        // Validate date is not in future
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const inputDate = new Date(input.date);
        inputDate.setHours(0, 0, 0, 0);

        if (inputDate > today) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Expense date cannot be in the future',
          });
        }

        // Insert expense
        const result = await db
          .insert(expenses)
          .values({
            farmId: input.farmId,
            category: input.category,
            description: input.description,
            amount: input.amount,
            date: input.date,
            quantity: input.quantity || null,
            notes: input.notes || null,
          })
          .returning();

        return {
          success: true,
          expense: result[0],
          message: `Expense of GHS ${input.amount} added successfully`,
        };
      } catch (error: any) {
        if (error.code === 'BAD_REQUEST') {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to add expense: ${error.message}`,
        });
      }
    }),

  // Add revenue
  addRevenue: protectedProcedure
    .input(addRevenueSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();

        // Validate date is not in future
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const inputDate = new Date(input.date);
        inputDate.setHours(0, 0, 0, 0);

        if (inputDate > today) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Revenue date cannot be in the future',
          });
        }

        // Insert revenue
        const result = await db
          .insert(revenue)
          .values({
            farmId: input.farmId,
            revenueType: input.type,
            description: input.description,
            amount: input.amount,
            revenueDate: input.date,
            quantity: input.quantity || null,
            buyer: input.buyer || null,
            invoiceNumber: input.invoiceNumber || null,
            paymentStatus: input.paymentStatus,
          })
          .returning();

        return {
          success: true,
          revenue: result[0],
          message: `Revenue of GHS ${input.amount} added successfully`,
        };
      } catch (error: any) {
        if (error.code === 'BAD_REQUEST') {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to add revenue: ${error.message}`,
        });
      }
    }),

  // Get expense categories
  getExpenseCategories: protectedProcedure.query(async () => {
    return [
      'Feed',
      'Medication',
      'Labor',
      'Equipment',
      'Utilities',
      'Transport',
      'Maintenance',
      'Other',
    ];
  }),

  // Get revenue types
  getRevenueTypes: protectedProcedure.query(async () => {
    return [
      'Animal Sales',
      'Milk Production',
      'Crop Sales',
      'Egg Production',
      'Wool/Fiber',
      'Services',
      'Other',
    ];
  }),
});
