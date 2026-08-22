import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import path from "path";
import fs from "fs";
import { registerOAuthRoutes } from "./_core/oauth";
import { registerStorageProxy } from "./_core/storageProxy";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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

app.use("*", (_req, res) => {
  const indexPath = path.resolve(resolvedStaticPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Jarida application build not found. Please check deployment build logs.");
  }
});

export default app;
