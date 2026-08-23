import { describe, expect, it } from "vitest";
import {
  getBoundedPageChange,
  getPageTurnSchedule,
  getSwipeStep,
  PAGE_TURN_DURATION_MS,
  PAGE_TURN_MIDPOINT_MS,
} from "./pageTurnTiming";

describe("page-turn timing and interaction contract", () => {
  it("swaps content at the center and keeps the animation active through its full cycle", () => {
    const schedule = getPageTurnSchedule();

    expect(schedule.contentSwapAtMs).toBe(PAGE_TURN_MIDPOINT_MS);
    expect(schedule.animationEndsAtMs).toBe(PAGE_TURN_DURATION_MS);
    expect(schedule.contentSwapAtMs).toBe(700);
    expect(schedule.animationEndsAtMs).toBe(1400);
    expect(schedule.animationEndsAtMs).toBeGreaterThan(schedule.contentSwapAtMs);
  });

  it("maps horizontal swipes to next/previous page changes with a dead zone", () => {
    expect(getSwipeStep(-80)).toBe(1);
    expect(getSwipeStep(80)).toBe(-1);
    expect(getSwipeStep(20)).toBe(0);
    expect(getSwipeStep(-20)).toBe(0);
  });

  it("bounds next and previous turns and carries the timing contract", () => {
    expect(getBoundedPageChange(1, 4, 1)).toEqual({
      fromPage: 1,
      toPage: 2,
      direction: "next",
      contentSwapAtMs: 700,
      animationEndsAtMs: 1400,
    });
    expect(getBoundedPageChange(2, 4, -1)?.direction).toBe("prev");
    expect(getBoundedPageChange(0, 4, -1)).toBeNull();
    expect(getBoundedPageChange(3, 4, 1)).toBeNull();
  });
});
