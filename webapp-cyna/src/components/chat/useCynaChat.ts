"use client";

// Owns the chat conversation state and the streaming fetch to /api/chat.
// Assistant text is stored as an array of chunks so each streamed piece can
// fade in independently; the joined text is used once streaming completes.
import { useCallback, useRef, useState } from "react";
import { useLocale } from "next-intl";

import type {
  ChatCardPayload,
  ChatRole,
  ChatStreamEvent,
  ChatTurn,
} from "@/lib/gemini/types";

export type ChatUiMessage = {
  id: string;
  role: ChatRole;
  chunks: string[];
  cards: ChatCardPayload[];
  streaming: boolean;
  error?: boolean;
};

let idCounter = 0;
const nextId = () => `m${Date.now()}-${idCounter++}`;

export function useCynaChat() {
  const locale = useLocale();
  const [messages, setMessages] = useState<ChatUiMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamingRef = useRef(false);

  const sendMessage = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || streamingRef.current) {
        return;
      }

      streamingRef.current = true;
      setIsStreaming(true);

      const userMessage: ChatUiMessage = {
        id: nextId(),
        role: "user",
        chunks: [text],
        cards: [],
        streaming: false,
      };
      const assistantId = nextId();
      const assistantMessage: ChatUiMessage = {
        id: assistantId,
        role: "assistant",
        chunks: [],
        cards: [],
        streaming: true,
      };

      // History sent to the API = everything so far + this new user turn.
      const history: ChatTurn[] = [...messages, userMessage].map((message) => ({
        role: message.role,
        content: message.chunks.join(""),
      }));

      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      const patch = (fn: (message: ChatUiMessage) => ChatUiMessage) =>
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId ? fn(message) : message,
          ),
        );

      const handleEvent = (event: ChatStreamEvent) => {
        if (event.type === "text") {
          patch((message) => ({
            ...message,
            chunks: [...message.chunks, event.value],
          }));
        } else if (event.type === "card") {
          patch((message) => ({
            ...message,
            cards: [...message.cards, event.card],
          }));
        } else if (event.type === "error") {
          patch((message) => ({ ...message, error: true }));
        }
      };

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, locale }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`Chat request failed: ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        let chunk = await reader.read();
        while (!chunk.done) {
          buffer += decoder.decode(chunk.value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) {
              continue;
            }
            try {
              handleEvent(JSON.parse(trimmed) as ChatStreamEvent);
            } catch {
              // Ignore a malformed/partial line.
            }
          }
          chunk = await reader.read();
        }
      } catch (error) {
        console.error("[CynAI]", error);
        patch((message) => ({ ...message, error: true }));
      } finally {
        patch((message) => ({ ...message, streaming: false }));
        streamingRef.current = false;
        setIsStreaming(false);
      }
    },
    [messages, locale],
  );

  return { messages, isStreaming, sendMessage };
}
