import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getSupabaseAdmin } from "@/lib/supabase"

export async function GET() {
  const result: Record<string, unknown> = {}

  // Test 1: auth()
  try {
    const session = await auth()
    result.auth = {
      ok: true,
      hasSession: !!session,
      userId: session?.user?.id ?? null,
      hasAccessToken: !!(session as { access_token?: string })?.access_token,
    }
  } catch (e) {
    result.auth = { ok: false, error: String(e) }
  }

  // Test 2: Supabase
  try {
    const db = getSupabaseAdmin()
    const { error } = await db.from("user_sites").select("id").limit(1)
    result.supabase = { ok: !error, error: error?.message ?? null }
  } catch (e) {
    result.supabase = { ok: false, error: String(e) }
  }

  // Test 3: Env vars (masked)
  result.env = {
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  }

  return NextResponse.json(result)
}
