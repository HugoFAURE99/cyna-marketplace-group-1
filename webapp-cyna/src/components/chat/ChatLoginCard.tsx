"use client";

// In-chat sign-in invitation. Shown when a logged-out user asks CynAI to open a
// support ticket — ticketing is account-only, so we point them to log in or
// register with clean buttons right inside the chat bubble.
import { LogIn, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

export default function ChatLoginCard() {
  const t = useTranslations("chat");

  return (
    <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">
        {t("loginCardTitle")}
      </p>
      <p className="mt-1 text-xs text-slate-600">{t("loginCardSubtitle")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-purple-700 px-4 text-sm font-semibold text-white transition hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700"
          href="/login"
        >
          <LogIn aria-hidden="true" className="size-4" />
          {t("loginCardLogIn")}
        </Link>
        <Link
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-purple-700 bg-white px-4 text-sm font-semibold text-purple-700 transition hover:bg-purple-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700"
          href="/register"
        >
          <UserPlus aria-hidden="true" className="size-4" />
          {t("loginCardSignUp")}
        </Link>
      </div>
    </div>
  );
}
