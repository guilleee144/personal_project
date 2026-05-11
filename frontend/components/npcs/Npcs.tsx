'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface NPC {
  id: number
  name: string
  image?: string
  location?: string
  role?: string
  description?: string
  dlc?: boolean
}

export default function NPCs() {
  const [npcs, setNpcs] = useState<NPC[]>([])
  const [filteredNpcs, setFilteredNpcs] = useState<NPC[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedNpc, setSelectedNpc] = useState<NPC | null>(null)

  useEffect(() => {
    const fetchNpcs = async () => {
      try {
        const res = await fetch('http://localhost:8000/npcs')
        const data = await res.json()
        setNpcs(data.npcs || [])
        setFilteredNpcs(data.npcs || [])
      } catch (error) {
        console.error('Error fetching NPCs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNpcs()
  }, [])

  useEffect(() => {
    if (search.trim()) {
      const searchLower = search.toLowerCase()
      setFilteredNpcs(npcs.filter(npc => npc.name.toLowerCase().includes(searchLower)))
    } else {
      setFilteredNpcs(npcs)
    }
  }, [search, npcs])

  return (
    <section className="relative bg-[#070604] font-serif text-stone-200 w-full min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(198,161,91,0.08),transparent_50%)]" />

      <div className="relative z-10 w-full flex flex-col min-h-screen">
        {/* Header - Fixed */}
        <div className="px-8 py-8 border-b border-[#c6a15b]/10 shrink-0">
          <h1 className="text-5xl font-bold uppercase tracking-[0.08em] text-[#e5c77e] mb-6">
            NPCs & Merchants
          </h1>
          
          {/* Search */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative">
              <input
                type="text"
                placeholder="Search NPCs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-80 bg-[#0f0e0a] border border-[#c6a15b]/20 rounded-lg px-4 py-2 text-sm text-stone-200 placeholder:text-stone-500 focus:border-[#c6a15b]/60 focus:outline-none transition-colors"
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
            <p className="text-stone-500 text-sm">
              {filteredNpcs.length} {filteredNpcs.length === 1 ? 'NPC' : 'NPCs'} found
            </p>
          </div>
        </div>

        {/* Grid - Scrolleable */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          {loading ? (
            <div className="flex justify-center py-20 text-[#c6a15b]">Loading NPCs...</div>
          ) : filteredNpcs.length === 0 ? (
            <div className="flex justify-center py-20 text-stone-500">No NPCs found</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
              {filteredNpcs.map((npc) => (
                <button
                  key={npc.id}
                  onClick={() => setSelectedNpc(npc)}
                  className="group relative overflow-hidden rounded-lg border border-[#c6a15b]/20 bg-[#0f0e0a]/40 transition-all hover:border-[#c6a15b]/60 hover:bg-[#0f0e0a]/80 text-left"
                >
                  {/* Image */}
                  {npc.image && (
                    <div className="relative h-56 overflow-hidden bg-[#070604]">
                      <img
                        src={npc.image}
                        alt={npc.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-85 group-hover:opacity-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f0e0a] via-transparent to-transparent" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-[#e5c77e] group-hover:text-[#ffe09a] transition-colors line-clamp-2">
                        {npc.name}
                      </h3>
                      {npc.dlc && (
                        <span className="inline-block px-1.5 py-0.5 text-[7px] uppercase tracking-widest rounded bg-[#9d4edd]/25 border border-[#9d4edd]/50 text-[#c090ff] whitespace-nowrap font-bold shrink-0">
                          ✦ DLC
                        </span>
                      )}
                    </div>

                    {npc.role && (
                      <p className="text-xs text-stone-400 uppercase tracking-widest mb-2 line-clamp-1">
                        {npc.role}
                      </p>
                    )}

                    {npc.description && (
                      <p className="text-xs text-stone-300 leading-relaxed line-clamp-3">
                        {npc.description}
                      </p>
                    )}
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#c6a15b] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedNpc && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedNpc(null)}
        >
          <div
            className="bg-[#0f0e0a] border border-[#c6a15b]/30 rounded w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#070604] border-b border-[#c6a15b]/20 px-6 py-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-2xl font-bold text-[#e5c77e] uppercase tracking-[0.08em] truncate">
                  {selectedNpc.name}
                </h2>
                {selectedNpc.dlc && (
                  <span className="inline-block px-2 py-0.5 text-[8px] uppercase tracking-widest rounded bg-[#9d4edd]/20 border border-[#9d4edd]/40 text-[#c090ff] whitespace-nowrap shrink-0">
                    ✦ DLC
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedNpc(null)}
                className="text-stone-500 hover:text-[#c6a15b] text-2xl leading-none ml-4 shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Content - Scrolleable */}
            <div className="overflow-y-auto flex-1 px-6 py-6">
              {/* Image */}
              {selectedNpc.image && (
                <div className="mb-6 bg-[#070604] rounded-lg border border-[#c6a15b]/20 p-4 flex items-center justify-center h-64">
                  <img
                    src={selectedNpc.image}
                    alt={selectedNpc.name}
                    className="max-h-60 max-w-full object-contain"
                  />
                </div>
              )}

              {/* Info */}
              <div className="space-y-4">
                {selectedNpc.role && (
                  <div className="border-b border-[#c6a15b]/10 pb-3">
                    <div className="text-xs uppercase tracking-widest text-stone-500 mb-1 font-bold">Role</div>
                    <div className="text-stone-200 text-sm">{selectedNpc.role}</div>
                  </div>
                )}

                {selectedNpc.location && (
                  <div className="border-b border-[#c6a15b]/10 pb-3">
                    <div className="text-xs uppercase tracking-widest text-stone-500 mb-1 font-bold">Location</div>
                    <div className="text-stone-200 text-sm">{selectedNpc.location}</div>
                  </div>
                )}

                {selectedNpc.description && (
                  <div className="pb-3">
                    <div className="text-xs uppercase tracking-widest text-stone-500 mb-1 font-bold">Description</div>
                    <div className="text-stone-200 text-sm leading-relaxed">{selectedNpc.description}</div>
                  </div>
                )}

                {/* More Info Button */}
                <div className="pt-4 border-t border-[#c6a15b]/10">
                  <a
                    href={`https://eldenring.wiki.fextralife.com/${selectedNpc.name.replace(/\s+/g, '+')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center bg-[#c6a15b]/20 border border-[#c6a15b]/60 hover:bg-[#c6a15b]/30 text-[#c6a15b] px-4 py-2 rounded-lg text-sm uppercase tracking-widest font-medium transition-all"
                  >
                    More Info on Fextralife →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}