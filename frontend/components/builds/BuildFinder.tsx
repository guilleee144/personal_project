'use client'

import { useState } from 'react'
import { Sword, Shield, Sparkles, Ghost, Scroll, Box } from 'lucide-react'

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
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a] text-[#e0e0e0]">
      {/* Sidebar */}
      <aside className="w-80 border-r border-[#c9a84c]/20 bg-[#0f0f0f] flex flex-col shadow-2xl">
        <div className="p-8 border-b border-[#c9a84c]/10 bg-gradient-to-b from-[#1a1a1a] to-transparent text-center">
          <h2 className="font-cinzel text-xl text-[#c9a84c] tracking-[0.2em]">FORJA DE BUILDS</h2>
          <div className="h-px w-24 bg-[#c9a84c]/40 mx-auto mt-2" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {PLAYSTYLES.map(p => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`w-full text-left p-4 rounded-sm border transition-all duration-300 group ${
                selected === p.id
                  ? 'bg-[#c9a84c]/10 border-[#c9a84c]/60 shadow-[0_0_15px_rgba(201,168,76,0.1)]'
                  : 'border-white/5 hover:border-[#c9a84c]/30 hover:bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`text-2xl transition-transform ${selected === p.id ? 'scale-110' : 'opacity-50 group-hover:opacity-100'}`}>
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
            className="w-full bg-transparent border border-[#c9a84c] text-[#c9a84c] hover:bg-[#c9a84c] hover:text-black disabled:opacity-20 disabled:cursor-not-allowed font-cinzel py-4 rounded-sm text-xs tracking-[0.3em] transition-all duration-500"
          >
            {loading ? 'RECOLECTANDO RUNAS...' : 'FORJAR BUILD'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[url('/gold-dust.png')] bg-fixed">
        {!build && !loading && (
          <div className="h-full flex flex-col items-center justify-center opacity-30">
            <p className="font-cinzel tracking-[0.4em] text-[#c9a84c] animate-pulse uppercase text-sm">
              Selecciona tu destino, Sinluz
            </p>
          </div>
        )}

        {loading && (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="relative w-20 h-20">
               <div className="absolute inset-0 border-2 border-[#c9a84c]/20 rounded-full"></div>
               <div className="absolute inset-0 border-t-2 border-[#c9a84c] rounded-full animate-spin"></div>
            </div>
            <p className="font-cinzel text-[10px] tracking-[0.5em] text-[#c9a84c] mt-6 animate-pulse">
              CONSULTANDO LA GRACIA...
            </p>
          </div>
        )}

        {build && !loading && (
          <div className="p-10 max-w-6xl mx-auto animate-in fade-in duration-700">
            {/* Header de la Build */}
            <div className="text-center mb-12 relative">
              <h1 className="text-6xl font-cinzel text-[#c9a84c] mb-4 tracking-tighter drop-shadow-2xl">
                {build.build_name}
              </h1>
              <div className="flex items-center justify-center gap-6 text-[10px] tracking-[0.3em] text-gray-500 uppercase">
                <div className="h-px w-20 bg-gradient-to-r from-transparent to-[#c9a84c]/50" />
                <span>Build de Analista</span>
                <div className="h-px w-20 bg-gradient-to-l from-transparent to-[#c9a84c]/50" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <BuildCard title="Armamento" items={build.weapon} icon={<Sword size={16}/>} accent="#c9a84c" />
              <BuildCard title="Indumentaria" items={build.armor} icon={<Shield size={16}/>} accent="#8e8e8e" />
              <BuildCard title="Talismanes" items={build.talismans} icon={<Box size={16}/>} accent="#d4af37" />
              <BuildCard title="Cenizas" items={build.skills} icon={<Sparkles size={16}/>} accent="#4ade80" />
              <BuildCard title="Espíritus" items={build.spirit_ashes} icon={<Ghost size={16}/>} accent="#a78bfa" />
              {build.spells && <BuildCard title="Magia" items={build.spells} icon={<Scroll size={16}/>} accent="#60a5fa" />}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function BuildCard({ title, items, icon, accent }: { title: string, items: any[], icon: any, accent: string }) {
  return (
    <div className="group bg-[#121212]/60 border border-white/5 hover:border-[#c9a84c]/30 p-4 rounded-sm transition-all duration-500">
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
        <h3 className="font-cinzel text-[11px] tracking-widest uppercase opacity-80" style={{ color: accent }}>{title}</h3>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 group/item">
            <div className="w-12 h-12 bg-black/40 border border-white/10 rounded-sm overflow-hidden flex-shrink-0 group-hover/item:border-[#c9a84c]/50 transition-colors">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-700 font-cinzel">N/A</div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-300 truncate group-hover/item:text-[#c9a84c] transition-colors">
                {item.name}
              </p>
              <p className="text-[9px] text-gray-600 italic uppercase">Objeto de Gracia</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}