import Parser from "rss-parser";
import { getDb } from "../db.js";
import { articles } from "../../drizzle/schema.js";
import { desc, eq } from "drizzle-orm";
import { extractArticleText } from "./articleExtractor.js";
import { summarizeArticle } from "./gemini.js";

const parser = new Parser({
  customFields: {
    item: [["media:content", "media"], ["enclosure", "enclosure"]],
  },
});

async function fetchFeed(url: string) {
  const response = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) JaridaLive/2.0" },
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) throw new Error(`RSS HTTP ${response.status}`);
  return parser.parseString(await response.text());
}

export const RSS_FEEDS = [
  { name: "الجزيرة نت", url: "https://www.aljazeera.net/rss", category: "دولي" },
  { name: "هسبريس", url: "https://www.hespress.com/feed", category: "مغرب" },
  { name: "مغرب 24", url: "https://www.maroc24.com/rss.xml", category: "مغرب" },
];

function normalizeText(text: string): string {
  return text
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Calculates Jaccard token similarity between two Arabic strings.
 */
export function calculateSimilarity(textA: string, textB: string): number {
  const cleanA = normalizeText(textA)
    .split(" ")
    .map((w) => (w.startsWith("و") && w.length > 3 ? w.slice(1) : w))
    .filter((w) => w.length > 2);
  const cleanB = normalizeText(textB)
    .split(" ")
    .map((w) => (w.startsWith("و") && w.length > 3 ? w.slice(1) : w))
    .filter((w) => w.length > 2);
  const wordsA = new Set(cleanA);
  const wordsB = new Set(cleanB);
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let intersection = 0;
  wordsA.forEach((word) => {
    if (wordsB.has(word)) intersection++;
  });
  const union = new Set(cleanA.concat(cleanB)).size;
  return union === 0 ? 0 : intersection / union;
}

export async function fetchAndStoreRSS() {
  const db = await getDb();
  if (!db) {
    console.warn("[RSS] Database not available");
    return { success: false, count: 0 };
  }

  let totalInserted = 0;
  let successfulFeeds = 0;

  // Retrieve recent articles to deduplicate across feeds
  const recentArticles = await db
    .select({ id: articles.id, title: articles.title, summary: articles.summary, url: articles.url })
    .from(articles)
    .orderBy(desc(articles.publishedAt))
    .limit(100);

  const seenUrls = new Set(recentArticles.map((a) => a.url));
  const existingTitles = recentArticles.map((a) => a.title);

  for (const feedInfo of RSS_FEEDS) {
    try {
      console.log(`[RSS] Fetching feed: ${feedInfo.name} (${feedInfo.url})`);
      const feed = await Promise.race([
        fetchFeed(feedInfo.url),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("RSS request timeout")), 6500)),
      ]);
      successfulFeeds++;

      for (const item of feed.items || []) {
        if (!item.link || !item.title) continue;

        const title = item.title.trim();
        let url = item.link.trim().split("?")[0];
        if (url.endsWith("/")) {
          url = url.slice(0, -1);
        }

        if (seenUrls.has(url)) continue;

        // Deduplication: check title similarity with recent published articles
        const isDuplicateEvent = existingTitles.some((existingTitle) => {
          const sim = calculateSimilarity(title, existingTitle);
          return sim >= 0.62;
        });

        if (isDuplicateEvent) {
          console.log(`[RSS] Skipping duplicate event across sources: "${title}"`);
          continue;
        }

        let summary = (item.contentSnippet || item.summary || item.content || "").replace(/<[^>]+>/g, " ").trim();

        // Check duplicate title-as-summary or deficient summary (< 40 chars or equals title)
        const isDeficient =
          !summary ||
          summary === title ||
          summary.length < 40 ||
          summary.replace(title, "").trim().length < 20;

        if (isDeficient) {
          console.log(`[RSS] Deficient summary for "${title}". Scraping full article from source...`);
          const fullText = await extractArticleText(url);
          if (!fullText || fullText.length < 100) {
            console.log(`[RSS] Skipping article "${title}" - insufficient content extracted (< 100 chars).`);
            continue;
          }

          const aiSummary = await summarizeArticle(title, fullText);
          if (!aiSummary || aiSummary.length < 35) {
            console.log(`[RSS] Skipping article "${title}" - AI summary generation failed.`);
            continue;
          }

          summary = aiSummary;
        }

        const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();

        // Filter out articles older than 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (publishedAt < sevenDaysAgo) continue;

        let imageUrl: string | null = null;
        if (item.enclosure && item.enclosure.url) {
          imageUrl = item.enclosure.url;
        } else if (item.media && (item.media as any).$ && (item.media as any).$.url) {
          imageUrl = (item.media as any).$.url;
        } else {
          imageUrl = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=600&q=80";
        }

        try {
          await db.insert(articles).values({
            title,
            summary: summary.slice(0, 800),
            content: item.content || summary,
            source: feedInfo.name,
            url,
            imageUrl,
            category: feedInfo.category,
            publishedAt,
          });

          seenUrls.add(url);
          existingTitles.push(title);
          totalInserted++;
        } catch (err: any) {
          if (!err.message?.includes("Duplicate entry")) {
            console.error(`[RSS] Error inserting article ${url}:`, err.message);
          }
        }
      }
    } catch (error: any) {
      console.error(`[RSS] Failed to fetch feed ${feedInfo.name}:`, error.message);
    }
  }

  console.log(`[RSS] Read ${successfulFeeds}/${RSS_FEEDS.length} feeds and inserted ${totalInserted} validated articles.`);
  return {
    success: successfulFeeds > 0,
    count: totalInserted,
    successfulFeeds,
    failedFeeds: RSS_FEEDS.length - successfulFeeds,
  };
}

export async function fetchLatestRSS() {
  const latest: Array<{
    id: string;
    title: string;
    summary: string;
    content: string;
    source: string;
    url: string;
    imageUrl: string | null;
    category: string;
    publishedAt: Date;
  }> = [];

  await Promise.all(
    RSS_FEEDS.map(async (feedInfo) => {
      try {
        const feed = await Promise.race([
          fetchFeed(feedInfo.url),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("RSS request timeout")), 5500)),
        ]);
        for (const item of feed.items || []) {
          if (!item.link || !item.title) continue;
          const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();

          const url = item.link.trim().split("?")[0].replace(/\/$/, "");
          const rawSummary = (item.contentSnippet || item.summary || item.content || item.title).slice(0, 500).trim();
          const imageUrl =
            item.enclosure?.url ||
            (item.media as any)?.$?.url ||
            "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80";
          latest.push({
            id: url,
            title: item.title.trim(),
            summary: rawSummary,
            content: item.content || rawSummary,
            source: feedInfo.name,
            url,
            imageUrl,
            category: feedInfo.category,
            publishedAt,
          });
        }
      } catch (error: any) {
        console.error(`[RSS] Failed to read live feed ${feedInfo.name}:`, error.message);
      }
    })
  );

  return latest;
}
