"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export function AccountToast({ message }: { message: string }) {
  const [visible, setVisible] = useState(true);
  const router = useRouter();
  const t = useTranslations("account");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
      router.replace(window.location.pathname, { scroll: false });
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [router]);

  if (!visible) return null;
  return (
    <div aria-live="polite" className="fixed right-4 top-24 z-50 flex max-w-sm items-start gap-3 rounded-lg border border-purple-200 bg-white p-4 text-sm text-slate-700 shadow-lg" role="status">
      <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-purple-700" />
      <span>{message}</span>
      <button aria-label={t("close")} className="ml-auto inline-flex size-11 items-center justify-center text-slate-400 hover:text-slate-700" onClick={() => setVisible(false)} type="button">
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
