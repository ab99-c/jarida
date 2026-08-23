import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions, type SessionCookieOptions } from "./_core/cookies.js";
import { systemRouter } from "./_core/systemRouter.js";
import { publicProcedure, router } from "./_core/trpc.js";
import { getDb } from "./db.js";
import { articles, comments } from "../drizzle/schema.js";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { fetchAndStoreRSS, fetchLatestRSS } from "./services/rss.js";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      const response = ctx.res as unknown as {
        clearCookie: (name: string, options?: SessionCookieOptions & { maxAge?: number }) => void;
      };
      response.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  jarida: router({
    getDailyEdition: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) {
        const liveArticles = await fetchLatestRSS();
        return { date: new Date(), sections: {}, articles: liveArticles };
      }
      
      let list: typeof articles.$inferSelect[] = [];
      try {
        list = await Promise.race([
          db.select().from(articles).orderBy(desc(articles.publishedAt)).limit(40),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Database query timeout")), 2500)),
        ]);
      } catch (error) {
        console.error("[Jarida] Failed to load daily edition:", error);
        return {
          date: new Date(),
          editionTitle: "جريدة الأفق - الإصدار اليومي المتجدد",
          sections: {},
          articles: await fetchLatestRSS(),
        };
      }
      
      const newestTimestamp = list[0]?.publishedAt ? new Date(list[0].publishedAt).getTime() : 0;
      const isStale = !newestTimestamp || Date.now() - newestTimestamp > 24 * 60 * 60 * 1000;
      if (isStale) {
        const liveArticles = await fetchLatestRSS();
        if (liveArticles.length > 0) {
          return {
            date: new Date(),
            editionTitle: "جريدة الأفق - الإصدار اليومي المتجدد",
            sections: {},
            articles: liveArticles,
          };
        }
      }

      // Group articles by category (sections)
      const sections: Record<string, typeof list> = {};
      for (const article of list) {
        const cat = article.category || "عام";
        if (!sections[cat]) {
          sections[cat] = [];
        }
        sections[cat].push(article);
      }

      return {
        date: new Date(),
        editionTitle: "جريدة الأفق - الإصدار اليومي المتجدد",
        sections,
        articles: list,
      };
    }),
    getArticles: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const list = await db.select().from(articles).orderBy(desc(articles.publishedAt)).limit(30);
      return list;
    }),
    refreshFeed: publicProcedure.mutation(async () => {
      try {
        return await fetchAndStoreRSS();
      } catch (error) {
        console.error("[Jarida] RSS refresh failed:", error);
        return { success: false, count: 0 };
      }
    }),
    getComments: publicProcedure
      .input(z.object({ articleId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return await db
          .select()
          .from(comments)
          .where(eq(comments.articleId, input.articleId))
          .orderBy(desc(comments.createdAt));
      }),
    addComment: publicProcedure
      .input(
        z.object({
          articleId: z.number(),
          authorName: z.string().min(1, "اسم القارئ مطلوب").max(100),
          content: z.string().min(1, "محتوى التعليق مطلوب").max(1000),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.insert(comments).values({
          articleId: input.articleId,
          authorName: input.authorName,
          content: input.content,
        });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
