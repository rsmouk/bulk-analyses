import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  getSearchConsoleSites,
  getSearchConsoleData,
} from "@/lib/google"
import { getSupabaseAdmin } from "@/lib/supabase"
import { DateRange } from "@/types"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const dateRange = (searchParams.get("range") ?? "28d") as DateRange
  const userId = session.user?.id
  if (!userId) return NextResponse.json({ error: "No user ID" }, { status: 401 })
  const accessToken = session.access_token

  // Get sites from Search Console
  const gscSites = await getSearchConsoleSites(accessToken)

  const db = getSupabaseAdmin()

  // Get saved sites from Supabase
  const { data: savedSites } = await db
    .from("user_sites")
    .select("*")
    .eq("user_id", userId)

  // Sync new sites into Supabase
  const savedUrls = savedSites?.map((s) => s.site_url) ?? []
  const newSites = gscSites.filter(
    (s) => s.siteUrl && !savedUrls.includes(s.siteUrl)
  )

  if (newSites.length > 0) {
    await db.from("user_sites").insert(
      newSites.map((s) => ({
        user_id: userId,
        site_url: s.siteUrl,
        display_name: s.siteUrl?.replace(/^https?:\/\//, "").replace(/\/$/, "") ?? s.siteUrl,
        ga4_property_id: null,
        is_visible: true,
      }))
    )
  }

  // Fetch all sites again after sync
  const { data: allSites } = await db
    .from("user_sites")
    .select("*")
    .eq("user_id", userId)
    .eq("is_visible", true)

  if (!allSites) return NextResponse.json([])

  // Fetch Search Console data for each visible site
  const results = await Promise.all(
    allSites.map(async (site) => {
      const gscData = await getSearchConsoleData(accessToken, site.site_url, dateRange)
      return {
        ...site,
        ...gscData,
        visitors: 0,
        sessions: 0,
      }
    })
  )

  return NextResponse.json(results)
}
