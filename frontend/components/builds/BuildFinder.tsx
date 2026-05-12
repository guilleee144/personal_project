'use client'

import { useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const gold    = '#C9A84C'
const goldDim = '#A07840'
const textAsh = '#B8A888'

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
  {
    id: 'sangrado',
    label: 'Bleed',
    icon: '🜁',
    desc: 'Rivers of Blood & Blood loss builds',
    accent: '#c0415a',
    accentDim: 'rgba(192,65,90,0.15)',
  },
  {
    id: 'fuerza',
    label: 'Strength',
    icon: '⚒',
    desc: 'Collosal weapons and Bonk',
    accent: '#C9A84C',
    accentDim: 'rgba(201,168,76,0.12)',
  },
  {
    id: 'destreza',
    label: 'Dexterity',
    icon: '◈',
    desc: 'Lightning and quick combos',
    accent: '#60b8d4',
    accentDim: 'rgba(96,184,212,0.12)',
  },
  {
    id: 'magia',
    label: 'Mage',
    icon: '✦',
    desc: 'Glintstone sorceries of Raya Lucaria',
    accent: '#7b9fd4',
    accentDim: 'rgba(123,159,212,0.12)',
  },
  {
    id: 'fe',
    label: 'Faith',
    icon: '☀',
    desc: 'Enchantments and Fire',
    accent: '#d4a43a',
    accentDim: 'rgba(212,164,58,0.12)',
  },
  {
    id: 'arcano',
    label: 'Arcane',
    icon: '◉',
    desc: 'Dragon Communion and item discovery builds',
    accent: '#9d4edd',
    accentDim: 'rgba(157,78,221,0.12)',
  },
]

const SECTIONS = [
  { key: 'weapon',      label: 'Weapons',   icon: '⚔' },
  { key: 'armor',       label: 'Armor', icon: '◈' },
  { key: 'talismans',   label: 'Talismans',   icon: '◆' },
  { key: 'skills',      label: 'Skills',      icon: '✦' },
  { key: 'spirit_ashes',label: 'Spirit Ashes',    icon: '◎' },
  { key: 'spells',      label: 'Spells',        icon: '☽' },
]

export default function BuildFinder() {
  const [selected, setSelected] = useState<string | null>(null)
  const [build, setBuild]       = useState<Build | null>(null)
  const [loading, setLoading]   = useState(false)

  const search = async () => {
    if (!selected) return
    setLoading(true)
    setBuild(null)
    try {
      const res = await fetch(`${API}/builds/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playstyle: selected, is_dlc: true }),
      })
      const data = await res.json()
      setBuild(data)
    } catch (err) {
      console.error('Error finding build:', err)
    } finally {
      setLoading(false)
    }
  }

  const activeStyle = PLAYSTYLES.find(p => p.id === selected)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#070604', color: '#D4C5A0',
      fontFamily: "'IBM Plex Sans', sans-serif",
    }}>

      {/* ── STICKY HEADER ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(7,6,4,0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(201,168,76,0.1)',
        padding: '18px 28px 14px',
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{ flex: '0 0 auto' }}>
          <h1 style={{
            fontFamily: "'Cinzel', serif", fontSize: 18, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: gold, margin: 0, lineHeight: 1,
          }}>Build Finder</h1>
          <p style={{ fontSize: 10, color: goldDim, letterSpacing: '0.08em', marginTop: 4 }}>
            Find your perfect build in the Lands Between
          </p>
        </div>

        <div style={{ width: 1, height: 32, background: 'rgba(201,168,76,0.1)', flexShrink: 0 }} />

        {/* Playstyle pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
          {PLAYSTYLES.map(p => (
            <PlaystylePill
              key={p.id}
              playstyle={p}
              active={selected === p.id}
              onClick={() => setSelected(p.id)}
            />
          ))}
        </div>

        {/* Forge button */}
        <button
          onClick={search}
          disabled={!selected || loading}
          style={{
            flexShrink: 0,
            padding: '8px 20px',
            fontFamily: "'Cinzel', serif",
            fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
            cursor: !selected || loading ? 'not-allowed' : 'pointer',
            border: `1px solid ${!selected || loading ? 'rgba(201,168,76,0.15)' : gold}`,
            background: !selected || loading
              ? 'rgba(201,168,76,0.03)'
              : 'rgba(201,168,76,0.12)',
            color: !selected || loading ? goldDim : gold,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            if (selected && !loading) {
              e.currentTarget.style.background = 'rgba(201,168,76,0.2)'
            }
          }}
          onMouseLeave={e => {
            if (selected && !loading) {
              e.currentTarget.style.background = 'rgba(201,168,76,0.12)'
            }
          }}
        >
          {loading ? 'Forging' : 'Forge Build'}
        </button>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 28px' }}>

        {/* Empty state */}
        {!build && !loading && (
          <div style={{
            height: '100%', minHeight: 400,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 16,
          }}>
            <div style={{
              width: 64, height: 64,
              border: '1px solid rgba(201,168,76,0.15)',
              display: 'grid', placeItems: 'center',
              fontSize: 28, color: 'rgba(201,168,76,0.2)',
            }}>⚔</div>
            <p style={{
              fontFamily: "'Cinzel', serif", fontSize: 11,
              letterSpacing: '0.4em', textTransform: 'uppercase',
              color: 'rgba(201,168,76,0.2)',
            }}>
              {selected ? 'Press Forge Build to continue' : 'Select your destination, Sinluz'}
            </p>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{
            minHeight: 400, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 20,
          }}>
            <div style={{ position: 'relative', width: 56, height: 56 }}>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                border: '1px solid rgba(201,168,76,0.15)',
              }} />
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                borderTop: `2px solid ${gold}`,
                animation: 'buildfinder-spin 1s linear infinite',
              }} />
            </div>
            <p style={{
              fontFamily: "'Cinzel', serif", fontSize: 10,
              letterSpacing: '0.4em', textTransform: 'uppercase',
              color: goldDim,
            }}>Consultando la Gracia...</p>
          </div>
        )}

        {/* Build result */}
        {build && !loading && (
          <div>
            {/* Build title */}
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <p style={{
                fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: 3,
                textTransform: 'uppercase', color: goldDim, marginBottom: 10,
              }}>
                {activeStyle && (
                  <span style={{ color: activeStyle.accent, marginRight: 8 }}>{activeStyle.icon}</span>
                )}
                Build Recomendada
              </p>
              <h2 style={{
                fontFamily: "'Cinzel', serif", fontSize: 28, fontWeight: 700,
                color: '#E8D8A0', letterSpacing: '0.08em',
                textTransform: 'uppercase', margin: '0 0 16px',
              }}>{build.build_name}</h2>

              {/* Decorative divider */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <div style={{ width: 80, height: 1, background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.4))' }} />
                <span style={{ color: 'rgba(201,168,76,0.4)', fontSize: 10 }}>◆</span>
                <div style={{ width: 80, height: 1, background: 'linear-gradient(to left, transparent, rgba(201,168,76,0.4))' }} />
              </div>

              {build.description && (
                <p style={{
                  fontSize: 12, lineHeight: 1.7, color: '#9A9080',
                  maxWidth: 600, margin: '16px auto 0',
                  fontStyle: 'italic',
                }}>{build.description}</p>
              )}
            </div>

            {/* Build cards grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}>
              {SECTIONS.map(section => {
                const items = (build as any)[section.key]
                if (!items || items.length === 0) return null
                return (
                  <BuildCard
                    key={section.key}
                    title={section.label}
                    icon={section.icon}
                    items={items}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes buildfinder-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

/* ── Sub-components ── */

function PlaystylePill({
  playstyle, active, onClick,
}: {
  playstyle: typeof PLAYSTYLES[0]
  active: boolean
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const show = active || hovered

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 14px',
        border: `1px solid ${show ? playstyle.accent : 'rgba(201,168,76,0.1)'}`,
        background: show ? playstyle.accentDim : 'transparent',
        cursor: 'pointer', transition: 'all 0.2s',
        borderBottom: active ? `2px solid ${playstyle.accent}` : `1px solid ${show ? playstyle.accent : 'rgba(201,168,76,0.1)'}`,
      }}
    >
      <span style={{ fontSize: 13, color: show ? playstyle.accent : goldDim }}>
        {playstyle.icon}
      </span>
      <div style={{ textAlign: 'left' }}>
        <p style={{
          fontFamily: "'Cinzel', serif", fontSize: 11,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          color: show ? playstyle.accent : '#9A9080',
          margin: 0, lineHeight: 1,
          transition: 'color 0.2s',
        }}>{playstyle.label}</p>
        <p style={{
          fontSize: 9, color: show ? 'rgba(154,144,128,0.8)' : 'rgba(90,80,64,0.7)',
          margin: '2px 0 0', letterSpacing: '0.02em',
          transition: 'color 0.2s',
        }}>{playstyle.desc}</p>
      </div>
    </button>
  )
}

function BuildCard({ title, icon, items }: { title: string; icon: string; items: BuildItem[] }) {
  return (
    <div style={{
      background: 'rgba(201,168,76,0.02)',
      border: '1px solid rgba(201,168,76,0.1)',
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.1)')}
    >
      {/* Card header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px',
        borderBottom: '1px solid rgba(201,168,76,0.08)',
        background: 'rgba(201,168,76,0.03)',
      }}>
        <p style={{
          fontFamily: "'Cinzel', serif", fontSize: 9,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: goldDim, margin: 0,
        }}>{title}</p>
        <span style={{ fontSize: 12, color: 'rgba(201,168,76,0.3)' }}>{icon}</span>
      </div>

      {/* Items */}
      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item, i) => (
          <BuildItem key={i} item={item} />
        ))}
      </div>
    </div>
  )
}

function BuildItem({ item }: { item: BuildItem }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '6px 8px',
        background: hovered ? 'rgba(201,168,76,0.05)' : 'transparent',
        border: `1px solid ${hovered ? 'rgba(201,168,76,0.15)' : 'transparent'}`,
        transition: 'all 0.2s', cursor: 'default',
      }}
    >
      {/* Image */}
      <div style={{
        width: 44, height: 44, flexShrink: 0,
        border: '1px solid rgba(201,168,76,0.15)',
        background: 'rgba(201,168,76,0.03)',
        display: 'grid', placeItems: 'center', overflow: 'hidden',
      }}>
        {item.image ? (
          <img
            src={item.image} alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <span style={{ fontSize: 9, color: goldDim, fontFamily: "'Cinzel', serif" }}>N/A</span>
        )}
      </div>

      {/* Name */}
      <div style={{ minWidth: 0 }}>
        <p style={{
          fontSize: 12, fontWeight: 500,
          color: hovered ? '#E8D8A0' : '#C9B896',
          margin: 0, overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          transition: 'color 0.2s',
        }}>{item.name}</p>
        <p style={{
          fontSize: 9, color: goldDim, margin: '2px 0 0',
          fontFamily: "'Cinzel', serif", letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>Objeto de Gracia</p>
      </div>
    </div>
  )
}