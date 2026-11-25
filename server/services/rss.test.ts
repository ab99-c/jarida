import { describe, expect, it } from "vitest";
import { calculateSimilarity } from "./rss.js";

describe("RSS Ingestion & Deduplication Service", () => {
  it("detects identical or highly similar news titles", () => {
    const title1 = "المغرب وإسبانيا يتفقان على تعزيز التعاون الأمني المشترك";
    const title2 = "المغرب وإسبانيا يتفقان على تعزيز التعاون الأمني وتنسيق الجهود";
    const title3 = "أسعار الذهب تسجل ارتفاعاً قياسياً في الأسواق العالمية";

    const sim12 = calculateSimilarity(title1, title2);
    const sim13 = calculateSimilarity(title1, title3);

    expect(sim12).toBeGreaterThan(0.4);
    expect(sim13).toBeLessThan(0.2);
  });
});
