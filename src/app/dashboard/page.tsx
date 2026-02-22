"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  BarChart3, RefreshCw, LogOut, Settings, Globe,
  ChevronDown, TrendingUp, Eye, MousePointerClick,
  Users, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown,
  ExternalLink, Edit2, Check, X
} from "lucide-react"
import { SummaryCards } from "@/components/dashboard/summary-cards"
import { ChartsSection } from "@/components/dashboard/charts-section"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Site, SiteStats, SummaryStats, DateRange } from "@/types"

type SortKey = keyof SiteStats
type SortDir = "asc" | "desc"

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return n.toLocaleString()
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [sites, setSites] = useState<Site[]>([])
  const [stats, setStats] = useState<SiteStats[]>([])
  const [summary, setSummary] = useState<SummaryStats | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>("28d")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedSite, setSelectedSite] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>("impressions")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [searchQuery, setSearchQuery] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  const fetchSites = useCallback(async () => {
    const res = await fetch("/api/sites")
    if (res.ok) setSites(await res.json())
  }, [])

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const [gscRes, ga4Res] = await Promise.all([
        fetch(`/api/search-console?range=${dateRange}`),
        fetch(`/api/analytics?range=${dateRange}`),
      ])
      const gscData: SiteStats[] = gscRes.ok ? await gscRes.json() : []
      const ga4Data: { site_url: string; visitors: number; sessions: number }[] = ga4Res.ok ? await ga4Res.json() : []

      const merged = gscData.map((site) => {
        const ga4 = ga4Data.find((g) => g.site_url === site.site_url)
        return { ...site, visitors: ga4?.visitors ?? 0, sessions: ga4?.sessions ?? 0 }
      })

      setStats(merged)
      await fetchSites()

      if (merged.length > 0) {
        const totalImpressions = merged.reduce((s, r) => s + r.impressions, 0)
        const totalClicks = merged.reduce((s, r) => s + r.clicks, 0)
        const totalVisitors = merged.reduce((s, r) => s + r.visitors, 0)
        const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0
        const positionSites = merged.filter((r) => r.position > 0)
        const avgPosition = positionSites.length > 0
          ? positionSites.reduce((s, r) => s + r.position, 0) / positionSites.length
          : 0

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
    if (status === "authenticated") fetchStats()
  }, [status, fetchStats])

  async function handleRefresh() {
    setRefreshing(true)
    await fetchStats()
    setRefreshing(false)
  }

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir("desc") }
  }

  const visibleStats = stats
    .filter((s) => sites.find((site) => site.site_url === s.site_url)?.is_visible !== false)
    .filter((s) => !searchQuery || s.display_name.toLowerCase().includes(searchQuery.toLowerCase()) || s.site_url.includes(searchQuery))
    .sort((a, b) => {
      const aVal = a[sortKey], bVal = b[sortKey]
      if (typeof aVal === "number" && typeof bVal === "number")
        return sortDir === "asc" ? aVal - bVal : bVal - aVal
      return sortDir === "asc" ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal))
    })

  const columns: { key: SortKey; label: string; align?: string }[] = [
    { key: "display_name", label: "الموقع" },
    { key: "impressions", label: "ظهور" },
    { key: "clicks", label: "ضغطات" },
    { key: "ctr", label: "CTR" },
    { key: "position", label: "ترتيب" },
    { key: "visitors", label: "زوار" },
    { key: "sessions", label: "جلسات" },
  ]

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const dateLabel = dateRange === "7d" ? "7 أيام" : dateRange === "28d" ? "28 يوم" : "3 أشهر"

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800">Analytics Dashboard</h1>
            <p className="text-[11px] text-slate-400 leading-none">{session?.user?.email}</p>
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
          <Link
            href="/settings"
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 px-3 py-1.5 rounded-lg transition-all"
          >
            <Settings className="w-3.5 h-3.5" />
            الإعدادات
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-500 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? "w-64" : "w-14"} shrink-0 bg-white border-r border-slate-200 flex flex-col transition-all duration-200`}>
          {/* Sidebar Toggle */}
          <div className="px-3 py-3 border-b border-slate-100 flex items-center justify-between">
            {sidebarOpen && <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">التحكم</span>}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
            </button>
          </div>

          {sidebarOpen && (
            <>
              {/* Date Range */}
              <div className="px-3 py-3 border-b border-slate-100">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">الفترة الزمنية</p>
                <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
                  <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">آخر 7 أيام</SelectItem>
                    <SelectItem value="28d">آخر 28 يوم</SelectItem>
                    <SelectItem value="90d">آخر 3 أشهر</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sites List */}
              <div className="flex-1 overflow-y-auto px-3 py-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  المواقع ({sites.filter((s) => s.is_visible).length}/{sites.length})
                </p>
                <div className="space-y-0.5">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-lg" />)
                  ) : sites.filter(s => s.is_visible).map((site) => {
                    const siteStats = stats.find((s) => s.site_url === site.site_url)
                    const isSelected = selectedSite === site.site_url
                    return (
                      <button
                        key={site.id}
                        onClick={() => setSelectedSite(isSelected ? null : site.site_url)}
                        className={`w-full text-right px-2.5 py-2 rounded-lg transition-all ${
                          isSelected
                            ? "bg-indigo-50 border border-indigo-200"
                            : "hover:bg-slate-50 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Globe className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-indigo-500" : "text-slate-400"}`} />
                          <span className={`text-xs truncate flex-1 ${isSelected ? "text-indigo-700 font-medium" : "text-slate-600"}`}>
                            {site.display_name}
                          </span>
                          {site.ga4_property_id && (
                            <span className="text-[9px] bg-emerald-50 text-emerald-500 px-1 rounded shrink-0">GA4</span>
                          )}
                        </div>
                        {siteStats && (
                          <div className="flex gap-2 mt-1 mr-5">
                            <span className="text-[10px] text-slate-400">
                              <span className="font-medium text-indigo-500">{formatNumber(siteStats.impressions)}</span> ظهور
                            </span>
                            <span className="text-[10px] text-slate-400">
                              <span className="font-medium text-sky-500">{formatNumber(siteStats.clicks)}</span> ضغطة
                            </span>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Quick Stats */}
              {summary && (
                <div className="px-3 py-3 border-t border-slate-100 space-y-2">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">إجماليات سريعة</p>
                  {[
                    { label: "الظهور", value: formatNumber(summary.total_impressions), color: "text-indigo-500" },
                    { label: "الضغطات", value: formatNumber(summary.total_clicks), color: "text-sky-500" },
                    { label: "الزوار", value: formatNumber(summary.total_visitors), color: "text-emerald-500" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">{item.label}</span>
                      <span className={`text-[11px] font-bold ${item.color}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Summary Cards */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">الإجماليات — {dateLabel}</h2>
              {summary && (
                <span className="text-xs text-slate-400">{summary.sites_count} موقع نشط</span>
              )}
            </div>
            <SummaryCards stats={summary} loading={loading} />
          </section>

          {/* Charts Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                التحليلات التفصيلية {selectedSite ? `— ${sites.find(s => s.site_url === selectedSite)?.display_name}` : ""}
              </h2>
              {!selectedSite && (
                <span className="text-xs text-slate-300">اضغط على موقع لعرض تحليلاته</span>
              )}
            </div>
            <ChartsSection siteUrl={selectedSite} dateRange={dateRange} />
          </section>

          {/* Sites Table */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                جدول المواقع ({visibleStats.length})
              </h2>
              {/* Search */}
              <div className="relative">
                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث..."
                  className="pr-8 pl-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 w-36"
                />
              </div>
            </div>

            {loading ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex gap-4 p-4">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <Skeleton key={j} className="h-4 flex-1" />
                        ))}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : visibleStats.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
                <Globe className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">لا توجد مواقع لعرضها</p>
                <Link href="/settings" className="text-xs text-indigo-500 hover:underline mt-1 block">
                  إضافة مواقع من الإعدادات
                </Link>
              </div>
            ) : (
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        {columns.map((col) => (
                          <th
                            key={col.key}
                            onClick={() => handleSort(col.key)}
                            className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide cursor-pointer hover:text-slate-600 select-none whitespace-nowrap"
                          >
                            <div className="flex items-center gap-1">
                              {col.label}
                              {sortKey === col.key ? (
                                sortDir === "asc" ? <ArrowUp className="w-3 h-3 text-indigo-500" /> : <ArrowDown className="w-3 h-3 text-indigo-500" />
                              ) : (
                                <ArrowUpDown className="w-3 h-3 opacity-30" />
                              )}
                            </div>
                          </th>
                        ))}
                        <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">تحليل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {visibleStats.map((site, i) => {
                        const isSelected = selectedSite === site.site_url
                        return (
                          <tr
                            key={site.site_url}
                            className={`transition-colors ${
                              isSelected
                                ? "bg-indigo-50/60"
                                : i % 2 === 0
                                ? "bg-white hover:bg-slate-50/70"
                                : "bg-slate-50/30 hover:bg-slate-50/70"
                            }`}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md bg-indigo-50 flex items-center justify-center shrink-0">
                                  <Globe className="w-3 h-3 text-indigo-400" />
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-slate-700">{site.display_name}</span>
                                  <a href={site.site_url} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-slate-400 hover:text-indigo-400 flex items-center gap-0.5">
                                    {site.site_url.replace(/^https?:\/\//, "").slice(0, 30)}
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-semibold text-slate-700">{formatNumber(site.impressions)}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-semibold text-slate-700">{formatNumber(site.clicks)}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                site.ctr > 0.05 ? "bg-emerald-50 text-emerald-600" :
                                site.ctr > 0.02 ? "bg-sky-50 text-sky-600" :
                                "bg-slate-100 text-slate-500"
                              }`}>
                                {(site.ctr * 100).toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-sm font-medium ${
                                site.position > 0 && site.position <= 3 ? "text-emerald-500" :
                                site.position <= 10 ? "text-sky-500" :
                                "text-slate-400"
                              }`}>
                                {site.position > 0 ? site.position.toFixed(1) : "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {site.visitors > 0 ? (
                                <span className="text-sm font-medium text-emerald-600">{formatNumber(site.visitors)}</span>
                              ) : (
                                <span className="text-xs text-slate-300">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-slate-500">{site.sessions > 0 ? formatNumber(site.sessions) : "—"}</span>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => setSelectedSite(isSelected ? null : site.site_url)}
                                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                                  isSelected
                                    ? "bg-indigo-100 text-indigo-600 border-indigo-200"
                                    : "bg-white text-slate-500 border-slate-200 hover:border-indigo-200 hover:text-indigo-500"
                                }`}
                              >
                                {isSelected ? "إخفاء" : "عرض"}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
