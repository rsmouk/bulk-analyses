import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getSupabaseAdmin } from "@/lib/supabase"

// GET - fetch all user sites
export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from("user_sites")
    .select("*")
    .eq("user_id", session.user?.id ?? "")
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH - update site (visibility, display_name, ga4_property_id)
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { id, ...updates } = body

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from("user_sites")
    .update(updates)
    .eq("id", id)
    .eq("user_id", session.user?.id ?? "")
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
