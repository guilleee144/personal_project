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
    <section className="relative bg-[#070604] font-serif text-stone-200 w-full min-h-screen flex flex-col">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(198,161,91,0.08),transparent_50%)]" />

      <div className="relative z-10 w-full flex flex-col flex-1">
        {/* Header - Fixed */}
        <div className="px-8 py-8 border-b border-[#c6a15b]/10 shrink-0">
          <h1 className="text-5xl font-bold uppercase tracking-[0.08em] text-[#e5c77e] mb-6">
            Bosses
          </h1>

          {/* Search & Filters */}
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" size={16} />
                <input
                  type="text"
                  placeholder="Search bosses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#0f0e0a] border border-[#c6a15b]/20 rounded-lg px-4 py-2 pl-10 text-sm text-stone-200 placeholder:text-stone-500 focus:border-[#c6a15b]/60 focus:outline-none transition-colors"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <p className="text-stone-500 text-sm whitespace-nowrap">
                {bosses.length} {bosses.length === 1 ? 'boss' : 'bosses'}
              </p>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setDlcFilter(null)}
                className={`px-4 py-2 text-xs uppercase tracking-widest rounded-lg font-medium transition-all ${
                  dlcFilter === null
                    ? 'bg-[#c6a15b]/25 border border-[#c6a15b]/60 text-[#c6a15b]'
                    : 'bg-transparent border border-[#c6a15b]/20 text-stone-400 hover:text-[#c6a15b]'
                }`}
              >
                All
              </button>

              <button
                onClick={() => setDlcFilter(false)}
                className={`px-4 py-2 text-xs uppercase tracking-widest rounded-lg font-medium transition-all ${
                  dlcFilter === false
                    ? 'bg-[#c6a15b]/25 border border-[#c6a15b]/60 text-[#c6a15b]'
                    : 'bg-transparent border border-[#c6a15b]/20 text-stone-400 hover:text-[#c6a15b]'
                }`}
              >
                Base
              </button>

              <button
                onClick={() => setDlcFilter(true)}
                className={`px-4 py-2 text-xs uppercase tracking-widest rounded-lg font-medium transition-all ${
                  dlcFilter === true
                    ? 'bg-[#c6a15b]/25 border border-[#c6a15b]/60 text-[#c6a15b]'
                    : 'bg-transparent border border-[#c6a15b]/20 text-stone-400 hover:text-[#c6a15b]'
                }`}
              >
                DLC
              </button>
            </div>
          </div>
        </div>

        {/* Content - Scrolleable */}
        {loading ? (
          <BossesSkeleton />
        ) : bosses.length === 0 ? (
          <EmptyState />
        ) : (
          <main className="flex-1 overflow-y-auto px-8 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-lg border border-[#c6a15b]/20 bg-[#0f0e0a]/40 transition-all hover:border-[#c6a15b]/60 hover:bg-[#0f0e0a]/80 text-left"
    >
      {/* Image */}
      {boss.image && (
        <div className="relative h-56 overflow-hidden bg-[#070604]">
          <img
            src={boss.image}
            alt={boss.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-85 group-hover:opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0e0a] via-transparent to-transparent" />
          {boss.dlc && (
            <span className="absolute top-3 right-3 px-2 py-1 text-[7px] uppercase tracking-widest rounded bg-[#9d4edd]/25 border border-[#9d4edd]/50 text-[#c090ff] font-bold">
              ✦ DLC
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-[#e5c77e] group-hover:text-[#ffe09a] transition-colors line-clamp-2 mb-2">
          {boss.name}
        </h3>

        {boss.hp && (
          <p className="text-xs text-stone-400 uppercase tracking-widest mb-3">
            HP: <span className="text-[#c6a15b] font-semibold">{boss.hp.toLocaleString()}</span>
          </p>
        )}

        {boss.blockquote && (
          <p className="text-xs text-stone-300 leading-relaxed line-clamp-2 italic">
            "{boss.blockquote}"
          </p>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#c6a15b] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
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
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="relative flex w-full max-w-2xl max-h-[85vh] flex-col overflow-hidden rounded border border-[#c6a15b]/30 bg-[#0f0e0a]">
        {/* Header */}
        <div className="bg-[#070604] border-b border-[#c6a15b]/20 px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-2xl font-bold text-[#e5c77e] uppercase tracking-[0.08em] truncate">
              {boss.name}
            </h2>
            {boss.dlc && (
              <span className="inline-block px-2 py-0.5 text-[8px] uppercase tracking-widest rounded bg-[#9d4edd]/20 border border-[#9d4edd]/40 text-[#c090ff] whitespace-nowrap shrink-0">
                ✦ DLC
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-[#c6a15b] text-2xl leading-none ml-4 shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-6">
          {/* Image */}
          {boss.image && (
            <div className="mb-6 bg-[#070604] rounded-lg border border-[#c6a15b]/20 p-4 flex items-center justify-center h-64">
              <img
                src={boss.image}
                alt={boss.name}
                className="max-h-60 max-w-full object-contain"
              />
            </div>
          )}

          {/* Stats */}
          <div className="space-y-4">
            {boss.hp && (
              <div className="border-b border-[#c6a15b]/10 pb-3">
                <div className="text-xs uppercase tracking-widest text-stone-500 mb-1 font-bold">HP</div>
                <div className="text-stone-200 text-lg font-semibold">{boss.hp.toLocaleString()}</div>
              </div>
            )}

            {boss.blockquote && (
              <div className="border-b border-[#c6a15b]/10 pb-3">
                <div className="text-xs uppercase tracking-widest text-stone-500 mb-1 font-bold">Description</div>
                <div className="text-stone-200 text-sm leading-relaxed italic">"{boss.blockquote}"</div>
              </div>
            )}

            {locationsText && (
              <div className="pb-3">
                <div className="text-xs uppercase tracking-widest text-stone-500 mb-1 font-bold">Locations & Drops</div>
                <div className="text-stone-200 text-sm whitespace-pre-wrap">{locationsText}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function BossesSkeleton() {
  return (
    <main className="flex-1 overflow-y-auto px-8 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="border border-[#c6a15b]/10 bg-[#0f0e0a]/40 rounded-lg overflow-hidden">
            <div className="h-56 animate-pulse bg-[#c6a15b]/10" />
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
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.08em] text-stone-500">
          No bosses found
        </p>
      </div>
    </div>
  )
}