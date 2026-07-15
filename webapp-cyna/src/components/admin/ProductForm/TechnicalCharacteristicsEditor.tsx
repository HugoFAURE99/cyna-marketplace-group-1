"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Pencil, Plus, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  upsertTechnicalCharacteristic,
  type TechnicalCharacteristic,
} from "@/app/[locale]/(admin)/admin/_actions/product.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EditorValue = {
  id?: number;
  labelEn: string;
  labelFr: string;
};

export function TechnicalCharacteristicsEditor({
  initialOptions,
  onChange,
  readOnly = false,
  value,
}: {
  initialOptions: TechnicalCharacteristic[];
  onChange: (ids: number[]) => void;
  readOnly?: boolean;
  value: number[];
}) {
  const t = useTranslations("admin.productForm.characteristics");
  const [options, setOptions] = useState(initialOptions);
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<EditorValue | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const byId = useMemo(() => new Map(options.map((item) => [item.id, item])), [options]);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const available = options.filter((item) => {
    if (value.includes(item.id)) return false;
    if (!normalizedQuery) return true;
    return [item.labelFr, item.labelEn]
      .filter(Boolean)
      .some((label) => label!.toLocaleLowerCase().includes(normalizedQuery));
  });

  function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= value.length) return;
    const next = [...value];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onChange(next);
  }

  function saveCharacteristic() {
    if (!editor) return;
    setError("");
    startTransition(async () => {
      const result = await upsertTechnicalCharacteristic({
        id: editor.id,
        labelEn: editor.labelEn,
        labelFr: editor.labelFr,
      });
      if (!result.ok) {
        setError(t(`errors.${result.error}`));
        return;
      }
      setOptions((current) => {
        const without = current.filter((item) => item.id !== result.characteristic.id);
        return [...without, result.characteristic].sort((a, b) =>
          (a.labelFr ?? a.labelEn ?? "").localeCompare(b.labelFr ?? b.labelEn ?? "", "fr"),
        );
      });
      if (!editor.id && !value.includes(result.characteristic.id)) {
        onChange([...value, result.characteristic.id]);
      }
      setEditor(null);
    });
  }

  return (
    <fieldset className="space-y-4 rounded-lg border p-4">
      <legend className="px-2 text-sm font-semibold">{t("title")}</legend>
      <p className="text-sm leading-6 text-muted-foreground">{t("description")}</p>

      <div className="space-y-2">
        {value.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            {t("empty")}
          </p>
        ) : value.map((id, index) => {
          const item = byId.get(id);
          if (!item) return null;
          const incomplete = !item.labelFr || !item.labelEn;
          return (
            <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center" key={id}>
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{item.labelFr || t("missingFr")}</p>
                <p className="text-sm text-muted-foreground">{item.labelEn || t("missingEn")}</p>
                {incomplete && (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                    <AlertTriangle aria-hidden="true" className="size-3.5" /> {t("incomplete")}
                  </p>
                )}
              </div>
              {!readOnly && (
                <div className="flex shrink-0 items-center gap-1">
                  <Button aria-label={t("moveUp")} disabled={index === 0} onClick={() => move(index, -1)} size="icon-sm" type="button" variant="ghost"><ChevronUp /></Button>
                  <Button aria-label={t("moveDown")} disabled={index === value.length - 1} onClick={() => move(index, 1)} size="icon-sm" type="button" variant="ghost"><ChevronDown /></Button>
                  <Button aria-label={t("edit")} onClick={() => setEditor({ id, labelEn: item.labelEn ?? "", labelFr: item.labelFr ?? "" })} size="icon-sm" type="button" variant="ghost"><Pencil /></Button>
                  <Button aria-label={t("remove")} onClick={() => onChange(value.filter((candidate) => candidate !== id))} size="icon-sm" type="button" variant="ghost"><X /></Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!readOnly && (
        <div className="space-y-3 rounded-lg bg-muted/40 p-3">
          <div className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label={t("search")} className="pl-9" onChange={(event) => setQuery(event.target.value)} placeholder={t("search")} value={query} />
          </div>
          {available.length > 0 && (
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {available.map((item) => (
                <button className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition hover:bg-background" key={item.id} onClick={() => onChange([...value, item.id])} type="button">
                  <span className="min-w-0"><span className="block truncate font-medium">{item.labelFr || t("missingFr")}</span><span className="block truncate text-xs text-muted-foreground">{item.labelEn || t("missingEn")}</span></span>
                  <Plus aria-hidden="true" className="size-4 shrink-0" />
                </button>
              ))}
            </div>
          )}
          <Button className="gap-2" onClick={() => setEditor({ labelEn: "", labelFr: "" })} size="sm" type="button" variant="outline">
            <Plus aria-hidden="true" className="size-4" /> {t("create")}
          </Button>
        </div>
      )}

      {editor && (
        <div aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
          <div className="w-full max-w-lg rounded-xl border bg-background p-5 shadow-xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div><h2 className="text-lg font-semibold">{editor.id ? t("editTitle") : t("createTitle")}</h2>{editor.id && <p className="mt-1 text-sm text-amber-700">{t("globalWarning")}</p>}</div>
              <Button aria-label={t("close")} onClick={() => setEditor(null)} size="icon-sm" type="button" variant="ghost"><X /></Button>
            </div>
            <div className="mt-5 space-y-4">
              <div className="space-y-2"><Label htmlFor="characteristic-fr">{t("labelFr")}</Label><Input autoFocus id="characteristic-fr" onChange={(event) => setEditor({ ...editor, labelFr: event.target.value })} value={editor.labelFr} /></div>
              <div className="space-y-2"><Label htmlFor="characteristic-en">{t("labelEn")}</Label><Input id="characteristic-en" onChange={(event) => setEditor({ ...editor, labelEn: event.target.value })} value={editor.labelEn} /></div>
              {error && <p className="text-sm font-medium text-destructive" role="alert">{error}</p>}
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button onClick={() => setEditor(null)} type="button" variant="outline">{t("cancel")}</Button>
              <Button disabled={isPending || !editor.labelFr.trim() || !editor.labelEn.trim()} onClick={saveCharacteristic} type="button">{isPending ? t("saving") : t("save")}</Button>
            </div>
          </div>
        </div>
      )}
    </fieldset>
  );
}
