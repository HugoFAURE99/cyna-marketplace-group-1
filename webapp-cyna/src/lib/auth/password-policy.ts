export const ENFORCE_PASSWORD_COMPLEXITY = false;
export const MIN_PASSWORD_LENGTH = 8;

const COMPLEX_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;

export type PasswordValidationKey = "errorTooShort" | "errorComplexity";

export function validatePassword(password: string): PasswordValidationKey | null {
  if (password.length < MIN_PASSWORD_LENGTH) return "errorTooShort";
  if (ENFORCE_PASSWORD_COMPLEXITY && !COMPLEX_PASSWORD.test(password)) {
    return "errorComplexity";
  }
  return null;
}
