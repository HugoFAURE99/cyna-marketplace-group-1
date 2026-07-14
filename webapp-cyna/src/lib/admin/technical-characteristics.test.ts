import { describe, expect, it } from "vitest";

import {
  mapTechnicalCharacteristicMutationError,
  mapTechnicalCharacteristics,
  normalizeTechnicalCharacteristicIds,
} from "@/lib/admin/technical-characteristics";
import { pickTranslation } from "@/lib/i18n/translations";

describe("translated technical characteristics", () => {
  it("loads paired and incomplete normalized translations", () => {
    const values = mapTechnicalCharacteristics([
      { id_caracteristique: 3, caracteristique_technique_traduction: [{ langue: "fr", nom_caracteristique: "Console centralisée" }, { langue: "en", nom_caracteristique: "Centralized console" }] },
      { id_caracteristique: 8, caracteristique_technique_traduction: [{ langue: "fr", nom_caracteristique: "Historique" }] },
    ]);
    expect(values).toEqual([
      { id: 3, labelEn: "Centralized console", labelFr: "Console centralisée" },
      { id: 8, labelEn: null, labelFr: "Historique" },
    ]);
  });

  it("preserves association order and accepts explicit removal", () => {
    expect(normalizeTechnicalCharacteristicIds([8, 3, 12])).toEqual([8, 3, 12]);
    expect(normalizeTechnicalCharacteristicIds([])).toEqual([]);
  });

  it("rejects duplicate and invalid associations before the database call", () => {
    expect(() => normalizeTechnicalCharacteristicIds([3, 3])).toThrow("INVALID_TECHNICAL_CHARACTERISTICS");
    expect(() => normalizeTechnicalCharacteristicIds([0])).toThrow("INVALID_TECHNICAL_CHARACTERISTICS");
  });

  it("keeps the storefront locale fallback for incomplete existing rows", () => {
    const translations = [{ langue: "fr", nom_caracteristique: "Historique" }];
    expect(pickTranslation(translations, "en")?.nom_caracteristique).toBe("Historique");
  });

  it("reports a missing transactional RPC as a pending database migration", () => {
    expect(mapTechnicalCharacteristicMutationError({ code: "PGRST202" })).toBe("migration_required");
    expect(mapTechnicalCharacteristicMutationError({ code: "23505" })).toBe("duplicate");
    expect(mapTechnicalCharacteristicMutationError({ code: "P0002" })).toBe("not_found");
    expect(mapTechnicalCharacteristicMutationError({ code: "22023" })).toBe("invalid");
    expect(mapTechnicalCharacteristicMutationError({ code: "XX000" })).toBe("database");
  });
});
