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
  const prevStart = new Date(start)
  prevStart.setDate(prevStart.getDate() - daysMap[range])
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end,
    prevStartDate: prevStart.toISOString().split("T")[0],
    prevEndDate: start.toISOString().split("T")[0],
  }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const dateRange = (searchParams.get("range") ?? "28d") as DateRange
  const propertyId = searchParams.get("property")
  if (!propertyId) return NextResponse.json({ error: "property param required" }, { status: 400 })

  const authClient = getOAuth2Client(session.access_token)
  const analyticsData = google.analyticsdata({ version: "v1beta", auth: authClient })
  const { startDate, endDate, prevStartDate, prevEndDate } = getDateRange(dateRange)

  try {
    const res = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [
          { startDate, endDate },
          { startDate: prevStartDate, endDate: prevEndDate },
        ],
        metrics: [
          { name: "totalUsers" },
          { name: "newUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "bounceRate" },
          { name: "averageSessionDuration" },
        ],
        dimensions: [{ name: "date" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      },
    })

    // Device breakdown
    const deviceRes = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        metrics: [{ name: "sessions" }, { name: "totalUsers" }],
        dimensions: [{ name: "deviceCategory" }],
      },
    })

    // Country breakdown
    const countryRes = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        metrics: [{ name: "totalUsers" }],
        dimensions: [{ name: "country" }],
        orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }],
        limit: 10,
      },
    })

    return NextResponse.json({
      trend: res.data.rows ?? [],
      devices: deviceRes.data.rows ?? [],
      countries: countryRes.data.rows ?? [],
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
