"use client";

import { useEffect, useCallback, useState } from "react";

export function useUnsavedChanges(isDirty: boolean) {
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // Browser-level: tab close, refresh, external navigation
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Client-side navigation guard: intercept link clicks
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#")) return;
      e.preventDefault();
      e.stopPropagation();
      setPendingHref(href);
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [isDirty]);

  const confirmNavigation = useCallback(() => {
    if (pendingHref) {
      window.location.href = pendingHref;
    }
  }, [pendingHref]);

  const cancelNavigation = useCallback(() => {
    setPendingHref(null);
  }, []);

  const guardNavigation = useCallback(
    (href: string, navigate: () => void) => {
      if (isDirty) {
        setPendingHref(href);
      } else {
        navigate();
      }
    },
    [isDirty],
  );

  return {
    showUnsavedDialog: pendingHref !== null,
    confirmNavigation,
    cancelNavigation,
    guardNavigation,
  };
}
