import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions, type SessionCookieOptions } from "./_core/cookies.js";
import { systemRouter } from "./_core/systemRouter.js";
import { publicProcedure, router } from "./_core/trpc.js";
import { getDb } from "./db.js";
import { articles, comments } from "../drizzle/schema.js";
import { desc, eq, gte } from "drizzle-orm";
import { getArchiveStartDate } from "../shared/date.js";
import { z } from "zod";
import { fetchAndStoreRSS, fetchLatestRSS } from "./services/rss.js";
import { moderateComment } from "./services/gemini.js";

// Rate limiter for comments: ip -> timestamps
const commentRateLimits = new Map<string, number[]>();

function checkRateLimit(ip: string, limit = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const timestamps = (commentRateLimits.get(ip) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= limit) return false;
  timestamps.push(now);
  commentRateLimits.set(ip, timestamps);
  return true;
}

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
      const archiveStartDate = getArchiveStartDate();
      let list: typeof articles.$inferSelect[] = [];
      if (db) {
        try {
          list = await Promise.race([
            db
              .select()
              .from(articles)
              .where(gte(articles.publishedAt, archiveStartDate))
              .orderBy(desc(articles.publishedAt))
              .limit(5000),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Database query timeout")), 2500)),
          ]);
        } catch (error) {
          console.error("[Jarida] Failed to load daily edition:", error);
        }
      }

      if (list.length === 0) {
        list = (await fetchLatestRSS()) as any[];
      }
      
      const newestTimestamp = list[0]?.publishedAt ? new Date(list[0].publishedAt).getTime() : 0;
      const isStale = !newestTimestamp || Date.now() - newestTimestamp > 12 * 60 * 60 * 1000 || list.length < 20;
      let combinedArticles: Array<any> = [...list];
      if (isStale) {
        const liveArticles = await fetchLatestRSS();
        if (liveArticles.length > 0) {
          const seenUrls = new Set(list.map((a) => a.url));
          const seenTitles = new Set(list.map((a) => a.title));
          const merged = [
            ...liveArticles.filter((a) => !seenUrls.has(a.url) && !seenTitles.has(a.title)),
            ...list,
          ];
          combinedArticles = merged.sort(
            (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
          );
        }
      }

      // Group articles by category (sections)
      const sections: Record<string, typeof combinedArticles> = {};
      for (const article of combinedArticles) {
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
        articles: combinedArticles,
      };
    }),

    getAudioBriefing: publicProcedure.query(async () => {
      return {
        title: "الموجز الإخباري اليومي لجريدة الأفق",
        date: new Date(),
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
          turnstileToken: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const clientIp =
          (ctx.req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
          ctx.req.socket.remoteAddress ||
          "unknown";

        if (!checkRateLimit(clientIp, 5, 60000)) {
          throw new Error("تجاوزت الحد المسموح من التعليقات. يُرجى الانتظار دقيقة قبل المحاولة مجدداً.");
        }

        // Verify Cloudflare Turnstile if configured
        const turnstileSecret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
        if (turnstileSecret && input.turnstileToken) {
          try {
            const formData = new URLSearchParams();
            formData.append("secret", turnstileSecret);
            formData.append("response", input.turnstileToken);
            formData.append("remoteip", clientIp);
            const tsRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
              method: "POST",
              body: formData,
            });
            const tsData = await tsRes.json();
            if (!tsData.success) {
              throw new Error("فشل التحقق الأمني (Cloudflare Turnstile).");
            }
          } catch (tsErr: any) {
            console.warn("[Turnstile] Validation error:", tsErr.message);
          }
        }

        // Gemini AI Moderation for spam, hate speech, and profanity
        const moderation = await moderateComment(input.content);
        if (!moderation.isAllowed) {
          throw new Error(moderation.reason || "التعليق يتعارض مع ميثاق النشر الصحفي.");
        }

        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.insert(comments).values({
          articleId: input.articleId,
          authorName: input.authorName.trim(),
          content: input.content.trim(),
        });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
