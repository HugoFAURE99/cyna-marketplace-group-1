"use client";

// Compact support-ticket form rendered inside the chat when CynAI calls
// open_support_form. Email is prefilled for signed-in users and they can link
// one of their orders. Submits through the shared ticket insert, then shows the
// confirmation card in place.
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";

import ChatTicketCard from "@/components/chat/ChatTicketCard";
import { submitChatSupportTicket } from "@/components/chat/ticket.actions";
import type { ChatOrderOption } from "@/lib/gemini/types";
import { SUPPORT_TICKET_CATEGORIES } from "@/lib/support/constants";

const fieldClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-200";

type ChatTicketFormProps = {
  email: string;
  orders: ChatOrderOption[];
};

export default function ChatTicketForm({ email, orders }: ChatTicketFormProps) {
  const t = useTranslations("support");
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [serverError, setServerError] = useState(false);

  const schema = z.object({
    sujet: z.string().trim().min(1, t("errors.subjectRequired")),
    email_contact: z
      .string()
      .trim()
      .min(1, t("errors.emailRequired"))
      .email(t("errors.emailInvalid")),
    description: z.string().trim().min(1, t("errors.messageRequired")),
    categorie: z.enum(SUPPORT_TICKET_CATEGORIES),
    orderId: z.string().optional(),
  });
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      sujet: "",
      email_contact: email,
      description: "",
      categorie: "other",
      orderId: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(false);
    const result = await submitChatSupportTicket({
      sujet: values.sujet,
      email_contact: values.email_contact,
      description: values.description,
      categorie: values.categorie,
      orderId: values.orderId ? Number(values.orderId) : undefined,
    });
    if (result.ok) {
      setSentEmail(values.email_contact);
    } else {
      setServerError(true);
    }
  });

  if (sentEmail) {
    return <ChatTicketCard email={sentEmail} />;
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
    >
      <p className="text-sm font-semibold text-slate-900">{t("title")}</p>

      <div className="space-y-1">
        <label htmlFor="chat-ticket-category" className="text-xs font-medium text-slate-600">{t("category")}</label>
        <select id="chat-ticket-category" className={fieldClass} {...register("categorie")}>
          {SUPPORT_TICKET_CATEGORIES.map((category) => <option key={category} value={category}>{t(`categories.${category}`)}</option>)}
        </select>
      </div>

      <div className="space-y-1">
        <input
          className={fieldClass}
          placeholder={t("subjectPlaceholder")}
          aria-label={t("subject")}
          {...register("sujet")}
        />
        {errors.sujet && (
          <p className="text-xs font-medium text-purple-700">{errors.sujet.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <input
          type="email"
          className={fieldClass}
          placeholder={t("emailPlaceholder")}
          aria-label={t("email")}
          {...register("email_contact")}
        />
        {errors.email_contact && (
          <p className="text-xs font-medium text-purple-700">{errors.email_contact.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <textarea
          rows={3}
          className={`${fieldClass} resize-y`}
          placeholder={t("messagePlaceholder")}
          aria-label={t("message")}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-xs font-medium text-purple-700">{errors.description.message}</p>
        )}
      </div>

      {orders.length > 0 && (
        <div className="space-y-1">
          <label
            htmlFor="chat-ticket-order"
            className="text-xs font-medium text-slate-600"
          >
            {t("orderLabel")}
          </label>
          <select
            id="chat-ticket-order"
            className={fieldClass}
            {...register("orderId")}
          >
            <option value="">{t("orderNone")}</option>
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {serverError && <p className="text-xs font-medium text-purple-800" role="alert">{t("error")}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-lg bg-purple-700 px-4 text-sm font-semibold text-white transition hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 active:bg-purple-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
