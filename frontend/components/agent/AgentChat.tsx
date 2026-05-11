'use client'

import { useState, useRef, useEffect } from 'react'
import { SendIcon, Sparkles, Sword, Shield, BookOpen, Flame, Droplet, Sun } from 'lucide-react'

interface ItemMention {
  name: string
  image: string
  type: string
  dlc: boolean
}

interface Message {
  id?: string
  role: 'user' | 'ai'
  content: string
  timestamp: Date
  items?: ItemMention[]
}

const PRESETS = [
  { label: 'Bleed DLC', prompt: 'I\'m looking for a Bleed build for the Shadow of the Erdtree DLC', icon: <Droplet size={18} /> },
  { label: 'Faith Mage', prompt: 'I want a Faith spell build with good defense', icon: <Sun size={18} /> },
  { label: 'Colossal Strength', prompt: 'Recommend me colossal weapons for a pure Strength build', icon: <Sword size={18} /> },
  { label: 'Dexterity Assassin', prompt: 'Dexterity build with bleed and fast ashes of war', icon: <Flame size={18} /> },
  { label: 'Summoner', prompt: 'What spirit ashes are best for supporting in difficult bosses', icon: <BookOpen size={18} /> },
]

function CornerOrnament({ position }: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) {
  const positionClasses = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'bottom-right': 'bottom-0 right-0',
  }

  return (
    <div className={`pointer-events-none absolute ${positionClasses[position]} h-8 w-8`}>
      <svg
        viewBox="0 0 40 40"
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {position === 'top-left' && (
          <>
            <path d="M 8 4 L 4 4 L 4 8" stroke="#c6a15b" strokeWidth="1" fill="none" opacity="0.6" />
            <circle cx="5" cy="5" r="1.5" fill="#c6a15b" opacity="0.5" />
          </>
        )}
        {position === 'top-right' && (
          <>
            <path d="M 32 4 L 36 4 L 36 8" stroke="#c6a15b" strokeWidth="1" fill="none" opacity="0.6" />
            <circle cx="35" cy="5" r="1.5" fill="#c6a15b" opacity="0.5" />
          </>
        )}
        {position === 'bottom-left' && (
          <>
            <path d="M 8 36 L 4 36 L 4 32" stroke="#c6a15b" strokeWidth="1" fill="none" opacity="0.6" />
            <circle cx="5" cy="35" r="1.5" fill="#c6a15b" opacity="0.5" />
          </>
        )}
        {position === 'bottom-right' && (
          <>
            <path d="M 32 36 L 36 36 L 36 32" stroke="#c6a15b" strokeWidth="1" fill="none" opacity="0.6" />
            <circle cx="35" cy="35" r="1.5" fill="#c6a15b" opacity="0.5" />
          </>
        )}
      </svg>
    </div>
  )
}

export default function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      content:
        'May Grace guide you, Tarnished. I am your companion in the Lands Between.\nAsk me about builds, weapons or strategies.',
      timestamp: new Date(),
    },
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
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: 'user', content: query, timestamp: new Date() },
    ])

    setLoading(true)

    try {
      const res = await fetch('http://localhost:8000/agent/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      })

      const data = await res.json()

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-ai`,
          role: 'ai',
          content: data.response,
          timestamp: new Date(),
          items: data.mentioned_items || [],
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          role: 'ai',
          content: 'Connection to Grace has been lost. The Two Fingers do not respond.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="relative h-[calc(100vh-64px)] overflow-hidden px-4 py-4 font-serif text-stone-200">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_45%_0%,rgba(198,161,91,0.10),transparent_35%),radial-gradient(circle_at_50%_65%,rgba(198,161,91,0.045),transparent_45%)]" />

      <div className="relative flex h-full w-full flex-col overflow-hidden border border-[#c6a15b]/20 bg-[#070604]/90 shadow-[0_0_90px_rgba(0,0,0,0.85)] backdrop-blur-xl">
        {/* Corner Ornaments - Positioned without overlap */}
        <CornerOrnament position="top-left" />
        <CornerOrnament position="top-right" />
        <CornerOrnament position="bottom-left" />
        <CornerOrnament position="bottom-right" />

        <div className="relative z-10 flex h-full min-h-0 flex-col gap-8 px-8 py-6">
          <header className="shrink-0 pb-5">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="relative grid h-14 w-14 place-items-center rounded-full border border-[#c6a15b]/35 bg-[#c6a15b]/10 text-[#d8b66f] shadow-[0_0_28px_rgba(198,161,91,0.20)]">
                  <Sparkles size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-bold uppercase tracking-[0.34em] text-[#e5c77e]">
                    Grace Companion
                  </h2>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.28em] text-stone-500">
                    Llama 3.3 · Elden Knowledge Base
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 border border-[#c6a15b]/20 bg-black/50 px-4 py-2 text-emerald-400 shadow-[0_0_22px_rgba(16,185,129,0.18)]">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,1)]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.22em]">
                  Live Context
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-5 gap-3">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => sendMessage(preset.prompt)}
                  className="group flex items-center justify-center gap-2 px-4 py-3 text-sm text-stone-400 transition-all duration-300 hover:text-[#e5c77e] hover:bg-[#c6a15b]/15 rounded-lg"
                >
                  <span className="text-[#c6a15b]/80">{preset.icon}</span>
                  <span className="hidden md:inline">{preset.label}</span>
                </button>
              ))}
            </div>
          </header>

          <main className="min-h-0 flex-1 pb-5">
            <div className="relative h-full overflow-hidden bg-[radial-gradient(circle_at_50%_50%,rgba(198,161,91,0.055),transparent_42%),linear-gradient(to_bottom,rgba(255,255,255,0.015),rgba(0,0,0,0.08))]">
              <div className="relative z-10 h-full overflow-y-auto px-8 py-8 custom-scrollbar">
                <div className="flex w-full flex-col gap-6">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-3 ${
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {msg.role === 'ai' && (
                        <div className="mb-1 hidden h-10 w-10 shrink-0 place-items-center rounded-full border border-[#c6a15b]/25 bg-[#c6a15b]/10 text-[#d8b66f] shadow-[0_0_22px_rgba(198,161,91,0.16)] md:grid">
                          <Sparkles size={18} />
                        </div>
                      )}

                      <div className={`flex max-w-[55%] flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`rounded-2xl px-5 py-3 text-sm leading-relaxed backdrop-blur-md transition-all ${
                            msg.role === 'user'
                              ? 'border border-white/15 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] text-stone-100 shadow-[0_0_20px_rgba(255,255,255,0.05)]'
                              : 'border border-[#c6a15b]/25 bg-gradient-to-br from-[#1a1915] to-[#0f0e0a] text-stone-100 shadow-[0_0_20px_rgba(198,161,91,0.12)]'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>

                          {!!msg.items?.length && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {msg.items.map((item) => (
                                <span
                                  key={item.name}
                                  className="rounded-lg border border-[#c6a15b]/30 bg-[#c6a15b]/12 px-3 py-1 text-[9px] uppercase tracking-widest text-[#d8b66f] transition-colors hover:bg-[#c6a15b]/20"
                                >
                                  {item.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {msg.role === 'user' && (
                        <div className="mb-1 hidden h-10 w-10 shrink-0 place-items-center rounded-full border border-[#c6a15b]/20 bg-black/60 text-[#d8b66f] shadow-[0_0_18px_rgba(198,161,91,0.12)] md:grid">
                          <Shield size={18} />
                        </div>
                      )}
                    </div>
                  ))}

                  {loading && (
                    <div className="flex items-end gap-3 mt-2">
                      <div className="mb-1 hidden h-10 w-10 shrink-0 place-items-center rounded-full border border-[#c6a15b]/25 bg-[#c6a15b]/10 text-[#d8b66f] shadow-[0_0_22px_rgba(198,161,91,0.16)] md:grid">
                        <Sparkles size={18} />
                      </div>

                      <div className="rounded-2xl border border-[#c6a15b]/30 bg-gradient-to-r from-[#1a1915]/80 via-[#1a1915]/60 to-[#0f0e0a]/80 px-8 py-5 text-base shadow-[0_0_30px_rgba(198,161,91,0.18)] backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex gap-2.5">
                            <span className="h-3 w-3 rounded-full bg-gradient-to-b from-[#d8b66f] to-[#c6a15b] animate-pulse shadow-[0_0_10px_rgba(216,182,111,0.8)]" />
                            <span className="h-3 w-3 rounded-full bg-gradient-to-b from-[#d8b66f] to-[#c6a15b] animate-pulse animation-delay-150 shadow-[0_0_10px_rgba(216,182,111,0.8)]" />
                            <span className="h-3 w-3 rounded-full bg-gradient-to-b from-[#d8b66f] to-[#c6a15b] animate-pulse animation-delay-300 shadow-[0_0_10px_rgba(216,182,111,0.8)]" />
                          </div>
                          <span className="font-medium tracking-wide text-[#e5c77e]">Consulting the Erdtree...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>
          </main>

          <footer className="shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                sendMessage()
              }}
              className="flex w-full items-center overflow-hidden border border-[#c6a15b]/25 bg-[#090806]/95 shadow-[0_0_34px_rgba(0,0,0,0.7),inset_0_0_22px_rgba(198,161,91,0.025)] transition focus-within:border-[#c6a15b]/60 focus-within:shadow-[0_0_40px_rgba(198,161,91,0.15)]"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your question about the Lands Between..."
                className="min-w-0 flex-1 bg-transparent px-6 py-4 text-sm text-stone-200 outline-none placeholder:text-stone-600"
              />

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="grid h-12 w-14 shrink-0 place-items-center border-l border-[#c6a15b]/35 bg-gradient-to-b from-[#c6a15b]/20 to-[#c6a15b]/10 text-[#e5c77e] shadow-[0_0_24px_rgba(198,161,91,0.16)] transition hover:from-[#c6a15b]/25 hover:to-[#c6a15b]/15 hover:text-[#ffe09a] disabled:border-stone-700 disabled:bg-stone-900/50 disabled:text-stone-600"
              >
                <SendIcon size={20} />
              </button>
            </form>

            <p className="mt-3 text-center text-[10px] uppercase tracking-[0.32em] text-stone-600">
              Press Enter to send · Information may vary depending on current patch
            </p>
          </footer>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c6a15b;
          background-clip: padding-box;
          border: 2px solid transparent;
          border-radius: 4px;
          opacity: 0.3;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          opacity: 0.5;
        }

        @keyframes pulse-delay-150 {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        @keyframes pulse-delay-300 {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        .animation-delay-150 {
          animation: pulse-delay-150 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .animation-delay-300 {
          animation: pulse-delay-300 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </section>
  )
}