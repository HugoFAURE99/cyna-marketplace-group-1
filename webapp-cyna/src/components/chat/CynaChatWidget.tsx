"use client";

// Floating CynAI entry point: a bottom-left button that toggles the chat panel.
// No overlay/blur — the panel just floats above the page with a soft shadow, so
// the site stays fully visible and usable. z-40 keeps it below the menu sheet.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { MessageCircle, X } from "lucide-react";

import ChatPanel from "@/components/chat/ChatPanel";
import { useCynaChat } from "@/components/chat/useCynaChat";

export default function CynaChatWidget() {
  const t = useTranslations("chat");
  const [open, setOpen] = useState(false);
  const { messages, isStreaming, sendMessage } = useCynaChat();

  return (
    <>
      {open && (
        <ChatPanel
          messages={messages}
          isStreaming={isStreaming}
          onSend={sendMessage}
          onClose={() => setOpen(false)}
        />
      )}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? t("close") : t("open")}
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-40 inline-flex size-12 cursor-pointer items-center justify-center rounded-full bg-purple-700 text-white shadow-lg transition-all duration-200 ease-out hover:scale-105 hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 active:scale-100 sm:bottom-6 sm:left-6 sm:size-14"
      >
        {open ? (
          <X aria-hidden="true" className="size-6" />
        ) : (
          <MessageCircle aria-hidden="true" className="size-6" />
        )}
      </button>
    </>
  );
}
