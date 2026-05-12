'use client'

import { useState, useRef, useEffect } from 'react'
import { GiBlackKnightHelm } from 'react-icons/gi'
import { GiHood } from "react-icons/gi";

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const gold    = '#C9A84C'
const goldDim = '#A07840'
const textAsh = '#B8A888'

interface ItemMention {
  name: string
  image: string
  type: string
  dlc: boolean
}

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: Date
  items?: ItemMention[]
}

// Presets
const PRESETS = [
  { label: 'Bleed DLC',         prompt: "I'm looking for a Bleed build for the Shadow of the Erdtree DLC",  icon: '🜁' },
  { label: 'Faith Mage',        prompt: 'I want a Faith spell build with good defense',                      icon: '☀' },
  { label: 'Colossal Strength', prompt: 'Recommend me colossal weapons for a pure Strength build',           icon: '⚔' },
  { label: 'Dex Assassin',      prompt: 'Dexterity build with bleed and fast ashes of war',                  icon: '◈' },
  { label: 'Summoner',          prompt: 'What spirit ashes are best for supporting in difficult bosses',      icon: '◎' },
]

/* ── Corner ornaments ── */
function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const style: React.CSSProperties = {
    position: 'absolute', width: 32, height: 32, pointerEvents: 'none',
    top:    pos === 'tl' || pos === 'tr' ? 0 : 'auto',
    bottom: pos === 'bl' || pos === 'br' ? 0 : 'auto',
    left:   pos === 'tl' || pos === 'bl' ? 0 : 'auto',
    right:  pos === 'tr' || pos === 'br' ? 0 : 'auto',
  }
  const d = {
    tl: 'M 8 4 L 4 4 L 4 8',
    tr: 'M 32 4 L 36 4 L 36 8',
    bl: 'M 8 36 L 4 36 L 4 32',
    br: 'M 32 36 L 36 36 L 36 32',
  }[pos]
  const cx = pos === 'tl' || pos === 'bl' ? 5 : 35
  const cy = pos === 'tl' || pos === 'tr' ? 5 : 35

  return (
    <div style={style}>
      <svg viewBox="0 0 40 40" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <path d={d} stroke="#c6a15b" strokeWidth="1" fill="none" opacity="0.6" />
        <circle cx={cx} cy={cy} r="1.5" fill="#c6a15b" opacity="0.5" />
      </svg>
    </div>
  )
}

/* ── Erdtree SVG avatar ── */
function ErdtreeAvatar({ size = 40 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      border: '1px solid rgba(201,168,76,0.35)',
      background: 'rgba(201,168,76,0.1)',
      display: 'grid', placeItems: 'center',
      boxShadow: '0 0 28px rgba(198,161,91,0.20)',
    }}>
      <GiHood size={size * 0.46} color="#C9A84C" style={{ opacity: 0.7 }} />
    </div>
  )
}

/* ── User avatar ── */
function UserAvatar({ size = 40 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      border: '1px solid rgba(201,168,76,0.2)',
      background: 'rgba(0,0,0,0.6)',
      display: 'grid', placeItems: 'center',
      boxShadow: '0 0 18px rgba(198,161,91,0.12)',
    }}>
      <GiBlackKnightHelm size={size * 0.46} color="#C9A84C" style={{ opacity: 0.7 }} />
    </div>
  )
}

export default function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      // Mensaje de bienvenida
content: 'May Grace guide you, Tarnished. I am your companion in the Lands Between.\nAsk me about builds, weapons or strategies.',
      timestamp: new Date(),
    },
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef        = useRef<HTMLDivElement>(null)
  const inputRef              = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text?: string) => {
    const query = (text || input).trim()
    if (!query || loading) return

    setInput('')
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: query, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res  = await fetch(`${API}/agent/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      })
      const data = await res.json()

      setMessages(prev => [...prev, {
        id: `${Date.now()}-ai`,
        role: 'ai',
        content: data.response,
        timestamp: new Date(),
        items: data.mentioned_items || [],
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: `${Date.now()}-error`,
        role: 'ai',
        // Error message
        content: 'Connection to Grace has been lost. The Two Fingers do not respond.',
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const fmt = (d: Date) =>
    d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      padding: '16px', background: '#070604',
      fontFamily: "'IBM Plex Sans', sans-serif",
    }}>

      {/* Outer frame */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        position: 'relative',
        border: '1px solid rgba(201,168,76,0.2)',
        background: 'rgba(7,6,4,0.92)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 0 90px rgba(0,0,0,0.85)',
      }}>
        {/* Radial glow */}
        <div style={{
          pointerEvents: 'none', position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 45% 0%, rgba(198,161,91,0.10) 0%, transparent 35%), radial-gradient(circle at 50% 65%, rgba(198,161,91,0.045) 0%, transparent 45%)',
        }} />

        {/* Corner ornaments */}
        <Corner pos="tl" /> <Corner pos="tr" /> <Corner pos="bl" /> <Corner pos="br" />

        {/* ── HEADER ── */}
        <div style={{
          position: 'relative', zIndex: 2,
          padding: '24px 32px 0',
          flexShrink: 0,
        }}>
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <ErdtreeAvatar size={56} />
              <div>
                <h2 style={{
                  fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 700,
                  letterSpacing: '0.34em', textTransform: 'uppercase',
                  color: '#E5C77E', margin: 0, lineHeight: 1,
                }}>Grace Companion</h2>
                <p style={{
                  fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.28em',
                  textTransform: 'uppercase', color: '#5A5040', marginTop: 6,
                }}>Llama 3.3 · Elden Knowledge Base</p>
              </div>
            </div>

            {/* Live badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              border: '1px solid rgba(201,168,76,0.2)',
              background: 'rgba(0,0,0,0.5)',
              padding: '8px 16px',
              boxShadow: '0 0 22px rgba(16,185,129,0.18)',
            }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%',
                background: '#34d399',
                boxShadow: '0 0 12px rgba(52,211,153,1)',
                flexShrink: 0,
              }} />
              <span style={{
                fontFamily: "'Cinzel', serif", fontSize: 10,
                letterSpacing: '0.22em', textTransform: 'uppercase',
                color: '#34d399', fontWeight: 700,
              }}>Live Context</span>
            </div>
          </div>

          {/* Presets */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
            {PRESETS.map(p => (
              <PresetButton key={p.label} label={p.label} icon={p.icon} onClick={() => sendMessage(p.prompt)} />
            ))}
          </div>
        </div>

        {/* ── MESSAGES ── */}
        <div style={{
          flex: 1, minHeight: 0, position: 'relative', zIndex: 2,
          padding: '0 32px',
        }}>
          <div style={{
            position: 'absolute', inset: 0, margin: '0 32px',
            background: 'radial-gradient(circle at 50% 50%, rgba(198,161,91,0.055) 0%, transparent 42%)',
          }} />
          <div
            className="agent-scrollbar"
            style={{
              height: '100%', overflowY: 'auto',
              paddingTop: 16, paddingBottom: 24,
              position: 'relative', zIndex: 1,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {messages.map(msg => (
                <ChatBubble key={msg.id} msg={msg} fmt={fmt} />
              ))}

              {loading && <LoadingBubble />}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* ── INPUT ── */}
        <div style={{
          flexShrink: 0, position: 'relative', zIndex: 2,
          padding: '0 32px 24px',
        }}>
          <div
            className="agent-input-wrap"
            style={{
              display: 'flex', alignItems: 'center', overflow: 'hidden',
              border: '1px solid rgba(201,168,76,0.25)',
              background: 'rgba(9,8,6,0.95)',
              boxShadow: '0 0 34px rgba(0,0,0,0.7), inset 0 0 22px rgba(198,161,91,0.025)',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendMessage() }}
              // Placeholder del input
              placeholder="Ask your question about the Lands Between..."
              style={{
                flex: 1, minWidth: 0,
                background: 'transparent', border: 'none', outline: 'none',
                padding: '16px 24px', fontSize: 13, color: '#E8D8A0',
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                width: 56, height: 48, flexShrink: 0, display: 'grid', placeItems: 'center',
                background: 'linear-gradient(to bottom, rgba(201,168,76,0.2), rgba(201,168,76,0.1))',
                border: 'none',
                borderLeft: '1px solid rgba(201,168,76,0.35)',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                color: loading || !input.trim() ? '#5A5040' : '#E5C77E',
                transition: 'all 0.2s',
}}
            >
              {/* Send arrow icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <p style={{
            marginTop: 10, textAlign: 'center',
            fontFamily: "'Cinzel', serif", fontSize: 9,
            letterSpacing: '0.32em', textTransform: 'uppercase',
            color: '#3A3020',
          }}>
           // Footer del input
            ←⊕→ Press Enter to send · Information may vary depending on current patch ←⊕→ 
          </p>
        </div>
      </div>

      <style>{`
        .agent-scrollbar::-webkit-scrollbar { width: 6px; }
        .agent-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .agent-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(201,168,76,0.25);
          border-radius: 3px;
        }
        .agent-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(201,168,76,0.45);
        }
        .agent-input-wrap:focus-within {
          border-color: rgba(201,168,76,0.6) !important;
          box-shadow: 0 0 40px rgba(198,161,91,0.15) !important;
        }
        @keyframes agent-pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.85); }
          50%       { opacity: 1;   transform: scale(1); }
        }
        .dot1 { animation: agent-pulse 1.4s ease-in-out infinite; }
        .dot2 { animation: agent-pulse 1.4s ease-in-out 0.2s infinite; }
        .dot3 { animation: agent-pulse 1.4s ease-in-out 0.4s infinite; }
      `}</style>
    </div>
  )
}

/* ── Sub-components ── */

function PresetButton({ label, icon, onClick }: { label: string; icon: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 18px',
        border: `1px solid ${hovered ? 'rgba(201,168,76,0.3)' : 'rgba(201,168,76,0.12)'}`,
        background: hovered ? 'rgba(201,168,76,0.1)' : 'transparent',
        cursor: 'pointer', transition: 'all 0.2s',
        color: hovered ? '#E5C77E' : '#9A9080',
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontSize: 12,
      }}
    >
      <span style={{ color: 'rgba(201,168,76,0.8)', fontSize: 14 }}>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

function ChatBubble({ msg, fmt }: { msg: Message; fmt: (d: Date) => string }) {
  const isAI = msg.role === 'ai'

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', gap: 12,
      justifyContent: isAI ? 'flex-start' : 'flex-end',
    }}>
      {isAI && <ErdtreeAvatar size={40} />}

      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: isAI ? 'flex-start' : 'flex-end',
        maxWidth: '55%',
      }}>
        <div style={{
          padding: '12px 20px', fontSize: 13, lineHeight: 1.65,
          backdropFilter: 'blur(8px)',
          border: isAI
            ? '1px solid rgba(201,168,76,0.25)'
            : '1px solid rgba(255,255,255,0.15)',
          background: isAI
            ? 'linear-gradient(135deg, #1a1915, #0f0e0a)'
            : 'linear-gradient(135deg, #1a1a1a, #0f0f0f)',
          color: '#F0E8D0',
          boxShadow: isAI
            ? '0 0 20px rgba(198,161,91,0.12)'
            : '0 0 20px rgba(255,255,255,0.05)',
          borderRadius: 2,
        }}>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>

          {!!msg.items?.length && (
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {msg.items.map(item => (
                <span key={item.name} style={{
                  fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
                  padding: '2px 10px',
                  border: '1px solid rgba(201,168,76,0.3)',
                  background: 'rgba(201,168,76,0.08)',
                  color: '#D8B66F',
                }}>{item.name}</span>
              ))}
            </div>
          )}
        </div>

        <span style={{
          marginTop: 6, fontSize: 10,
          color: 'rgba(90,80,64,0.7)',
          fontFamily: "'Cinzel', serif",
          letterSpacing: '0.05em',
        }}>{fmt(msg.timestamp)}</span>
      </div>

      {!isAI && <UserAvatar size={40} />}
    </div>
  )
}

function LoadingBubble() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
      <ErdtreeAvatar size={40} />
      <div style={{
        padding: '16px 32px',
        border: '1px solid rgba(201,168,76,0.3)',
        background: 'linear-gradient(90deg, rgba(26,25,21,0.8), rgba(26,25,21,0.6), rgba(15,14,10,0.8))',
        boxShadow: '0 0 30px rgba(198,161,91,0.18)',
        borderRadius: 2,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['dot1','dot2','dot3'].map(cls => (
            <span key={cls} className={cls} style={{
              width: 10, height: 10, borderRadius: '50%',
              background: 'linear-gradient(to bottom, #D8B66F, #C9A84C)',
              boxShadow: '0 0 10px rgba(216,182,111,0.8)',
              display: 'block',
            }} />
          ))}
        </div>
        <span style={{
          fontFamily: "'Cinzel', serif", fontSize: 12,
          letterSpacing: '0.1em', color: '#E5C77E', fontWeight: 500,
        }}>Consulting the Erdtree...</span>
      </div>
    </div>
  )
}