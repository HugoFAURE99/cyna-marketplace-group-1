import { describe, expect, it } from "vitest";

import { planEnglishTranslation } from "@/lib/admin/translation-mutation";

describe("English translation persistence", () => {
  it("upserts the complete enabled translation", () => {
    const value = { name: "Endpoint", description: "Description", specifications: "Specs" };
    expect(planEnglishTranslation(true, value.name, value)).toEqual({ mode: "upsert", value });
  });

  it("requires an English name when enabled", () => {
    expect(() => planEnglishTranslation(true, "  ", { description: "Not silently lost" })).toThrow("EN_NAME_REQUIRED");
  });

  it("explicitly selects deletion when disabled", () => {
    expect(planEnglishTranslation(false, "Old name", { name: "Old name" })).toEqual({ mode: "delete" });
  });
});
