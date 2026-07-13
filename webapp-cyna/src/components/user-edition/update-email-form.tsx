"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect } from "react";
import { updateEmail } from "@/components/user-edition/action";
import { AuthMessage } from "@/components/connection/auth-message";
import { useNotification } from "@/components/ui/notification-provider";

type ActionState = {
  errorKey?: string;
  successKey?: string;
};

const initialState: ActionState = {};

export function UpdateEmailForm({ initialEmail }: { initialEmail: string }) {
  const t = useTranslations("user_edition");
  const { notify } = useNotification();

  const [state, formAction, isPending] = useActionState(
    updateEmail,
    initialState
  );

  useEffect(() => {
    if (state?.successKey) {
      notify(t(state.successKey as Parameters<typeof t>[0]));
    }
  }, [notify, state, t]);

  return (
    <section>
      <h2 className="text-xl font-semibold mb-6">{t("editEmailTitle")}</h2>
      <form action={formAction} className="max-w-md flex flex-col gap-4">
        {state?.errorKey && (
          <AuthMessage variant="error">
            {t(state.errorKey as Parameters<typeof t>[0])}
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
          className="min-h-11 cursor-pointer self-start rounded-md bg-purple-700 px-4 py-2 text-white transition-colors hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 active:bg-purple-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "..." : t("updateEmailButton")}
        </button>
      </form>
    </section>
  );
}
