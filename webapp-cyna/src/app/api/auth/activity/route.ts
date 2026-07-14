import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { markServerSessionActive, SESSION_ACTIVITY_COOKIE } from "@/lib/auth/session-activity";
import { createServerClient } from "@/lib/supabase/server-client";

export async function POST() {
  const store = await cookies();
  if (!store.has(SESSION_ACTIVITY_COOKIE)) return NextResponse.json({ ok: false }, { status: 401 });
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  await markServerSessionActive();
  return NextResponse.json({ ok: true });
}
