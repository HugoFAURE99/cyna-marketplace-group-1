export const PROFILE_NAME_MIN_LENGTH = 2;
export const PROFILE_NAME_MAX_LENGTH = 100;

export function normalizeProfileName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function isValidProfileName(value: string) {
  const normalized = normalizeProfileName(value);
  return (
    normalized.length >= PROFILE_NAME_MIN_LENGTH &&
    normalized.length <= PROFILE_NAME_MAX_LENGTH
  );
}
