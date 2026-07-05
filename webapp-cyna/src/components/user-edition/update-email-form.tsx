"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { updateEmail } from "@/components/user-edition/action";
import { AuthMessage } from "@/components/connection/auth-message";

type ActionState = {
  errorKey?: string;
  successKey?: string;
};

const initialState: ActionState = {};

export function UpdateEmailForm({ initialEmail }: { initialEmail: string }) {
  const t = useTranslations("user_edition");

  const [state, formAction, isPending] = useActionState(
    updateEmail,
    initialState
  );

  return (
    <section>
      <h2 className="text-xl font-semibold mb-6">{t("editEmailTitle")}</h2>
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
          <label htmlFor="email" className="font-medium text-slate-700">
            {t("newEmailLabel")}
          </label>
          <input
            type="email"
            id="email"
            name="email"
            defaultValue={initialEmail}
            required
            className="border border-slate-300 rounded-md p-2 focus:ring-2 focus:ring-black outline-none transition-shadow"
            placeholder={t("emailPlaceholder")}
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="bg-purple-700 text-white px-4 py-2 rounded-md hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 transition-colors self-start disabled:opacity-50"
        >
          {isPending ? "..." : t("updateEmailButton")}
        </button>
      </form>
    </section>
  );
}
