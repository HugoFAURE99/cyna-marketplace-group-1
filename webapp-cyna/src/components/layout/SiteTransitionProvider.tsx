"use client";

import Image from "next/image";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { usePathname, useRouter } from "@/i18n/navigation";

type TransitionRequest = {
  destination: "admin" | "marketplace";
  href: string;
  label: string;
  onNavigate?: () => void;
};

type SiteTransitionContextValue = {
  completeTransition: (
    destination: TransitionRequest["destination"],
    pathname: string,
  ) => void;
  isTransitioning: boolean;
  startTransition: (request: TransitionRequest) => void;
};

const SiteTransitionContext = createContext<SiteTransitionContextValue | null>(null);

export function SiteTransitionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [request, setRequest] = useState<TransitionRequest | null>(null);
  const [phase, setPhase] = useState<"entering" | "leaving">("entering");
  const originPathRef = useRef(pathname);
  const requestRef = useRef<TransitionRequest | null>(null);
  const navigationTimerRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);
  const finishTimerRef = useRef<number | null>(null);
  const isLeavingRef = useRef(false);

  const finishTransition = useCallback(() => {
    setRequest(null);
    setPhase("entering");
    requestRef.current = null;
    isLeavingRef.current = false;
    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    if (finishTimerRef.current !== null) {
      window.clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }
  }, []);

  const leaveTransition = useCallback(() => {
    if (!requestRef.current || isLeavingRef.current) return;

    isLeavingRef.current = true;
    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setPhase("leaving");
    finishTimerRef.current = window.setTimeout(
      finishTransition,
      reduceMotion ? 20 : 380,
    );
  }, [finishTransition]);

  const completeTransition = useCallback((
    destination: TransitionRequest["destination"],
    readyPathname: string,
  ) => {
    const activeRequest = requestRef.current;
    if (!activeRequest) return;

    const reachedRequestedDestination = activeRequest.destination === destination;
    const reachedPublicFallback =
      activeRequest.destination === "admin" &&
      destination === "marketplace" &&
      readyPathname !== originPathRef.current &&
      !readyPathname.startsWith("/mfa-verify");

    if (reachedRequestedDestination || reachedPublicFallback) {
      leaveTransition();
    }
  }, [leaveTransition]);

  const startTransition = useCallback((nextRequest: TransitionRequest) => {
    if (requestRef.current) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    originPathRef.current = pathname;
    requestRef.current = nextRequest;
    isLeavingRef.current = false;
    setRequest(nextRequest);
    setPhase("entering");

    navigationTimerRef.current = window.setTimeout(() => {
      navigationTimerRef.current = null;
      router.push(nextRequest.href);
      nextRequest.onNavigate?.();
    }, reduceMotion ? 100 : 850);

    fallbackTimerRef.current = window.setTimeout(() => {
      fallbackTimerRef.current = null;
      leaveTransition();
    }, 10_000);
  }, [leaveTransition, pathname, router]);

  useEffect(() => {
    if (!request) return;

    const root = document.documentElement;
    root.dataset.cynaSiteTransition = "active";

    return () => {
      delete root.dataset.cynaSiteTransition;
    };
  }, [request]);

  useEffect(() => () => {
    if (navigationTimerRef.current !== null) {
      window.clearTimeout(navigationTimerRef.current);
    }
    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current);
    }
    if (finishTimerRef.current !== null) {
      window.clearTimeout(finishTimerRef.current);
    }
  }, []);

  const contextValue = useMemo<SiteTransitionContextValue>(() => ({
    completeTransition,
    isTransitioning: request !== null,
    startTransition,
  }), [completeTransition, request, startTransition]);

  return (
    <SiteTransitionContext.Provider value={contextValue}>
      {children}
      {request && (
        <div
          aria-live="assertive"
          className="cyna-site-transition fixed inset-0 z-[9999] flex min-h-svh flex-col items-center justify-center bg-white px-6 text-center text-slate-950"
          data-phase={phase}
          role="status"
        >
          <Image
            alt="CYNA"
            className="h-auto w-[132px]"
            height={36}
            priority
            src="/brand/cyna-logo-v2-header.svg"
            width={132}
          />
          <p className="mt-8 text-lg font-semibold tracking-tight sm:text-xl">
            {request.label}
          </p>
          <div aria-hidden="true" className="mt-6 flex h-8 items-end gap-2">
            {[0, 1, 2].map((index) => (
              <span
                className="cyna-site-transition-dot size-2.5 rounded-full bg-purple-700"
                key={index}
                style={{ animationDelay: `${index * 140}ms` }}
              />
            ))}
          </div>
        </div>
      )}
    </SiteTransitionContext.Provider>
  );
}

export function useSiteTransition() {
  const context = useContext(SiteTransitionContext);
  if (!context) {
    throw new Error("useSiteTransition must be used within SiteTransitionProvider");
  }
  return context;
}

export function SiteTransitionReady({
  destination,
}: {
  destination: TransitionRequest["destination"];
}) {
  const pathname = usePathname();
  const { completeTransition, isTransitioning } = useSiteTransition();

  useEffect(() => {
    if (isTransitioning) completeTransition(destination, pathname);
  }, [completeTransition, destination, isTransitioning, pathname]);

  return null;
}
