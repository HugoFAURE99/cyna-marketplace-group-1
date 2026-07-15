import { getTranslations, setRequestLocale } from "next-intl/server";

import { LoginForm } from "@/components/connection/login-form";
import { AuthMessage } from "@/components/connection/auth-message";
import { AccountToast } from "@/components/account/account-toast";
import type { Locale } from "@/lib/i18n/translations";

// Query-param keys the auth flow may redirect here with. We map them to
// translated copy so the user never sees a raw key like "checkEmail".
const MESSAGE_KEYS = [
  "checkEmail",
  "confirmationLinkUsed",
  "emailConfirmed",
  "updatePasswordSuccess",
] as const;
const ERROR_KEYS = ["invalidLink", "errorInactive"] as const;

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

  const messageText = MESSAGE_KEYS.includes(message as never)
    ? t(message as never)
    : message;
  const errorText = ERROR_KEYS.includes(error as never)
    ? t(error as never)
    : error;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>

        {/* Message de succès venant de l'inscription / reset (traduit) */}
        {messageText && (
          <AccountToast
            kind={message === "confirmationLinkUsed" ? "info" : "success"}
            message={messageText}
          />
        )}

        {/* Erreur venant du callback (ex: lien expiré) (traduit) */}
        {errorText && <AuthMessage variant="error">{errorText}</AuthMessage>}

        <div className="w-full">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
