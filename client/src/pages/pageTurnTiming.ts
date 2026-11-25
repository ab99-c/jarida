export const PAGE_TURN_DURATION_MS = 1400;
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

/**
 * Calculates 0..1 progress for lifting the sheet from bottom-left toward top-right (next)
 * or pulling it back from top-right toward bottom-left (prev).
 */
export function getBottomLeftPeelProgress(
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
  width: number,
  height: number,
  direction: "next" | "prev",
): number {
  const safeW = Math.max(120, width);
  const safeH = Math.max(120, height);
  const dx = currentX - startX;
  const dy = currentY - startY;

  if (direction === "next") {
    // Lifting from bottom-left (تحت جهة اليسار) up and toward the right (وتطلع لجهة اليمين):
    // dx > 0 (moving right) and dy < 0 (moving up)
    const rightComponent = Math.max(0, dx) / (safeW * 0.65);
    const upComponent = Math.max(0, -dy) / (safeH * 0.65);
    const combined = rightComponent * 0.6 + upComponent * 0.55;
    return Math.max(0, Math.min(0.95, combined));
  }

  // Returning from top-right (جهة اليمين) back down toward bottom-left (تحت جهة اليسار):
  // dx < 0 (moving left) and dy > 0 (moving down)
  const leftComponent = Math.max(0, -dx) / (safeW * 0.65);
  const downComponent = Math.max(0, dy) / (safeH * 0.65);
  const combined = leftComponent * 0.6 + downComponent * 0.55;
  return Math.max(0, Math.min(0.95, combined));
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
