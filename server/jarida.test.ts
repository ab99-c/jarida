import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("jarida router", () => {
  it("fetches daily edition and articles without requiring admin permissions", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const edition = await caller.jarida.getDailyEdition();
    
    expect(edition).toBeDefined();
    expect(edition.articles).toBeInstanceOf(Array);
    expect(edition.sections).toBeTypeOf("object");
  });
});
