"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { useNotification } from "@/components/ui/notification-provider";

export function AccountToast({
  kind = "success",
  message,
}: {
  kind?: "info" | "success";
  message: string;
}) {
  const router = useRouter();
  const { notify } = useNotification();
  const hasNotified = useRef(false);

  useEffect(() => {
    if (hasNotified.current) return;
    hasNotified.current = true;
    notify(message, { kind });
    router.replace(window.location.pathname, { scroll: false });
  }, [kind, message, notify, router]);

  return null;
}
