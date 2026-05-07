'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Bug,
  ExternalLink,
  RefreshCw,
  ScrollText,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react'

type ChangeType = 'buff' | 'nerf' | 'fix' | 'adjustment'

interface PatchImage {
  src: string
  alt: string
}

interface PatchChange {
  type: ChangeType
  item: string
  detail: string
  images?: PatchImage[]
}

interface PatchNote {
  version: string
  date: string
  source: string
  title: string
  url: string
  description: string
  changes: PatchChange[]
  images?: PatchImage[]
  summary: {
    buffs: number
    nerfs: number
    fixes: number
    adjustments: number
  }
}

const META = {
  buff: {
    label: 'Buffs',
    icon: ArrowUpRight,
    className: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/[0.035]',
  },
  nerf: {
    label: 'Nerfs',
    icon: ArrowDownRight,
    className: 'text-red-400 border-red-400/20 bg-red-400/[0.035]',
  },
  fix: {
    label: 'Fixes',
    icon: Bug,
    className: 'text-sky-400 border-sky-400/20 bg-sky-400/[0.035]',
  },
  adjustment: {
    label: 'Ajustes',
    icon: SlidersHorizontal,
    className: 'text-[#c6a15b] border-[#c6a15b]/20 bg-[#c6a15b]/[0.04]',
  },
}

export default function PatchNotes() {
  const [patches, setPatches] = useState<PatchNote[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null)
  const [filter, setFilter] = useState<ChangeType | 'all'>('all')
  const [refreshing, setRefreshing] = useState(false)
  const [selectedChange, setSelectedChange] = useState<PatchChange | null>(null)

  const selectedPatch = useMemo(() => {
    return patches.find((p) => p.version === selectedVersion) || patches[0]
  }, [patches, selectedVersion])

  const visibleChanges = useMemo(() => {
    if (!selectedPatch) return []
    if (filter === 'all') return selectedPatch.changes
    return selectedPatch.changes.filter((c) => c.type === filter)
  }, [selectedPatch, filter])

  const fetchPatches = async () => {
    try {
      setRefreshing(true)

      const res = await fetch('http://localhost:8000/patches')
      const data = await res.json()

      const nextPatches = data.patches || []

      setPatches(nextPatches)
      setSelectedVersion(nextPatches[0]?.version || null)
    } catch (error) {
      console.error('[PATCH NOTES] Error:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchPatches()
  }, [])

  return (
    <section className="relative h-[calc(100vh-64px)] overflow-hidden px-4 py-4 font-serif text-stone-200">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_45%_0%,rgba(198,161,91,0.10),transparent_35%),radial-gradient(circle_at_70%_70%,rgba(198,161,91,0.045),transparent_42%)]" />

      <div className="relative flex h-full w-full flex-col overflow-hidden border border-[#c6a15b]/20 bg-[#070604]/90 shadow-[0_0_90px_rgba(0,0,0,0.85)] backdrop-blur-xl">
        <FrameOrnaments />

        <div className="relative z-10 flex h-full min-h-0 flex-col px-8 py-6">
          <header className="shrink-0 border-b border-[#c6a15b]/15 pb-6">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center border border-[#c6a15b]/30 bg-[#c6a15b]/10 text-[#d8b66f] shadow-[0_0_28px_rgba(198,161,91,0.18)]">
                  <ScrollText size={24} />
                </div>

                <div>
                  <h1 className="text-xl font-bold uppercase tracking-[0.34em] text-[#e5c77e]">
                    Patch Notes
                  </h1>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.28em] text-stone-500">
                    Live balance archive · Elden Ring
                  </p>
                </div>
              </div>

              <button
                onClick={fetchPatches}
                disabled={refreshing}
                className="flex items-center gap-3 border border-[#c6a15b]/20 bg-black/45 px-4 py-2 text-[#c6a15b] backdrop-blur-md transition hover:border-[#c6a15b]/45 hover:bg-[#c6a15b]/10 disabled:opacity-50"
              >
                <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                <span className="text-[11px] font-bold uppercase tracking-[0.22em]">
                  Refrescar
                </span>
              </button>
            </div>
          </header>

          {loading ? (
            <PatchSkeleton />
          ) : !selectedPatch ? (
            <EmptyState />
          ) : (
            <main className="grid min-h-0 flex-1 grid-cols-[320px_1fr] gap-6 py-6">
              <aside className="min-h-0 overflow-hidden border border-[#c6a15b]/15 bg-black/25 backdrop-blur-md">
                <div className="border-b border-[#c6a15b]/12 px-5 py-4">
                  <p className="text-[10px] uppercase tracking-[0.32em] text-[#c6a15b]/55">
                    Versiones
                  </p>
                </div>

                <div className="h-full overflow-y-auto p-3 custom-scrollbar">
                  {patches.map((patch, index) => (
                    <button
                      key={`${patch.version}-${index}`}
                      onClick={() => {
                        setSelectedVersion(patch.version)
                        setFilter('all')
                        setSelectedChange(null)
                      }}
                      className={`mb-2 w-full border px-4 py-4 text-left transition ${
                        selectedPatch.version === patch.version
                          ? 'border-[#c6a15b]/45 bg-[#c6a15b]/10'
                          : 'border-white/5 bg-white/[0.025] hover:border-[#c6a15b]/25 hover:bg-[#c6a15b]/5'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-bold tracking-[0.18em] text-[#e5c77e]">
                          {patch.version}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-stone-600">
                          {patch.source}
                        </span>
                      </div>

                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-stone-500">
                        {patch.title}
                      </p>
                    </button>
                  ))}
                </div>
              </aside>

              <section className="min-h-0 overflow-hidden border border-[#c6a15b]/15 bg-[radial-gradient(circle_at_50%_15%,rgba(198,161,91,0.055),transparent_42%),linear-gradient(to_bottom,rgba(255,255,255,0.015),rgba(0,0,0,0.08))] backdrop-blur-md">
                <div className="flex h-full min-h-0 flex-col">
                  <div className="shrink-0 border-b border-[#c6a15b]/12 px-7 py-6">
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.32em] text-[#c6a15b]/55">
                          Versión {selectedPatch.version}
                        </p>

                        <h2 className="mt-2 max-w-5xl text-2xl font-bold tracking-[0.12em] text-[#e5c77e]">
                          {selectedPatch.title}
                        </h2>

                        <p className="mt-3 max-w-5xl text-sm leading-7 text-stone-500">
                          {selectedPatch.description || 'Notas del parche recopiladas en tiempo real.'}
                        </p>
                      </div>

                      {selectedPatch.url && (
                        <a
                          href={selectedPatch.url}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 border border-[#c6a15b]/20 bg-black/40 p-3 text-[#c6a15b] transition hover:border-[#c6a15b]/45 hover:bg-[#c6a15b]/10"
                        >
                          <ExternalLink size={18} />
                        </a>
                      )}
                    </div>

                    <div className="mt-6 grid grid-cols-4 gap-3">
                      <Metric label="Buffs" value={selectedPatch.summary?.buffs || 0} type="buff" />
                      <Metric label="Nerfs" value={selectedPatch.summary?.nerfs || 0} type="nerf" />
                      <Metric label="Fixes" value={selectedPatch.summary?.fixes || 0} type="fix" />
                      <Metric label="Ajustes" value={selectedPatch.summary?.adjustments || 0} type="adjustment" />
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
                        Todos
                      </FilterButton>

                      {Object.entries(META).map(([key, meta]) => (
                        <FilterButton
                          key={key}
                          active={filter === key}
                          onClick={() => setFilter(key as ChangeType)}
                        >
                          {meta.label}
                        </FilterButton>
                      ))}
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6 custom-scrollbar">
                    <div className="space-y-3">
                      {visibleChanges.map((change, index) => (
                        <ChangeRow
                          key={`${change.type}-${index}`}
                          change={change}
                          onClick={() => setSelectedChange(change)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </main>
          )}
        </div>
      </div>

      {selectedChange && (
        <ChangeDetailModal
          change={selectedChange}
          onClose={() => setSelectedChange(null)}
        />
      )}
    </section>
  )
}

function Metric({
  label,
  value,
  type,
}: {
  label: string
  value: number
  type: ChangeType
}) {
  const meta = META[type]
  const Icon = meta.icon

  return (
    <div className={`border px-4 py-3 ${meta.className}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.24em] opacity-70">
          {label}
        </span>
        <Icon size={15} />
      </div>
      <p className="mt-2 text-2xl font-bold tracking-widest">{value}</p>
    </div>
  )
}

function ChangeRow({
  change,
  onClick,
}: {
  change: PatchChange
  onClick: () => void
}) {
  const meta = META[change.type] || META.adjustment
  const Icon = meta.icon

  return (
    <article
      onClick={onClick}
      className="group cursor-pointer border border-white/7 bg-black/25 px-5 py-4 backdrop-blur-md transition hover:border-[#c6a15b]/25 hover:bg-black/35"
    >
      <div className="flex items-start gap-4">
        <div className={`mt-1 grid h-9 w-9 shrink-0 place-items-center border ${meta.className}`}>
          <Icon size={17} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold tracking-[0.16em] text-[#e5c77e]">
              {change.item || 'General'}
            </span>

            <span className={`border px-2 py-0.5 text-[9px] uppercase tracking-[0.22em] ${meta.className}`}>
              {meta.label}
            </span>
          </div>

          <p className="mt-2 text-sm leading-7 text-stone-400">
            {change.detail}
          </p>
        </div>
      </div>
    </article>
  )
}

function ChangeDetailModal({
  change,
  onClose,
}: {
  change: PatchChange
  onClose: () => void
}) {
  const meta = META[change.type] || META.adjustment
  const Icon = meta.icon

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 backdrop-blur-md sm:px-6">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden border border-[#c6a15b]/25 bg-[#070604]/95 shadow-[0_0_90px_rgba(0,0,0,0.9)]">
        <FrameOrnaments />

        {/* Header */}
        <div className="relative z-10 flex items-start justify-between gap-4 border-b border-[#c6a15b]/15 px-6 py-5 sm:px-8 sm:py-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-4 sm:items-center">
              <div className={`mt-1 grid h-12 w-12 shrink-0 place-items-center border ${meta.className}`}>
                <Icon size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[9px] uppercase tracking-[0.28em] text-[#c6a15b]/60">
                  {meta.label}
                </p>

                <h2 className="mt-2 text-lg font-bold tracking-[0.12em] text-[#e5c77e] sm:text-xl">
                  {change.item || 'Cambio General'}
                </h2>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center border border-[#c6a15b]/20 bg-black/40 text-[#c6a15b] transition hover:border-[#c6a15b]/50 hover:bg-[#c6a15b]/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-6 py-5 custom-scrollbar sm:px-8 sm:py-6">
          {/* Detail Text */}
          <div className="mb-8">
            <p className="text-[9px] uppercase tracking-[0.28em] text-[#c6a15b]/60">
              Detalles del cambio
            </p>

            <p className="mt-4 text-sm leading-8 text-stone-300 sm:text-base">
              {change.detail}
            </p>
          </div>

          {/* Images */}
          {change.images && change.images.length > 0 && (
            <div className="mb-8">
              <p className="text-[9px] uppercase tracking-[0.28em] text-[#c6a15b]/60">
                Imágenes relacionadas
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {change.images.map((image, index) => (
                  <div
                    key={`${image.src}-${index}`}
                    className="overflow-hidden border border-[#c6a15b]/15 bg-black/35"
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="h-48 w-full object-cover opacity-85 transition hover:opacity-100"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`border px-4 py-2 text-xs uppercase tracking-[0.22em] transition ${
        active
          ? 'border-[#c6a15b]/50 bg-[#c6a15b]/12 text-[#e5c77e]'
          : 'border-white/8 bg-black/25 text-stone-500 hover:border-[#c6a15b]/25 hover:text-[#c6a15b]'
      }`}
    >
      {children}
    </button>
  )
}

function PatchSkeleton() {
  return (
    <main className="grid min-h-0 flex-1 grid-cols-[320px_1fr] gap-6 py-6">
      <div className="border border-[#c6a15b]/15 bg-black/25 p-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="mb-3 border border-white/5 p-4">
            <div className="h-4 w-24 animate-pulse bg-[#c6a15b]/20" />
            <div className="mt-3 h-3 w-full animate-pulse bg-white/8" />
            <div className="mt-2 h-3 w-2/3 animate-pulse bg-white/8" />
          </div>
        ))}
      </div>

      <div className="border border-[#c6a15b]/15 bg-black/20 p-7">
        <div className="h-4 w-36 animate-pulse bg-[#c6a15b]/20" />
        <div className="mt-4 h-8 w-2/3 animate-pulse bg-[#c6a15b]/15" />
        <div className="mt-5 h-4 w-full animate-pulse bg-white/8" />
        <div className="mt-2 h-4 w-4/5 animate-pulse bg-white/8" />

        <div className="mt-8 grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse border border-[#c6a15b]/10 bg-white/[0.03]" />
          ))}
        </div>

        <div className="mt-8 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 animate-pulse border border-white/5 bg-white/[0.025]" />
          ))}
        </div>
      </div>
    </main>
  )
}

function EmptyState() {
  return (
    <div className="grid h-full place-items-center">
      <div className="text-center">
        <Sparkles className="mx-auto text-[#c6a15b]" size={28} />
        <p className="mt-4 text-sm uppercase tracking-[0.28em] text-[#c6a15b]">
          Sin datos disponibles
        </p>
        <p className="mt-3 text-sm text-stone-500">
          No se pudieron leer las notas del parche ahora mismo.
        </p>
      </div>
    </div>
  )
}

function FrameOrnaments() {
  return (
    <>
      <div className="pointer-events-none absolute inset-3 border border-[#c6a15b]/15" />
      <span className="pointer-events-none absolute left-3 top-3 h-6 w-6 border-l border-t border-[#c6a15b]/55" />
      <span className="pointer-events-none absolute right-3 top-3 h-6 w-6 border-r border-t border-[#c6a15b]/55" />
      <span className="pointer-events-none absolute bottom-3 left-3 h-6 w-6 border-b border-l border-[#c6a15b]/55" />
      <span className="pointer-events-none absolute bottom-3 right-3 h-6 w-6 border-b border-r border-[#c6a15b]/55" />
    </>
  )
}