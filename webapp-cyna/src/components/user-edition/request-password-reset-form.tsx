"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { requestPasswordResetEmail } from "@/components/user-edition/action";
import { AuthMessage } from "@/components/connection/auth-message";

type ActionState = {
  errorKey?: string;
  successKey?: string;
  rawError?: string;
};

const initialState: ActionState = {};

export function RequestPasswordResetForm() {
  const t = useTranslations("user_edition");

  const [state, formAction, isPending] = useActionState(
    requestPasswordResetEmail,
    initialState
  );

  return (
    <section>
      <h2 className="text-xl font-semibold mb-6">{t("editPasswordTitle")}</h2>
      <form action={formAction} className="max-w-md flex flex-col gap-4">
        {state?.errorKey && (
          <AuthMessage variant="error">
            {t(state.errorKey as Parameters<typeof t>[0])}
            {state.rawError && <span className="block mt-1 text-sm font-medium">({state.rawError})</span>}
          </AuthMessage>
        )}
        {state?.successKey && (
          <AuthMessage variant="info">
            {t(state.successKey as Parameters<typeof t>[0])}
          </AuthMessage>
        )}
        <p className="text-slate-600 mb-2">
          {t("requestResetDescription") || "Vous recevrez un email contenant un lien sécurisé pour changer votre mot de passe."}
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="bg-purple-700 text-white px-4 py-2 rounded-md hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 transition-colors self-start disabled:opacity-50"
        >
          {isPending ? "..." : t("requestResetButton") || "Envoyer un email de réinitialisation"}
        </button>
      </form>
    </section>
  );
}
