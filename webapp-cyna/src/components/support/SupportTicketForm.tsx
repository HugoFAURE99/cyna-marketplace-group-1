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
import type { ChatOrderOption } from "@/lib/gemini/types";

const fieldClass =
  "min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-200";

export default function SupportTicketForm({
  defaultEmail = "",
  isAuthenticated = false,
  orders = [],
}: {
  defaultEmail?: string;
  isAuthenticated?: boolean;
  orders?: ChatOrderOption[];
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
    orderId: z.string().optional(),
  });
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { sujet: "", email_contact: defaultEmail, description: "", orderId: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(false);
    const result = await submitSupportTicket({
      sujet: values.sujet,
      email_contact: values.email_contact,
      description: values.description,
      orderId: values.orderId ? Number(values.orderId) : undefined,
    });
    if (result.ok) {
      reset();
      setSubmitted(true);
    } else {
      setServerError(true);
    }
  });

  if (submitted) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-purple-200 bg-purple-50 p-4 text-sm text-purple-900">
        <CheckCircle2
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-purple-700"
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
          <p className="text-xs font-medium text-purple-700">{errors.sujet.message}</p>
        )}
      </div>

      {orders.length > 0 && (
        <div className="space-y-1.5">
          <label htmlFor="ticket-order" className="text-sm font-medium text-slate-800">{t("orderLabel")}</label>
          <select id="ticket-order" className={fieldClass} {...register("orderId")}>
            <option value="">{t("orderNone")}</option>
            {orders.map((order) => <option key={order.id} value={order.id}>{order.label}</option>)}
          </select>
        </div>
      )}

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
          <p className="text-xs font-medium text-purple-700">{errors.email_contact.message}</p>
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
          <p className="text-xs font-medium text-purple-700">{errors.description.message}</p>
        )}
      </div>

      {serverError && <p className="text-sm font-medium text-purple-800" role="alert">{t("error")}</p>}

      {isAuthenticated && <p className="text-xs text-slate-500">{t("accountNote")}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-purple-700 px-5 text-sm font-semibold text-white transition hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {isSubmitting ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
