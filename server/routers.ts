import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { articles } from "../drizzle/schema";
import { desc } from "drizzle-orm";
import { fetchAndStoreRSS } from "./services/rss";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  jarida: router({
    getDailyEdition: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { date: new Date(), sections: {}, articles: [] };
      
      const list = await db.select().from(articles).orderBy(desc(articles.publishedAt)).limit(40);
      
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
      const result = await fetchAndStoreRSS();
      return result;
    }),
  }),
});

export type AppRouter = typeof appRouter;
