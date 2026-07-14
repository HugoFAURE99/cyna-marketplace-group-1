"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Loader2, LogOut, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { createBrowserClient } from "@/lib/supabase/browser-client";
import { logout } from "@/app/(auth)/_action/auth.action";
import { requestMfaRecovery } from "@/app/(auth)/_action/mfa.action";
import { normalizeTotpQrCode } from "@/lib/auth/totp-qr";

export function MfaPanel({ mode, next }: { mode: "challenge" | "required-admin-enrollment"; next: string }) {
  const router = useRouter();
  const t = useTranslations("mfa");
  const locale = useLocale();
  const [supabase] = useState(createBrowserClient);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState("");

  const prepareFactor = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance?.currentLevel === "aal2") {
      router.replace(next);
      return;
    }

    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) {
      setError(t("errorFetchParams"));
      setLoading(false);
      return;
    }

    const verified = factors?.totp.find((factor) => factor.status === "verified");
    if (verified) {
      setFactorId(verified.id);
      setQrCode("");
      setIsEnrolled(true);
      setLoading(false);
      return;
    }

    if (mode === "challenge") {
      setError(t("errorNoFactor"));
      setLoading(false);
      return;
    }

    const staleFactors = factors?.all.filter(
      (factor) => factor.factor_type === "totp" && factor.status === "unverified",
    ) ?? [];
    await Promise.all(
      staleFactors.map((factor) => supabase.auth.mfa.unenroll({ factorId: factor.id })),
    );

    const { data: enrollment, error: enrollmentError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "CYNA BackOffice",
      issuer: "CYNA",
    });
    if (enrollmentError) {
      setError(t("errorGenQr"));
      setLoading(false);
      return;
    }

    setFactorId(enrollment.id);
    setQrCode(normalizeTotpQrCode(enrollment.totp.qr_code));
    setSecret(enrollment.totp.secret);
    setIsEnrolled(false);
    setLoading(false);
  }, [mode, next, router, supabase, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void prepareFactor(), 0);
    return () => window.clearTimeout(timer);
  }, [prepareFactor]);

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const challenge = await supabase.auth.mfa.challenge({ factorId });
    if (challenge.error) {
      setError(t("errorChallenge"));
      setLoading(false);
      return;
    }

    const verification = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code,
    });
    if (verification.error) {
      setError(t("errorCode"));
      setLoading(false);
      return;
    }

    router.replace(next);
    router.refresh();
  }

  async function handleRecovery() {
    setRecoveryMessage("");
    const result = await requestMfaRecovery(locale);
    if (result.ok) setRecoveryMessage(t("recoveryCreated", { id: result.ticketId.slice(0, 8) }));
    else setRecoveryMessage(t(`recoveryErrors.${result.error}`));
  }

  return (
    <main className="flex min-h-[calc(100vh-72px)] items-start justify-center bg-slate-50 px-4 py-8 sm:items-center sm:px-6 sm:py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8" aria-live="polite">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700 ring-1 ring-purple-100 sm:size-12">
            {isEnrolled ? <ShieldCheck aria-hidden="true" className="size-6" /> : <ShieldAlert aria-hidden="true" className="size-6" />}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">
              {isEnrolled ? t("titleVerify") : t("titleSetup")}
            </h1>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {isEnrolled ? t("descVerify") : t("descSetup")}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
            <p>{error}</p>
            <button className="mt-3 inline-flex min-h-10 items-center gap-2 font-semibold underline underline-offset-4" onClick={() => void prepareFactor()} type="button">
              <RefreshCw aria-hidden="true" className="size-4" />
              {t("retry")}
            </button>
          </div>
        )}

        {loading && !factorId ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-sm text-slate-500">
            <Loader2 aria-hidden="true" className="size-7 animate-spin text-purple-700" />
            {t("loading")}
          </div>
        ) : (
          <>
            {!isEnrolled && qrCode && (
              <div className="mt-6 space-y-3"><div className="mx-auto flex w-fit max-w-full items-center justify-center rounded-xl border border-slate-200 bg-white p-3"><Image alt={t("qrAlt")} className="size-44 max-w-full object-contain sm:size-52" height={208} src={qrCode} unoptimized width={208} /></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-medium text-slate-500">{t("manualSecret")}</p><code className="mt-1 block break-all text-sm text-slate-800">{secret}</code></div></div>
            )}
            <form className="mt-6 space-y-4" onSubmit={handleVerify}>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="mfa-code">{t("authCodeLabel")}</label>
                <input
                  aria-invalid={!!error}
                  autoComplete="one-time-code"
                  autoFocus
                  className="block min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-center text-xl font-semibold tracking-[0.35em] text-slate-950 shadow-xs outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  id="mfa-code"
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  pattern="[0-9]{6}"
                  placeholder="123456"
                  required
                  type="text"
                  value={code}
                />
              </div>
              <button className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-purple-700 px-4 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50" disabled={loading || code.length !== 6 || !factorId} type="submit">
                {loading ? <Loader2 aria-hidden="true" className="size-5 animate-spin" /> : t("submitButton")}
              </button>
            </form>
            {isEnrolled && (
              <div className="mt-5 border-t border-slate-200 pt-4 text-center">
                <button className="text-sm font-semibold text-purple-800 underline underline-offset-4" onClick={() => void handleRecovery()} type="button">{t("lostAuthenticator")}</button>
                {recoveryMessage && <p className="mt-2 text-sm text-slate-600" role="status">{recoveryMessage}</p>}
              </div>
            )}
          </>
        )}
        <div className="mt-5 border-t border-slate-200 pt-4">
          <form action={logout}>
            <button
              className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700"
              type="submit"
            >
              <LogOut aria-hidden="true" className="size-4" />
              {t("exitAndSignOut")}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
