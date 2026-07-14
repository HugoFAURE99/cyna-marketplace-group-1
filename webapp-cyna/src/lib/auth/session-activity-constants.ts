export const SESSION_ACTIVITY_COOKIE = "cyna-session-active";
export const SESSION_IDLE_SECONDS = 30 * 60;
export const SESSION_HEARTBEAT_SECONDS = 60;

export function isSessionIdle(lastActivity: number, now = Date.now()): boolean {
  return !Number.isFinite(lastActivity) || now - lastActivity >= SESSION_IDLE_SECONDS * 1000;
}

export function parseStoredSessionActivity(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const timestamp = Number(value);
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null;
}

export function shouldExpireAfterHeartbeat(status: number | null): boolean {
  return status === 401;
}
