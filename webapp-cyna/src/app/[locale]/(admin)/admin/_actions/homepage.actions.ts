"use server";

import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { createAdminClient } from "@/lib/supabase/server";

// ─── Carousel ───

export type CarouselSlide = {
  id_image: number;
  lien_image_caroussel: string;
  est_actif: boolean;
  ordre: number;
  titre_fr: string;
  description_fr: string | null;
  titre_en: string;
  description_en: string | null;
  lien_bouton: string;
  texte_bouton_fr: string;
  texte_bouton_en: string;
};

export async function getCarouselSlides(): Promise<CarouselSlide[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("image_carrousel")
    .select(
      `
      id_image,
      lien_image_caroussel,
      est_actif,
      ordre,
      lien_bouton,
      image_carrousel_traduction (
        langue,
        titre_image,
        description_image,
        texte_bouton
      )
    `,
    )
    .order("ordre", { ascending: true });

  if (error) throw new Error(`Erreur chargement carousel : ${error.message}`);

  return (data ?? []).map((slide) => {
    const trads = slide.image_carrousel_traduction ?? [];
    const fr = trads.find((t) => t.langue === "fr");
    const en = trads.find((t) => t.langue === "en");
    return {
      id_image: slide.id_image,
      lien_image_caroussel: slide.lien_image_caroussel,
      est_actif: slide.est_actif,
      ordre: slide.ordre,
      titre_fr: fr?.titre_image ?? "",
      description_fr: fr?.description_image ?? null,
      titre_en: en?.titre_image ?? "",
      description_en: en?.description_image ?? null,
      lien_bouton: slide.lien_bouton ?? "",
      texte_bouton_fr: fr?.texte_bouton ?? "",
      texte_bouton_en: en?.texte_bouton ?? "",
    };
  });
}

async function uploadCarouselImage(file: File): Promise<string> {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Format non supporté. Utilisez JPG, PNG ou WebP.");
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("L'image doit faire moins de 2MB.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const webpBuffer = await sharp(buffer)
    .webp({ quality: 80, effort: 6 })
    .toBuffer();

  const filename = `${uuidv4()}.webp`;
  const supabase = createAdminClient();

  const { error: uploadError } = await supabase.storage
    .from("carousel-images")
    .upload(filename, webpBuffer, {
      contentType: "image/webp",
      upsert: false,
    });

  if (uploadError) throw new Error(`Erreur upload : ${uploadError.message}`);

  const { data } = supabase.storage
    .from("carousel-images")
    .getPublicUrl(filename);

  return data.publicUrl;
}

function extractFilename(url: string): string | null {
  try {
    const parts = new URL(url).pathname.split("/");
    return parts[parts.length - 1] || null;
  } catch {
    return null;
  }
}

async function getNextOrdre(): Promise<number> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("image_carrousel")
    .select("ordre")
    .order("ordre", { ascending: false })
    .limit(1)
    .single();
  return (data?.ordre ?? 0) + 1;
}

export async function createCarouselSlide(formData: FormData) {
  const supabase = createAdminClient();
  const imageFile = formData.get("image") as File | null;
  const titreFr = (formData.get("titre_fr") as string) || "";
  const descriptionFr = (formData.get("description_fr") as string) || null;
  const titreEn = (formData.get("titre_en") as string) || "";
  const descriptionEn = (formData.get("description_en") as string) || null;
  const hasEn = formData.get("has_en") === "true";
  const lienBouton = (formData.get("lien_bouton") as string) || "";
  const texteBoutonFr = (formData.get("texte_bouton_fr") as string) || "";
  const texteBoutonEn = (formData.get("texte_bouton_en") as string) || "";

  if (!imageFile || imageFile.size === 0) {
    throw new Error("Une image est requise.");
  }

  const imageUrl = await uploadCarouselImage(imageFile);
  const ordre = await getNextOrdre();

  const { data: slide, error } = await supabase
    .from("image_carrousel")
    .insert({ lien_image_caroussel: imageUrl, est_actif: true, ordre, lien_bouton: lienBouton })
    .select("id_image")
    .single();

  if (error) throw new Error(`Erreur création slide : ${error.message}`);

  const translations: { id_image: number; langue: "fr" | "en"; titre_image: string; description_image: string | null; texte_bouton: string }[] = [
    { id_image: slide.id_image, langue: "fr", titre_image: titreFr, description_image: descriptionFr, texte_bouton: texteBoutonFr },
  ];

  if (hasEn) {
    translations.push({
      id_image: slide.id_image,
      langue: "en",
      titre_image: titreEn || titreFr,
      description_image: descriptionEn,
      texte_bouton: texteBoutonEn || texteBoutonFr,
    });
  }

  const { error: tradError } = await supabase
    .from("image_carrousel_traduction")
    .insert(translations);

  if (tradError) throw new Error(`Erreur traductions : ${tradError.message}`);

  revalidatePath("/[locale]/admin", "page");
  revalidatePath("/[locale]", "page");
}

export async function updateCarouselSlide(id: number, formData: FormData) {
  const supabase = createAdminClient();
  const imageFile = formData.get("image") as File | null;
  const titreFr = (formData.get("titre_fr") as string) || "";
  const descriptionFr = (formData.get("description_fr") as string) || null;
  const titreEn = (formData.get("titre_en") as string) || "";
  const descriptionEn = (formData.get("description_en") as string) || null;
  const hasEn = formData.get("has_en") === "true";
  const lienBouton = (formData.get("lien_bouton") as string) || "";
  const texteBoutonFr = (formData.get("texte_bouton_fr") as string) || "";
  const texteBoutonEn = (formData.get("texte_bouton_en") as string) || "";

  if (imageFile && imageFile.size > 0) {
    const { data: existing } = await supabase
      .from("image_carrousel")
      .select("lien_image_caroussel")
      .eq("id_image", id)
      .single();

    if (existing) {
      const oldFilename = extractFilename(existing.lien_image_caroussel);
      if (oldFilename) {
        await supabase.storage.from("carousel-images").remove([oldFilename]);
      }
    }

    const newUrl = await uploadCarouselImage(imageFile);
    await supabase
      .from("image_carrousel")
      .update({ lien_image_caroussel: newUrl, lien_bouton: lienBouton })
      .eq("id_image", id);
  } else {
    await supabase
      .from("image_carrousel")
      .update({ lien_bouton: lienBouton })
      .eq("id_image", id);
  }

  // Always upsert FR
  await supabase
    .from("image_carrousel_traduction")
    .upsert(
      { id_image: id, langue: "fr" as const, titre_image: titreFr, description_image: descriptionFr, texte_bouton: texteBoutonFr },
      { onConflict: "id_image,langue" },
    );

  if (hasEn) {
    await supabase
      .from("image_carrousel_traduction")
      .upsert(
        { id_image: id, langue: "en" as const, titre_image: titreEn || titreFr, description_image: descriptionEn, texte_bouton: texteBoutonEn || texteBoutonFr },
        { onConflict: "id_image,langue" },
      );
  } else {
    await supabase
      .from("image_carrousel_traduction")
      .delete()
      .eq("id_image", id)
      .eq("langue", "en");
  }

  revalidatePath("/[locale]/admin", "page");
  revalidatePath("/[locale]", "page");
}

export async function deleteCarouselSlide(id: number) {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("image_carrousel")
    .select("lien_image_caroussel")
    .eq("id_image", id)
    .single();

  if (existing) {
    const filename = extractFilename(existing.lien_image_caroussel);
    if (filename) {
      await supabase.storage.from("carousel-images").remove([filename]);
    }
  }

  await supabase
    .from("image_carrousel_traduction")
    .delete()
    .eq("id_image", id);

  const { error } = await supabase
    .from("image_carrousel")
    .delete()
    .eq("id_image", id);

  if (error) throw new Error(`Erreur suppression : ${error.message}`);

  revalidatePath("/[locale]/admin", "page");
  revalidatePath("/[locale]", "page");
}

export async function toggleCarouselSlide(id: number, active: boolean) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("image_carrousel")
    .update({ est_actif: active })
    .eq("id_image", id);

  if (error) throw new Error(`Erreur toggle : ${error.message}`);

  revalidatePath("/[locale]/admin", "page");
  revalidatePath("/[locale]", "page");
}

export async function updateCarouselOrder(items: { id: number; ordre: number }[]) {
  const supabase = createAdminClient();

  const failures: string[] = [];
  for (const item of items) {
    const { error } = await supabase
      .from("image_carrousel")
      .update({ ordre: item.ordre })
      .eq("id_image", item.id);
    if (error) failures.push(error.message);
  }

  if (failures.length > 0) {
    throw new Error(`Erreur mise à jour ordre : ${failures.join(", ")}`);
  }

  revalidatePath("/[locale]/admin", "page");
  revalidatePath("/[locale]", "page");
}

// ─── Intro texts ───

export type IntroTexts = {
  eyebrow_fr: string;
  eyebrow_en: string;
  title_fr: string;
  title_en: string;
  body_fr: string;
  body_en: string;
  linkLabel_fr: string;
  linkLabel_en: string;
  linkUrl_fr: string;
  linkUrl_en: string;
};

const INTRO_PLACEMENTS = {
  eyebrow: "home_intro_eyebrow",
  title: "home_intro_title",
  body: "home_intro_body",
  linkLabel: "home_intro_link_label",
  linkUrl: "home_intro_link_url",
} as const;

export async function getIntroTexts(): Promise<IntroTexts> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("texte_general")
    .select("emplacement_texte, langue, texte")
    .in("emplacement_texte", Object.values(INTRO_PLACEMENTS));

  if (error) throw new Error(`Erreur chargement textes : ${error.message}`);

  const rows = data ?? [];
  const get = (placement: string, lang: string) =>
    rows.find((r) => r.emplacement_texte === placement && r.langue === lang)?.texte ?? "";

  return {
    eyebrow_fr: get(INTRO_PLACEMENTS.eyebrow, "fr"),
    eyebrow_en: get(INTRO_PLACEMENTS.eyebrow, "en"),
    title_fr: get(INTRO_PLACEMENTS.title, "fr"),
    title_en: get(INTRO_PLACEMENTS.title, "en"),
    body_fr: get(INTRO_PLACEMENTS.body, "fr"),
    body_en: get(INTRO_PLACEMENTS.body, "en"),
    linkLabel_fr: get(INTRO_PLACEMENTS.linkLabel, "fr"),
    linkLabel_en: get(INTRO_PLACEMENTS.linkLabel, "en"),
    linkUrl_fr: get(INTRO_PLACEMENTS.linkUrl, "fr"),
    linkUrl_en: get(INTRO_PLACEMENTS.linkUrl, "en"),
  };
}

export async function updateIntroTexts(texts: IntroTexts, hasEn: boolean) {
  const supabase = createAdminClient();

  const entries: { placement: string; lang: "fr" | "en"; texte: string }[] = [
    { placement: INTRO_PLACEMENTS.eyebrow, lang: "fr", texte: texts.eyebrow_fr },
    { placement: INTRO_PLACEMENTS.title, lang: "fr", texte: texts.title_fr },
    { placement: INTRO_PLACEMENTS.body, lang: "fr", texte: texts.body_fr },
    { placement: INTRO_PLACEMENTS.linkLabel, lang: "fr", texte: texts.linkLabel_fr },
    { placement: INTRO_PLACEMENTS.linkUrl, lang: "fr", texte: texts.linkUrl_fr },
  ];

  if (hasEn) {
    entries.push(
      { placement: INTRO_PLACEMENTS.eyebrow, lang: "en", texte: texts.eyebrow_en },
      { placement: INTRO_PLACEMENTS.title, lang: "en", texte: texts.title_en },
      { placement: INTRO_PLACEMENTS.body, lang: "en", texte: texts.body_en },
      { placement: INTRO_PLACEMENTS.linkLabel, lang: "en", texte: texts.linkLabel_en },
      { placement: INTRO_PLACEMENTS.linkUrl, lang: "en", texte: texts.linkUrl_en },
    );
  }

  for (const entry of entries) {
    const { data: existing } = await supabase
      .from("texte_general")
      .select("id_texte")
      .eq("emplacement_texte", entry.placement)
      .eq("langue", entry.lang)
      .single();

    if (existing) {
      await supabase
        .from("texte_general")
        .update({ texte: entry.texte })
        .eq("id_texte", existing.id_texte);
    } else if (entry.texte.trim()) {
      await supabase
        .from("texte_general")
        .insert({
          emplacement_texte: entry.placement,
          langue: entry.lang,
          texte: entry.texte,
        });
    }
  }

  // If EN removed, delete EN rows
  if (!hasEn) {
    for (const placement of Object.values(INTRO_PLACEMENTS)) {
      await supabase
        .from("texte_general")
        .delete()
        .eq("emplacement_texte", placement)
        .eq("langue", "en");
    }
  }

  revalidatePath("/[locale]/admin", "page");
  revalidatePath("/[locale]", "page");
}
