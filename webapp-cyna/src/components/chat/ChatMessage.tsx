"use client";

// Renders one chat turn. Assistant turns fade each streamed chunk in while
// streaming, then re-render as Markdown once complete, and reveal any tool
// cards (each card animates in as it arrives from the stream).
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BotMessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";

import ChatCategoryCard from "@/components/chat/ChatCategoryCard";
import ChatLoginCard from "@/components/chat/ChatLoginCard";
import ChatProductCard from "@/components/chat/ChatProductCard";
import ChatSupportCard from "@/components/chat/ChatSupportCard";
import ChatTicketForm from "@/components/chat/ChatTicketForm";
import ChatTypingIndicator from "@/components/chat/ChatTypingIndicator";
import type { ChatUiMessage } from "@/components/chat/useCynaChat";

const markdownClass =
  "text-sm leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-0.5 [&_a]:font-medium [&_a]:text-purple-700 [&_a]:underline [&_strong]:font-semibold [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]";

export default function ChatMessage({ message }: { message: ChatUiMessage }) {
  const t = useTranslations("chat");
  const text = message.chunks.join("");
  const hasCards = message.cards.length > 0;

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-purple-700 px-3.5 py-2 text-sm text-white shadow-sm">
          {text}
        </div>
      </div>
    );
  }

  const showThinking = message.streaming && text.length === 0;
  const showTextBubble = showThinking || text.length > 0 || message.error;

  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700">
        <BotMessageSquare aria-hidden="true" className="size-4" />
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        {showTextBubble && (
          <div className="max-w-[92%] rounded-2xl rounded-tl-sm border border-slate-100 bg-slate-50 px-3.5 py-2 text-slate-800 shadow-sm">
            {showThinking ? (
              <ChatTypingIndicator />
            ) : message.streaming ? (
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                {message.chunks.map((chunk, index) => (
                  <span key={index} className="animate-in fade-in duration-700">
                    {chunk}
                  </span>
                ))}
              </p>
            ) : message.error && text.length === 0 ? (
              <p className="text-sm text-slate-500">{t("error")}</p>
            ) : (
              <div className={markdownClass}>
                <Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>
              </div>
            )}
          </div>
        )}

        {hasCards && (
          <div className="space-y-2">
            {message.cards.map((card, index) => (
              <div
                key={index}
                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                {card.kind === "product" ? (
                  card.items.map((product) => (
                    <ChatProductCard key={product.id_produit} product={product} />
                  ))
                ) : card.kind === "category" ? (
                  card.items.map((category) => (
                    <ChatCategoryCard
                      key={category.id_categorie}
                      category={category}
                    />
                  ))
                ) : card.kind === "support" ? (
                  <ChatSupportCard />
                ) : card.kind === "login" ? (
                  <ChatLoginCard />
                ) : (
                  <ChatTicketForm email={card.email} orders={card.orders} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
