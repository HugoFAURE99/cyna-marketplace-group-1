import { NextResponse } from "next/server";

import { clearServerSessionActivity } from "@/lib/auth/session-activity";
import { createServerClient } from "@/lib/supabase/server-client";

export async function POST() {
  const supabase = await createServerClient();
  await supabase.auth.signOut({ scope: "local" });
  await clearServerSessionActivity();
  return NextResponse.json({ ok: true });
}
