import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("AutoSync Script Verification", () => {
  it("should have auto-sync script file present in scripts/", () => {
    const scriptPath = path.join(process.cwd(), "scripts", "auto-sync.mjs");
    expect(fs.existsSync(scriptPath)).toBe(true);
  });

  it("should be defined in package.json scripts", () => {
    const pkgPath = path.join(process.cwd(), "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    expect(pkg.scripts["auto:sync"]).toBeDefined();
  });
});
