export type EnglishTranslationMutation<T> =
  | { mode: "delete" }
  | { mode: "upsert"; value: T };

export function planEnglishTranslation<T>(
  enabled: boolean,
  englishName: string | null | undefined,
  value: T,
): EnglishTranslationMutation<T> {
  if (!enabled) return { mode: "delete" };
  if (!englishName?.trim()) throw new Error("EN_NAME_REQUIRED");
  return { mode: "upsert", value };
}
