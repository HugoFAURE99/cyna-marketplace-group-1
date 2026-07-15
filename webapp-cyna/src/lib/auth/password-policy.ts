export const ENFORCE_PASSWORD_COMPLEXITY = false;
export const MIN_PASSWORD_LENGTH = 8;

const COMPLEX_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;

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
