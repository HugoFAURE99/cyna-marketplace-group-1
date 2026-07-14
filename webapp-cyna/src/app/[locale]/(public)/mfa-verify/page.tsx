"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

function MFAForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("mfa");

  const next = searchParams.get("next") ?? "/";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [code, setCode] = useState("");
  const [isEnrolled, setIsEnrolled] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    checkMfaStatus();
    /*
    eslint-disable-next-line react-hooks/exhaustive-deps
    */
  }, []);

  async function checkMfaStatus() {
    setLoading(true);

    const { data: aalData } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalData?.currentLevel === "aal2") {
      router.push(next);
      return;
    }

    const { data: factors, error: factorsError } =
      await supabase.auth.mfa.listFactors();
    if (factorsError) {
      setError(t("errorFetchParams"));
      setLoading(false);
      return;
    }

    const totpFactor = factors?.totp[0];

    if (totpFactor && totpFactor.status === "verified") {
      setIsEnrolled(true);
      setFactorId(totpFactor.id);
    } else {
      const { data: enrollData, error: enrollError } =
        await supabase.auth.mfa.enroll({
          factorType: "totp",
        });

      if (enrollError) {
        setError(t("errorGenQr"));
      } else {
        setFactorId(enrollData.id);
        setQrCode(enrollData.totp.qr_code);
      }
    }
    setLoading(false);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const challenge = await supabase.auth.mfa.challenge({ factorId });
    if (challenge.error) {
      setError(t("errorChallenge"));
      setLoading(false);
      return;
    }

    const verify = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code,
    });

    if (verify.error) {
      setError(t("errorCode"));
      setLoading(false);
    } else {
      router.push(next);
    }
  }

  if (loading && !factorId) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 animate-spin text-purple-700" />
        <p className="text-sm text-slate-500">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-12 w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="h-1 w-full bg-gradient-to-r from-purple-700 via-fuchsia-500 to-purple-400" />

      <div className="p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700 ring-1 ring-purple-100">
            {isEnrolled ? (
              <ShieldCheck className="size-6" />
            ) : (
              <ShieldAlert className="size-6" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-950">
              {isEnrolled ? t("titleVerify") : t("titleSetup")}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {isEnrolled ? t("descVerify") : t("descSetup")}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {!isEnrolled && qrCode && (
          <div className="mb-6 flex flex-col items-center justify-center rounded-lg border border-slate-100 bg-slate-50 p-4">
            <img
              src={qrCode}
              alt="QR Code 2FA"
              className="size-48 object-contain"
            />
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label
              htmlFor="code"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              {t("authCodeLabel")}
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              required
              className="block w-full rounded-md border-slate-300 py-3 text-center text-2xl tracking-[0.5em] text-slate-900 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-lg"
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-purple-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              t("submitButton")
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function MFAVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-purple-700" />
        </div>
      }
    >
      <MFAForm />
    </Suspense>
  );
}
