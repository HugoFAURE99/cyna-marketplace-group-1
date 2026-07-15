import type {
  ReportGranularity,
  ReportPreset,
  ReportRange,
  ReportRangeErrorCode,
} from "@/lib/admin/commerce-report-types";

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

function startOfWeek(key: string): string {
  const parts = parseDateKey(key);
  if (!parts) throw new Error("Invalid report date");
  const day = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
  return shiftDate(key, -(day === 0 ? 6 : day - 1));
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

export function reportTodayKey(now = new Date()): string {
  return parisDateKey(now);
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

export class ReportRangeError extends Error {
  readonly code: ReportRangeErrorCode;

  constructor(code: ReportRangeErrorCode) {
    super(code);
    this.name = "ReportRangeError";
    this.code = code;
  }
}

export function isReportRangeError(error: unknown): error is ReportRangeError {
  return error instanceof ReportRangeError;
}

export function validateCustomReportRange(
  from: string | undefined,
  to: string | undefined,
  today = reportTodayKey(),
): ReportRangeErrorCode | null {
  if (!from || !to || !parseDateKey(from) || !parseDateKey(to)) {
    return "INVALID_DATE_FORMAT";
  }
  if (from > to) return "RANGE_REVERSED";
  if (from > today || to > today) return "RANGE_IN_FUTURE";
  if (daysInclusive(from, to) > 366) return "RANGE_TOO_LONG";
  return null;
}

export function createReportRange(
  preset: ReportPreset,
  options: { from?: string; to?: string; now?: Date } = {},
): ReportRange {
  const today = reportTodayKey(options.now ?? new Date());
  let from: string;
  let to = today;
  let granularity: ReportGranularity;

  if (preset === "custom") {
    const error = validateCustomReportRange(options.from, options.to, today);
    if (error) throw new ReportRangeError(error);
    from = options.from as string;
    to = options.to as string;
    const customLength = daysInclusive(from, to);
    granularity = customLength <= 31 ? "day" : customLength <= 120 ? "week" : "month";
  } else if (preset === "5w") {
    from = shiftDate(startOfWeek(today), -28);
    granularity = "week";
  } else {
    from = shiftDate(today, -6);
    granularity = "day";
  }

  const length = daysInclusive(from, to);
  if (length < 1) throw new ReportRangeError("RANGE_REVERSED");
  if (length > 366) throw new ReportRangeError("RANGE_TOO_LONG");

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
    granularity,
    preset,
    timeZone: TIME_ZONE,
    today,
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

export function reportBucketKey(day: string, granularity: ReportGranularity): string {
  if (granularity === "day") return day;
  if (granularity === "week") return startOfWeek(day);
  return `${day.slice(0, 7)}-01`;
}
