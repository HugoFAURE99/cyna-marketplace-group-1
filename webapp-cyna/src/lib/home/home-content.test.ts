import { describe, expect, it } from "vitest";

import { resolveCarouselContent, type CarouselContentSource } from "@/lib/home/home-content";

const slide: CarouselContentSource = {
  id_image: 8,
  lien_bouton: "/search?category=3",
  lien_image_caroussel: "https://images.example/hero.webp",
  image_carrousel_traduction: [
    { langue: "fr", titre_image: "Sécurité", description_image: "FR", texte_bouton: "Découvrir" },
    { langue: "en", titre_image: "Security", description_image: "EN", texte_bouton: "Explore" },
  ],
};

describe("carousel CMS localization", () => {
  it("maps each slide's destination and localized label", () => {
    expect(resolveCarouselContent(slide, "en", "#fallback")).toMatchObject({
      buttonHref: "/search?category=3",
      buttonLabel: "Explore",
      titre_image: "Security",
    });
  });

  it("falls back to French content and the configured fallback CTA", () => {
    const result = resolveCarouselContent({ ...slide, lien_bouton: null, image_carrousel_traduction: [slide.image_carrousel_traduction![0]] }, "en", "#top-products");
    expect(result).toMatchObject({ buttonHref: "#top-products", buttonLabel: "Découvrir", titre_image: "Sécurité" });
  });
});
