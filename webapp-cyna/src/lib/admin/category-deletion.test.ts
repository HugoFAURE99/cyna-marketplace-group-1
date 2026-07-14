import { describe, expect, it } from "vitest";

import { planCategoryDeletion } from "@/lib/admin/category-deletion";

describe("category deletion planning", () => {
  it("blocks a category with its exact product count", () => {
    expect(planCategoryDeletion([4], [4, 4, 4])).toEqual({
      blocked: [{ id: 4, productCount: 3 }],
      deletableIds: [],
    });
  });

  it("keeps mixed bulk deletion partial and deduplicates ids", () => {
    expect(planCategoryDeletion([1, 2, 2, 3], [2, 2, 8])).toEqual({
      blocked: [{ id: 2, productCount: 2 }],
      deletableIds: [1, 3],
    });
  });
});
