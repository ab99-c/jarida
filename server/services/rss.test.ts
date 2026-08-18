import { describe, expect, it } from "vitest";
import { fetchAndStoreRSS } from "./rss";

describe("RSS Ingestion & Deduplication Service", () => {
  it("should execute fetchAndStoreRSS and return structured result", async () => {
    const result = await fetchAndStoreRSS();
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("count");
    expect(typeof result.success).toBe("boolean");
    expect(typeof result.count).toBe("number");
  });
});
