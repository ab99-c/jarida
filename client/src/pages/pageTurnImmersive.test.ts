import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("immersive page sheet implementation", () => {
  const css = fs.readFileSync(path.join(process.cwd(), "client/src/index.css"), "utf8");
  const home = fs.readFileSync(path.join(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

  it("defines a sheet layer that lifts from bottom-left toward top-right to reveal the next page and returns on prev", () => {
    expect(home).toContain("data-jarida-release=\"jarida-immersive-83ae373f\"");
    expect(home).toContain("data-jarida-spread-mode=\"paired-articles\"");
    expect(home).toContain("TurningPagePreview");
    expect(home).toContain("const ARTICLES_PER_SPREAD = 2;");
    expect(home).toContain("data-page-slot={idx === 0 ? \"right\" : \"left\"}");
    expect(home).toContain("className=\"jarida-empty-page");
    expect(home).toContain("aria-label=\"صفحة فارغة\"");
    expect(home).toContain("grid grid-cols-2 gap-0 lg:gap-12");
    expect(home).toContain("data-peel-corner=\"bottom-left\"");
    expect(home).toContain("data-peel-corner=\"top-right\"");
    expect(home).toContain("jarida-peel-curl-flap");
    expect(home).toContain("كل spread فيه جوج صفحات حقيقيين");
    expect(home).toContain("dir=\"rtl\"");
    expect(home).toContain("jarida-turning-face jarida-turning-front");
    expect(home).toContain("jarida-turning-face jarida-turning-back");
    expect(css).toContain(".jarida-static-spread");
    expect(css).toContain("@keyframes jarida-immersive-page-turn");
    expect(css).toContain("transform-origin: right top");
    expect(css).toContain("animation: jarida-immersive-page-turn 1400ms");
    expect(css).toContain(".jarida-turning-page.turn-prev");
    expect(css).toContain(".jarida-corner-peel-next");
    expect(css).toContain(".jarida-corner-peel-prev");
    expect(css).toContain("backface-visibility: hidden");
    expect(css).toContain("grid-template-columns: repeat(2, minmax(0, 1fr));");
  });

  it("lifts the sheet from bottom-left toward top-right on next and returns from top-right to bottom-left on prev", () => {
    expect(css).toContain("@keyframes jarida-immersive-page-turn {");
    expect(css).toContain("@keyframes jarida-immersive-page-turn-prev {");
    expect(css).toContain("@keyframes jarida-bottom-left-curl-flap {");
    expect(css).toContain("@keyframes jarida-bottom-left-curl-flap-prev {");
  });

  it("keeps swipe handling, corner peel drag, and reduced-motion behavior present", () => {
    expect(home).toContain("handleTouchStart");
    expect(home).toContain("handleTouchMove");
    expect(home).toContain("startCornerPeelDrag");
    expect(home).toContain("PAGE_TURN_MIDPOINT_MS");
    expect(home).toContain("PAGE_TURN_DURATION_MS");
    expect(home).toContain("handleTouchEnd");
    expect(home).not.toContain("fb-controls");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
