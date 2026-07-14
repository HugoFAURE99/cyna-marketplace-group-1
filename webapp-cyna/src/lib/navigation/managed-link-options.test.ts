import { describe, expect, it } from "vitest";

import { buildManagedLinkOptions } from "@/lib/navigation/managed-link-options";

const labels = {
  about: "About",
  catalog: "Catalog",
  categoryFallback: (id: number) => `Category ${id}`,
  faq: "FAQ",
  home: "Home",
  legal: "Legal",
  productFallback: (id: number) => `Product ${id}`,
  terms: "Terms",
  topProducts: "Featured",
};

describe("managed link options", () => {
  it("builds locale-neutral destinations with localized labels", () => {
    const options = buildManagedLinkOptions(
      "en",
      labels,
      [{
        id_categorie: 4,
        categorie_traduction: [
          { cat_nom: "Détection", langue: "fr" },
          { cat_nom: "Detection", langue: "en" },
        ],
      }],
      [{
        id_produit: 12,
        produit_traduction: [
          { langue: "fr", nom_pro: "Protection FR" },
          { langue: "en", nom_pro: "Protection EN" },
        ],
      }],
    );

    expect(options).toContainEqual({ href: "/search", kind: "page", label: "Catalog" });
    expect(options).toContainEqual({ href: "#top-products", kind: "anchor", label: "Featured" });
    expect(options).toContainEqual({ href: "/categories/4", kind: "category", label: "Detection" });
    expect(options).toContainEqual({ href: "/products/12", kind: "product", label: "Protection EN" });
  });

  it("uses the normal French translation fallback", () => {
    const options = buildManagedLinkOptions(
      "en",
      labels,
      [{
        id_categorie: 3,
        categorie_traduction: [{ cat_nom: "SOC", langue: "fr" }],
      }],
      [],
    );
    expect(options.at(-1)?.label).toBe("SOC");
  });
});
