import { cookies } from "next/headers";

import { SESSION_ACTIVITY_COOKIE, SESSION_IDLE_SECONDS } from "@/lib/auth/session-activity-constants";

export { SESSION_ACTIVITY_COOKIE, SESSION_IDLE_SECONDS } from "@/lib/auth/session-activity-constants";

export async function markServerSessionActive() {
  const store = await cookies();
  store.set(SESSION_ACTIVITY_COOKIE, String(Date.now()), {
    httpOnly: true,
    maxAge: SESSION_IDLE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearServerSessionActivity() {
  const store = await cookies();
  store.delete(SESSION_ACTIVITY_COOKIE);
}
