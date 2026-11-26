import { execSync } from "child_process";
import fs from "fs";
import path from "path";

console.log("[AutoSync] Starting automated daily news sync & GitHub push...");

async function collectDailyNews() {
  const appUrl = process.env.JARIDA_APP_URL || "https://jarida-tan.vercel.app";
  const endpoint = new URL("/api/trpc/jarida.refreshFeed", appUrl);
  if (endpoint.protocol !== "https:") {
    throw new Error("JARIDA_APP_URL must use HTTPS.");
  }

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[AutoSync] Collecting RSS news from ${endpoint.origin} (attempt ${attempt}/3)...`);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ json: null }),
        signal: AbortSignal.timeout(45000),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(`Daily news endpoint returned HTTP ${response.status}: ${JSON.stringify(payload)}`);
      }

      const result = payload?.result?.data?.json ?? payload?.result?.data;
      if (!result || result.success !== true) {
        throw new Error(`Daily news collection was not successful: ${JSON.stringify(payload)}`);
      }

      console.log(
        `[AutoSync] Collected ${result.count ?? 0} new articles; ` +
          `${result.successfulFeeds ?? "?"} RSS feeds responded successfully.`,
      );
      return result;
    } catch (error) {
      lastError = error;
      if (attempt === 3) break;
      const delayMs = attempt * 5000;
      console.warn(`[AutoSync] Collection attempt failed; retrying in ${delayMs / 1000}s:`, error.message);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

try {
  // 1. Run TypeScript check to ensure code stability
  console.log("[AutoSync] Running TypeScript check...");
  execSync("pnpm check", { stdio: "inherit", cwd: process.cwd() });

  // The database keeps collected stories, so previous daily editions remain available in the archive.
  const collection = await collectDailyNews();

  // 2. Record the successful collection rather than only a scheduled workflow pulse.
  const timestampFile = path.join(process.cwd(), ".daily-edition-sync");
  const nowStr = new Date().toISOString();
  fs.writeFileSync(
    timestampFile,
    `Daily Edition Synced At: ${nowStr}; New Articles: ${collection.count ?? 0}; RSS Feeds: ${collection.successfulFeeds ?? "unknown"}\n`,
  );

  console.log("[AutoSync] Checking git status for updates...");
  const status = execSync("git status --porcelain", { encoding: "utf8" });

  if (status.trim() === "") {
    console.log("[AutoSync] No changes found. Creating a minor update pulse.");
    fs.writeFileSync(timestampFile, `Daily Edition Synced At: ${nowStr} (pulse)\n`);
  }

  // 3. Stage, commit, and push to GitHub (which triggers Vercel Production deployment automatically)
  console.log("[AutoSync] Staging changes...");
  execSync("git add -A", { stdio: "inherit" });

  const commitMsg = `chore(edition): daily automated newspaper sync & update - ${nowStr.split("T")[0]}`;
  console.log(`[AutoSync] Configuring Git identity for automated commit...`);
  execSync('git config user.name "Jarida Automation"', { stdio: "inherit" });
  execSync('git config user.email "automation@jarida.local"', { stdio: "inherit" });

  console.log(`[AutoSync] Committing with message: "${commitMsg}"`);
  execSync(`git commit -m "${commitMsg}"`, { stdio: "inherit" });

  const pushRemote = process.env.GIT_PUSH_REMOTE?.trim() || "github";
  console.log(`[AutoSync] Pushing to GitHub (${pushRemote}/main)...`);
  execSync(`git push ${pushRemote} main`, { stdio: "inherit" });

  console.log("[AutoSync] Successfully pushed to GitHub! Vercel production deployment is now triggered.");
} catch (error) {
  console.error("[AutoSync] Error during automated sync & push:", error);
  process.exit(1);
}
