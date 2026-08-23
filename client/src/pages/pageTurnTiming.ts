export const PAGE_TURN_DURATION_MS = 980;
export const PAGE_TURN_MIDPOINT_MS = PAGE_TURN_DURATION_MS / 2;
export const SWIPE_THRESHOLD_PX = 34;

export function getPageTurnSchedule() {
  return {
    contentSwapAtMs: PAGE_TURN_MIDPOINT_MS,
    animationEndsAtMs: PAGE_TURN_DURATION_MS,
  };
}

export function getSwipeStep(deltaX: number, threshold = SWIPE_THRESHOLD_PX): -1 | 0 | 1 {
  if (Math.abs(deltaX) < threshold) return 0;
  return deltaX < 0 ? 1 : -1;
}

export function getBoundedPageChange(currentPage: number, totalPages: number, step: number) {
  if (totalPages <= 0 || step === 0) return null;
  const nextPage = Math.max(0, Math.min(totalPages - 1, currentPage + step));
  if (nextPage === currentPage) return null;
  return {
    fromPage: currentPage,
    toPage: nextPage,
    direction: step > 0 ? ("next" as const) : ("prev" as const),
    contentSwapAtMs: PAGE_TURN_MIDPOINT_MS,
    animationEndsAtMs: PAGE_TURN_DURATION_MS,
  };
}
