"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { BarChart3, RefreshCw, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"
import { SummaryCards } from "@/components/dashboard/summary-cards"
import { SitesTable } from "@/components/dashboard/sites-table"
import { SidebarFilter } from "@/components/dashboard/sidebar-filter"
import { Site, SiteStats, SummaryStats, DateRange } from "@/types"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [sites, setSites] = useState<Site[]>([])
  const [stats, setStats] = useState<SiteStats[]>([])
  const [summary, setSummary] = useState<SummaryStats | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>("28d")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  // Fetch all sites settings from Supabase
  const fetchSites = useCallback(async () => {
    const res = await fetch("/api/sites")
    if (res.ok) {
      const data = await res.json()
      setSites(data)
    }
  }, [])

  // Fetch stats from Google APIs
  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const [gscRes, ga4Res] = await Promise.all([
        fetch(`/api/search-console?range=${dateRange}`),
        fetch(`/api/analytics?range=${dateRange}`),
      ])

      const gscData: SiteStats[] = gscRes.ok ? await gscRes.json() : []
      const ga4Data: { site_url: string; visitors: number; sessions: number }[] = ga4Res.ok
        ? await ga4Res.json()
        : []

      // Merge GA4 data into GSC data
      const merged = gscData.map((site) => {
        const ga4 = ga4Data.find((g) => g.site_url === site.site_url)
        return {
          ...site,
          visitors: ga4?.visitors ?? 0,
          sessions: ga4?.sessions ?? 0,
        }
      })

      setStats(merged)
      await fetchSites()

      // Calculate summary
      if (merged.length > 0) {
        const totalImpressions = merged.reduce((s, r) => s + r.impressions, 0)
        const totalClicks = merged.reduce((s, r) => s + r.clicks, 0)
        const totalVisitors = merged.reduce((s, r) => s + r.visitors, 0)
        const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0
        const avgPosition =
          merged.filter((r) => r.position > 0).reduce((s, r) => s + r.position, 0) /
          (merged.filter((r) => r.position > 0).length || 1)

        setSummary({
          total_impressions: totalImpressions,
          total_clicks: totalClicks,
          total_visitors: totalVisitors,
          avg_ctr: avgCtr,
          avg_position: avgPosition,
          sites_count: merged.length,
        })
      }
    } finally {
      setLoading(false)
    }
  }, [dateRange, fetchSites])

  useEffect(() => {
    if (status === "authenticated") {
      fetchStats()
    }
  }, [status, fetchStats])

  async function handleRefresh() {
    setRefreshing(true)
    await fetchStats()
    setRefreshing(false)
  }

  async function handleToggleSite(siteId: string, visible: boolean) {
    await fetch("/api/sites", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: siteId, is_visible: visible }),
    })
    setSites((prev) =>
      prev.map((s) => (s.id === siteId ? { ...s, is_visible: visible } : s))
    )
  }

  async function handleUpdateGA4(siteId: string, propertyId: string) {
    await fetch("/api/sites", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: siteId, ga4_property_id: propertyId || null }),
    })
    setSites((prev) =>
      prev.map((s) =>
        s.id === siteId ? { ...s, ga4_property_id: propertyId || null } : s
      )
    )
  }

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const visibleStats = stats.filter((s) => {
    const site = sites.find((site) => site.site_url === s.site_url)
    return site?.is_visible !== false
  })

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800">Analytics Dashboard</h1>
            <p className="text-xs text-slate-400">{session?.user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 px-3 py-1.5 rounded-lg transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            تحديث
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-500 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            خروج
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <SidebarFilter
          sites={sites}
          loading={loading}
          dateRange={dateRange}
          onDateRangeChange={(range) => {
            setDateRange(range)
          }}
          onToggleSite={handleToggleSite}
          onUpdateGA4={handleUpdateGA4}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary */}
          <div>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              الإجماليات — {dateRange === "7d" ? "7 أيام" : dateRange === "28d" ? "28 يوم" : "3 أشهر"}
            </h2>
            <SummaryCards stats={summary} loading={loading} />
          </div>

          {/* Table */}
          <div>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              المواقع ({visibleStats.length})
            </h2>
            <SitesTable data={visibleStats} loading={loading} />
          </div>
        </main>
      </div>
    </div>
  )
}
