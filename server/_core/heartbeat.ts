import { fetchAndStoreRSS } from "../services/rss";

let isRunning = false;

export async function runHeartbeat() {
  if (isRunning) return;
  try {
    isRunning = true;
    console.log("[Heartbeat] Running scheduled daily RSS sync...");
    await fetchAndStoreRSS();
    console.log("[Heartbeat] Scheduled daily RSS sync completed successfully.");
  } catch (error) {
    console.error("[Heartbeat] Error during scheduled RSS sync:", error);
  } finally {
    isRunning = false;
  }
}

// Trigger once after server start
setTimeout(() => {
  runHeartbeat();
}, 5000);

// Schedule repeat every 24 hours (86400000 ms)
setInterval(() => {
  runHeartbeat();
}, 24 * 60 * 60 * 1000);
