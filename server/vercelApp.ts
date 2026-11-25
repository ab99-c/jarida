import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import path from "path";
import fs from "fs";
import { registerOAuthRoutes } from "./_core/oauth.js";
import { registerStorageProxy } from "./_core/storageProxy.js";
import { appRouter } from "./routers.js";
import { createContext } from "./_core/context.js";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Vercel Edge Caching for daily edition and videos to reduce TiDB Cloud load
app.use((req, res, next) => {
  if (
    req.method === "GET" &&
    (req.url.includes("getDailyEdition") ||
      req.url.includes("getVideos") ||
      req.url.includes("getAudioBriefing"))
  ) {
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  }
  next();
});

registerStorageProxy(app);
registerOAuthRoutes(app);

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

const projectRoot = process.cwd();
const staticDistPath = path.resolve(projectRoot, "dist", "public");
const fallbackStaticPath = path.resolve(projectRoot, "client", "public");
const resolvedStaticPath = fs.existsSync(staticDistPath) ? staticDistPath : fallbackStaticPath;

app.use(express.static(resolvedStaticPath));

app.use("*", async (req, res) => {
  const indexPath = path.resolve(resolvedStaticPath, "index.html");
  if (!fs.existsSync(indexPath)) {
    return res.status(404).send("Jarida application build not found. Please check deployment build logs.");
  }

  let html = fs.readFileSync(indexPath, "utf8");

  // Dynamic Open Graph & Twitter meta tags for rich social sharing (WhatsApp, X, Facebook)
  const shareTitle = (req.query.title as string) || "جريدة الأفق - الصحيفة المغربية الرقمية الذكية";
  const shareDesc =
    (req.query.desc as string) ||
    "مستجدات الشأن الوطني والدولي، تقارير مصورة وبث إخباري ذكي في تجربة قراءة تفاعلية أصيلة.";
  const shareImage =
    (req.query.image as string) ||
    "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=85";
  const shareUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;

  const ogTags = `
    <!-- Dynamic Open Graph & Twitter Cards for Jarida Live -->
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${shareTitle.replace(/"/g, "&quot;")}" />
    <meta property="og:description" content="${shareDesc.replace(/"/g, "&quot;")}" />
    <meta property="og:image" content="${shareImage}" />
    <meta property="og:url" content="${shareUrl}" />
    <meta property="og:site_name" content="جريدة الأفق - Jarida Live" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${shareTitle.replace(/"/g, "&quot;")}" />
    <meta name="twitter:description" content="${shareDesc.replace(/"/g, "&quot;")}" />
    <meta name="twitter:image" content="${shareImage}" />
  `;

  if (html.includes("</head>")) {
    html = html.replace("</head>", `${ogTags}</head>`);
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.send(html);
});

export default app;
