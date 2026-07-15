"use client";

import Image from "next/image";
import { useState } from "react";
import { KeyRound, Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrowserClient } from "@/lib/supabase/browser-client";
import { normalizeTotpQrCode } from "@/lib/auth/totp-qr";

export function MfaSettingsCard({ initialEnabled, required }: { initialEnabled: boolean; required: boolean }) {
  const t = useTranslations("account.mfa");
  const [supabase] = useState(createBrowserClient);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function beginEnrollment() {
    setLoading(true);
    setError("");
    const factors = await supabase.auth.mfa.listFactors();
    if (factors.error) { setError(t("errors.load")); setLoading(false); return; }
    await Promise.all((factors.data.all ?? []).filter((factor) => factor.factor_type === "totp" && factor.status === "unverified").map((factor) => supabase.auth.mfa.unenroll({ factorId: factor.id })));
    const enrollment = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: required ? "CYNA Back-Office" : "CYNA Account", issuer: "CYNA" });
    if (enrollment.error) { setError(t("errors.enroll")); setLoading(false); return; }
    setFactorId(enrollment.data.id);
    setQrCode(normalizeTotpQrCode(enrollment.data.totp.qr_code));
    setSecret(enrollment.data.totp.secret);
    setLoading(false);
  }

  async function verifyEnrollment(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const challenge = await supabase.auth.mfa.challenge({ factorId });
    if (challenge.error) { setError(t("errors.verify")); setLoading(false); return; }
    const verification = await supabase.auth.mfa.verify({ challengeId: challenge.data.id, code, factorId });
    if (verification.error) { setError(t("errors.code")); setLoading(false); return; }
    setEnabled(true);
    setQrCode("");
    setSecret("");
    setCode("");
    setLoading(false);
  }

  async function disableMfa() {
    if (!window.confirm(t("disableConfirm"))) return;
    setLoading(true);
    setError("");
    const factors = await supabase.auth.mfa.listFactors();
    const verified = factors.data?.totp.filter((factor) => factor.status === "verified") ?? [];
    if (factors.error || verified.length === 0) { setError(t("errors.load")); setLoading(false); return; }
    for (const factor of verified) {
      const result = await supabase.auth.mfa.unenroll({ factorId: factor.id });
      if (result.error) { setError(t("errors.disable")); setLoading(false); return; }
    }
    await supabase.auth.refreshSession();
    setEnabled(false);
    setLoading(false);
  }

  return (
    <section className="w-full min-w-0 max-w-3xl rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-700 ring-1 ring-purple-100">
          {enabled ? <ShieldCheck aria-hidden="true" className="size-5" /> : <ShieldOff aria-hidden="true" className="size-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div><h2 className="font-semibold text-slate-950">{t("title")}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{required ? t("requiredDescription") : enabled ? t("enabledDescription") : t("disabledDescription")}</p></div>
            <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{enabled ? t("enabled") : t("disabled")}</span>
          </div>

          {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}

          {!enabled && !qrCode && <Button className="mt-4 gap-2" disabled={loading} onClick={() => void beginEnrollment()} type="button"><KeyRound aria-hidden="true" className="size-4" />{loading ? t("loading") : t("enable")}</Button>}
          {enabled && !required && <Button className="mt-4" disabled={loading} onClick={() => void disableMfa()} type="button" variant="outline">{loading ? t("loading") : t("disable")}</Button>}

          {!enabled && qrCode && (
            <form className="mt-5 space-y-4" onSubmit={verifyEnrollment}>
              <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
                <div className="w-fit rounded-xl border bg-white p-2"><Image alt={t("qrAlt")} className="size-40" height={160} src={qrCode} unoptimized width={160} /></div>
                <div className="min-w-0"><p className="text-sm text-slate-600">{t("setupInstructions")}</p><p className="mt-3 text-xs font-medium text-slate-500">{t("manualSecret")}</p><code className="mt-1 block break-all rounded bg-slate-50 p-2 text-xs">{secret}</code></div>
              </div>
              <Input aria-label={t("code")} autoComplete="one-time-code" inputMode="numeric" maxLength={6} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" value={code} />
              <Button disabled={loading || code.length !== 6} type="submit">{loading ? <Loader2 className="size-4 animate-spin" /> : t("verify")}</Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
