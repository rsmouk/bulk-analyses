"use client"

import { useState } from "react"
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { SiteStats } from "@/types"

type SortKey = keyof SiteStats
type SortDir = "asc" | "desc"

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return n.toLocaleString()
}

interface SortIconProps {
  column: SortKey
  current: SortKey
  direction: SortDir
}

function SortIcon({ column, current, direction }: SortIconProps) {
  if (column !== current) return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
  if (direction === "asc") return <ArrowUp className="w-3.5 h-3.5 text-indigo-500" />
  return <ArrowDown className="w-3.5 h-3.5 text-indigo-500" />
}

interface SitesTableProps {
  data: SiteStats[]
  loading: boolean
}

export function SitesTable({ data, loading }: SitesTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("impressions")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const sorted = [...data].sort((a, b) => {
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDir === "asc" ? aVal - bVal : bVal - aVal
    }
    return sortDir === "asc"
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal))
  })

  const columns: { key: SortKey; label: string }[] = [
    { key: "display_name", label: "الموقع" },
    { key: "impressions", label: "الظهور" },
    { key: "clicks", label: "الضغطات" },
    { key: "ctr", label: "CTR" },
    { key: "position", label: "الترتيب" },
    { key: "visitors", label: "الزوار" },
    { key: "sessions", label: "الجلسات" },
  ]

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              {columns.map((c) => (
                <TableHead key={c.key} className="text-slate-500 font-medium text-xs uppercase tracking-wide">
                  {c.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((c) => (
                  <TableCell key={c.key}>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <p className="text-slate-400 text-sm">لا توجد مواقع لعرضها</p>
        <p className="text-slate-300 text-xs mt-1">تأكد من ربط مواقعك في لوحة الإعدادات</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            {columns.map((c) => (
              <TableHead
                key={c.key}
                className="text-slate-500 font-medium text-xs uppercase tracking-wide cursor-pointer select-none"
                onClick={() => handleSort(c.key)}
              >
                <div className="flex items-center gap-1.5">
                  {c.label}
                  <SortIcon column={c.key} current={sortKey} direction={sortDir} />
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((site, i) => (
            <TableRow
              key={site.site_url}
              className={i % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-100/60"}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <span className="text-slate-700 text-sm">{site.display_name}</span>
                  <a
                    href={site.site_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-300 hover:text-indigo-400 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-slate-700 font-medium">{formatNumber(site.impressions)}</span>
              </TableCell>
              <TableCell>
                <span className="text-slate-700 font-medium">{formatNumber(site.clicks)}</span>
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className="bg-indigo-50 text-indigo-600 hover:bg-indigo-50 font-medium text-xs"
                >
                  {(site.ctr * 100).toFixed(1)}%
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-slate-600 text-sm">{site.position > 0 ? site.position.toFixed(1) : "—"}</span>
              </TableCell>
              <TableCell>
                {site.visitors > 0 ? (
                  <span className="text-emerald-600 font-medium">{formatNumber(site.visitors)}</span>
                ) : (
                  <span className="text-slate-300 text-xs">غير مربوط</span>
                )}
              </TableCell>
              <TableCell>
                {site.sessions > 0 ? (
                  <span className="text-slate-600">{formatNumber(site.sessions)}</span>
                ) : (
                  <span className="text-slate-300 text-xs">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
