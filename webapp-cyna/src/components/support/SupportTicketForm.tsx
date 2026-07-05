"use client";

// Support ticket form. Uses the project's react-hook-form + zod stack (see
// admin ProductForm) and posts to the submitSupportTicket server action.
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";

import { submitSupportTicket } from "@/app/[locale]/(public)/faq/_actions/support.actions";

const fieldClass =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-200";

export default function SupportTicketForm({
  defaultEmail = "",
}: {
  defaultEmail?: string;
}) {
  const t = useTranslations("support");
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState(false);

  const schema = z.object({
    sujet: z.string().trim().min(1, t("errors.subjectRequired")),
    email_contact: z
      .string()
      .trim()
      .min(1, t("errors.emailRequired"))
      .email(t("errors.emailInvalid")),
    description: z.string().trim().min(1, t("errors.messageRequired")),
  });
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { sujet: "", email_contact: defaultEmail, description: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(false);
    const result = await submitSupportTicket(values);
    if (result.ok) {
      reset();
      setSubmitted(true);
    } else {
      setServerError(true);
    }
  });

  if (submitted) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        <CheckCircle2
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-green-600"
        />
        <p>{t("success")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <label
          htmlFor="ticket-subject"
          className="text-sm font-medium text-slate-800"
        >
          {t("subject")}
        </label>
        <input
          id="ticket-subject"
          className={fieldClass}
          placeholder={t("subjectPlaceholder")}
          {...register("sujet")}
        />
        {errors.sujet && (
          <p className="text-xs text-red-600">{errors.sujet.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="ticket-email"
          className="text-sm font-medium text-slate-800"
        >
          {t("email")}
        </label>
        <input
          id="ticket-email"
          type="email"
          className={fieldClass}
          placeholder={t("emailPlaceholder")}
          {...register("email_contact")}
        />
        {errors.email_contact && (
          <p className="text-xs text-red-600">{errors.email_contact.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="ticket-message"
          className="text-sm font-medium text-slate-800"
        >
          {t("message")}
        </label>
        <textarea
          id="ticket-message"
          rows={5}
          className={`${fieldClass} resize-y`}
          placeholder={t("messagePlaceholder")}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-xs text-red-600">{errors.description.message}</p>
        )}
      </div>

      {serverError && <p className="text-sm text-red-600">{t("error")}</p>}

      <p className="text-xs text-slate-500">{t("accountNote")}</p>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-10 items-center justify-center rounded-md bg-purple-700 px-5 text-sm font-semibold text-white transition hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
