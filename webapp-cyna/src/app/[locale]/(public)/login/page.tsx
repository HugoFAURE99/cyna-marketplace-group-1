import { getTranslations, setRequestLocale } from "next-intl/server";

import { LoginForm } from "@/components/connection/login-form";
import type { Locale } from "@/lib/i18n/translations";

export default async function Login({
  params,
  searchParams, // Ajout des paramètres d'URL
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ message?: string; error?: string }>; // Typage des messages
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.login");

  // Résolution des paramètres d'URL
  const resolvedSearchParams = await searchParams;
  const message = resolvedSearchParams.message;
  const error = resolvedSearchParams.error;

  return (
    <>
      <div className="flex justify-center mt-5">
        <div className="w-50"></div>
        <div>
          <div className="my-10 text-center">
            <h1 className="text-3xl font-bold mb-5">{t("title")}</h1>
            <p>{t("subtitle")}</p>
          </div>
          {/* Affichage du message de succès venant de l'inscription */}
          {message && (
            <div className="mb-4 p-3 text-sm text-green-700 bg-green-100 rounded-md text-center">
              {message}
            </div>
          )}

          {/* Affichage d'une erreur venant du callback (ex: lien expiré) */}
          {error && (
            <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-md text-center">
              {error}
            </div>
          )}
          <div className="h-100 w-100">
            <LoginForm />
          </div>
        </div>
        <div className="w-50"></div>
      </div>
    </>
  );
}
