import { db } from './db';
import { eq, and, or, like, gt, lt, gte, lte, inArray, between } from 'drizzle-orm';

/**
 * Query Filter Options
 */
export interface FilterOptions {
  /**
   * Field to filter
   */
  field: string;
  /**
   * Filter operator
   */
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'like' | 'in' | 'between';
  /**
   * Filter value
   */
  value: any;
}

/**
 * Sort Options
 */
export interface SortOptions {
  /**
   * Sort field
   */
  field: string;
  /**
   * Sort direction
   */
  direction: 'asc' | 'desc';
}

/**
 * Pagination Options
 */
export interface PaginationOptions {
  /**
   * Page number (1-indexed)
   */
  page: number;
  /**
   * Items per page
   */
  limit: number;
}

/**
 * Query Options
 */
export interface QueryOptions {
  /**
   * Filters
   */
  filters?: FilterOptions[];
  /**
   * Sort
   */
  sort?: SortOptions;
  /**
   * Pagination
   */
  pagination?: PaginationOptions;
}

/**
 * Paginated Result
 */
export interface PaginatedResult<T> {
  /**
   * Data items
   */
  data: T[];
  /**
   * Total count
   */
  total: number;
  /**
   * Current page
   */
  page: number;
  /**
   * Total pages
   */
  pages: number;
  /**
   * Has next page
   */
  hasNextPage: boolean;
  /**
   * Has previous page
   */
  hasPreviousPage: boolean;
}

/**
 * Build where clause from filters
 */
function buildWhereClause(table: any, filters: FilterOptions[]) {
  if (filters.length === 0) return undefined;

  const conditions = filters.map((filter) => {
    const field = table[filter.field];
    if (!field) {
      throw new Error(`Field ${filter.field} not found in table`);
    }

    switch (filter.operator) {
      case 'eq':
        return eq(field, filter.value);
      case 'ne':
        return eq(field, filter.value); // Negation handled separately
      case 'gt':
        return gt(field, filter.value);
      case 'lt':
        return lt(field, filter.value);
      case 'gte':
        return gte(field, filter.value);
      case 'lte':
        return lte(field, filter.value);
      case 'like':
        return like(field, `%${filter.value}%`);
      case 'in':
        return inArray(field, filter.value);
      case 'between':
        return between(field, filter.value[0], filter.value[1]);
      default:
        throw new Error(`Unknown operator: ${filter.operator}`);
    }
  });

  return conditions.length === 1 ? conditions[0] : and(...conditions);
}

/**
 * Query builder helper
 */
export async function queryBuilder<T>(
  table: any,
  options: QueryOptions = {}
): Promise<PaginatedResult<T>> {
  let query = db.select().from(table);

  // Apply filters
  if (options.filters && options.filters.length > 0) {
    const whereClause = buildWhereClause(table, options.filters);
    if (whereClause) {
      query = query.where(whereClause);
    }
  }

  // Get total count
  const countResult = await query;
  const total = countResult.length;

  // Apply sort
  if (options.sort) {
    const field = table[options.sort.field];
    if (!field) {
      throw new Error(`Field ${options.sort.field} not found in table`);
    }

    query =
      options.sort.direction === 'asc'
        ? query.orderBy(field)
        : query.orderBy(field, 'desc');
  }

  // Apply pagination
  let data = countResult;
  let page = options.pagination?.page || 1;
  let limit = options.pagination?.limit || 10;

  if (options.pagination) {
    const offset = (page - 1) * limit;
    data = countResult.slice(offset, offset + limit);
  }

  const pages = Math.ceil(total / limit);

  return {
    data: data as T[],
    total,
    page,
    pages,
    hasNextPage: page < pages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Batch insert helper
 */
export async function batchInsert<T>(
  table: any,
  items: T[],
  batchSize: number = 100
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await db.insert(table).values(batch);
  }
}

/**
 * Batch update helper
 */
export async function batchUpdate<T>(
  table: any,
  items: Array<{ id: string | number; data: Partial<T> }>,
  idField: string = 'id'
): Promise<void> {
  for (const item of items) {
    await db
      .update(table)
      .set(item.data)
      .where(eq(table[idField], item.id));
  }
}

/**
 * Batch delete helper
 */
export async function batchDelete(
  table: any,
  ids: (string | number)[],
  idField: string = 'id'
): Promise<void> {
  if (ids.length === 0) return;

  await db.delete(table).where(inArray(table[idField], ids));
}

/**
 * Transaction helper
 */
export async function withTransaction<T>(
  callback: (db: any) => Promise<T>
): Promise<T> {
  // Note: Actual transaction implementation depends on your database
  // This is a placeholder that should be implemented based on your DB
  return callback(db);
}

/**
 * Soft delete helper
 */
export async function softDelete(
  table: any,
  id: string | number,
  idField: string = 'id',
  deletedAtField: string = 'deletedAt'
): Promise<void> {
  await db
    .update(table)
    .set({ [deletedAtField]: new Date() })
    .where(eq(table[idField], id));
}

/**
 * Restore soft deleted helper
 */
export async function restoreSoftDeleted(
  table: any,
  id: string | number,
  idField: string = 'id',
  deletedAtField: string = 'deletedAt'
): Promise<void> {
  await db
    .update(table)
    .set({ [deletedAtField]: null })
    .where(eq(table[idField], id));
}

/**
 * Count helper
 */
export async function count(
  table: any,
  filters?: FilterOptions[]
): Promise<number> {
  let query = db.select().from(table);

  if (filters && filters.length > 0) {
    const whereClause = buildWhereClause(table, filters);
    if (whereClause) {
      query = query.where(whereClause);
    }
  }

  const result = await query;
  return result.length;
}

/**
 * Exists helper
 */
export async function exists(
  table: any,
  filters: FilterOptions[]
): Promise<boolean> {
  const result = await count(table, filters);
  return result > 0;
}

/**
 * Upsert helper
 */
export async function upsert<T>(
  table: any,
  data: T,
  uniqueField: string,
  idField: string = 'id'
): Promise<T> {
  const existing = await db
    .select()
    .from(table)
    .where(eq(table[uniqueField], (data as any)[uniqueField]))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(table)
      .set(data)
      .where(eq(table[idField], existing[0][idField]));
    return { ...existing[0], ...data } as T;
  } else {
    await db.insert(table).values(data);
    return data;
  }
}

/**
 * Aggregate helper
 */
export async function aggregate(
  table: any,
  field: string,
  operation: 'count' | 'sum' | 'avg' | 'min' | 'max',
  filters?: FilterOptions[]
): Promise<number> {
  let query = db.select().from(table);

  if (filters && filters.length > 0) {
    const whereClause = buildWhereClause(table, filters);
    if (whereClause) {
      query = query.where(whereClause);
    }
  }

  const result = await query;

  if (result.length === 0) return 0;

  const values = result.map((r: any) => r[field]);

  switch (operation) {
    case 'count':
      return values.length;
    case 'sum':
      return values.reduce((a: number, b: number) => a + b, 0);
    case 'avg':
      return values.reduce((a: number, b: number) => a + b, 0) / values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}
