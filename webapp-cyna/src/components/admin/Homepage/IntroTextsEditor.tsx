"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import type { IntroTexts } from "@/app/[locale]/(admin)/admin/_actions/homepage.actions";
import { updateIntroTexts } from "@/app/[locale]/(admin)/admin/_actions/homepage.actions";
import { useNotification } from "@/components/ui/notification-provider";

interface Translations {
  title: string;
  eyebrow: string;
  introTitle: string;
  body: string;
  linkLabel: string;
  defaultLang: string;
  addTranslation: string;
  save: string;
  saving: string;
  saved: string;
}

type FieldKey = "eyebrow" | "title" | "body" | "linkLabel";

export default function IntroTextsEditor({
  introTexts,
  translations,
}: {
  introTexts: IntroTexts;
  translations: Translations;
}) {
  const [form, setForm] = useState<IntroTexts>(introTexts);
  const [enFields, setEnFields] = useState<Record<FieldKey, boolean>>({
    eyebrow: !!introTexts.eyebrow_en,
    title: !!introTexts.title_en,
    body: !!introTexts.body_en,
    linkLabel: !!introTexts.linkLabel_en,
  });
  const [isPending, startTransition] = useTransition();
  const { notify } = useNotification();
  const router = useRouter();
  const t = translations;

  const hasEn = Object.values(enFields).some(Boolean);

  const isDirty =
    JSON.stringify(form) !== JSON.stringify(introTexts) ||
    JSON.stringify(enFields) !==
      JSON.stringify({
        eyebrow: !!introTexts.eyebrow_en,
        title: !!introTexts.title_en,
        body: !!introTexts.body_en,
        linkLabel: !!introTexts.linkLabel_en,
      });

  const handleSave = () => {
    startTransition(async () => {
      const cleaned = { ...form };
      for (const key of ["eyebrow", "title", "body", "linkLabel"] as FieldKey[]) {
        if (!enFields[key]) {
          cleaned[`${key}_en`] = "";
        }
      }
      await updateIntroTexts(cleaned, hasEn);
      router.refresh();
      notify(t.saved);
    });
  };

  const addEn = (key: FieldKey) => {
    setEnFields((prev) => ({ ...prev, [key]: true }));
  };

  const removeEn = (key: FieldKey) => {
    setEnFields((prev) => ({ ...prev, [key]: false }));
    setForm((prev) => ({ ...prev, [`${key}_en`]: "" }));
  };

  const fields: { key: FieldKey; label: string; multiline: boolean }[] = [
    { key: "eyebrow", label: t.eyebrow, multiline: false },
    { key: "title", label: t.introTitle, multiline: false },
    { key: "body", label: t.body, multiline: true },
    { key: "linkLabel", label: t.linkLabel, multiline: false },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t.title}</h2>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || isPending}
            className={!isDirty ? "opacity-40" : ""}
          >
            {isPending ? <><Spinner /> {t.saving}</> : t.save}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {fields.map(({ key, label, multiline }) => (
          <fieldset key={key} className="space-y-3 rounded-lg border p-4">
            <legend className="px-2 text-sm font-semibold">{label}</legend>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">{t.defaultLang}</label>
              {multiline ? (
                <textarea
                  value={form[`${key}_fr`]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [`${key}_fr`]: e.target.value }))}
                  rows={4}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              ) : (
                <input
                  type="text"
                  value={form[`${key}_fr`]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [`${key}_fr`]: e.target.value }))}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              )}
            </div>

            {enFields[key] && (
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">EN</label>
                  <button
                    type="button"
                    onClick={() => removeEn(key)}
                    className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {multiline ? (
                  <textarea
                    value={form[`${key}_en`]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [`${key}_en`]: e.target.value }))}
                    rows={4}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                ) : (
                  <input
                    type="text"
                    value={form[`${key}_en`]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [`${key}_en`]: e.target.value }))}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                )}
              </div>
            )}

            {!enFields[key] && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addEn(key)}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                {t.addTranslation}
              </Button>
            )}
          </fieldset>
        ))}
      </div>
    </div>
  );
}
