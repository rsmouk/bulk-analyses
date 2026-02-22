"use client"

import { useState, useEffect } from "react"
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, Search, FileText, Monitor } from "lucide-react"
import { DateRange } from "@/types"

interface TrendRow {
  keys?: string[]
  clicks?: number
  impressions?: number
  ctr?: number
  position?: number
}

interface ChartsProps {
  siteUrl: string | null
  dateRange: DateRange
}

const DEVICE_COLORS = {
  DESKTOP: "#6366f1",
  MOBILE: "#0ea5e9",
  TABLET: "#10b981",
}

export function ChartsSection({ siteUrl, dateRange }: ChartsProps) {
  const [data, setData] = useState<{
    trend: TrendRow[]
    keywords: TrendRow[]
    pages: TrendRow[]
    devices: TrendRow[]
  } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!siteUrl) return
    setLoading(true)
    fetch(`/api/trends?site=${encodeURIComponent(siteUrl)}&range=${dateRange}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [siteUrl, dateRange])

  if (!siteUrl) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-400 text-sm">اختر موقعاً من الجدول لعرض التحليلات التفصيلية</p>
      </div>
    )
  }

  const trendChartData = data?.trend.map((row) => ({
    date: row.keys?.[0]?.slice(5) ?? "",
    clicks: row.clicks ?? 0,
    impressions: Math.round((row.impressions ?? 0) / 10),
  })) ?? []

  const deviceData = data?.devices.map((row) => ({
    name: row.keys?.[0] ?? "",
    value: row.clicks ?? 0,
  })) ?? []

  return (
    <div className="space-y-4">
      {/* Trend Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <CardTitle className="text-sm font-semibold text-slate-700">الأداء عبر الزمن</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-4">
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                  formatter={(value: number, name: string) => [
                    name === "impressions" ? value * 10 : value,
                    name === "clicks" ? "ضغطات" : "ظهور (÷10)",
                  ]}
                />
                <Line type="monotone" dataKey="clicks" stroke="#6366f1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="impressions" stroke="#0ea5e9" strokeWidth={2} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Keywords */}
        <Card className="border-0 shadow-sm lg:col-span-1">
          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-violet-500" />
              <CardTitle className="text-sm font-semibold text-slate-700">أهم الكلمات المفتاحية</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
            ) : (
              <div className="space-y-1.5">
                {(data?.keywords ?? []).slice(0, 8).map((kw, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-600 truncate flex-1">{kw.keys?.[0]}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-medium text-indigo-600">{kw.clicks}</span>
                      <div className="w-12 bg-slate-100 rounded-full h-1.5">
                        <div
                          className="bg-indigo-400 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, ((kw.clicks ?? 0) / (data?.keywords?.[0]?.clicks ?? 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card className="border-0 shadow-sm lg:col-span-1">
          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              <CardTitle className="text-sm font-semibold text-slate-700">أهم الصفحات</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
            ) : (
              <div className="space-y-1.5">
                {(data?.pages ?? []).slice(0, 8).map((page, i) => {
                  const path = page.keys?.[0]?.replace(/^https?:\/\/[^/]+/, "") ?? "/"
                  return (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-600 truncate flex-1" title={path}>{path || "/"}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-medium text-emerald-600">{page.clicks}</span>
                        <div className="w-12 bg-slate-100 rounded-full h-1.5">
                          <div
                            className="bg-emerald-400 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, ((page.clicks ?? 0) / (data?.pages?.[0]?.clicks ?? 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card className="border-0 shadow-sm lg:col-span-1">
          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-sky-500" />
              <CardTitle className="text-sm font-semibold text-slate-700">الأجهزة</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-4">
            {loading ? (
              <Skeleton className="h-32 w-full" />
            ) : deviceData.length > 0 ? (
              <div className="flex flex-col items-center gap-3">
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie data={deviceData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" paddingAngle={3}>
                      {deviceData.map((entry, i) => (
                        <Cell key={i} fill={Object.values(DEVICE_COLORS)[i % 3]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-2">
                  {deviceData.map((entry, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: Object.values(DEVICE_COLORS)[i % 3] }} />
                      <span className="text-xs text-slate-500">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-300 text-center py-6">لا توجد بيانات</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
