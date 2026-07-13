"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Check, Info, TriangleAlert, X } from "lucide-react";
import { useTranslations } from "next-intl";

type NotificationKind = "success" | "info" | "error";

type NotificationOptions = {
  duration?: number;
  kind?: NotificationKind;
};

type NotificationItem = Required<NotificationOptions> & {
  id: number;
  message: string;
  exiting: boolean;
};

type NotificationContextValue = {
  notify: (message: string, options?: NotificationOptions) => number;
  dismiss: (id: number) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);
let nextNotificationId = 0;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const notify = useCallback(
    (message: string, options: NotificationOptions = {}) => {
      const id = ++nextNotificationId;
      const notification: NotificationItem = {
        id,
        message,
        kind: options.kind ?? "success",
        duration: options.duration ?? 4200,
        exiting: false,
      };

      setNotifications((current) => [...current.slice(-2), notification]);
      return id;
    },
    [],
  );

  const dismiss = useCallback((id: number) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, exiting: true }
          : notification,
      ),
    );
  }, []);

  const remove = useCallback((id: number) => {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== id),
    );
  }, []);

  const value = useMemo(() => ({ notify, dismiss }), [dismiss, notify]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div
        aria-atomic="false"
        aria-live="polite"
        className="pointer-events-none fixed left-1/2 top-[max(0.75rem,env(safe-area-inset-top))] z-[100] flex w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 flex-col items-center gap-2"
      >
        {notifications.map((notification) => (
          <NotificationPill
            key={notification.id}
            notification={notification}
            onDismiss={dismiss}
            onRemove={remove}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
}

function NotificationPill({
  notification,
  onDismiss,
  onRemove,
}: {
  notification: NotificationItem;
  onDismiss: (id: number) => void;
  onRemove: (id: number) => void;
}) {
  const t = useTranslations("notifications");

  useEffect(() => {
    if (notification.exiting) return;
    const timer = window.setTimeout(
      () => onDismiss(notification.id),
      notification.duration,
    );
    return () => window.clearTimeout(timer);
  }, [notification.duration, notification.exiting, notification.id, onDismiss]);

  useEffect(() => {
    if (!notification.exiting) return;
    const timer = window.setTimeout(() => onRemove(notification.id), 240);
    return () => window.clearTimeout(timer);
  }, [notification.exiting, notification.id, onRemove]);

  const Icon =
    notification.kind === "error"
      ? TriangleAlert
      : notification.kind === "info"
        ? Info
        : Check;

  return (
    <div
      className={`pointer-events-auto relative flex min-h-12 max-w-full items-center gap-2.5 overflow-hidden rounded-full border border-white/15 bg-gradient-to-r from-purple-950 via-purple-800 to-purple-700 py-2.5 pl-4 pr-2 text-sm font-medium text-white shadow-[0_14px_45px_-12px_rgba(88,28,135,0.72)] backdrop-blur-xl ${notification.exiting ? "cyna-notification-out" : "cyna-notification-in"}`}
      role={notification.kind === "error" ? "alert" : "status"}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/14">
        <Icon aria-hidden="true" className="size-3.5" />
      </span>
      <span className="min-w-0 break-words leading-5">{notification.message}</span>
      <button
        aria-label={t("close")}
        className="ml-1 inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/70 transition hover:bg-white/12 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        onClick={() => onDismiss(notification.id)}
        type="button"
      >
        <X aria-hidden="true" className="size-3.5" />
      </button>
    </div>
  );
}
