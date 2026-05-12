'use client'

const gold    = '#C9A84C'
const goldDim = '#7A6030'
const textAsh = '#9A9080'
const textDim = '#5A5040'

const NAV_ITEMS = [
  {
    section: 'Companion',
    items: [
      { id: 'agent',  icon: '◈', label: 'AI Companion', count: null,  live: true },
      { id: 'builds', icon: '⚔', label: 'Build Finder', count: null,  live: true },
    ],
  },
  {
    section: 'World',
    items: [
      { id: 'patches',   icon: '◉', label: 'Patch Notes', count: null, live: true },
      { id: 'items',     icon: '◆', label: 'Items',       count: null, live: true },
      { id: 'creatures', icon: '🝗', label: 'Creatures',   count: null, live: true },
    ],
  },
  {
    section: 'Lore',
    items: [
      { id: 'bosses',    icon: '☠', label: 'Bosses',     count: null, live: true },
      { id: 'npcs',      icon: '◎', label: 'NPCs',       count: null, live: true },
      { id: 'locations', icon: '◇', label: 'Locations',  count: null, live: true },
    ],
  },
]

interface SidebarProps {
  active: string
  onNavigate: (id: string) => void
}

export default function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside style={{
      width: 210,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      background: '#080706',
      borderRight: '1px solid rgba(201,168,76,0.1)',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 16px 12px',
        borderBottom: '1px solid rgba(201,168,76,0.08)',
        marginBottom: 4,
      }}>
        <p style={{
          fontFamily: "'Cinzel',serif", fontSize: 8, letterSpacing: 3,
          textTransform: 'uppercase', color: 'rgba(201,168,76,0.25)',
        }}>Navigation</p>
      </div>

      {NAV_ITEMS.map((group, gi) => (
        <div key={group.section} style={{ marginBottom: 4 }}>
          <p style={{
            fontFamily: "'Cinzel',serif", fontSize: 8, letterSpacing: 2.5,
            textTransform: 'uppercase', color: 'rgba(90,80,64,0.8)',
            padding: '10px 16px 6px',
          }}>{group.section}</p>

          {group.items.map(item => {
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 16px',
                  textAlign: 'left',
                  position: 'relative',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: isActive
                    ? 'linear-gradient(90deg, rgba(201,168,76,0.1), rgba(201,168,76,0.04))'
                    : 'transparent',
                  borderLeft: isActive ? `2px solid ${gold}` : '2px solid transparent',
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(201,168,76,0.04)'
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.background = 'transparent'
                }}
              >
                <span style={{
                  width: 18, textAlign: 'center', fontSize: 13, flexShrink: 0,
                  color: isActive ? gold : 'rgba(90,80,64,0.9)',
                  filter: isActive ? 'drop-shadow(0 0 4px rgba(201,168,76,0.4))' : 'none',
                  transition: 'all 0.2s',
                }}>{item.icon}</span>

                <span style={{
                  fontFamily: "'IBM Plex Sans',sans-serif",
                  fontSize: 12.5,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? '#E8D8A0' : textAsh,
                  transition: 'color 0.2s',
                  flex: 1,
                }}>{item.label}</span>

                {item.live && !isActive && (
                  <span style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: 'rgba(80,160,80,0.6)',
                    flexShrink: 0,
                  }} />
                )}

                {item.count && (
                  <span style={{
                    fontFamily: "'Cinzel',serif",
                    fontSize: 8, padding: '1px 6px', borderRadius: 10,
                    background: 'rgba(201,168,76,0.08)',
                    border: '1px solid rgba(201,168,76,0.15)',
                    color: goldDim,
                  }}>{item.count}</span>
                )}

                {!item.live && (
                  <span style={{
                    fontFamily: "'Cinzel',serif",
                    fontSize: 7, padding: '1px 5px', borderRadius: 2,
                    background: 'rgba(90,80,64,0.12)',
                    border: '1px solid rgba(90,80,64,0.2)',
                    color: 'rgba(90,80,64,0.8)',
                    letterSpacing: 1,
                  }}>soon</span>
                )}
              </button>
            )
          })}

          {gi < NAV_ITEMS.length - 1 && (
            <div style={{ height: 1, margin: '8px 16px', background: 'rgba(201,168,76,0.06)' }} />
          )}
        </div>
      ))}

      {/* Footer */}
      <div style={{ marginTop: 'auto', padding: '12px 16px', borderTop: '1px solid rgba(201,168,76,0.06)' }}>
        <div style={{
          padding: '10px 12px', borderRadius: 4,
          background: 'rgba(201,168,76,0.03)',
          border: '1px solid rgba(201,168,76,0.08)',
        }}>
          <p style={{ fontFamily: "'Cinzel',serif", fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: goldDim, marginBottom: 4 }}>
            ◈ Context Injection
          </p>
          <p style={{ fontSize: 10, lineHeight: 1.5, color: 'rgba(90,80,64,0.7)' }}>
            Datos en vivo desde Supabase inyectados en cada consulta.
          </p>
        </div>
      </div>
    </aside>
  )
}