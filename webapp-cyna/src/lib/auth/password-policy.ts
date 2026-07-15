export const ENFORCE_PASSWORD_COMPLEXITY = true;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_USERNAME_LENGTH = 12;

const COMPLEX_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;

// Règles individuelles, réutilisées côté client pour l'affichage temps réel
// et côté serveur pour la validation. Une seule source de vérité.
export type PasswordRuleId =
  | "length"
  | "uppercase"
  | "lowercase"
  | "number"
  | "special";

export const PASSWORD_RULES: Record<PasswordRuleId, (password: string) => boolean> = {
  length: (password) => password.length >= MIN_PASSWORD_LENGTH,
  uppercase: (password) => /[A-Z]/.test(password),
  lowercase: (password) => /[a-z]/.test(password),
  number: (password) => /\d/.test(password),
  special: (password) => /[^A-Za-z\d]/.test(password),
};

export function isUsernameValid(username: string): boolean {
  const trimmed = username.trim();
  return trimmed.length >= 1 && trimmed.length <= MAX_USERNAME_LENGTH;
}

export type PasswordValidationKey =
  | "errorCompromised"
  | "errorComplexity"
  | "errorTooShort"
  | "errorWeakPassword";

export function validatePassword(password: string): PasswordValidationKey | null {
  if (password.length < MIN_PASSWORD_LENGTH) return "errorTooShort";
  if (ENFORCE_PASSWORD_COMPLEXITY && !COMPLEX_PASSWORD.test(password)) {
    return "errorComplexity";
  }
  return null;
}

export function getAuthPasswordErrorKey(error: unknown): PasswordValidationKey | null {
  if (!error || typeof error !== "object" || !("code" in error) || error.code !== "weak_password") {
    return null;
  }

  const reasons = "reasons" in error && Array.isArray(error.reasons)
    ? error.reasons
    : [];

  if (reasons.includes("length")) return "errorTooShort";
  if (reasons.includes("characters")) return "errorComplexity";
  if (reasons.includes("pwned")) return "errorCompromised";
  return "errorWeakPassword";
}
