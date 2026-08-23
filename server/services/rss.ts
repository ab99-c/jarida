import Parser from "rss-parser";
import { getDb } from "../db.js";
import { articles } from "../../drizzle/schema.js";
import { eq } from "drizzle-orm";

const parser = new Parser({
  customFields: {
    item: [["media:content", "media"], ["enclosure", "enclosure"]],
  },
});

async function fetchFeed(url: string) {
  const response = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 JaridaLive/1.0" },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`RSS HTTP ${response.status}`);
  return parser.parseString(await response.text());
}

const RSS_FEEDS = [
  { name: "الجزيرة نت", url: "https://www.aljazeera.net/rss", category: "سياسة ودولي" },
  { name: "هسبريس", url: "https://www.hespress.com/feed", category: "وطني" },
  { name: "مغرب 24", url: "https://www.maroc24.com/feed", category: "مغرب" },
];

export async function fetchAndStoreRSS() {
  const db = await getDb();
  if (!db) {
    console.warn("[RSS] Database not available");
    return { success: false, count: 0 };
  }

  let totalInserted = 0;

  for (const feedInfo of RSS_FEEDS) {
    try {
      console.log(`[RSS] Fetching feed: ${feedInfo.name} (${feedInfo.url})`);
      const feed = await Promise.race([
        fetchFeed(feedInfo.url),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("RSS request timeout")), 2500)),
      ]);

      for (const item of feed.items || []) {
        if (!item.link || !item.title) continue;

        const title = item.title.trim();
        const summary = (item.contentSnippet || item.summary || item.content || title).slice(0, 500).trim();
        // Normalize URL to prevent duplicates with trailing slashes or UTM tags
        let url = item.link.trim().split("?")[0];
        if (url.endsWith("/")) {
          url = url.slice(0, -1);
        }

        const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();
        
        // Filter out very old articles (older than 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (publishedAt < sevenDaysAgo) continue;

        let imageUrl: string | null = null;
        if (item.enclosure && item.enclosure.url) {
          imageUrl = item.enclosure.url;
        } else if (item.media && item.media.$ && item.media.$.url) {
          imageUrl = item.media.$.url;
        } else {
          imageUrl = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=600&q=80";
        }

        // Check if article already exists by normalized URL
        const existing = await db.select().from(articles).where(eq(articles.url, url)).limit(1);
        if (existing.length > 0) continue;

        try {
          await db.insert(articles).values({
            title,
            summary,
            content: item.content || summary,
            source: feedInfo.name,
            url,
            imageUrl,
            category: feedInfo.category,
            publishedAt,
          });
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

  console.log(`[RSS] Successfully inserted ${totalInserted} new articles.`);
  return { success: true, count: totalInserted };
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

  for (const feedInfo of RSS_FEEDS) {
    try {
      const feed = await Promise.race([
        fetchFeed(feedInfo.url),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("RSS request timeout")), 2500)),
      ]);
      for (const item of feed.items || []) {
        if (!item.link || !item.title) continue;
        const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (publishedAt < sevenDaysAgo) continue;

        const url = item.link.trim().split("?")[0].replace(/\/$/, "");
        const summary = (item.contentSnippet || item.summary || item.content || item.title).slice(0, 500).trim();
        const imageUrl = item.enclosure?.url || item.media?.$?.url || null;
        latest.push({
          id: url,
          title: item.title.trim(),
          summary,
          content: item.content || summary,
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
  }

  return latest
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, 40);
}
