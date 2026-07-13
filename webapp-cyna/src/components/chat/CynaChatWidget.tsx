"use client";

// Floating CynAI entry point: a bottom-left button that toggles the chat panel.
// No overlay/blur — the panel just floats above the page with a soft shadow, so
// the site stays fully visible and usable. z-40 keeps it below the menu sheet.
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { MessageCircle, X } from "lucide-react";

import ChatPanel from "@/components/chat/ChatPanel";
import { useCynaChat } from "@/components/chat/useCynaChat";

export default function CynaChatWidget() {
  const t = useTranslations("chat");
  const [open, setOpen] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const { messages, isStreaming, sendMessage } = useCynaChat();

  return (
    <>
      {open && (
        <ChatPanel
          messages={messages}
          isStreaming={isStreaming}
          onSend={sendMessage}
          onClose={() => {
            setOpen(false);
            requestAnimationFrame(() => launcherRef.current?.focus());
          }}
        />
      )}
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? t("close") : t("open")}
        className="cynai-launcher fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-40 inline-flex size-12 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/25 bg-gradient-to-br from-purple-950 via-purple-700 to-fuchsia-500 text-white shadow-[0_14px_32px_-9px_rgba(126,34,206,0.78)] ring-1 ring-inset ring-white/20 hover:-translate-y-0.5 hover:scale-105 hover:brightness-110 hover:shadow-[0_18px_38px_-8px_rgba(126,34,206,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 active:translate-y-0 active:scale-95 sm:bottom-6 sm:left-6 sm:size-14"
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_32%_20%,rgba(255,255,255,0.38),transparent_42%)]"
        />
        <MessageCircle
          aria-hidden="true"
          className={`absolute size-6 transition-all duration-200 ${open ? "scale-75 opacity-0" : "scale-100 opacity-100"}`}
        />
        <X
          aria-hidden="true"
          className={`absolute size-6 transition-all duration-200 ${open ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}
        />
      </button>
    </>
  );
}
