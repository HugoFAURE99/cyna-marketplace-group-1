"use client";

// In-chat confirmation shown after CynAI files a support ticket via the
// create_support_ticket tool.
import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function ChatTicketCard({ email }: { email: string }) {
  const t = useTranslations("chat");

  return (
    <div className="flex items-start gap-3 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2.5">
      <CheckCircle2
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0 text-purple-700"
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-purple-900">
          {t("ticketCreatedTitle")}
        </p>
        <p className="text-xs text-purple-700">
          {t("ticketCreatedSubtitle", { email })}
        </p>
      </div>
    </div>
  );
}
