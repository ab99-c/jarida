import { describe, expect, it } from "vitest";
import { formatArabicEditionDate } from "@shared/date";

describe("formatArabicEditionDate", () => {
  it("formats the supplied edition date in Moroccan Arabic", () => {
    const formatted = formatArabicEditionDate("2026-08-22T12:00:00.000Z");

    expect(formatted).toContain("2026");
    expect(formatted).toContain("غشت");
    expect(formatted).toContain("22");
  });
});
