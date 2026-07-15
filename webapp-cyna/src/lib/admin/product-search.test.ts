import { describe, expect, it } from "vitest";

import {
  matchesAdminProductSearch,
  normalizeAdminProductSearch,
} from "@/lib/admin/product-search";

const product = {
  categorie: { cat_nom: "Sécurité Réseau" },
  id_produit: 42,
  nom_pro: "Protection Étendue",
};

describe("admin product search", () => {
  it("normalizes case, accents, and repeated whitespace", () => {
    expect(normalizeAdminProductSearch("  SÉCURITÉ   Réseau ")).toBe(
      "securite reseau",
    );
  });

  it.each(["42", "protection", "etendue", "securite reseau", "42 réseau"])(
    "matches %s across ID, localized name, and category",
    (query) => expect(matchesAdminProductSearch(product, query)).toBe(true),
  );

  it("requires every search term", () => {
    expect(matchesAdminProductSearch(product, "42 firewall")).toBe(false);
  });
});
