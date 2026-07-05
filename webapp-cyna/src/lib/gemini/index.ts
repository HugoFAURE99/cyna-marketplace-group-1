// Lazily-initialised Google Gen AI client for the CynAI chatbot. Server-only.
// Mirrors src/lib/stripe/index.ts but defers the env check to first use so a
// missing key surfaces as a graceful error event instead of a module-load crash.
import "server-only";

import { GoogleGenAI } from "@google/genai";

// Latest cost-effective GA "lite" model — supports streaming + tool calling.
export const GEMINI_MODEL = "gemini-3.1-flash-lite";

let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY manquante. Vérifie ton .env.local");
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}
