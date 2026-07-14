import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isSessionIdle,
  parseStoredSessionActivity,
  SESSION_HEARTBEAT_SECONDS,
  SESSION_IDLE_SECONDS,
  shouldExpireAfterHeartbeat,
} from "@/lib/auth/session-activity-constants";

describe("session inactivity", () => {
  afterEach(() => vi.useRealTimers());

  it("expires at exactly 30 minutes and not before", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-14T12:00:00Z"));
    const activity = Date.now();
    vi.advanceTimersByTime(SESSION_IDLE_SECONDS * 1000 - 1);
    expect(isSessionIdle(activity)).toBe(false);
    vi.advanceTimersByTime(1);
    expect(isSessionIdle(activity)).toBe(true);
  });

  it("allows activity from another tab to reset the deadline", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-14T12:00:00Z"));
    const firstTabActivity = Date.now();
    vi.advanceTimersByTime(20 * 60 * 1000);
    const crossTabActivity = Date.now();
    expect(isSessionIdle(firstTabActivity)).toBe(false);
    vi.advanceTimersByTime(10 * 60 * 1000);
    expect(isSessionIdle(firstTabActivity)).toBe(true);
    expect(isSessionIdle(crossTabActivity)).toBe(false);
  });

  it("keeps server heartbeats substantially shorter than the idle window", () => {
    expect(SESSION_HEARTBEAT_SECONDS).toBeLessThan(SESSION_IDLE_SECONDS);
    expect(isSessionIdle(Number.NaN)).toBe(true);
  });

  it("does not interpret a missing browser marker as an ancient activity timestamp", () => {
    expect(parseStoredSessionActivity(null)).toBeNull();
    expect(parseStoredSessionActivity("")).toBeNull();
    expect(parseStoredSessionActivity("not-a-date")).toBeNull();
    expect(parseStoredSessionActivity("0")).toBeNull();
    expect(parseStoredSessionActivity("1720958400000")).toBe(1720958400000);
  });

  it("expires only when the server authoritatively rejects the session", () => {
    expect(shouldExpireAfterHeartbeat(401)).toBe(true);
    expect(shouldExpireAfterHeartbeat(null)).toBe(false);
    expect(shouldExpireAfterHeartbeat(500)).toBe(false);
    expect(shouldExpireAfterHeartbeat(503)).toBe(false);
    expect(shouldExpireAfterHeartbeat(200)).toBe(false);
  });
});
