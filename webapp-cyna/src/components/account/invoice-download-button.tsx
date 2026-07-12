"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { getInvoiceSignedUrl } from "@/lib/facture/facture.actions";

export function InvoiceDownloadButton({ invoiceId }: { invoiceId: number }) {
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
        className="inline-flex min-h-11 items-center gap-2 rounded-md bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800 disabled:opacity-60"
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
