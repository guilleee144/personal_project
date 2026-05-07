'use client'

import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'

interface Boss {
  id: number
  name: string
  image?: string
  hp?: number
  locations_and_drops?: string | Record<string, unknown>
  blockquote?: string
  dlc: boolean
}

export default function Bosses() {
  const [bosses, setBosses] = useState<Boss[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dlcFilter, setDlcFilter] = useState<boolean | null>(null)
  const [selectedBoss, setSelectedBoss] = useState<Boss | null>(null)

  const fetchBosses = async () => {
    try {
      setLoading(true)
      let url = 'http://localhost:8000/bosses?'

      if (dlcFilter !== null) {
        url += `dlc=${dlcFilter}&`
      }

      if (search) {
        url += `search=${encodeURIComponent(search)}&`
      }

      const res = await fetch(url)
      const data = await res.json()

      setBosses(data.bosses || [])
    } catch (error) {
      console.error('[BOSSES] Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBosses()
  }, [dlcFilter, search])

  return (
    <section className="relative h-[calc(100vh-64px)] overflow-hidden px-4 py-4 font-serif text-stone-200">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_45%_0%,rgba(198,161,91,0.10),transparent_35%),radial-gradient(circle_at_70%_70%,rgba(198,161,91,0.045),transparent_42%)]" />

      <div className="relative flex h-full w-full flex-col overflow-hidden border border-[#c6a15b]/20 bg-[#070604]/90 shadow-[0_0_90px_rgba(0,0,0,0.85)] backdrop-blur-xl">
        <div className="relative z-10 flex h-full min-h-0 flex-col px-8 py-6">
          {/* Header */}
          <header className="shrink-0 border-b border-[#c6a15b]/15 pb-6">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center border border-[#c6a15b]/30 bg-[#c6a15b]/10 text-[#d8b66f] shadow-[0_0_28px_rgba(198,161,91,0.18)]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>

              <div>
                <h1 className="text-xl font-bold uppercase tracking-[0.34em] text-[#e5c77e]">
                  Bosses
                </h1>
                <p className="mt-1 text-[11px] uppercase tracking-[0.28em] text-stone-500">
                  Boss database · Elden Ring
                </p>
              </div>
            </div>

          {/* Search & Filters */}
            <div className="mt-6 flex flex-col gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c6a15b]/50" size={16} />
                <input
                  type="text"
                  placeholder="Buscar por nombre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border border-[#c6a15b]/20 bg-black/30 py-3 pl-11 pr-4 text-sm text-stone-200 placeholder-stone-600 outline-none transition hover:border-[#c6a15b]/40 focus:border-[#c6a15b]/60"
                />
              </div>

              {/* DLC Filter */}
              <div className="flex gap-2">
                <button
                  onClick={() => setDlcFilter(null)}
                  className={`flex-1 sm:flex-none border px-4 py-2.5 text-xs uppercase tracking-[0.22em] transition ${
                    dlcFilter === null
                      ? 'border-[#c6a15b]/50 bg-[#c6a15b]/12 text-[#e5c77e]'
                      : 'border-white/8 bg-black/25 text-stone-500 hover:border-[#c6a15b]/25 hover:text-[#c6a15b]'
                  }`}
                >
                  Todos
                </button>

                <button
                  onClick={() => setDlcFilter(false)}
                  className={`flex-1 sm:flex-none border px-4 py-2.5 text-xs uppercase tracking-[0.22em] transition ${
                    dlcFilter === false
                      ? 'border-[#c6a15b]/50 bg-[#c6a15b]/12 text-[#e5c77e]'
                      : 'border-white/8 bg-black/25 text-stone-500 hover:border-[#c6a15b]/25 hover:text-[#c6a15b]'
                  }`}
                >
                  Base
                </button>

                <button
                  onClick={() => setDlcFilter(true)}
                  className={`flex-1 sm:flex-none border px-4 py-2.5 text-xs uppercase tracking-[0.22em] transition ${
                    dlcFilter === true
                      ? 'border-[#c6a15b]/50 bg-[#c6a15b]/12 text-[#e5c77e]'
                      : 'border-white/8 bg-black/25 text-stone-500 hover:border-[#c6a15b]/25 hover:text-[#c6a15b]'
                  }`}
                >
                  DLC
                </button>
              </div>
            </div>
          </header>

          {/* Content */}
          {loading ? (
            <BossesSkeleton />
          ) : bosses.length === 0 ? (
            <EmptyState />
          ) : (
            <main className="min-h-0 flex-1 overflow-y-auto py-6 px-2 custom-scrollbar">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {bosses.map((boss) => (
                  <BossCard
                    key={boss.id}
                    boss={boss}
                    onClick={() => setSelectedBoss(boss)}
                  />
                ))}
              </div>
            </main>
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedBoss && (
        <BossDetailModal boss={selectedBoss} onClose={() => setSelectedBoss(null)} />
      )}
    </section>
  )
}

interface BossCardProps {
  boss: Boss
  onClick: () => void
}

function BossCard({ boss, onClick }: BossCardProps) {
  return (
    <article
      onClick={onClick}
      className="group cursor-pointer overflow-hidden border border-[#c6a15b]/20 bg-black/40 backdrop-blur-md transition hover:border-[#c6a15b]/40 hover:bg-black/60"
    >
      {/* Image */}
      {boss.image && (
        <div className="relative h-48 overflow-hidden bg-black/50">
          <img
            src={boss.image}
            alt={boss.name}
            className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100 group-hover:scale-105"
          />
          {boss.dlc && (
            <div className="absolute right-2 top-2 border border-purple-500/50 bg-purple-500/20 px-2 py-1 text-[8px] uppercase tracking-widest text-purple-300">
              DLC
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="border-t border-[#c6a15b]/10 px-5 py-5">
        <h3 className="text-base font-bold tracking-[0.16em] text-[#e5c77e]">
          {boss.name}
        </h3>

        {boss.hp && (
          <p className="mt-3 text-sm text-stone-500">
            HP: <span className="text-[#c6a15b] font-semibold">{boss.hp.toLocaleString()}</span>
          </p>
        )}

        {boss.blockquote && (
          <p className="mt-4 line-clamp-3 text-xs italic text-stone-400 leading-relaxed">
            "{boss.blockquote}"
          </p>
        )}
      </div>
    </article>
  )
}

interface BossDetailModalProps {
  boss: Boss
  onClose: () => void
}

function BossDetailModal({ boss, onClose }: BossDetailModalProps) {
  // Parsear locations_and_drops si es un objeto
  let locationsText = ''
  if (boss.locations_and_drops) {
    if (typeof boss.locations_and_drops === 'string') {
      locationsText = boss.locations_and_drops
    } else if (typeof boss.locations_and_drops === 'object') {
      try {
        // Si es un objeto, formatéalo de forma legible
        locationsText = Object.entries(boss.locations_and_drops)
          .map(([key, value]) => {
            if (Array.isArray(value)) {
              return `${key}: ${value.join(', ')}`
            }
            return `${key}: ${JSON.stringify(value)}`
          })
          .join('\n\n')
      } catch {
        locationsText = JSON.stringify(boss.locations_and_drops, null, 2)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 backdrop-blur-md sm:px-6">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden border border-[#c6a15b]/25 bg-[#070604]/95 shadow-[0_0_90px_rgba(0,0,0,0.9)]">
        {/* Header */}
        <div className="relative z-20 flex items-start justify-between gap-6 border-b border-[#c6a15b]/15 px-7 py-7 sm:px-8">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#c6a15b]/70 mb-2">
              Boss Details
            </p>

            <h2 className="text-3xl font-bold tracking-[0.12em] text-[#e5c77e]">
              {boss.name}
            </h2>

            {boss.dlc && (
              <div className="mt-4 border border-purple-500/50 bg-purple-500/20 px-3 py-1.5 w-fit text-[9px] uppercase tracking-widest text-purple-300">
                Shadow of the Erdtree
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="mt-2 grid h-10 w-10 shrink-0 place-items-center border border-[#c6a15b]/20 bg-black/40 text-[#c6a15b] transition hover:border-[#c6a15b]/50 hover:bg-[#c6a15b]/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-7 py-8 custom-scrollbar sm:px-8">
          {/* Image */}
          {boss.image && (
            <div className="mb-10 overflow-hidden border border-[#c6a15b]/15 bg-black/35">
              <img
                src={boss.image}
                alt={boss.name}
                className="h-80 w-full object-cover opacity-85 transition hover:opacity-100"
              />
            </div>
          )}

          {/* Stats */}
          {boss.hp && (
            <div className="mb-10 grid grid-cols-2 gap-4">
              <div className="border border-[#c6a15b]/20 bg-[#c6a15b]/5 px-5 py-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#c6a15b]/70 mb-2">
                  HP
                </p>
                <p className="text-2xl font-bold text-[#e5c77e]">
                  {boss.hp.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Blockquote */}
          {boss.blockquote && (
            <div className="mb-10">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#c6a15b]/70 mb-4">
                Description
              </p>
              <p className="border-l-2 border-[#c6a15b]/30 pl-5 text-base leading-8 italic text-stone-300">
                "{boss.blockquote}"
              </p>
            </div>
          )}

          {/* Locations & Drops */}
          {locationsText && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#c6a15b]/70 mb-4">
                Locations & Drops
              </p>
              <div className="border border-[#c6a15b]/15 bg-black/30 px-5 py-4">
                <p className="text-sm leading-8 text-stone-300 whitespace-pre-wrap font-serif">
                  {locationsText}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BossesSkeleton() {
  return (
    <main className="min-h-0 flex-1 overflow-y-auto py-6 px-2 custom-scrollbar">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="border border-[#c6a15b]/10 bg-black/25 overflow-hidden">
            <div className="h-48 animate-pulse bg-[#c6a15b]/10" />
            <div className="p-5">
              <div className="h-5 w-2/3 animate-pulse bg-[#c6a15b]/10 mb-3" />
              <div className="h-4 w-full animate-pulse bg-white/5 mb-2" />
              <div className="h-4 w-4/5 animate-pulse bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

function EmptyState() {
  return (
    <div className="grid h-full place-items-center">
      <div className="text-center">
        <svg className="mx-auto w-8 h-8 text-[#c6a15b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        <p className="mt-4 text-sm uppercase tracking-[0.28em] text-[#c6a15b]">
          No se encontraron bosses
        </p>
      </div>
    </div>
  )
}