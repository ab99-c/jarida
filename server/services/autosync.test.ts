import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("AutoSync and Security Documentation", () => {
  it("should have auto-sync script file present and support the configured Git remote", () => {
    const scriptPath = path.join(process.cwd(), "scripts", "auto-sync.mjs");
    expect(fs.existsSync(scriptPath)).toBe(true);
    const content = fs.readFileSync(scriptPath, "utf8");
    expect(content).toContain('process.env.GIT_PUSH_REMOTE?.trim() || "github"');
    expect(content).toContain("git push ${pushRemote} main");
  });

  it("should be defined in package.json scripts", () => {
    const pkgPath = path.join(process.cwd(), "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    expect(pkg.scripts["auto:sync"]).toBeDefined();
  });

  it("should have security and automation documentation present", () => {
    const docPath = path.join(process.cwd(), "docs", "security-and-automation.md");
    expect(fs.existsSync(docPath)).toBe(true);
  });
});
