"use client"

import { Settings, Globe, Edit2, Check, X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Site, DateRange } from "@/types"
import { useState } from "react"

interface SidebarFilterProps {
  sites: Site[]
  loading: boolean
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
  onToggleSite: (siteId: string, visible: boolean) => void
  onUpdateGA4: (siteId: string, propertyId: string) => void
}

export function SidebarFilter({
  sites,
  loading,
  dateRange,
  onDateRangeChange,
  onToggleSite,
  onUpdateGA4,
}: SidebarFilterProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")

  function startEdit(site: Site) {
    setEditingId(site.id)
    setEditValue(site.ga4_property_id ?? "")
  }

  function saveEdit(siteId: string) {
    onUpdateGA4(siteId, editValue.trim())
    setEditingId(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValue("")
  }

  return (
    <aside className="w-72 shrink-0 bg-white border-r border-slate-200 h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">لوحة التحكم</span>
        </div>
      </div>

      {/* Date Range */}
      <div className="px-5 py-4 border-b border-slate-100">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">الفترة الزمنية</p>
        <Select value={dateRange} onValueChange={(v) => onDateRangeChange(v as DateRange)}>
          <SelectTrigger className="w-full bg-slate-50 border-slate-200 text-slate-700 text-sm h-9">
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
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">المواقع</p>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-4 h-4 rounded" />
                <Skeleton className="h-3 flex-1" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {sites.map((site) => (
              <div key={site.id} className="rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 py-2 px-2">
                  <Checkbox
                    id={site.id}
                    checked={site.is_visible}
                    onCheckedChange={(checked) => onToggleSite(site.id, !!checked)}
                    className="border-slate-300"
                  />
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={site.id}
                      className="text-sm text-slate-600 cursor-pointer truncate block leading-tight"
                    >
                      {site.display_name}
                    </label>
                  </div>
                  {site.ga4_property_id ? (
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 text-[10px] px-1.5 py-0 h-4 shrink-0">
                      GA4
                    </Badge>
                  ) : (
                    <Globe className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  )}
                </div>

                {/* GA4 Property ID Editor */}
                {editingId === site.id ? (
                  <div className="px-2 pb-2">
                    <div className="flex items-center gap-1.5">
                      <input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="مثال: 123456789"
                        className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(site.id)
                          if (e.key === "Escape") cancelEdit()
                        }}
                      />
                      <button
                        onClick={() => saveEdit(site.id)}
                        className="text-emerald-500 hover:text-emerald-600"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-500">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">GA4 Property ID</p>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(site)}
                    className="flex items-center gap-1 px-2 pb-2 text-[11px] text-slate-400 hover:text-indigo-500 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    {site.ga4_property_id
                      ? `Property: ${site.ga4_property_id}`
                      : "ربط GA4 Property ID"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100">
        <p className="text-[11px] text-slate-400 text-center">
          {sites.filter((s) => s.is_visible).length} من {sites.length} موقع مُفعَّل
        </p>
      </div>
    </aside>
  )
}
