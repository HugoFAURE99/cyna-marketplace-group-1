"use client";

import { useCallback, useEffect, useRef } from "react";

const INITIAL_REPEAT_DELAY_MS = 350;
const REPEAT_INTERVAL_MS = 70;

export function useRepeatingPress(onStep: () => void, onRelease?: () => void) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeRef = useRef(false);
  const removeGlobalListenersRef = useRef<(() => void) | null>(null);
  const onStepRef = useRef(onStep);
  const onReleaseRef = useRef(onRelease);
  const stopRef = useRef<() => void>(() => {});

  useEffect(() => {
    onStepRef.current = onStep;
    onReleaseRef.current = onRelease;
  }, [onStep, onRelease]);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const removeGlobalListeners = useCallback(() => {
    removeGlobalListenersRef.current?.();
    removeGlobalListenersRef.current = null;
  }, []);

  const stop = useCallback(() => {
    if (!activeRef.current) {
      return;
    }
    activeRef.current = false;
    clearTimers();
    removeGlobalListeners();
    onReleaseRef.current?.();
  }, [clearTimers, removeGlobalListeners]);

  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  const start = useCallback(() => {
    activeRef.current = true;
    clearTimers();
    removeGlobalListeners();
    onStepRef.current();
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        onStepRef.current();
      }, REPEAT_INTERVAL_MS);
    }, INITIAL_REPEAT_DELAY_MS);
    const stopListener = () => stopRef.current();
    window.addEventListener("pointerup", stopListener);
    window.addEventListener("pointercancel", stopListener);
    window.addEventListener("blur", stopListener);
    removeGlobalListenersRef.current = () => {
      window.removeEventListener("pointerup", stopListener);
      window.removeEventListener("pointercancel", stopListener);
      window.removeEventListener("blur", stopListener);
    };
  }, [clearTimers, removeGlobalListeners]);

  useEffect(() => {
    return () => {
      clearTimers();
      removeGlobalListeners();
    };
  }, [clearTimers, removeGlobalListeners]);

  return {
    onPointerCancel: stop,
    onPointerDown: start,
    onPointerLeave: stop,
    onPointerUp: stop,
  };
}
