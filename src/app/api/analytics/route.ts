import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getGA4Data } from "@/lib/google"
import { supabaseAdmin } from "@/lib/supabase"
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

  // Get sites that have GA4 property IDs
  const { data: sites } = await supabaseAdmin
    .from("user_sites")
    .select("*")
    .eq("user_id", userId)
    .eq("is_visible", true)
    .not("ga4_property_id", "is", null)

  if (!sites || sites.length === 0) return NextResponse.json([])

  const results = await Promise.all(
    sites.map(async (site) => {
      const ga4Data = await getGA4Data(accessToken, site.ga4_property_id!, dateRange)
      return {
        site_url: site.site_url,
        property_id: site.ga4_property_id,
        ...ga4Data,
      }
    })
  )

  return NextResponse.json(results)
}
