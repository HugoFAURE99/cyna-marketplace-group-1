"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { updateDashboardPassword } from "@/components/user-edition/action";
import { AuthMessage } from "@/components/connection/auth-message";

type ActionState = {
  errorKey?: string;
  successKey?: string;
};

const initialState: ActionState = {};

export function UpdatePasswordForm() {
  const t = useTranslations("user_edition");

  const [state, formAction, isPending] = useActionState(
    updateDashboardPassword,
    initialState
  );

  return (
    <section>
      <h2 className="text-xl font-semibold mb-6">{t("editPasswordTitle")}</h2>
      <form action={formAction} className="max-w-md flex flex-col gap-4">
        {state?.errorKey && (
          <AuthMessage variant="error">
            {t(state.errorKey as Parameters<typeof t>[0])}
          </AuthMessage>
        )}
        {state?.successKey && (
          <AuthMessage variant="info">
            {t(state.successKey as Parameters<typeof t>[0])}
          </AuthMessage>
        )}
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="font-medium text-slate-700">
            {t("newPasswordLabel")}
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            className="border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-black outline-none transition-shadow"
            placeholder={t("passwordPlaceholder")}
          />
          <p className="text-xs text-slate-500">{t("passwordRequirements")}</p>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="password_confirm" className="font-medium text-slate-700">
            {t("confirmPasswordLabel")}
          </label>
          <input
            type="password"
            id="password_confirm"
            name="password_confirm"
            required
            className="border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-black outline-none transition-shadow"
            placeholder={t("passwordPlaceholder")}
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="min-h-11 cursor-pointer self-start rounded-md bg-purple-700 px-4 py-2 text-white transition-colors hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 active:bg-purple-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "..." : t("updatePasswordButton")}
        </button>
      </form>
    </section>
  );
}
