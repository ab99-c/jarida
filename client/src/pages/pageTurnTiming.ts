export const PAGE_TURN_DURATION_MS = 980;
export const PAGE_TURN_MIDPOINT_MS = PAGE_TURN_DURATION_MS / 2;

export function getPageTurnSchedule() {
  return {
    contentSwapAtMs: PAGE_TURN_MIDPOINT_MS,
    animationEndsAtMs: PAGE_TURN_DURATION_MS,
  };
}
