"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { getInvoiceSignedUrl } from "@/lib/facture/facture.actions";

export function InvoiceDownloadButton({
  compact = false,
  invoiceId,
}: {
  compact?: boolean;
  invoiceId: number;
}) {
  const t = useTranslations("billing");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const download = async () => {
    setError(false);
    setLoading(true);
    try {
      const url = await getInvoiceSignedUrl(invoiceId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        className={`inline-flex cursor-pointer items-center gap-2 rounded-md bg-purple-700 font-semibold text-white transition hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 active:bg-purple-900 disabled:cursor-not-allowed disabled:opacity-60 ${compact ? "min-h-9 px-3 py-1.5 text-xs" : "min-h-11 px-4 py-2 text-sm"}`}
        disabled={loading}
        onClick={download}
        type="button"
      >
        {loading ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Download aria-hidden="true" className="size-4" />}
        {t("download")}
      </button>
      {error && <span className="text-xs font-medium text-purple-800" role="alert">{t("downloadError")}</span>}
    </span>
  );
}
