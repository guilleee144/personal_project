'use client'

import { useState } from 'react'

interface BuildItem {
  name: string
  description?: string
  is_dlc?: boolean
  image_url?: string
}

interface Build {
  playstyle: string
  is_dlc: boolean
  weapon: BuildItem[]
  armor: BuildItem[]
  talismans: BuildItem[]
  spells: BuildItem[]
  skills: BuildItem[]
  spirit_ashes: BuildItem[]
  stats_priority?: string[]
}

const PLAYSTYLES = [
  { id: 'sangrado', label: 'Sangrado', icon: '🩸', desc: 'Meta actual: Rivers of Blood & White Mask' },
  { id: 'fuerza', label: 'Fuerza', icon: '⚒', desc: 'Bonk build: Armas colosales y gran aguante' },
  { id: 'destreza', label: 'Destreza', icon: '🗡', desc: 'Rápido: Katanas y combos de mil cortes' },
  { id: 'magia', label: 'Magia', icon: '✦', desc: 'Glass Cannon: Hechizos de máximo daño' },
  { id: 'fe', label: 'Fe', icon: '☀', desc: 'Paladín: Buffs sagrados y fuego mortal' },
  { id: 'arcano', label: 'Arcano', icon: '◈', desc: 'Híbrido: Sangre, Veneno y Magia de Dragón' },
]

export default function BuildFinder() {
  const [selected, setSelected] = useState<string | null>(null)
  const [isDlc, setIsDlc] = useState(false)
  const [build, setBuild] = useState<Build | null>(null)
  const [loading, setLoading] = useState(false)

  const search = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const res = await fetch('http://localhost:8000/builds/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playstyle: selected, is_dlc: isDlc }),
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
      <aside className="w-72 border-r border-[#c9a84c]/30 bg-[#0f0f0f] flex flex-col">
        <div className="p-6 border-b border-[#c9a84c]/20">
          <h2 className="font-cinzel text-lg text-[#c9a84c] tracking-widest">FORJA DE BUILDS</h2>
          <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">Inspirado en Meta-Reddit</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {PLAYSTYLES.map(p => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`w-full text-left p-4 rounded-md border transition-all duration-300 ${
                selected === p.id 
                ? 'bg-[#c9a84c]/10 border-[#c9a84c] shadow-[0_0_15px_rgba(201,168,76,0.1)]' 
                : 'border-transparent hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{p.icon}</span>
                <span className={`font-cinzel text-sm ${selected === p.id ? 'text-[#c9a84c]' : 'text-gray-400'}`}>
                  {p.label}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="p-6 bg-[#0a0a0a] border-t border-[#c9a84c]/20">
          <button
            onClick={search}
            disabled={!selected || loading}
            className="w-full bg-[#c9a84c] hover:bg-[#b08d36] disabled:bg-gray-800 text-black font-cinzel py-3 rounded text-sm tracking-widest transition-all"
          >
            {loading ? 'BUSCANDO...' : 'GENERAR RECOMENDACIÓN'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-fixed">
        {!build && !loading ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30">
            <p className="font-cinzel tracking-[0.2em]">Selecciona un estilo para comenzar</p>
          </div>
        ) : loading ? (
          <div className="h-full flex items-center justify-center">
             <div className="w-12 h-12 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : build && ( /* <--- Aquí aseguramos que build NO sea null */
          <div className="p-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-end border-b border-[#c9a84c]/30 pb-6 mb-8">
              <div>
                <h1 className="text-4xl font-cinzel text-[#c9a84c] mb-2 uppercase tracking-tighter">
                  {build.playstyle} Meta Build
                </h1>
              </div>
              <button onClick={() => setBuild(null)} className="text-[10px] text-gray-500 hover:text-white uppercase">
                [ Resetear ]
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <BuildSection title="Armas" items={build.weapon || []} icon="⚔" color="#c9a84c" />
              <BuildSection title="Armadura" items={build.armor || []} icon="🛡" color="#a0a0a0" />
              <BuildSection title="Talismanes" items={build.talismans || []} icon="◆" color="#ffd700" />
              <BuildSection title="Cenizas" items={build.skills || []} icon="◈" color="#80c080" />
              <BuildSection title="Hechizos" items={build.spells || []} icon="✦" color="#80a0ff" />
              <BuildSection title="Espíritus" items={build.spirit_ashes || []} icon="◎" color="#c090ff" />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function BuildSection({ title, items, icon, color }: { title: string; items: BuildItem[]; icon: string; color: string }) {
  // Verificamos que items exista antes de intentar el map
  if (!items || items.length === 0) return null

  return (
    <section className="bg-[#0f0f0f] border border-white/5 rounded-lg overflow-hidden">
      <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2 bg-white/[0.02]">
        <span style={{ color }}>{icon}</span>
        <h3 className="font-cinzel text-[10px] tracking-widest uppercase py-1" style={{ color }}>{title}</h3>
      </div>
      <div className="p-2 space-y-1">
        {items.map((item, i) => (
          <div key={i} className="p-3 hover:bg-white/[0.03] transition-colors rounded">
            <h4 className="text-[11px] font-bold text-gray-200">{item?.name}</h4>
            {item?.description && (
              <p className="text-[10px] text-gray-500 leading-snug line-clamp-2">{item.description}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}