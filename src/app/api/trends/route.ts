import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { google } from "googleapis"
import { DateRange } from "@/types"

function getOAuth2Client(accessToken: string) {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  client.setCredentials({ access_token: accessToken })
  return client
}

function getDateRange(range: DateRange) {
  const today = new Date()
  const end = today.toISOString().split("T")[0]
  const daysMap: Record<DateRange, number> = { "7d": 7, "28d": 28, "90d": 90 }
  const start = new Date(today)
  start.setDate(start.getDate() - daysMap[range])
  return { startDate: start.toISOString().split("T")[0], endDate: end }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const dateRange = (searchParams.get("range") ?? "28d") as DateRange
  const siteUrl = searchParams.get("site")
  if (!siteUrl) return NextResponse.json({ error: "site param required" }, { status: 400 })

  const authClient = getOAuth2Client(session.access_token)
  const webmasters = google.webmasters({ version: "v3", auth: authClient })
  const { startDate, endDate } = getDateRange(dateRange)

  try {
    // Daily trend data
    const trendRes = await webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ["date"],
        rowLimit: 90,
      },
    })

    // Top keywords
    const keywordsRes = await webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ["query"],
        rowLimit: 10,
      },
    })

    // Top pages
    const pagesRes = await webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ["page"],
        rowLimit: 10,
      },
    })

    // Search type breakdown
    const deviceRes = await webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ["device"],
        rowLimit: 10,
      },
    })

    return NextResponse.json({
      trend: trendRes.data.rows ?? [],
      keywords: keywordsRes.data.rows ?? [],
      pages: pagesRes.data.rows ?? [],
      devices: deviceRes.data.rows ?? [],
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
