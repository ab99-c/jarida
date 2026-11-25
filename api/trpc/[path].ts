import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../../server/routers.js";
import { createContext } from "../../server/_core/context.js";

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
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

export default function handler(req: any, res: any) {
  return app(req, res);
}
