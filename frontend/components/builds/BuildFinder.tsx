'use client'

import { useState } from 'react'

interface BuildItem {
  name: string
  image?: string
}

interface Build {
  build_name: string
  description?: string
  source?: 'reddit' | 'ai'
  reddit_url?: string
  author?: string
  upvotes?: number
  weapon: BuildItem[]
  armor: BuildItem[]
  talismans: BuildItem[]
  skills: BuildItem[]
  spirit_ashes: BuildItem[]
  great_rune?: BuildItem
  spells?: BuildItem[]
}

const PLAYSTYLES = [
  { id: 'sangrado', label: 'Sangrado', icon: '🩸', desc: 'Rivers of Blood & Hemorragia' },
  { id: 'fuerza',   label: 'Fuerza',   icon: '⚒',  desc: 'Armas Colosales y Bonk' },
  { id: 'destreza', label: 'Destreza', icon: '🗡',  desc: 'Rayos y combos rápidos' },
  { id: 'magia',    label: 'Magia',    icon: '✦',  desc: 'Hechizos de la Academia' },
  { id: 'fe',       label: 'Fe',       icon: '☀',  desc: 'Encantamientos y Fuego' },
  { id: 'arcano',   label: 'Arcano',   icon: '◈',  desc: 'Comunión Dragontina' },
]

export default function BuildFinder() {
  const [selected, setSelected] = useState<string | null>(null)
  const [build, setBuild] = useState<Build | null>(null)
  const [loading, setLoading] = useState(false)

  const search = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const res = await fetch('http://localhost:8000/builds/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playstyle: selected, is_dlc: true }),
      })
      const data = await res.json()
      setBuild(data)
    } catch (err) {
      console.error('Error forjando la build:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a] text-[#e0e0e0] font-sans">

      {/* Sidebar */}
      <aside className="w-80 border-r border-[#c9a84c]/20 bg-[#0f0f0f] flex flex-col shadow-2xl">
        <div className="p-8 border-b border-[#c9a84c]/10 bg-gradient-to-b from-[#1a1a1a] to-transparent">
          <h2 className="font-cinzel text-xl text-[#c9a84c] tracking-[0.2em] text-center">FORJA DE BUILDS</h2>
          <div className="h-[1px] w-24 bg-[#c9a84c]/40 mx-auto mt-2" />
          <p className="text-[9px] text-gray-500 mt-4 text-center uppercase tracking-widest opacity-60">
            Elden Ring Knowledge Base
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {PLAYSTYLES.map(p => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`w-full text-left p-4 rounded-sm border transition-all duration-500 group ${
                selected === p.id
                  ? 'bg-[#c9a84c]/5 border-[#c9a84c]/60'
                  : 'border-white/5 hover:border-[#c9a84c]/30 hover:bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`text-2xl transition-transform duration-500 ${selected === p.id ? 'scale-110' : 'opacity-50 group-hover:opacity-100'}`}>
                  {p.icon}
                </span>
                <div>
                  <span className={`block font-cinzel text-sm tracking-widest ${selected === p.id ? 'text-[#c9a84c]' : 'text-gray-400'}`}>
                    {p.label}
                  </span>
                  <span className="text-[10px] text-gray-600 block mt-0.5">{p.desc}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="p-6 bg-[#0c0c0c] border-t border-[#c9a84c]/20">
          <button
            onClick={search}
            disabled={!selected || loading}
            className="w-full bg-transparent border border-[#c9a84c] text-[#c9a84c] hover:bg-[#c9a84c] hover:text-black disabled:opacity-20 disabled:cursor-not-allowed font-cinzel py-4 rounded-sm text-xs tracking-[0.3em] transition-all duration-700 active:scale-95"
          >
            {loading ? 'RECOLECTANDO RUNAS...' : 'FORJAR BUILD'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">

        {/* Estado vacío */}
        {!build && !loading && (
          <div className="h-full flex flex-col items-center justify-center">
            <p className="font-cinzel tracking-[0.4em] text-gray-600 animate-pulse">
              Selecciona tu destino
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-16 h-16 border border-[#c9a84c]/30 border-t-[#c9a84c] rounded-full animate-spin mb-4" />
            <p className="font-cinzel text-[10px] tracking-[0.5em] text-[#c9a84c]">
              Consultando la Gracia...
            </p>
          </div>
        )}

        {/* Build resultado */}
        {build && !loading && (
          <div className="p-10 max-w-6xl mx-auto">

            {/* Header */}
            <div className="relative mb-8 text-center">
              <h1 className="text-5xl font-cinzel text-[#c9a84c] mb-2 uppercase tracking-[0.1em]">
                {build.build_name}
              </h1>
              <div className="flex items-center justify-center gap-4 mb-3">
                <div className="h-[1px] w-32 bg-gradient-to-r from-transparent to-[#c9a84c]/50" />
                <span className="font-cinzel text-[10px] text-gray-500 tracking-[0.3em]">
                  RECOMENDACIÓN DEL ANALISTA
                  {build.description && build.source !== 'ai' && (
  <p className="text-[11px] text-center max-w-2xl mx-auto mt-3 leading-relaxed" style={{ color: 'var(--text-ash)' }}>
    {build.description}
  </p>
)}
                </span>
                <div className="h-[1px] w-32 bg-gradient-to-l from-transparent to-[#c9a84c]/50" />
              </div>

              {/* Fuente */}
              <div className="flex items-center justify-center gap-3 mt-2">
                {build.source === 'reddit' ? (
                  <>
                    <span
                      className="text-[9px] px-2 py-1 tracking-widest uppercase"
                      style={{
                        background: 'rgba(255,69,0,0.1)',
                        border: '1px solid rgba(255,69,0,0.3)',
                        color: '#FF6040',
                        borderRadius: '2px',
                      }}
                    >
                      ◉ Reddit
                    </span>
                    {build.author && (
                      <span className="text-[10px] text-gray-500">
                        por u/{build.author}
                      </span>
                    )}
                    {build.upvotes && (
                      <span className="text-[10px] text-[#c9a84c]/60">
                        ▲ {build.upvotes}
                      </span>
                    )}
                    {build.reddit_url && (
                      
                        <a href={build.reddit_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-[#c9a84c]/40 hover:text-[#c9a84c] transition-colors underline"
                      >
                        Ver post original →
                      </a>
                    )}
                  </>
                ) : (
                  <span
                    className="text-[9px] px-2 py-1 tracking-widest uppercase"
                    style={{
                      background: 'rgba(201,168,76,0.08)',
                      border: '1px solid rgba(201,168,76,0.2)',
                      color: '#7A6030',
                      borderRadius: '2px',
                    }}
                  >
                    ◈ Generada por IA
                  </span>
                )}
              </div>

              <button
                onClick={() => setBuild(null)}
                className="absolute top-0 right-0 text-[9px] text-gray-600 hover:text-[#c9a84c] transition-colors uppercase tracking-widest"
              >
                [ Deshacer ]
              </button>
            </div>

            {/* Great Rune */}
            {build.great_rune && build.great_rune.name !== 'None' && (
              <div className="flex justify-center mb-10">
                <div className="flex items-center gap-6 p-4 bg-gradient-to-r from-transparent via-[#c9a84c]/5 to-transparent border-y border-[#c9a84c]/20 w-full max-w-xl">
                  <div className="w-20 h-20 bg-black/40 border border-[#c9a84c]/30 p-2 rounded">
                    {build.great_rune.image ? (
                      <img
                        src={build.great_rune.image}
                        alt={build.great_rune.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-[8px] text-gray-700">
                        RUNA
                      </div>
                    )}
                  </div>
                  <div className="text-left">
                    <h3 className="text-[#c9a84c] font-cinzel text-xs tracking-widest mb-1">GREAT RUNE</h3>
                    <p className="text-xl text-white font-medium">{build.great_rune.name}</p>
                    <p className="text-[10px] text-gray-500 italic mt-1">
                      El poder del Círculo de Elden restaurado.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Grid de secciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <BuildSection title="Armas de Guerra"          items={build.weapon}       icon="⚔" color="#c9a84c" />
              <BuildSection title="Indumentaria"             items={build.armor}        icon="🛡" color="#8e8e8e" />
              <BuildSection title="Talismanes"               items={build.talismans}    icon="◆" color="#d4af37" />
              {build.spells && build.spells.length > 0 && (
                <BuildSection title="Hechizos y Encantamientos" items={build.spells}   icon="✦" color="#60a5fa" />
              )}
              <BuildSection title="Cenizas de Guerra"        items={build.skills}       icon="◈" color="#4ade80" />
              <BuildSection title="Cenizas de Espíritu"      items={build.spirit_ashes} icon="◎" color="#a78bfa" />
            </div>

          </div>
        )}

      </main>
    </div>
  )
}

function BuildSection({
  title, items, icon, color,
}: {
  title: string
  items: BuildItem[]
  icon: string
  color: string
}) {
  if (!items || items.length === 0) return null

  return (
    <section className="bg-[#121212]/80 border border-[#c9a84c]/10 rounded-sm overflow-hidden shadow-xl hover:border-[#c9a84c]/30 transition-all duration-500">
      <div className="px-5 py-3 border-b border-[#c9a84c]/10 flex items-center justify-between bg-black/40">
        <h3 className="font-cinzel text-[11px] tracking-[0.2em] uppercase" style={{ color }}>
          {title}
        </h3>
        <span className="opacity-50 text-sm" style={{ color }}>{icon}</span>
      </div>
      <div className="p-4 space-y-4">
        {items.map((item, i) => (
          <div key={i} className="flex gap-4 items-center group/item">
            <div className="w-14 h-14 bg-[#1a1a1a] border border-white/5 rounded-sm flex-shrink-0 flex items-center justify-center overflow-hidden group-hover/item:border-[#c9a84c]/40 transition-colors">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1" />
              ) : (
                <div className="text-[8px] text-gray-700 font-cinzel">VACÍO</div>
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-[12px] font-medium text-gray-300 group-hover/item:text-[#c9a84c] transition-colors leading-tight">
                {item.name}
              </h4>
              <p className="text-[9px] text-gray-600 uppercase tracking-tighter mt-1 italic">
                Objeto de Gracia
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}