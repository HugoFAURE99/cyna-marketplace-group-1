"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "@/i18n/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import CarouselManager from "./CarouselManager";
import IntroTextsEditor from "./IntroTextsEditor";
import ShortcutsPanel from "./ShortcutsPanel";
import type { CarouselSlide, IntroTexts } from "@/app/[locale]/(admin)/admin/_actions/homepage.actions";

type Tab = "carousel" | "intro" | "shortcuts";

interface Translations {
  carouselTab: string;
  introTab: string;
  shortcutsTab: string;
  unsavedTitle: string;
  unsavedMessage: string;
  unsavedLeave: string;
  unsavedStay: string;
  unsavedSaveAndLeave: string;
}

interface CarouselTranslations {
  title: string;
  addSlide: string;
  noSlides: string;
  titleFr: string;
  titleEn: string;
  descriptionFr: string;
  descriptionEn: string;
  image: string;
  active: string;
  inactive: string;
  save: string;
  saving: string;
  cancel: string;
  delete: string;
  deleting: string;
  confirmDeleteTitle: string;
  confirmDeleteMessage: string;
  confirmDelete: string;
  cancelDelete: string;
  dragOrClick: string;
  imageHint: string;
  editSlide: string;
  newSlide: string;
  addTranslation: string;
  defaultLang: string;
  order: string;
  validate: string;
  validating: string;
  dragHint: string;
  cancelOrder: string;
  unsavedTitle: string;
  unsavedMessage: string;
  unsavedLeave: string;
  unsavedStay: string;
  buttonText: string;
  buttonLink: string;
}

interface IntroTranslations {
  title: string;
  eyebrow: string;
  introTitle: string;
  body: string;
  linkLabel: string;
  linkUrl: string;
  defaultLang: string;
  addTranslation: string;
  save: string;
  saving: string;
  saved: string;
}

interface ShortcutTranslations {
  title: string;
  productsTitle: string;
  productsDescription: string;
  categoriesTitle: string;
  categoriesDescription: string;
  go: string;
}

export default function HomepageTabs({
  slides,
  introTexts,
  translations,
  carouselTranslations,
  introTranslations,
  shortcutTranslations,
}: {
  slides: CarouselSlide[];
  introTexts: IntroTexts;
  translations: Translations;
  carouselTranslations: CarouselTranslations;
  introTranslations: IntroTranslations;
  shortcutTranslations: ShortcutTranslations;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("carousel");
  const [carouselDirty, setCarouselDirty] = useState(false);
  const [pendingTab, setPendingTab] = useState<Tab | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const t = translations;

  const carouselSaveRef = useRef<(() => Promise<void>) | null>(null);

  const handleRegisterCarouselSave = useCallback((fn: () => Promise<void>) => {
    carouselSaveRef.current = fn;
  }, []);

  const switchTab = useCallback(
    (tab: Tab) => {
      if (tab === activeTab) return;
      if (carouselDirty && activeTab === "carousel") {
        setPendingTab(tab);
      } else {
        setActiveTab(tab);
      }
    },
    [activeTab, carouselDirty],
  );

  const confirmSwitch = () => {
    if (pendingTab) {
      setCarouselDirty(false);
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  };

  const cancelSwitch = () => {
    setPendingTab(null);
  };

  const saveAndLeave = async () => {
    setIsSaving(true);
    try {
      if (carouselSaveRef.current) {
        await carouselSaveRef.current();
      }
      setCarouselDirty(false);
      if (pendingTab) {
        setActiveTab(pendingTab);
        setPendingTab(null);
      }
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "carousel", label: t.carouselTab },
    { key: "intro", label: t.introTab },
    { key: "shortcuts", label: t.shortcutsTab },
  ];

  return (
    <>
      <div className="mb-6 border-b">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => switchTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "carousel" && (
        <CarouselManager
          slides={slides}
          translations={carouselTranslations}
          onDirtyChange={setCarouselDirty}
          onRegisterSave={handleRegisterCarouselSave}
        />
      )}
      {activeTab === "intro" && (
        <IntroTextsEditor introTexts={introTexts} translations={introTranslations} />
      )}
      {activeTab === "shortcuts" && (
        <ShortcutsPanel translations={shortcutTranslations} />
      )}

      <Dialog.Root
        open={pendingTab !== null}
        onOpenChange={(open) => { if (!open) cancelSwitch(); }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/20 supports-backdrop-filter:backdrop-blur-xs" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-popover p-6 text-popover-foreground shadow-lg">
            <Dialog.Title className="text-base font-semibold">
              {t.unsavedTitle}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">
              {t.unsavedMessage}
            </Dialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={cancelSwitch}>
                {t.unsavedStay}
              </Button>
              <Button size="sm" onClick={saveAndLeave} disabled={isSaving}>
                {isSaving ? <><Spinner /> {t.unsavedSaveAndLeave}</> : t.unsavedSaveAndLeave}
              </Button>
              <Button variant="destructive" size="sm" onClick={confirmSwitch} disabled={isSaving}>
                {t.unsavedLeave}
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
