"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {  useSearchParams }               from "next/navigation"
import Link                                          from "next/link"
import { HistoryCard }                               from "@/components/history/history-card"

// ── Types ──────────────────────────────────────────────────────────────────
interface HistoryItem {
  id:              string
  inputText:       string
  charCount:       number
  outputFormat:    string
  createdAt:       string
  servedFromCache: boolean
  freshUrl:        string | null
  voiceModel: {
    name:          string
    provider:      string
    edgeVoiceName: string | null
  } | null
  audioFile: {
    fileSizeBytes:   bigint | null
    durationSeconds: number | null
    fileFormat:      string
  } | null
}

interface HistoryResponse {
  items:   HistoryItem[]
  total:   number
  page:    number
  pages:   number
  hasMore: boolean
}

// ── Filter options ─────────────────────────────────────────────────────────
const PERIOD_OPTIONS = [
  { value: "all",   label: "All time" },
  { value: "today", label: "Today"    },
  { value: "week",  label: "This week"},
  { value: "month", label: "This month"},
]

const PROVIDER_OPTIONS = [
  { value: "all",        label: "All providers" },
  { value: "edge",       label: "Edge TTS"       },
  { value: "google",     label: "Google Cloud"   },
  { value: "elevenlabs", label: "ElevenLabs"     },
]

const SORT_OPTIONS = [
  { value: "newest",  label: "Newest first"  },
  { value: "oldest",  label: "Oldest first"  },
  { value: "longest", label: "Longest audio" },
]

// ── Debounce hook ──────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// ── Empty state ────────────────────────────────────────────────────────────
function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-[#141424] border border-[#282846]
                      flex items-center justify-center mb-5">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none"
             stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round">
          <path d="M4 7h20M4 14h20M4 21h12"/>
        </svg>
      </div>

      <p className="text-white/40 text-sm font-medium mb-1">
        {hasFilters ? "No results match your filters." : "No generations yet."}
      </p>
      <p className="text-white/20 text-xs mb-6">
        {hasFilters
          ? "Try adjusting your search or filter criteria."
          : "Head to Studio to create your first audio file."}
      </p>

      {!hasFilters && (
        <Link
          href="/studio"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                     bg-[rgb(120,62,246)] text-white text-sm font-medium
                     hover:bg-[rgba(120,62,246,0.85)] transition-all
                     hover:scale-[1.02] active:scale-[0.98]"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M7 1a6 6 0 1 0 0 12A6 6 0 0 0 7 1zm0 4a.75.75 0 0 1 .75.75v1.5h1.5a.75.75 0 0 1 0 1.5h-1.5v1.5a.75.75 0 0 1-1.5 0v-1.5h-1.5a.75.75 0 0 1 0-1.5h1.5v-1.5A.75.75 0 0 1 7 5z"/>
          </svg>
          Go to Studio
        </Link>
      )}
    </div>
  )
}

// ── Skeleton card ─────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="rounded-xl border border-[#282846] bg-[#141424] p-4">
      <div className="flex gap-2 mb-3 pl-6">
        <div className="h-4 w-10 rounded skeleton"/>
        <div className="h-4 w-20 rounded skeleton"/>
      </div>
      <div className="space-y-1.5 mb-3 pl-1">
        <div className="h-3.5 w-full rounded skeleton"/>
        <div className="h-3.5 w-3/4 rounded skeleton"/>
      </div>
      <div className="flex gap-2 mb-4">
        {[1,2,3].map(i => <div key={i} className="h-4 w-12 rounded skeleton"/>)}
      </div>
      <div className="flex gap-2">
        <div className="h-7 w-16 rounded-lg skeleton"/>
        <div className="h-7 w-20 rounded-lg skeleton"/>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function HistoryPage() {
//   const router       = useSearchParams()

  const [items,      setItems]      = useState<HistoryItem[]>([])
  const [total,      setTotal]      = useState(0)
  const [page,       setPage]       = useState(1)
  const [hasMore,    setHasMore]    = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Filters
  const [search,   setSearch]   = useState("")
  const [period,   setPeriod]   = useState("all")
  const [provider, setProvider] = useState("all")
  const [sort,     setSort]     = useState("newest")

  // Selection (bulk actions)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkDel,  setBulkDel]  = useState(false)

  const debouncedSearch = useDebounce(search, 350)
  const abortRef        = useRef<AbortController | null>(null)

  // ── Fetch ────────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async (
    pg: number,
    replace: boolean
  ) => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    if (replace) setLoading(true)
    else         setLoadingMore(true)

    const params = new URLSearchParams({
      q:        debouncedSearch,
      provider,
      period,
      sort,
      page:     String(pg),
    })

    try {
      const res  = await fetch(`/api/history?${params}`, { signal: ctrl.signal })
      const data = await res.json() as HistoryResponse

      setItems(prev => replace ? data.items : [...prev, ...data.items])
      setTotal(data.total)
      setPage(data.page)
      setHasMore(data.hasMore)
    } catch (err) {
      if ((err as Error).name === "AbortError") return
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [debouncedSearch, provider, period, sort])

  // Refetch when filters change
  useEffect(() => {
    setSelected(new Set())
    fetchHistory(1, true)
  }, [fetchHistory])

  // ── Select / bulk ────────────────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(items.map(i => i.id)))
  }

  function clearSelection() {
    setSelected(new Set())
  }

  async function handleBulkDelete() {
    if (bulkDel) return
    setBulkDel(true)
    await Promise.allSettled(
      Array.from(selected).map(id =>
        fetch(`/api/history/${id}`, { method: "DELETE" })
      )
    )
    setItems(prev => prev.filter(i => !selected.has(i.id)))
    setTotal(prev => prev - selected.size)
    setSelected(new Set())
    setBulkDel(false)
  }

  function handleDelete(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
    setTotal(prev => prev - 1)
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  const hasFilters = debouncedSearch !== "" || period !== "all" || provider !== "all"

  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-screen">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            History
          </h1>
          <p className="text-white/35 text-sm mt-1">
            {total > 0
              ? `${total.toLocaleString()} generation${total !== 1 ? "s" : ""}`
              : "Your past generations"
            }
          </p>
        </div>

        <Link
          href="/studio"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                     bg-[rgb(120,62,246)] text-white text-sm font-medium
                     hover:bg-[rgba(120,62,246,0.85)] transition-all
                     hover:scale-[1.02] active:scale-[0.98] shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M7 1a6 6 0 1 0 0 12A6 6 0 0 0 7 1zm0 4a.75.75 0 0 1 .75.75v1.5h1.5a.75.75 0 0 1 0 1.5h-1.5v1.5a.75.75 0 0 1-1.5 0v-1.5h-1.5a.75.75 0 0 1 0-1.5h1.5v-1.5A.75.75 0 0 1 7 5z"/>
          </svg>
          New generation
        </Link>
      </div>

      {/* ── Filters bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-0 max-w-sm">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4
                         text-white/25 pointer-events-none"
               viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="7" cy="7" r="4.5"/><path d="M11 11l3 3" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by text…"
            className="w-full bg-[#141424] border border-[#282846] rounded-xl
                       pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/20
                       focus:outline-none focus:border-[rgba(120,62,246,0.4)]
                       transition-colors duration-150"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30
                         hover:text-white/60 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                   stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M3 3l8 8M11 3l-8 8"/>
              </svg>
            </button>
          )}
        </div>

        {/* Period */}
        <FilterSelect
          value={period}
          options={PERIOD_OPTIONS}
          onChange={setPeriod}
        />

        {/* Provider */}
        <FilterSelect
          value={provider}
          options={PROVIDER_OPTIONS}
          onChange={setProvider}
        />

        {/* Sort */}
        <FilterSelect
          value={sort}
          options={SORT_OPTIONS}
          onChange={setSort}
        />
      </div>

      {/* ── Bulk action bar ──────────────────────────────────────────── */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 mb-5 rounded-xl
                        bg-[rgba(120,62,246,0.08)] border border-[rgba(120,62,246,0.2)]
                        animate-in slide-in-from-top-2 duration-200">
          <span className="text-sm text-white/70">
            <span className="font-semibold text-white">{selected.size}</span>{" "}
            selected
          </span>

          <div className="flex-1"/>

          <button onClick={selectAll}
                  className="text-xs text-white/40 hover:text-white/70
                             transition-colors">
            Select all ({items.length})
          </button>

          <button onClick={clearSelection}
                  className="text-xs text-white/40 hover:text-white/70
                             transition-colors">
            Clear
          </button>

          <button
            onClick={handleBulkDelete}
            disabled={bulkDel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                       text-xs font-medium bg-red-500/15 text-red-400
                       hover:bg-red-500/25 border border-red-500/20
                       transition-all duration-150 disabled:opacity-50"
          >
            {bulkDel ? (
              <span className="w-3 h-3 border border-red-400/40
                               border-t-red-400 rounded-full animate-spin block"/>
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                   stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 3h8M4.5 3V2h3v1M3.5 3l.4 7h4.2l.4-7"/>
              </svg>
            )}
            Delete {selected.size}
          </button>
        </div>
      )}

      {/* ── Grid ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => <CardSkeleton key={i}/>)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState hasFilters={hasFilters}/>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(item => (
              <HistoryCard
                key={item.id}
                item={item}
                selected={selected.has(item.id)}
                onSelect={toggleSelect}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => fetchHistory(page + 1, false)}
                disabled={loadingMore}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl
                           border border-[#282846] text-sm text-white/50
                           hover:text-white hover:border-white/20
                           transition-all duration-150 disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <span className="w-4 h-4 border border-white/20
                                     border-t-white/60 rounded-full animate-spin"/>
                    Loading…
                  </>
                ) : (
                  <>
                    Load more
                    <span className="text-white/25 text-xs">
                      ({total - items.length} remaining)
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Reusable filter select ─────────────────────────────────────────────────
function FilterSelect({
  value, options, onChange,
}: {
  value:   string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div className="relative shrink-0">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none bg-[#141424] border border-[#282846] rounded-xl
                   text-sm text-white/60 pl-3 pr-8 py-2.5 cursor-pointer
                   focus:outline-none focus:border-[rgba(120,62,246,0.4)]
                   transition-colors duration-150"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3
                     text-white/30 pointer-events-none"
           viewBox="0 0 10 6" fill="currentColor">
        <path d="M0 0l5 6 5-6H0z"/>
      </svg>
    </div>
  )
}