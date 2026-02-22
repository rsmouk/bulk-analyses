"use client"

import { Eye, MousePointerClick, Users, TrendingUp, FileText, Target, Activity, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SummaryStats } from "@/types"

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return n.toLocaleString()
}

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  colorClass: string
  bgClass: string
  trend?: number
}

function TrendBadge({ trend }: { trend?: number }) {
  if (trend === undefined || trend === 0) return <Minus className="w-3 h-3 text-slate-400" />
  if (trend > 0) return (
    <div className="flex items-center gap-0.5 text-emerald-500">
      <ArrowUpRight className="w-3 h-3" />
      <span className="text-xs font-medium">{trend.toFixed(0)}%</span>
    </div>
  )
  return (
    <div className="flex items-center gap-0.5 text-red-400">
      <ArrowDownRight className="w-3 h-3" />
      <span className="text-xs font-medium">{Math.abs(trend).toFixed(0)}%</span>
    </div>
  )
}

function StatCard({ title, value, subtitle, icon, colorClass, bgClass, trend }: StatCardProps) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`${bgClass} p-2.5 rounded-xl`}>
            <div className={colorClass}>{icon}</div>
          </div>
          <TrendBadge trend={trend} />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-800 leading-none">{value}</p>
          <p className="text-xs font-medium text-slate-500 mt-1.5">{title}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

interface SummaryCardsProps {
  stats: SummaryStats | null
  loading: boolean
}

export function SummaryCards({ stats, loading }: SummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-5 space-y-3">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  const cards = [
    {
      title: "إجمالي الظهور",
      value: formatNumber(stats.total_impressions),
      subtitle: `${stats.sites_count} موقع`,
      icon: <Eye className="w-4.5 h-4.5" />,
      colorClass: "text-indigo-500",
      bgClass: "bg-indigo-50",
    },
    {
      title: "إجمالي الضغطات",
      value: formatNumber(stats.total_clicks),
      subtitle: `CTR: ${(stats.avg_ctr * 100).toFixed(1)}%`,
      icon: <MousePointerClick className="w-4.5 h-4.5" />,
      colorClass: "text-sky-500",
      bgClass: "bg-sky-50",
    },
    {
      title: "إجمالي الزوار",
      value: formatNumber(stats.total_visitors),
      subtitle: "Google Analytics",
      icon: <Users className="w-4.5 h-4.5" />,
      colorClass: "text-emerald-500",
      bgClass: "bg-emerald-50",
    },
    {
      title: "متوسط الترتيب",
      value: stats.avg_position > 0 ? stats.avg_position.toFixed(1) : "—",
      subtitle: "في نتائج البحث",
      icon: <TrendingUp className="w-4.5 h-4.5" />,
      colorClass: "text-violet-500",
      bgClass: "bg-violet-50",
    },
    {
      title: "إجمالي مشاهدات الصفحات",
      value: formatNumber(stats.total_page_views ?? 0),
      subtitle: "Page Views",
      icon: <FileText className="w-4.5 h-4.5" />,
      colorClass: "text-orange-500",
      bgClass: "bg-orange-50",
    },
    {
      title: "مستخدمون جدد",
      value: formatNumber(stats.total_new_users ?? 0),
      subtitle: "New Users",
      icon: <Activity className="w-4.5 h-4.5" />,
      colorClass: "text-pink-500",
      bgClass: "bg-pink-50",
    },
    {
      title: "معدل الارتداد",
      value: stats.avg_bounce_rate ? `${(stats.avg_bounce_rate * 100).toFixed(1)}%` : "—",
      subtitle: "Bounce Rate",
      icon: <Target className="w-4.5 h-4.5" />,
      colorClass: "text-rose-500",
      bgClass: "bg-rose-50",
    },
    {
      title: "متوسط وقت الجلسة",
      value: stats.avg_session_duration ? formatDuration(stats.avg_session_duration) : "—",
      subtitle: "Avg Session Duration",
      icon: <TrendingUp className="w-4.5 h-4.5" />,
      colorClass: "text-teal-500",
      bgClass: "bg-teal-50",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  )
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return "0s"
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  if (m === 0) return `${s}s`
  return `${m}m ${s}s`
}
