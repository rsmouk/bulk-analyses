"use client"

import { Eye, MousePointerClick, Users, TrendingUp } from "lucide-react"
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
}

function StatCard({ title, value, subtitle, icon, colorClass, bgClass }: StatCardProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            {subtitle && (
              <p className="text-xs text-slate-400">{subtitle}</p>
            )}
          </div>
          <div className={`${bgClass} p-3 rounded-xl`}>
            <div className={colorClass}>{icon}</div>
          </div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
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
      icon: <Eye className="w-5 h-5" />,
      colorClass: "text-indigo-500",
      bgClass: "bg-indigo-50",
    },
    {
      title: "إجمالي الضغطات",
      value: formatNumber(stats.total_clicks),
      subtitle: `معدل CTR: ${(stats.avg_ctr * 100).toFixed(1)}%`,
      icon: <MousePointerClick className="w-5 h-5" />,
      colorClass: "text-sky-500",
      bgClass: "bg-sky-50",
    },
    {
      title: "إجمالي الزوار",
      value: formatNumber(stats.total_visitors),
      subtitle: "من Google Analytics",
      icon: <Users className="w-5 h-5" />,
      colorClass: "text-emerald-500",
      bgClass: "bg-emerald-50",
    },
    {
      title: "متوسط الترتيب",
      value: stats.avg_position > 0 ? stats.avg_position.toFixed(1) : "—",
      subtitle: "في نتائج البحث",
      icon: <TrendingUp className="w-5 h-5" />,
      colorClass: "text-violet-500",
      bgClass: "bg-violet-50",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  )
}
