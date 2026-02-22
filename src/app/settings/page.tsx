"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  BarChart3, ArrowLeft, Globe, Edit2, Check, X,
  Eye, EyeOff, Link, Trash2, RefreshCw
} from "lucide-react"
import Link_next from "next/link"
import { Site } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editField, setEditField] = useState<"name" | "ga4" | null>(null)
  const [editValue, setEditValue] = useState("")
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/sites")
        .then((r) => r.json())
        .then((d) => setSites(d))
        .finally(() => setLoading(false))
    }
  }, [status])

  async function updateSite(id: string, updates: Partial<Site>) {
    setSaving(id)
    const res = await fetch("/api/sites", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    })
    if (res.ok) {
      const updated = await res.json()
      setSites((prev) => prev.map((s) => (s.id === id ? updated : s)))
    }
    setSaving(null)
  }

  async function toggleAll(visible: boolean) {
    const targets = sites.filter((s) => s.is_visible !== visible)
    await Promise.all(targets.map((s) => updateSite(s.id, { is_visible: visible })))
  }

  function startEdit(site: Site, field: "name" | "ga4") {
    setEditingId(site.id)
    setEditField(field)
    setEditValue(field === "name" ? site.display_name : (site.ga4_property_id ?? ""))
  }

  async function saveEdit() {
    if (!editingId || !editField) return
    const updates =
      editField === "name"
        ? { display_name: editValue.trim() }
        : { ga4_property_id: editValue.trim() || null }
    await updateSite(editingId, updates)
    setEditingId(null)
    setEditField(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditField(null)
    setEditValue("")
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center gap-4">
        <Link_next href="/dashboard" className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-500 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          <span>العودة</span>
        </Link_next>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-sm font-bold text-slate-800">إعدادات المواقع</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">إدارة المواقع</h2>
            <p className="text-sm text-slate-500 mt-1">
              تحكم في المواقع الظاهرة في لوحة التحكم وربط GA4 Property IDs
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-1">
            <button
              onClick={() => toggleAll(true)}
              disabled={loading || sites.length === 0}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Eye className="w-3.5 h-3.5" />
              إظهار الكل
            </button>
            <button
              onClick={() => toggleAll(false)}
              disabled={loading || sites.length === 0}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <EyeOff className="w-3.5 h-3.5" />
              إخفاء الكل
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {sites.map((site) => (
              <div
                key={site.id}
                className={`bg-white rounded-xl border transition-all ${
                  site.is_visible ? "border-slate-200 shadow-sm" : "border-slate-100 opacity-60"
                }`}
              >
                <div className="p-4">
                  {/* Site Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        site.is_visible ? "bg-indigo-50" : "bg-slate-100"
                      }`}>
                        <Globe className={`w-4 h-4 ${site.is_visible ? "text-indigo-500" : "text-slate-400"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Display Name */}
                        {editingId === site.id && editField === "name" ? (
                          <div className="flex items-center gap-2">
                            <input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="flex-1 text-sm border border-indigo-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-indigo-50/50"
                              autoFocus
                              onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit() }}
                            />
                            <button onClick={saveEdit} className="text-emerald-500 hover:text-emerald-600 p-1">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-500 p-1">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-700 truncate">{site.display_name}</span>
                            <button
                              onClick={() => startEdit(site, "name")}
                              className="text-slate-300 hover:text-indigo-400 transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <p className="text-xs text-slate-400 truncate mt-0.5">{site.site_url}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {saving === site.id && (
                        <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                      )}
                      <button
                        onClick={() => updateSite(site.id, { is_visible: !site.is_visible })}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                          site.is_visible
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {site.is_visible ? (
                          <><Eye className="w-3.5 h-3.5" /> ظاهر</>
                        ) : (
                          <><EyeOff className="w-3.5 h-3.5" /> مخفي</>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* GA4 Property ID */}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Link className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs text-slate-500 shrink-0">GA4 Property ID:</span>
                      {editingId === site.id && editField === "ga4" ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder="مثال: 123456789"
                            className="flex-1 text-xs border border-indigo-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-indigo-50/50"
                            autoFocus
                            onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit() }}
                          />
                          <button onClick={saveEdit} className="text-emerald-500 hover:text-emerald-600">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-500">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : site.ga4_property_id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Badge className="bg-emerald-50 text-emerald-600 border-0 text-xs font-medium">
                            {site.ga4_property_id}
                          </Badge>
                          <button
                            onClick={() => startEdit(site, "ga4")}
                            className="text-slate-300 hover:text-indigo-400 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(site, "ga4")}
                          className="text-xs text-indigo-500 hover:text-indigo-600 underline underline-offset-2"
                        >
                          + ربط GA4
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
          <p className="text-xs text-indigo-600 leading-relaxed">
            <strong>كيف تجد GA4 Property ID؟</strong> افتح Google Analytics ← Admin ← Property Settings ← Property ID (أرقام فقط، مثال: 123456789)
          </p>
        </div>
      </main>
    </div>
  )
}
