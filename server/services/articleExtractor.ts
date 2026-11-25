/**
 * Extracts clean full text content from an article web page URL.
 */
export async function extractArticleText(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ar,fr;q=0.9,en;q=0.8",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return null;
    const html = await response.text();

    // Strip scripts, styles, comments, SVG, and noscript
    const cleaned = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ");

    // Extract text specifically inside <article>, .article-content, or <p> tags
    const paragraphs: string[] = [];
    const pRegex = /<p\b[^>]*>(.*?)<\/p>/gi;
    let match: RegExpExecArray | null;

    while ((match = pRegex.exec(cleaned)) !== null) {
      const rawText = match[1]
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#\d+;/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      // Only keep informative paragraphs (avoid cookie notices, social buttons, etc.)
      if (
        rawText.length >= 35 &&
        !rawText.includes("حقوق النشر") &&
        !rawText.includes("تابعونا على") &&
        !rawText.includes("اشترك في")
      ) {
        paragraphs.push(rawText);
      }
    }

    const fullText = paragraphs.join("\n\n").trim();
    if (fullText.length < 100) return null;

    return fullText;
  } catch (error: any) {
    console.warn(`[ArticleExtractor] Failed to extract from ${url}:`, error.message);
    return null;
  }
}
