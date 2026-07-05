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
        className="fixed bottom-6 left-6 z-40 inline-flex size-14 cursor-pointer items-center justify-center rounded-full bg-purple-700 text-white shadow-lg transition-all duration-200 ease-out hover:scale-110 hover:bg-purple-800 hover:shadow-xl hover:shadow-purple-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 active:scale-100"
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
