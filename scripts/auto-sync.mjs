import { execSync } from "child_process";
import fs from "fs";
import path from "path";

console.log("[AutoSync] Starting automated daily news sync & GitHub push...");

try {
  // 1. Run local build or check to make sure the app is stable
  console.log("[AutoSync] Running TypeScript check...");
  execSync("pnpm check", { stdio: "inherit", cwd: process.cwd() });

  // 2. Check git status for changes or generate a timestamp update log
  const timestampFile = path.join(process.cwd(), ".last-sync");
  const nowStr = new Date().toISOString();
  fs.writeFileSync(timestampFile, `Last automated sync: ${nowStr}\n`);

  console.log("[AutoSync] Checking git status...");
  const status = execSync("git status --porcelain", { encoding: "utf8" });

  if (status.trim() === "") {
    console.log("[AutoSync] No local file changes detected. Forcing a timestamp update to trigger deployment.");
    fs.writeFileSync(timestampFile, `Sync pulse: ${nowStr}\n`);
  }

  // 3. Git add, commit, and push
  console.log("[AutoSync] Staging changes...");
  execSync("git add -A", { stdio: "inherit" });

  const commitMsg = `chore(auto): daily automated news update & sync - ${nowStr.split("T")[0]}`;
  console.log(`[AutoSync] Committing with message: "${commitMsg}"`);
  execSync(`git commit -m "${commitMsg}"`, { stdio: "inherit" });

  console.log("[AutoSync] Pushing to GitHub (origin/main)...");
  execSync("git push origin main", { stdio: "inherit" });

  console.log("[AutoSync] Successfully synced with GitHub! Vercel will automatically trigger a production deployment.");
} catch (error) {
  console.error("[AutoSync] Error during automated sync & push:", error);
  process.exit(1);
}
