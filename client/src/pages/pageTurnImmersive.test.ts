import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("immersive page sheet implementation", () => {
  const css = fs.readFileSync(path.join(process.cwd(), "client/src/index.css"), "utf8");
  const home = fs.readFileSync(path.join(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

  it("defines a sheet layer with front/back faces and a center-axis turn", () => {
    expect(home).toContain("data-jarida-release=\"jarida-immersive-83ae373f\"");
    expect(home).toContain("TurningPagePreview");
    expect(home).toContain("jarida-turning-face jarida-turning-front");
    expect(home).toContain("jarida-turning-face jarida-turning-back");
    expect(css).toContain(".jarida-static-spread");
    expect(css).toContain("@keyframes jarida-immersive-page-turn");
    expect(css).toContain("transform-origin: left center");
    expect(css).toContain("backface-visibility: hidden");
  });

  it("holds the turned face at 180 degrees until the overlay is removed", () => {
    expect(css).toContain("100% {\n    transform: rotateY(-180deg) translateZ(0) scaleX(1);");
    expect(css).toContain("100% {\n    transform: rotateY(180deg) translateZ(0) scaleX(1);");
  });

  it("keeps swipe handling and reduced-motion behavior present", () => {
    expect(home).toContain("handleTouchStart");
    expect(home).toContain("handleTouchEnd");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
