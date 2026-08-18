import { execSync } from "child_process";
import fs from "fs";
import path from "path";

console.log("[AutoSync] Starting automated daily news sync & GitHub push...");

try {
  // 1. Run TypeScript check to ensure code stability
  console.log("[AutoSync] Running TypeScript check...");
  execSync("pnpm check", { stdio: "inherit", cwd: process.cwd() });

  // 2. Update a sync log file to represent the daily edition pulse
  const timestampFile = path.join(process.cwd(), ".daily-edition-sync");
  const nowStr = new Date().toISOString();
  fs.writeFileSync(timestampFile, `Daily Edition Synced At: ${nowStr}\n`);

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
  console.log(`[AutoSync] Committing with message: "${commitMsg}"`);
  execSync(`git commit -m "${commitMsg}"`, { stdio: "inherit" });

  console.log("[AutoSync] Pushing to GitHub (github/main)...");
  execSync("git push github main", { stdio: "inherit" });

  console.log("[AutoSync] Successfully pushed to GitHub! Vercel production deployment is now triggered.");
} catch (error) {
  console.error("[AutoSync] Error during automated sync & push:", error);
  process.exit(1);
}
