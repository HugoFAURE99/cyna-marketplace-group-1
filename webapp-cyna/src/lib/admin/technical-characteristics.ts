export type TechnicalCharacteristicValue = {
  id: number;
  labelEn: string | null;
  labelFr: string | null;
};

export type TechnicalCharacteristicMutationError =
  | "duplicate"
  | "invalid"
  | "not_found"
  | "migration_required"
  | "database";

export function mapTechnicalCharacteristicMutationError(error: {
  code?: string | null;
} | null): TechnicalCharacteristicMutationError {
  if (error?.code === "23505") return "duplicate";
  if (error?.code === "P0002") return "not_found";
  if (error?.code === "22023") return "invalid";
  if (error?.code === "PGRST202") return "migration_required";
  return "database";
}

export function mapTechnicalCharacteristics(rows: {
  id_caracteristique: number;
  caracteristique_technique_traduction: { langue: string; nom_caracteristique: string }[];
}[]): TechnicalCharacteristicValue[] {
  return rows.map((item) => ({
    id: item.id_caracteristique,
    labelEn: item.caracteristique_technique_traduction.find((row) => row.langue === "en")?.nom_caracteristique ?? null,
    labelFr: item.caracteristique_technique_traduction.find((row) => row.langue === "fr")?.nom_caracteristique ?? null,
  }));
}

export function normalizeTechnicalCharacteristicIds(ids: number[]): number[] {
  if (ids.some((id) => !Number.isInteger(id) || id <= 0) || new Set(ids).size !== ids.length) {
    throw new Error("INVALID_TECHNICAL_CHARACTERISTICS");
  }
  return [...ids];
}
