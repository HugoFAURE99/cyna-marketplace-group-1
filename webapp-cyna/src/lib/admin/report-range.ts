import type { ReportPreset, ReportRange } from "@/lib/admin/commerce-report-types";

const TIME_ZONE = "Europe/Paris" as const;
const DAY_MS = 86_400_000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type DateParts = { year: number; month: number; day: number };

function parseDateKey(value: string): DateParts | null {
  if (!DATE_PATTERN.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

function dateKey(parts: DateParts): string {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function shiftDate(key: string, days: number): string {
  const parts = parseDateKey(key);
  if (!parts) throw new Error("Invalid report date");
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return dateKey({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  });
}

function parisDateKey(now: Date): string {
  const values = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(values.find((value) => value.type === type)?.value);
  return dateKey({ year: part("year"), month: part("month"), day: part("day") });
}

function timeZoneOffset(instant: Date): number {
  const values = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(values.find((value) => value.type === type)?.value);
  const representedAsUtc = Date.UTC(
    part("year"),
    part("month") - 1,
    part("day"),
    part("hour"),
    part("minute"),
    part("second"),
  );
  return representedAsUtc - instant.getTime();
}

function parisMidnightIso(key: string): string {
  const parts = parseDateKey(key);
  if (!parts) throw new Error("Invalid report date");
  const wallClockUtc = Date.UTC(parts.year, parts.month - 1, parts.day);
  let instant = new Date(wallClockUtc - timeZoneOffset(new Date(wallClockUtc)));
  instant = new Date(wallClockUtc - timeZoneOffset(instant));
  return instant.toISOString();
}

function daysInclusive(from: string, to: string): number {
  const first = parseDateKey(from);
  const last = parseDateKey(to);
  if (!first || !last) return 0;
  return (
    Math.round(
      (Date.UTC(last.year, last.month - 1, last.day) -
        Date.UTC(first.year, first.month - 1, first.day)) /
        DAY_MS,
    ) + 1
  );
}

export function createReportRange(
  preset: ReportPreset,
  options: { from?: string; to?: string; now?: Date } = {},
): ReportRange {
  const today = parisDateKey(options.now ?? new Date());
  let from: string;
  let to = today;

  if (preset === "custom") {
    if (!options.from || !options.to || !parseDateKey(options.from) || !parseDateKey(options.to)) {
      throw new Error("INVALID_RANGE");
    }
    from = options.from;
    to = options.to;
  } else if (preset === "ytd") {
    from = `${today.slice(0, 4)}-01-01`;
  } else {
    const length = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
    from = shiftDate(today, -(length - 1));
  }

  const length = daysInclusive(from, to);
  if (length < 1 || length > 366) throw new Error("INVALID_RANGE");

  const previousTo = shiftDate(from, -1);
  const previousFrom = shiftDate(previousTo, -(length - 1));
  return {
    from,
    to,
    fromIso: parisMidnightIso(from),
    toExclusiveIso: parisMidnightIso(shiftDate(to, 1)),
    previousFrom,
    previousTo,
    previousFromIso: parisMidnightIso(previousFrom),
    previousToExclusiveIso: parisMidnightIso(shiftDate(previousTo, 1)),
    preset,
    timeZone: TIME_ZONE,
  };
}

export function reportDateKey(date: string | Date): string {
  return parisDateKey(typeof date === "string" ? new Date(date) : date);
}

export function enumerateReportDays(from: string, to: string): string[] {
  const count = daysInclusive(from, to);
  if (count < 1 || count > 366) return [];
  return Array.from({ length: count }, (_, index) => shiftDate(from, index));
}
