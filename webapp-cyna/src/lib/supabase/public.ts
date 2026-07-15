// Supabase client for public (anon-key) reads. Server-only.
import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Variables Supabase publiques manquantes. Verifie ton .env.local");
  }

  return createClient<Database>(url, key);
}
