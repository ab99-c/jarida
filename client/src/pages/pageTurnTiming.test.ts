import { describe, expect, it } from "vitest";
import { getPageTurnSchedule, PAGE_TURN_DURATION_MS, PAGE_TURN_MIDPOINT_MS } from "./pageTurnTiming";

describe("page-turn timing", () => {
  it("swaps content at the center and keeps the animation active through its full cycle", () => {
    const schedule = getPageTurnSchedule();

    expect(schedule.contentSwapAtMs).toBe(PAGE_TURN_MIDPOINT_MS);
    expect(schedule.animationEndsAtMs).toBe(PAGE_TURN_DURATION_MS);
    expect(schedule.contentSwapAtMs).toBe(490);
    expect(schedule.animationEndsAtMs).toBe(980);
    expect(schedule.animationEndsAtMs).toBeGreaterThan(schedule.contentSwapAtMs);
  });
});
