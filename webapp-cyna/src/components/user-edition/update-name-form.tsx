"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";

import { AuthMessage } from "@/components/connection/auth-message";
import { updateProfileName } from "@/components/user-edition/action";
import { useNotification } from "@/components/ui/notification-provider";

type ActionState = { errorKey?: string; successKey?: string };
const initialState: ActionState = {};

export function UpdateNameForm({ initialName }: { initialName: string }) {
  const t = useTranslations("user_edition");
  const { notify } = useNotification();
  const [state, formAction, isPending] = useActionState(
    updateProfileName,
    initialState,
  );

  useEffect(() => {
    if (state?.successKey) notify(t(state.successKey as Parameters<typeof t>[0]));
  }, [notify, state, t]);

  return (
    <section>
      <h2 className="mb-6 text-xl font-semibold">{t("editNameTitle")}</h2>
      <form action={formAction} className="flex max-w-md flex-col gap-4">
        {state?.errorKey && (
          <AuthMessage variant="error">
            {t(state.errorKey as Parameters<typeof t>[0])}
          </AuthMessage>
        )}
        <div className="flex flex-col gap-2">
          <label className="font-medium text-slate-700" htmlFor="full-name">
            {t("fullNameLabel")}
          </label>
          <input
            autoComplete="name"
            className="rounded-md border border-slate-300 p-2 outline-none transition-shadow focus:ring-2 focus:ring-black"
            id="full-name"
            maxLength={100}
            minLength={2}
            name="fullName"
            defaultValue={initialName}
            key={initialName}
            required
            type="text"
          />
          <p className="text-xs text-slate-500">{t("fullNameHint")}</p>
        </div>
        <button
          className="min-h-11 cursor-pointer self-start rounded-md bg-purple-700 px-4 py-2 text-white transition-colors hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "..." : t("updateNameButton")}
        </button>
      </form>
    </section>
  );
}
