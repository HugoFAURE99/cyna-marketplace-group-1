// CynAI chat endpoint. Streams the assistant answer as newline-delimited JSON
// (NDJSON) events. Each round is streamed; if the model requests a tool, we run
// it and loop so it can answer with the data. The model's parts are echoed back
// verbatim so Gemini 3 thinking models keep their required `thoughtSignature`
// on function-call parts (rebuilding the part from functionCalls drops it).
import type { Content, FunctionCall, Part } from "@google/genai";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";

import { GEMINI_MODEL, getGeminiClient } from "@/lib/gemini";
import { CHAT_TOOLS, runChatTool, SYSTEM_INSTRUCTION } from "@/lib/gemini/tools";
import type { ChatStreamEvent, ChatTurn } from "@/lib/gemini/types";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/lib/i18n/translations";
import { createServerClient } from "@/lib/supabase/server-client";
import {
  appendChatMessage,
  CHAT_GUEST_COOKIE,
  CHAT_RETENTION_DAYS,
  hashGuestSession,
  resolveChatConversation,
} from "@/lib/chat/persistence";
import { createSafeChatMetadata } from "@/lib/chat/history-metadata";
import { captureOperationalException } from "@/lib/observability/capture";
import type { ChatCardPayload } from "@/lib/gemini/types";

export const runtime = "nodejs";

// Safety cap so a misbehaving model can't loop on tool calls forever.
const MAX_TOOL_ROUNDS = 4;

// Delay between card reveals so they appear one by one in the UI.
const CARD_REVEAL_DELAY_MS = 160;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type ChatRequestBody = {
  conversationId?: string;
  messages?: ChatTurn[];
  locale?: string;
};

function toLocale(value: unknown): Locale {
  if (
    typeof value === "string" &&
    (routing.locales as readonly string[]).includes(value)
  ) {
    return value as Locale;
  }
  return routing.defaultLocale;
}

function toContents(messages: ChatTurn[]): Content[] {
  return messages
    .filter((message) => message.content?.trim())
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));
}

export async function POST(request: Request) {
  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const locale = toLocale(body.locale);
  if (messages.length === 0) {
    return new Response("No messages provided", { status: 400 });
  }

  // Resolve the logged-in user once, before streaming, so the in-chat ticket
  // form can prefill their email and offer their orders.
  let userId: string | null = null;
  let userEmail: string | null = null;
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
    userEmail = user?.email ?? null;
  } catch {
    userId = null;
    userEmail = null;
  }

  const cookieStore = await cookies();
  const guestSession = cookieStore.get(CHAT_GUEST_COOKIE)?.value ?? randomUUID();
  cookieStore.set(CHAT_GUEST_COOKIE, guestSession, {
    httpOnly: true,
    maxAge: CHAT_RETENTION_DAYS * 24 * 60 * 60,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  const lastUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user" && message.content.trim());
  if (!lastUserMessage) {
    return new Response("No user message provided", { status: 400 });
  }

  let conversationId: string;
  try {
    conversationId = await resolveChatConversation({
      accountId: userId,
      conversationId:
        typeof body.conversationId === "string" ? body.conversationId : undefined,
      guestSessionHash: hashGuestSession(guestSession),
      locale,
    });
    await appendChatMessage({
      content: lastUserMessage.content,
      conversationId,
      role: "user",
    });
  } catch (error) {
    console.error("[/api/chat] Could not persist user turn", error);
    captureOperationalException(error, {
      area: "chat",
      stage: "persist-user-turn",
    });
    return new Response("Chat history unavailable", { status: 503 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChatStreamEvent) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));

      let assistantText = "";
      const renderedCards: ChatCardPayload[] = [];
      const toolNames: string[] = [];

      const sendCard = (card: ChatCardPayload) => {
        renderedCards.push(card);
        send({ type: "card", card });
      };

      try {
        send({ type: "conversation", id: conversationId });
        const ai = getGeminiClient();
        const contents = toContents(messages);
        const config = {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: CHAT_TOOLS,
        };

        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          const result = await ai.models.generateContentStream({
            model: GEMINI_MODEL,
            contents,
            config,
          });

          // Collect the model's parts verbatim (keeps thoughtSignature on the
          // function-call parts) while forwarding visible answer text.
          const modelParts: Part[] = [];
          for await (const chunk of result) {
            const parts = chunk.candidates?.[0]?.content?.parts;
            if (!parts) {
              continue;
            }
            for (const part of parts) {
              modelParts.push(part);
              if (part.text && !part.thought) {
                assistantText += part.text;
                send({ type: "text", value: part.text });
              }
            }
          }

          const calls: FunctionCall[] = modelParts.flatMap((part) =>
            part.functionCall ? [part.functionCall] : [],
          );

          // No tool requested → this round produced the final answer.
          if (calls.length === 0) {
            break;
          }

          // Echo the tool-call turn back (with signatures), run the tools, send
          // their cards one item at a time, then append the results and loop.
          contents.push({ role: "model", parts: modelParts });

          const responseParts: Part[] = [];
          for (const call of calls) {
            toolNames.push(call.name ?? "");
            const toolResult = await runChatTool(
              call.name ?? "",
              (call.args ?? {}) as Record<string, unknown>,
              locale,
              { userId, userEmail },
            );

            const card = toolResult.card;
            if (card?.kind === "product") {
              for (const item of card.items) {
                sendCard({ kind: "product", items: [item] });
                await sleep(CARD_REVEAL_DELAY_MS);
              }
            } else if (card?.kind === "category") {
              for (const item of card.items) {
                sendCard({ kind: "category", items: [item] });
                await sleep(CARD_REVEAL_DELAY_MS);
              }
            } else if (card) {
              // Single-item cards (support link, ticket confirmation).
              sendCard(card);
              await sleep(CARD_REVEAL_DELAY_MS);
            }

            responseParts.push({
              functionResponse: {
                name: call.name ?? "",
                response: toolResult.forModel,
              },
            });
          }

          contents.push({ role: "user", parts: responseParts });
        }

        await appendChatMessage({
          content: assistantText || "Assistant response rendered as cards.",
          conversationId,
          metadata: createSafeChatMetadata({ cards: renderedCards, tools: toolNames }),
          role: "assistant",
        });
        send({ type: "done" });
      } catch (error) {
        console.error("[/api/chat]", error);
        captureOperationalException(error, {
          area: "chat",
          stage: "generate-response",
        });
        try {
          await appendChatMessage({
            content:
              assistantText ||
              (locale === "fr"
                ? "Désolé, une erreur est survenue. Réessayez plus tard."
                : "Sorry, an error occurred. Please try again later."),
            conversationId,
            metadata: createSafeChatMetadata({ cards: renderedCards, tools: toolNames }),
            role: "assistant",
            status: "error",
          });
        } catch (persistenceError) {
          console.error("[/api/chat] Could not persist partial assistant turn", persistenceError);
          captureOperationalException(persistenceError, {
            area: "chat",
            stage: "persist-assistant-error",
          });
        }
        send({
          type: "error",
          message: "Désolé, une erreur est survenue. Réessayez plus tard.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
