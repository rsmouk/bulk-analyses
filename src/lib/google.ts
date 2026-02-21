import { google } from "googleapis"
import { DateRange } from "@/types"

function getOAuth2Client(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  oauth2Client.setCredentials({ access_token: accessToken })
  return oauth2Client
}

function getDateRange(range: DateRange): { startDate: string; endDate: string } {
  const today = new Date()
  const end = today.toISOString().split("T")[0]

  const daysMap: Record<DateRange, number> = {
    "7d": 7,
    "28d": 28,
    "90d": 90,
  }

  const start = new Date(today)
  start.setDate(start.getDate() - daysMap[range])

  return { startDate: start.toISOString().split("T")[0], endDate: end }
}

export async function getSearchConsoleSites(accessToken: string) {
  const auth = getOAuth2Client(accessToken)
  const webmasters = google.webmasters({ version: "v3", auth })

  const res = await webmasters.sites.list()
  return res.data.siteEntry || []
}

export async function getSearchConsoleData(
  accessToken: string,
  siteUrl: string,
  dateRange: DateRange
) {
  const auth = getOAuth2Client(accessToken)
  const webmasters = google.webmasters({ version: "v3", auth })
  const { startDate, endDate } = getDateRange(dateRange)

  try {
    const res = await webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: [],
        rowLimit: 1,
      },
    })

    const row = res.data.rows?.[0]
    return {
      clicks: row?.clicks ?? 0,
      impressions: row?.impressions ?? 0,
      ctr: row?.ctr ?? 0,
      position: row?.position ?? 0,
    }
  } catch {
    return { clicks: 0, impressions: 0, ctr: 0, position: 0 }
  }
}

export async function getGA4Data(
  accessToken: string,
  propertyId: string,
  dateRange: DateRange
) {
  const auth = getOAuth2Client(accessToken)
  const analyticsData = google.analyticsdata({ version: "v1beta", auth })
  const { startDate, endDate } = getDateRange(dateRange)

  try {
    const res = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: "totalUsers" },
          { name: "sessions" },
        ],
      },
    })

    const row = res.data.rows?.[0]
    return {
      visitors: parseInt(row?.metricValues?.[0]?.value ?? "0"),
      sessions: parseInt(row?.metricValues?.[1]?.value ?? "0"),
    }
  } catch {
    return { visitors: 0, sessions: 0 }
  }
}
