import { BotMessageSquare, ExternalLink, Search } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  getChatTranscript,
  listChatConversations,
} from "@/app/[locale]/(admin)/admin/_actions/chatbot.actions";
import { DeleteConversationButton } from "@/components/admin/ChatbotHistory/DeleteConversationButton";
import AdminBackButton from "@/components/admin/AdminBackButton";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/i18n/translations";
import type { Json } from "@/types/database.types";

type Query = {
  audience?: string;
  detail?: string;
  localeFilter?: string;
  page?: string;
  search?: string;
};

export default async function ChatbotHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Query>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const t = await getTranslations("admin.chatbot");
  const formatDate = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  if (query.detail) {
    const transcript = await getChatTranscript(query.detail);
    return (
      <div className="space-y-6">
        <AdminBackButton
          href="/admin/chatbot"
          label={t("back")}
        />
        {!transcript ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            {t("notFound")}
          </div>
        ) : (
          <>
            <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-2xl font-bold">{t("transcriptTitle")}</h1>
                <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                  {transcript.id}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-muted px-3 py-1">
                    {transcript.isGuest ? t("guest") : t("account")}
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1 uppercase">
                    {transcript.locale}
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1">
                    {t("messages", { count: transcript.messageCount })}
                  </span>
                </div>
                {!transcript.isGuest && (
                  <Link
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                    href="/admin/users"
                  >
                    {transcript.accountName ?? transcript.accountEmail}
                    <ExternalLink aria-hidden="true" className="size-3.5" />
                  </Link>
                )}
              </div>
              <DeleteConversationButton
                confirmMessage={t("deleteConfirm")}
                conversationId={transcript.id}
                label={t("delete")}
              />
            </header>

            <section className="space-y-4" aria-label={t("transcriptTitle")}>
              {transcript.messages.map((message) => (
                <article
                  className={`max-w-4xl rounded-xl border p-4 shadow-sm ${
                    message.role === "user"
                      ? "ml-auto border-purple-200 bg-purple-50"
                      : "mr-auto bg-card"
                  }`}
                  key={message.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <strong className="uppercase tracking-wide text-foreground">
                      {t(message.role === "user" ? "user" : "assistant")}
                    </strong>
                    <span>{formatDate.format(new Date(message.createdAt))}</span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">
                    {message.content}
                  </p>
                  <MetadataSummary metadata={message.metadata} />
                  {message.status === "error" && (
                    <p className="mt-3 text-xs font-semibold text-destructive">
                      {t("partialError")}
                    </p>
                  )}
                </article>
              ))}
            </section>
          </>
        )}
      </div>
    );
  }

  const audience = ["account", "guest"].includes(query.audience ?? "")
    ? (query.audience as "account" | "guest")
    : "all";
  const localeFilter = ["fr", "en"].includes(query.localeFilter ?? "")
    ? (query.localeFilter as "fr" | "en")
    : undefined;
  const result = await listChatConversations({
    audience,
    locale: localeFilter,
    page: Number(query.page) || 1,
    search: query.search,
  });

  const href = (values: Partial<Query>) => {
    const next = new URLSearchParams();
    const merged = { ...query, ...values };
    Object.entries(merged).forEach(([key, value]) => {
      if (value) next.set(key, value);
    });
    return `/admin/chatbot?${next.toString()}`;
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <BotMessageSquare aria-hidden="true" className="size-6 text-primary" />
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <form className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <label className="grid min-w-56 flex-1 gap-1 text-xs font-medium text-muted-foreground">
          {t("search")}
          <span className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <input
              className="min-h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm text-foreground"
              defaultValue={query.search}
              name="search"
              type="search"
            />
          </span>
        </label>
        <label className="grid gap-1 text-xs font-medium text-muted-foreground">
          {t("audience")}
          <select className="min-h-10 rounded-md border bg-background px-3 text-sm text-foreground" defaultValue={audience} name="audience">
            <option value="all">{t("all")}</option>
            <option value="account">{t("account")}</option>
            <option value="guest">{t("guest")}</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-muted-foreground">
          {t("locale")}
          <select className="min-h-10 rounded-md border bg-background px-3 text-sm text-foreground" defaultValue={localeFilter ?? ""} name="localeFilter">
            <option value="">{t("all")}</option>
            <option value="fr">FR</option>
            <option value="en">EN</option>
          </select>
        </label>
        <button className="min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground" type="submit">
          {t("apply")}
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr><th className="px-4 py-3">{t("audience")}</th><th className="px-4 py-3">{t("preview")}</th><th className="px-4 py-3">{t("locale")}</th><th className="px-4 py-3">{t("messagesLabel")}</th><th className="px-4 py-3">{t("lastActivity")}</th><th className="px-4 py-3">{t("actions")}</th></tr>
            </thead>
            <tbody>
              {result.items.length ? result.items.map((item) => (
                <tr className="border-t" key={item.id}>
                  <td className="px-4 py-3"><strong>{item.isGuest ? t("guest") : item.accountName || t("account")}</strong>{item.accountEmail && <p className="text-xs text-muted-foreground">{item.accountEmail}</p>}</td>
                  <td className="max-w-sm truncate px-4 py-3">{item.preview}</td>
                  <td className="px-4 py-3 uppercase">{item.locale}</td>
                  <td className="px-4 py-3">{item.messageCount}</td>
                  <td className="px-4 py-3">{formatDate.format(new Date(item.updatedAt))}</td>
                  <td className="px-4 py-3"><Link className="font-semibold text-primary hover:underline" href={href({ detail: item.id })}>{t("view")}</Link></td>
                </tr>
              )) : <tr><td className="px-4 py-10 text-center text-muted-foreground" colSpan={6}>{t("empty")}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <nav className="flex items-center justify-between text-sm" aria-label={t("pagination")}>
        <span>{t("resultCount", { count: result.total })}</span>
        <div className="flex gap-2">
          {result.page > 1 && <Link className="rounded-md border px-3 py-2" href={href({ page: String(result.page - 1) })}>{t("previous")}</Link>}
          {result.page < result.totalPages && <Link className="rounded-md border px-3 py-2" href={href({ page: String(result.page + 1) })}>{t("next")}</Link>}
        </div>
      </nav>
    </div>
  );
}

function MetadataSummary({ metadata }: { metadata: Json }) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const tools = Array.isArray(metadata.tools)
    ? metadata.tools.filter((tool): tool is string => typeof tool === "string")
    : [];
  const cards = Array.isArray(metadata.cards)
    ? metadata.cards.flatMap((card) => {
        if (!card || typeof card !== "object" || Array.isArray(card)) return [];
        return typeof card.kind === "string" ? [card.kind] : [];
      })
    : [];
  if (!tools.length && !cards.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
      {tools.map((tool) => <span className="rounded bg-muted px-2 py-1" key={`tool-${tool}`}>tool: {tool}</span>)}
      {cards.map((card, index) => <span className="rounded bg-muted px-2 py-1" key={`card-${card}-${index}`}>card: {card}</span>)}
    </div>
  );
}
