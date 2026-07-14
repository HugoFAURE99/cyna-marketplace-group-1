const SVG_DATA_TYPE = "data:image/svg+xml";

/**
 * Supabase returns TOTP QR codes as raw, multiline SVG data URIs. Next Image
 * rejects those control characters, so convert the payload to one canonical,
 * percent-encoded URI before rendering it.
 */
export function normalizeTotpQrCode(value: string): string {
  const trimmed = value.trim();
  const separator = trimmed.indexOf(",");
  if (separator === -1) return "";

  const metadata = trimmed.slice(0, separator);
  if (!metadata.toLowerCase().startsWith(SVG_DATA_TYPE)) return "";
  if (metadata.toLowerCase().includes(";base64")) return trimmed;

  const payload = trimmed.slice(separator + 1);
  let svg = payload;
  try {
    svg = decodeURIComponent(payload);
  } catch {
    // A raw SVG can contain a literal percent sign. Encoding the untouched
    // payload is still safe and produces a valid data URI.
  }

  return `${SVG_DATA_TYPE};charset=utf-8,${encodeURIComponent(svg.trim())}`;
}
