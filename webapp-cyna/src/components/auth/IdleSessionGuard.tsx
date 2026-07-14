"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "next-intl";

import {
  isSessionIdle,
  parseStoredSessionActivity,
  SESSION_HEARTBEAT_SECONDS,
  shouldExpireAfterHeartbeat,
} from "@/lib/auth/session-activity-constants";
import { createBrowserClient } from "@/lib/supabase/browser-client";

const STORAGE_KEY = "cyna:last-activity";
const CHANNEL_NAME = "cyna:session";

export function IdleSessionGuard() {
  const locale = useLocale() === "en" ? "en" : "fr";
  const lastHeartbeat = useRef(0);
  const expiring = useRef(false);

  useEffect(() => {
    const supabase = createBrowserClient();
    const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(CHANNEL_NAME);
    let authenticated = false;

    async function expireSession(broadcast = true) {
      if (expiring.current) return;
      expiring.current = true;
      if (broadcast) channel?.postMessage({ type: "logout" });
      localStorage.removeItem(STORAGE_KEY);
      try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
      window.location.assign(`/${locale}/login?message=sessionExpired`);
    }

    async function heartbeat(now: number) {
      if (!authenticated || now - lastHeartbeat.current < SESSION_HEARTBEAT_SECONDS * 1000) return;
      lastHeartbeat.current = now;
      const response = await fetch("/api/auth/activity", { method: "POST" }).catch(() => null);
      if (shouldExpireAfterHeartbeat(response?.status ?? null)) {
        await expireSession();
        return;
      }
      if (!response?.ok) lastHeartbeat.current = 0;
    }

    function recordActivity() {
      if (!authenticated || expiring.current) return;
      const now = Date.now();
      localStorage.setItem(STORAGE_KEY, String(now));
      channel?.postMessage({ type: "activity", at: now });
      void heartbeat(now);
    }

    function handleChannel(event: MessageEvent<{ type: string; at?: number }>) {
      if (event.data.type === "logout") void expireSession(false);
      if (event.data.type === "activity" && event.data.at) localStorage.setItem(STORAGE_KEY, String(event.data.at));
    }

    channel?.addEventListener("message", handleChannel);
    const events: (keyof WindowEventMap)[] = ["keydown", "pointerdown", "scroll", "touchstart"];
    events.forEach((eventName) => window.addEventListener(eventName, recordActivity, { passive: true }));

    void supabase.auth.getSession().then(({ data }) => {
      authenticated = Boolean(data.session);
      if (!authenticated) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      const stored = parseStoredSessionActivity(localStorage.getItem(STORAGE_KEY));
      const now = Date.now();
      if (stored !== null && isSessionIdle(stored, now)) {
        void expireSession();
        return;
      }
      localStorage.setItem(STORAGE_KEY, String(now));
      void heartbeat(now);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      authenticated = Boolean(session);
      if (!session && (event === "INITIAL_SESSION" || event === "SIGNED_OUT")) {
        localStorage.removeItem(STORAGE_KEY);
      }
      if (event === "SIGNED_IN") recordActivity();
    });

    const timer = window.setInterval(() => {
      if (!authenticated || expiring.current) return;
      const lastActivity = parseStoredSessionActivity(localStorage.getItem(STORAGE_KEY));
      if (lastActivity === null) {
        recordActivity();
        return;
      }
      if (isSessionIdle(lastActivity)) void expireSession();
    }, 5_000);

    return () => {
      window.clearInterval(timer);
      authListener.subscription.unsubscribe();
      events.forEach((eventName) => window.removeEventListener(eventName, recordActivity));
      channel?.removeEventListener("message", handleChannel);
      channel?.close();
    };
  }, [locale]);

  return null;
}
