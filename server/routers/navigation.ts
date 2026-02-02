import { protectedProcedure, publicProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { userFavorites, navigationHistory, searchIndexes } from '../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

export const navigationRouter = router({
  // Favorites management
  addFavorite: protectedProcedure
    .input(
      z.object({
        menuPath: z.string(),
        menuLabel: z.string(),
        menuIcon: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const existing = await db
        .select()
        .from(userFavorites)
        .where(
          and(
            eq(userFavorites.userId, ctx.user.id),
            eq(userFavorites.menuPath, input.menuPath)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return existing[0];
      }

      const maxPosition = await db
        .select()
        .from(userFavorites)
        .where(eq(userFavorites.userId, ctx.user.id));

      const position = maxPosition.length;

      const result = await db
        .insert(userFavorites)
        .values({
          userId: ctx.user.id,
          menuPath: input.menuPath,
          menuLabel: input.menuLabel,
          menuIcon: input.menuIcon,
          position,
          isPinned: false,
        });

      return result;
    }),

  removeFavorite: protectedProcedure
    .input(z.object({ menuPath: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db
        .delete(userFavorites)
        .where(
          and(
            eq(userFavorites.userId, ctx.user.id),
            eq(userFavorites.menuPath, input.menuPath)
          )
        );

      return { success: true };
    }),

  pinFavorite: protectedProcedure
    .input(z.object({ menuPath: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db
        .update(userFavorites)
        .set({ isPinned: true })
        .where(
          and(
            eq(userFavorites.userId, ctx.user.id),
            eq(userFavorites.menuPath, input.menuPath)
          )
        );

      return { success: true };
    }),

  unpinFavorite: protectedProcedure
    .input(z.object({ menuPath: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db
        .update(userFavorites)
        .set({ isPinned: false })
        .where(
          and(
            eq(userFavorites.userId, ctx.user.id),
            eq(userFavorites.menuPath, input.menuPath)
          )
        );

      return { success: true };
    }),

  getFavorites: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    return db
      .select()
      .from(userFavorites)
      .where(eq(userFavorites.userId, ctx.user.id))
      .orderBy(userFavorites.position);
  }),

  getPinnedFavorites: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    return db
      .select()
      .from(userFavorites)
      .where(
        and(
          eq(userFavorites.userId, ctx.user.id),
          eq(userFavorites.isPinned, true)
        )
      )
      .orderBy(userFavorites.position);
  }),

  // Navigation history
  recordNavigation: protectedProcedure
    .input(
      z.object({
        path: z.string(),
        label: z.string(),
        breadcrumbTrail: z.string(),
        sessionId: z.string().optional(),
        referrerPath: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db.insert(navigationHistory).values({
        userId: ctx.user.id,
        path: input.path,
        label: input.label,
        breadcrumbTrail: input.breadcrumbTrail,
        sessionId: input.sessionId,
        referrerPath: input.referrerPath,
      });

      return { success: true };
    }),

  getNavigationHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      return db
        .select()
        .from(navigationHistory)
        .where(eq(navigationHistory.userId, ctx.user.id))
        .orderBy(desc(navigationHistory.visitedAt))
        .limit(input.limit);
    }),

  getRecentPaths: protectedProcedure
    .input(z.object({ limit: z.number().default(5) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const history = await db
        .select({ path: navigationHistory.path, label: navigationHistory.label })
        .from(navigationHistory)
        .where(eq(navigationHistory.userId, ctx.user.id))
        .orderBy(desc(navigationHistory.visitedAt))
        .limit(input.limit);

      return history.filter(
        (item: any, index: number, self: any[]) =>
          self.findIndex((h: any) => h.path === item.path) === index
      );
    }),

  // Search
  searchPages: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const searchQuery = input.query.toLowerCase();
      const allIndexes = await db.select().from(searchIndexes);

      return allIndexes
        .filter((index: any) => {
          const label = index.label.toLowerCase();
          const category = index.category.toLowerCase();
          const keywords = JSON.parse(index.keywords || '[]');

          return (
            label.includes(searchQuery) ||
            category.includes(searchQuery) ||
            keywords.some((k: string) => k.includes(searchQuery))
          );
        })
        .sort((a: any, b: any) => {
          const aScore = parseFloat(a.searchScore || '1');
          const bScore = parseFloat(b.searchScore || '1');
          return bScore - aScore;
        })
        .slice(0, 10);
    }),
});
