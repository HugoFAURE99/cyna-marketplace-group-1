"use client";

// Floating CynAI panel: a clean elevated card anchored above the launcher. No
// overlay/blur — it simply sits on top of the page (strong shadow) while the
// rest of the site stays visible and interactive.
import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { BotMessageSquare, Send, X } from "lucide-react";

import ChatMessage from "@/components/chat/ChatMessage";
import type { ChatUiMessage } from "@/components/chat/useCynaChat";

type ChatPanelProps = {
  messages: ChatUiMessage[];
  isStreaming: boolean;
  onSend: (text: string) => void;
  onClose: () => void;
};

export default function ChatPanel({
  messages,
  isStreaming,
  onSend,
  onClose,
}: ChatPanelProps) {
  const t = useTranslations("chat");
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = scrollRef.current;
    if (element) {
      element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) {
      return;
    }
    onSend(text);
    setInput("");
  };

  return (
    <div
      role="dialog"
      aria-label={t("title")}
      className="fixed bottom-[calc(max(1rem,env(safe-area-inset-bottom))+4rem)] left-3 z-40 flex h-[min(70vh,560px)] w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-900/5 animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-300 sm:bottom-24 sm:left-6 sm:w-[384px]"
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Image
            src="/brand/cyna-logo-v2-header.svg"
            alt="CYNA"
            width={72}
            height={20}
            className="h-5 w-auto"
          />
          <span className="text-lg font-bold leading-none text-purple-700">
            AI
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="inline-flex size-11 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 ? (
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700">
              <BotMessageSquare aria-hidden="true" className="size-4" />
            </span>
            <div className="max-w-[92%] rounded-2xl rounded-tl-sm border border-slate-100 bg-slate-50 px-3.5 py-2 text-sm leading-relaxed text-slate-700">
              {t("greeting")}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}
      </div>

      <form
        onSubmit={submit}
        className="flex items-center gap-2 border-t border-slate-100 px-3 py-3"
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          className="h-10 min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-200"
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          aria-label={t("send")}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-purple-700 text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send aria-hidden="true" className="size-4" />
        </button>
      </form>
    </div>
  );
}
