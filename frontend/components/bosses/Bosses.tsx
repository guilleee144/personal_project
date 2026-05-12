'use client'

import { useState, useEffect, useRef } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const gold    = '#C9A84C'
const goldDim = '#A07840'
const textAsh = '#B8A888'

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
  const [bosses, setBosses]       = useState<Boss[]>([])
  const [filtered, setFiltered]   = useState<Boss[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filter, setFilter]       = useState<'all' | 'base' | 'dlc'>('all')
  const [selected, setSelected]   = useState<Boss | null>(null)
  const modalRef                  = useRef<HTMLDivElement>(null)

  // Fetch
  useEffect(() => {
    fetch(`${API}/bosses`)
      .then(r => r.json())
      .then(d => {
        setBosses(d.bosses ?? [])
        setFiltered(d.bosses ?? [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Filter + search
  useEffect(() => {
    let list = bosses

    if (filter === 'base') list = list.filter(b => !b.dlc)
    if (filter === 'dlc')  list = list.filter(b => b.dlc)

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(b =>
        b.name?.toLowerCase().includes(q) ||
        b.blockquote?.toLowerCase().includes(q)
      )
    }

    setFiltered(list)
  }, [search, filter, bosses])

  // Close modal on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setSelected(null)
      }
    }
    if (selected) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [selected])

  // Close modal on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const FILTER_OPTS = [
    { key: 'all',  label: 'All' },
    { key: 'base', label: 'Base' },
    { key: 'dlc',  label: 'DLC' },
  ] as const

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#070604', color: '#D4C5A0', fontFamily: "'IBM Plex Sans', sans-serif",
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
        {/* Title */}
        <div style={{ flex: '0 0 auto' }}>
          <h1 style={{
            fontFamily: "'Cinzel', serif", fontSize: 18, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: gold, margin: 0, lineHeight: 1,
          }}>Bosses</h1>
          <p style={{ fontSize: 10, color: goldDim, letterSpacing: '0.08em', marginTop: 4 }}>
            {filtered.length} of {bosses.length} entries
          </p>
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 32, background: 'rgba(201,168,76,0.1)', flexShrink: 0 }} />

        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 380 }}>
          <span style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            fontSize: 12, color: goldDim, pointerEvents: 'none',
          }}>⌕</span>
          <input
            type="text"
            placeholder="Search by name, description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', paddingLeft: 28, paddingRight: 12,
              height: 34, fontSize: 12, color: '#D4C5A0',
              background: 'rgba(201,168,76,0.04)',
              border: '1px solid rgba(201,168,76,0.15)',
              outline: 'none', fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {FILTER_OPTS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              style={{
                padding: '5px 14px', fontSize: 11, fontFamily: "'Cinzel', serif",
                letterSpacing: '0.06em', textTransform: 'uppercase',
                cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                background: filter === opt.key
                  ? 'rgba(201,168,76,0.15)'
                  : 'rgba(201,168,76,0.04)',
                color: filter === opt.key ? gold : goldDim,
                borderBottom: filter === opt.key
                  ? `1px solid ${gold}`
                  : '1px solid rgba(201,168,76,0.1)',
              }}
            >
              {opt.label === 'DLC' ? (
                <span style={{ color: filter === opt.key ? '#9d4edd' : 'rgba(157,78,221,0.5)' }}>
                  DLC
                </span>
              ) : opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

        {loading && (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <p style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: goldDim, letterSpacing: '0.1em' }}>
              Loading bosses...
            </p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <p style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: goldDim, letterSpacing: '0.1em' }}>
              No bosses found
            </p>
          </div>
        )}

        {!loading && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}>
            {filtered.map(boss => (
              <BossCard
                key={boss.id}
                boss={boss}
                onClick={() => setSelected(boss)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL ── */}
      {selected && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(4,3,2,0.88)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          <div ref={modalRef} style={{
            width: '100%', maxWidth: 680,
            background: '#0c0a08',
            border: '1px solid rgba(201,168,76,0.2)',
            boxShadow: '0 0 60px rgba(201,168,76,0.06)',
            display: 'flex', flexDirection: 'column',
            maxHeight: '90vh', overflowY: 'auto',
          }}>

            {/* Modal header bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: '1px solid rgba(201,168,76,0.1)',
            }}>
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: 3, color: goldDim, textTransform: 'uppercase' }}>
                Boss Detail
              </span>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: goldDim, fontSize: 16, lineHeight: 1, padding: 4,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = gold)}
                onMouseLeave={e => (e.currentTarget.style.color = goldDim)}
              >✕</button>
            </div>

            {/* Modal body */}
            <div style={{ display: 'flex', gap: 0 }}>

              {/* Image panel */}
              <div style={{
                width: 220, flexShrink: 0,
                borderRight: '1px solid rgba(201,168,76,0.1)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '28px 20px',
                background: 'rgba(201,168,76,0.02)',
              }}>
                <div style={{
                  width: 160, height: 160, overflow: 'hidden',
                  border: '1px solid rgba(201,168,76,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(201,168,76,0.03)',
                }}>
                  {selected.image ? (
                    <img
                      src={selected.image}
                      alt={selected.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <span style={{ fontSize: 32, color: goldDim }}>☠</span>
                  )}
                </div>

                {selected.hp && (
                  <div style={{ marginTop: 16, textAlign: 'center' }}>
                    <p style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: 2, color: goldDim, textTransform: 'uppercase', marginBottom: 4 }}>
                      HP
                    </p>
                    <p style={{ fontFamily: "'Cinzel', serif", fontSize: 18, color: gold, fontWeight: 700 }}>
                      {selected.hp.toLocaleString()}
                    </p>
                  </div>
                )}

                {selected.dlc && (
                  <span style={{
                    marginTop: 14, fontSize: 9, letterSpacing: 2,
                    fontFamily: "'Cinzel', serif", textTransform: 'uppercase',
                    color: '#9d4edd', border: '1px solid rgba(157,78,221,0.3)',
                    padding: '2px 10px',
                  }}>Shadow of the Erdtree</span>
                )}
              </div>

              {/* Info panel */}
              <div style={{ flex: 1, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Name */}
                <div>
                  <h2 style={{
                    fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 700,
                    color: '#E8D8A0', letterSpacing: '0.08em', margin: '0 0 10px',
                  }}>{selected.name}</h2>

                  {selected.blockquote && (
                    <p style={{
                      fontSize: 11.5, fontStyle: 'italic', lineHeight: 1.65,
                      color: 'rgba(154,144,128,0.75)',
                      borderLeft: '2px solid rgba(201,168,76,0.25)',
                      paddingLeft: 12, margin: 0,
                    }}>
                      "{selected.blockquote}"
                    </p>
                  )}
                </div>

                {/* Locations & Drops */}
                {selected.locations_and_drops && (
                  <LocationsDropsField data={selected.locations_and_drops} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Sub-components ── */

function BossCard({ boss, onClick }: { boss: Boss; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: 'pointer',
        background: hovered ? 'rgba(201,168,76,0.06)' : 'rgba(201,168,76,0.02)',
        border: `1px solid ${hovered ? 'rgba(201,168,76,0.3)' : 'rgba(201,168,76,0.1)'}`,
        transition: 'all 0.2s',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Image */}
      <div style={{
        width: '100%', aspectRatio: '1 / 1',
        background: 'rgba(201,168,76,0.03)',
        overflow: 'hidden', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {boss.image ? (
          <img
            src={boss.image}
            alt={boss.name}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              transition: 'transform 0.35s',
              transform: hovered ? 'scale(1.06)' : 'scale(1)',
              filter: hovered ? 'brightness(1.08)' : 'brightness(0.92)',
            }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <span style={{ fontSize: 36, color: 'rgba(201,168,76,0.2)' }}>☠</span>
        )}

        {boss.dlc && (
          <span style={{
            position: 'absolute', top: 8, right: 8,
            fontSize: 8, letterSpacing: 1.5,
            fontFamily: "'Cinzel', serif", textTransform: 'uppercase',
            color: '#9d4edd', background: 'rgba(4,3,2,0.85)',
            border: '1px solid rgba(157,78,221,0.35)',
            padding: '2px 6px',
          }}>DLC</span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(201,168,76,0.08)' }}>
        <p style={{
          fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 600,
          color: hovered ? '#E8D8A0' : '#C9B896',
          letterSpacing: '0.05em', margin: '0 0 6px',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          transition: 'color 0.2s',
        }}>{boss.name}</p>

        {boss.hp && (
          <p style={{
            fontSize: 10, color: 'rgba(154,144,128,0.6)',
            margin: '0 0 4px',
          }}>
            <span style={{ color: goldDim, marginRight: 4 }}>◈</span>
            HP: <span style={{ color: gold }}>{boss.hp.toLocaleString()}</span>
          </p>
        )}

        {boss.blockquote && (
          <p style={{
            fontSize: 10, color: 'rgba(154,144,128,0.5)',
            margin: 0, fontStyle: 'italic',
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            "{boss.blockquote}"
          </p>
        )}
      </div>
    </div>
  )
}

function LocationsDropsField({ data }: { data: string | Record<string, unknown> }) {
  let content: string

  if (typeof data === 'string') {
    content = data
  } else {
    try {
      content = Object.entries(data)
        .map(([key, value]) =>
          Array.isArray(value) ? `${key}: ${value.join(', ')}` : `${key}: ${JSON.stringify(value)}`
        )
        .join('\n\n')
    } catch {
      content = JSON.stringify(data, null, 2)
    }
  }

  return (
    <div>
      <p style={{
        fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: 2.5,
        textTransform: 'uppercase', color: goldDim, marginBottom: 8,
      }}>
        <span style={{ marginRight: 6 }}>◇</span>Locations & Drops
      </p>
      <p style={{
        fontSize: 12, lineHeight: 1.7, color: '#9A9080',
        margin: 0, whiteSpace: 'pre-wrap',
      }}>
        {content}
      </p>
    </div>
  )
}