import { describe, expect, it } from "vitest";
import {
  convertPageIndexBetweenModes,
  detectDeviceKind,
  getDefaultViewMode,
} from "./deviceMode";

describe("Android & TV single-page device mode detection", () => {
  it("detects Android TV user agents and defaults to single-page mode", () => {
    const env = {
      userAgent: "Mozilla/5.0 (Linux; Android 11; BRAVIA 4K VH2) AppleWebKit/537.36 Chrome/110.0.0.0 Safari/537.36",
      viewportWidth: 1920,
    };
    expect(detectDeviceKind(env)).toBe("android-tv");
    expect(getDefaultViewMode(env)).toBe("single");
  });

  it("detects Android phone user agents and defaults to single-page mode even in landscape", () => {
    const env = {
      userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
      viewportWidth: 1100,
    };
    expect(detectDeviceKind(env)).toBe("android-phone");
    expect(getDefaultViewMode(env)).toBe("single");
  });

  it("defaults to single-page on narrow mobile viewports and double-page spread on desktop", () => {
    const desktopEnv = {
      userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      viewportWidth: 1440,
    };
    const mobileEnv = { ...desktopEnv, viewportWidth: 412 };

    expect(detectDeviceKind(mobileEnv)).toBe("mobile");
    expect(getDefaultViewMode(mobileEnv)).toBe("single");
    expect(detectDeviceKind(desktopEnv)).toBe("desktop");
    expect(getDefaultViewMode(desktopEnv)).toBe("spread");
  });

  it("respects explicit saved preference and query overrides", () => {
    const desktopEnv = {
      userAgent: "Mozilla/5.0 (X11; Linux x86_64)",
      viewportWidth: 1440,
    };
    expect(getDefaultViewMode(desktopEnv, "single")).toBe("single");
    expect(getDefaultViewMode({ ...desktopEnv, search: "?view=single" }, "spread")).toBe("single");
  });

  it("preserves article position when switching between single-page and spread modes", () => {
    expect(convertPageIndexBetweenModes(3, "spread", "single", 20)).toBe(6);
    expect(convertPageIndexBetweenModes(6, "single", "spread", 20)).toBe(3);
    expect(convertPageIndexBetweenModes(7, "single", "spread", 20)).toBe(3);
    expect(convertPageIndexBetweenModes(19, "single", "spread", 20)).toBe(9);
  });
});
