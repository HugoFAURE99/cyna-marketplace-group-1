import { pickTranslation, type Locale } from "@/lib/i18n/translations";

export type CarouselContentSource = {
  id_image: number;
  lien_bouton: string | null;
  lien_image_caroussel: string;
  image_carrousel_traduction: {
    description_image: string | null;
    langue: string;
    texte_bouton: string | null;
    titre_image: string;
  }[] | null;
};

export function resolveCarouselContent(
  slide: CarouselContentSource,
  locale: Locale,
  fallbackHref: string,
) {
  const translation = pickTranslation(slide.image_carrousel_traduction, locale);
  return {
    buttonHref: slide.lien_bouton?.trim() || fallbackHref,
    buttonLabel: translation?.texte_bouton?.trim() || "",
    id_image: slide.id_image,
    lien_image_caroussel: slide.lien_image_caroussel,
    titre_image: translation?.titre_image ?? "",
    description_image: translation?.description_image ?? null,
  };
}
