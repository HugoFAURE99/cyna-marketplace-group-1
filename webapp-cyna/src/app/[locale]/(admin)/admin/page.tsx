import { getTranslations, setRequestLocale } from "next-intl/server";

import HomepageTabs from "@/components/admin/Homepage/HomepageTabs";
import {
  getCarouselSlides,
  getIntroTexts,
} from "@/app/[locale]/(admin)/admin/_actions/homepage.actions";
import type { Locale } from "@/lib/i18n/translations";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tDashboard = await getTranslations("admin.dashboard");
  const tCarousel = await getTranslations("admin.homepage.carousel");
  const tIntro = await getTranslations("admin.homepage.intro");
  const tShortcuts = await getTranslations("admin.homepage.shortcuts");
  const tTabs = await getTranslations("admin.homepage.tabs");

  const [slides, introTexts] = await Promise.all([
    getCarouselSlides(),
    getIntroTexts(),
  ]);

  const translations = {
    carouselTab: tTabs("carousel"),
    introTab: tTabs("intro"),
    shortcutsTab: tTabs("shortcuts"),
    unsavedTitle: tTabs("unsavedTitle"),
    unsavedMessage: tTabs("unsavedMessage"),
    unsavedLeave: tTabs("unsavedLeave"),
    unsavedStay: tTabs("unsavedStay"),
    unsavedSaveAndLeave: tTabs("unsavedSaveAndLeave"),
  };

  const carouselTranslations = {
    title: tCarousel("title"),
    addSlide: tCarousel("addSlide"),
    noSlides: tCarousel("noSlides"),
    titleFr: tCarousel("titleFr"),
    titleEn: tCarousel("titleEn"),
    descriptionFr: tCarousel("descriptionFr"),
    descriptionEn: tCarousel("descriptionEn"),
    image: tCarousel("image"),
    active: tCarousel("active"),
    inactive: tCarousel("inactive"),
    save: tCarousel("save"),
    saving: tCarousel("saving"),
    cancel: tCarousel("cancel"),
    delete: tCarousel("delete"),
    deleting: tCarousel("deleting"),
    confirmDeleteTitle: tCarousel("confirmDeleteTitle"),
    confirmDeleteMessage: tCarousel("confirmDeleteMessage"),
    confirmDelete: tCarousel("confirmDelete"),
    cancelDelete: tCarousel("cancelDelete"),
    dragOrClick: tCarousel("dragOrClick"),
    imageHint: tCarousel("imageHint"),
    editSlide: tCarousel("editSlide"),
    newSlide: tCarousel("newSlide"),
    addTranslation: tCarousel("addTranslation"),
    defaultLang: tCarousel("defaultLang"),
    order: tCarousel("order"),
    validate: tCarousel("validate"),
    validating: tCarousel("validating"),
    dragHint: tCarousel("dragHint"),
    cancelOrder: tCarousel("cancelOrder"),
    unsavedTitle: tCarousel("unsavedTitle"),
    unsavedMessage: tCarousel("unsavedMessage"),
    unsavedLeave: tCarousel("unsavedLeave"),
    unsavedStay: tCarousel("unsavedStay"),
  };

  const introTranslations = {
    title: tIntro("title"),
    eyebrow: tIntro("eyebrow"),
    introTitle: tIntro("introTitle"),
    body: tIntro("body"),
    linkLabel: tIntro("linkLabel"),
    defaultLang: tIntro("defaultLang"),
    addTranslation: tIntro("addTranslation"),
    save: tIntro("save"),
    saving: tIntro("saving"),
    saved: tIntro("saved"),
  };

  const shortcutTranslations = {
    title: tShortcuts("title"),
    productsTitle: tShortcuts("productsTitle"),
    productsDescription: tShortcuts("productsDescription"),
    categoriesTitle: tShortcuts("categoriesTitle"),
    categoriesDescription: tShortcuts("categoriesDescription"),
    go: tShortcuts("go"),
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{tDashboard("title")}</h1>
      <HomepageTabs
        slides={slides}
        introTexts={introTexts}
        translations={translations}
        carouselTranslations={carouselTranslations}
        introTranslations={introTranslations}
        shortcutTranslations={shortcutTranslations}
      />
    </div>
  );
}
