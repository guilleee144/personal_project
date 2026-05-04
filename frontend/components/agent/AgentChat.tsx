'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'ai'
  content: string
  timestamp: Date
}

const PRESETS = [
  { label: 'Sangrado DLC', prompt: 'Busco una build de Sangrado para el DLC Shadow of the Erdtree' },
  { label: 'Mago de Fe', prompt: 'Quiero una build de hechizos de Fe con buena defensa' },
  { label: 'Fuerza Colosal', prompt: 'Recomiéndame armas colosales para una build de Fuerza pura' },
  { label: 'Asesino Destreza', prompt: 'Build de Destreza con sangrado y cenizas de guerra rápidas' },
  { label: 'Invocador', prompt: 'Qué spirit ashes son las mejores para apoyar en jefes difíciles' },
  { label: 'Arcano Puro', prompt: 'Build de Arcano con máximo sangrado y veneno para el DLC' },
]

export default function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: 'Que la Gracia te guíe, Sinluz. Soy tu compañero en las Tierras Intermedias. Pregúntame sobre builds, armas, hechizos o estrategias. Consulto la base de datos real para darte recomendaciones precisas.',
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text?: string) => {
    const query = text || input.trim()
    if (!query || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: query, timestamp: new Date() }])
    setLoading(true)

    try {
      const res = await fetch('http://localhost:8000/agent/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'ai',
        content: data.response,
        timestamp: new Date(),
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'Error conectando con el servidor. Asegúrate de que el backend está corriendo en el puerto 8000.',
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex h-full overflow-hidden">

      {/* Panel izquierdo — presets */}
      <div
        className="w-[220px] flex flex-col flex-shrink-0 overflow-y-auto"
        style={{ borderRight: '1px solid var(--border-gold)', background: 'var(--bg-surface)' }}
      >
        <p
          className="font-cinzel text-[9px] tracking-[2px] uppercase px-4 py-3"
          style={{ color: 'var(--gold-dim)', borderBottom: '1px solid var(--border-gold)' }}
        >
          Consultas Rápidas
        </p>
        <div className="p-2 flex flex-col gap-1">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => sendMessage(p.prompt)}
              className="text-left px-3 py-2 rounded-sm transition-all duration-200 text-[11.5px] leading-snug"
              style={{
                border: '1px solid transparent',
                color: 'var(--text-ash)',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.background = 'var(--bg-hover)'
                el.style.borderColor = 'var(--border-gold)'
                el.style.color = 'var(--text-rune)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.background = 'transparent'
                el.style.borderColor = 'transparent'
                el.style.color = 'var(--text-ash)'
              }}
            >
              <strong
                className="block font-cinzel text-[9px] tracking-wider uppercase mb-0.5"
                style={{ color: 'var(--gold-dim)' }}
              >
                {p.label}
              </strong>
              {p.prompt}
            </button>
          ))}
        </div>
        

        {/* Context injection badge */}
        <div className="mt-auto p-3">
          <div
            className="p-2.5 rounded-sm text-[10px] leading-relaxed"
            style={{
              background: 'rgba(201,168,76,0.05)',
              border: '1px solid rgba(201,168,76,0.15)',
              color: 'var(--text-dim)',
            }}
          >
            <span style={{ color: 'var(--gold-dim)' }}>◈ Context Injection</span>
            <br />
            Cada respuesta se genera con datos reales de Supabase inyectados al modelo.
          </div>
        </div>
      </div>

      {/* Chat principal */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Header */}
        <div
          className="px-5 py-3.5 flex items-center gap-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border-gold)', background: 'var(--bg-surface)' }}
        >
          <div>
            <p className="font-cinzel text-sm tracking-wide" style={{ color: 'var(--gold)' }}>
              AI Companion
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-ash)' }}>
              Powered by Ollama · llama3.2 · Datos en vivo de Supabase
            </p>
          </div>
          <div
            className="ml-auto text-[10px] px-2.5 py-1 rounded-sm"
            style={{
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.2)',
              color: 'var(--gold-dim)',
            }}
          >
            Context Injection ON
          </div>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 fade-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                style={{
                  background: msg.role === 'ai' ? 'rgba(201,168,76,0.1)' : 'rgba(80,60,20,0.3)',
                  border: `1px solid ${msg.role === 'ai' ? 'var(--border-gold)' : 'rgba(201,168,76,0.15)'}`,
                  color: 'var(--gold)',
                  fontFamily: 'var(--font-cinzel)',
                }}
              >
                {msg.role === 'ai' ? '✦' : '◈'}
              </div>

              {/* Burbuja */}
              <div
                className="max-w-[75%] px-4 py-2.5 rounded-md text-[13px] leading-relaxed"
                style={{
                  background: msg.role === 'ai' ? 'var(--bg-panel)' : 'rgba(201,168,76,0.06)',
                  border: `1px solid ${msg.role === 'ai' ? 'var(--border-gold)' : 'rgba(201,168,76,0.18)'}`,
                  color: 'var(--text-rune)',
                  textAlign: msg.role === 'user' ? 'right' : 'left',
                  whiteSpace: 'pre-wrap',
                }}
              >
                <p
                  className="font-cinzel text-[9px] tracking-widest uppercase mb-1.5"
                  style={{ color: 'var(--text-dim)' }}
                >
                  {msg.role === 'ai' ? 'Companion' : 'Tú'}
                </p>
                {msg.content}
              </div>
            </div>
          ))}

          {/* Thinking indicator */}
          {loading && (
            <div className="flex gap-3 fade-up">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                style={{
                  background: 'rgba(201,168,76,0.1)',
                  border: '1px solid var(--border-gold)',
                  color: 'var(--gold)',
                  fontFamily: 'var(--font-cinzel)',
                }}
              >
                ✦
              </div>
              <div
                className="px-4 py-3 rounded-md flex items-center gap-1"
                style={{
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border-gold)',
                }}
              >
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: 'var(--gold)',
                      display: 'inline-block',
                      animation: `blink 1.2s infinite ${i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          className="p-4 flex gap-3 items-end flex-shrink-0"
          style={{ borderTop: '1px solid var(--border-gold)', background: 'var(--bg-surface)' }}
        >
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Pregunta sobre builds, armas, hechizos... (Enter para enviar)"
            rows={1}
            className="flex-1 resize-none outline-none text-[13px] px-4 py-2.5 rounded-sm"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-gold)',
              color: 'var(--text-rune)',
              fontFamily: 'var(--font-ibm)',
              minHeight: '42px',
              maxHeight: '100px',
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="h-[42px] px-5 font-cinzel text-[11px] tracking-wider rounded-sm transition-all duration-200"
            style={{
              background: 'var(--gold)',
              color: 'var(--bg-void)',
              fontWeight: 600,
              opacity: loading || !input.trim() ? 0.4 : 1,
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            ENVIAR
          </button>
        </div>
      </div>
    </div>
  )
}