"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useNotification } from "@/components/ui/notification-provider";

export function AccountToast({ message }: { message: string }) {
  const router = useRouter();
  const { notify } = useNotification();

  useEffect(() => {
    notify(message);
    router.replace(window.location.pathname, { scroll: false });
  }, [message, notify, router]);

  return null;
}
