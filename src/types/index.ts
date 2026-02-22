export interface Site {
  id: string
  user_id: string
  site_url: string
  display_name: string
  ga4_property_id: string | null
  is_visible: boolean
  created_at: string
}

export interface SiteStats {
  site_url: string
  display_name: string
  ga4_property_id: string | null
  is_visible: boolean
  // Search Console
  impressions: number
  clicks: number
  ctr: number
  position: number
  // GA4
  visitors: number
  sessions: number
}

export interface SummaryStats {
  total_impressions: number
  total_clicks: number
  total_visitors: number
  avg_ctr: number
  avg_position: number
  sites_count: number
  total_page_views?: number
  total_new_users?: number
  avg_bounce_rate?: number
  avg_session_duration?: number
}

export type DateRange = "7d" | "28d" | "90d"

export interface UserPreferences {
  user_id: string
  date_range: DateRange
  hidden_sites: string[]
}

export interface SearchConsoleData {
  site: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface AnalyticsData {
  property_id: string
  visitors: number
  sessions: number
}
