'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const FEATURES : Array<{ icon: string; title: string; badge: 'live' | 'dlc' | 'progress' | 'soon'; desc: string }> =[
  { icon: '◈', title: 'AI Companion',          badge: 'live' as const, desc: 'An intelligent agent that consults the database in real-time and generates precise recommendations based on your playstyle.' },
  { icon: '⚔', title: 'Build Finder',           badge: 'live' as const, desc: 'Search real builds from the community and enrich them with data from our database. Bleed, strength, faith, magic and more.' },
  { icon: '◉', title: 'Patch Notes',            badge: 'live' as const, desc: 'News feed about patches, buffs and nerfs tracked from the community. Know if your favorite weapon has changed.' },
  { icon: '✦', title: 'Shadow of the Erdtree', badge: 'dlc'  as const, desc: 'Complete database with all items, weapons, spells and bosses from the DLC. Exclusive builds from the world of the Shadows.' },
  { icon: '◆', title: 'Complete Database', badge: 'live' as const, desc: 'Over 2,000 items in Supabase: weapons, armor, talismans, spells, ashes of war, spirits and much more.' },
  { icon: '◎', title: 'Lore Explorer', badge: 'progress' as const, desc: 'Explore bosses, NPCs, locations and creatures with detailed descriptions and interactive maps.' },
]

const STATS = [
  { number: '2.000+', label: 'Items in DB' },
  { number: '150+',      label: 'Bosses' },
  { number: '100%',   label: 'DLC included' },
  { number: '∞',      label: 'Possible Builds' },
]

const TECH = [
  'Next.js 15', 'TypeScript', 'Tailwind CSS', 'FastAPI', 'Python',
  'Supabase', 'PostgreSQL', 'Groq AI', 'Llama 3.3', 'httpx', 'BeautifulSoup', 'APScheduler',
]

const SECTIONS = ['hero', 'features', 'tech', 'cta']

const gold         = '#C9A84C'
const goldFaint    = 'rgba(201,168,76,0.15)'
const goldGlow     = 'rgba(201,168,76,0.05)'
const textAsh      = '#9A9080'
const textDim      = '#9A8870'
const goldDim      = '#C8B070'
const textRune     = '#E8D8A0'
const bgVoid       = '#060504'

const BADGE: Record<string, { bg: string; border: string; color: string; label: string }> = {
  live: { bg: 'rgba(40,100,40,0.2)',   border: 'rgba(60,140,60,0.4)',  color: '#80C080', label: '● Live' },
  soon: { bg: 'rgba(201,168,76,0.08)', border: 'rgba(201,168,76,0.2)', color: goldDim,   label: '◌ Coming Soon' },
  progress: { bg: 'rgba(100,150,200,0.15)', border: 'rgba(120,170,220,0.3)', color: '#80B8FF', label: '◐ In Progress' },
  dlc:  { bg: 'rgba(120,80,200,0.15)', border: 'rgba(160,96,224,0.3)', color: '#C090FF', label: '✦ DLC' },
}

const css = `
  @keyframes fadeDown {
    from { opacity: 0; transform: translateY(-18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%,100% { opacity:1; } 50% { opacity:0.3; }
  }
  .hero-el-0 { animation: fadeDown 0.7s ease 0.0s forwards; opacity:0; }
  .hero-el-1 { animation: fadeDown 0.7s ease 0.1s forwards; opacity:0; }
  .hero-el-2 { animation: fadeDown 0.7s ease 0.2s forwards; opacity:0; }
  .hero-el-3 { animation: fadeDown 0.7s ease 0.3s forwards; opacity:0; }
  .hero-el-4 { animation: fadeDown 0.7s ease 0.4s forwards; opacity:0; }
  .hero-el-5 { animation: fadeDown 0.7s ease 0.5s forwards; opacity:0; }
  .hero-el-6 { animation: fadeDown 0.7s ease 0.6s forwards; opacity:0; }
  .hero-el-7 { animation: fadeDown 0.7s ease 1.0s forwards; opacity:0; }
  .dot-pulse  { animation: pulse 2s infinite; }
`

export default function LandingPage() {
  const [mounted,     setMounted]     = useState(false)
  const [current,     setCurrent]     = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)

  const goTo = useCallback((idx: number) => {
    if (idx < 0 || idx >= SECTIONS.length || isScrolling) return
    setIsScrolling(true)
    setCurrent(idx)
    document.getElementById(SECTIONS[idx])?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setTimeout(() => setIsScrolling(false), 900)
  }, [isScrolling])

  useEffect(() => {
    setMounted(true)
    const onWheel = (e: WheelEvent) => { e.preventDefault(); goTo(e.deltaY > 0 ? current + 1 : current - 1) }
    const onKey   = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goTo(current + 1) }
      if (e.key === 'ArrowUp'   || e.key === 'PageUp')   { e.preventDefault(); goTo(current - 1) }
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('wheel', onWheel); window.removeEventListener('keydown', onKey) }
  }, [current, goTo])

  useEffect(() => {
    if (!mounted) return
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { const i = SECTIONS.indexOf(e.target.id); if (i !== -1) setCurrent(i) } }),
      { threshold: 0.5 }
    )
    SECTIONS.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [mounted])

  if (!mounted) return null

  return (
    <>
      <style>{css}</style>
      <div
        id="landing-root"
        style={{
          height: '100vh',
          overflowY: 'scroll',
          overflowX: 'hidden',
          scrollSnapType: 'y mandatory',
          background: bgVoid,
          color: textRune,
          fontFamily: "'IBM Plex Sans', sans-serif",
        }}
      >
        {/* ── NAV ── */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 48px',
          background: 'rgba(6,5,4,0.9)', backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${goldFaint}`,
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <Image src="/logo.png" alt="logo" width={34} height={34}
              style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(201,168,76,0.4))' }} />
            <span style={{ fontFamily: "'Cinzel',serif", fontSize: 13, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: gold }}>
              The Souls Grail
            </span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {['Features', 'Stack'].map((lbl, i) => (
              <button key={lbl} onClick={() => goTo(i + 1)} style={{
                fontFamily: "'Cinzel',serif", fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
                color: textAsh, background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.color = gold)}
                onMouseLeave={e => (e.currentTarget.style.color = textAsh)}
              >{lbl}</button>
            ))}
            <Link href="/dashboard" style={{
              fontFamily: "'Cinzel',serif", fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
              color: gold, padding: '8px 20px', border: `1px solid rgba(201,168,76,0.5)`,
              borderRadius: 2, textDecoration: 'none', transition: 'all 0.3s',
            }}>Enter</Link>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section id="hero" style={{
          height: '100vh', scrollSnapAlign: 'start',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '68px 24px 40px', position: 'relative', overflow: 'hidden',
        }}>
          {/* Glow */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 50% 45%, rgba(201,168,76,0.07) 0%, transparent 60%)' }} />

          {/* Badge */}
          <div className="hero-el-0" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', marginBottom: 28,
            border: `1px solid rgba(201,168,76,0.3)`, borderRadius: 2,
            fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: gold,
          }}>
            <span className="dot-pulse" style={{ width: 5, height: 5, borderRadius: '50%', background: gold, display: 'inline-block' }} />
            Elden Ring AI Companion · Shadow of the Erdtree
          </div>

          {/* Logo */}
          <div className="hero-el-1" style={{ marginBottom: 20 }}>
            <Image src="/logo.png" alt="The Souls Grail" width={80} height={80} priority
              style={{ filter: 'drop-shadow(0 0 30px rgba(201,168,76,0.35))', objectFit: 'contain' }} />
          </div>

          {/* Title */}
          <h1 className="hero-el-2" style={{
            fontFamily: "'Cinzel',serif", fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: 6, lineHeight: 1, marginBottom: 8,
            fontSize: 'clamp(38px,7vw,82px)', color: gold,
            textShadow: '0 0 60px rgba(201,168,76,0.2)',
          }}>The Souls Grail</h1>

          <p className="hero-el-3" style={{
            fontFamily: "'Cinzel',serif", textTransform: 'uppercase',
            letterSpacing: 6, marginBottom: 28, color: goldDim,
            fontSize: 'clamp(10px,1.8vw,13px)',
          }}>Elden Ring Knowledge Base</p>

          {/* Divider */}
          <div className="hero-el-4" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <div style={{ width: 100, height: 1, background: 'linear-gradient(90deg,transparent,rgba(201,168,76,0.5))' }} />
            <span style={{ color: gold }}>✦</span>
            <div style={{ width: 100, height: 1, background: 'linear-gradient(90deg,rgba(201,168,76,0.5),transparent)' }} />
          </div>

          {/* Desc */}
          <p className="hero-el-4" style={{
            fontFamily: "'Crimson Pro',serif", fontStyle: 'italic',
            color: textAsh, maxWidth: 520, lineHeight: 1.7, marginBottom: 36,
            fontSize: 'clamp(15px,2.2vw,19px)',
          }}>
            Your intelligent companion in the Lands Between. Real builds,
            live data and precise recommendations for every Tarnished.
          </p>

          {/* Buttons */}
          <div className="hero-el-5" style={{ display: 'flex', gap: 14, marginBottom: 40 }}>
            <Link href="/dashboard" style={{
              fontFamily: "'Cinzel',serif", fontWeight: 700, fontSize: 11,
              letterSpacing: 3, textTransform: 'uppercase', textDecoration: 'none',
              padding: '13px 32px', borderRadius: 2, background: gold, color: bgVoid,
              transition: 'all 0.3s',
            }}>Invoke the Grace</Link>
            <button onClick={() => goTo(1)} style={{
              fontFamily: "'Cinzel',serif", fontSize: 11, letterSpacing: 3,
              textTransform: 'uppercase', padding: '13px 32px', borderRadius: 2,
              border: `1px solid rgba(201,168,76,0.4)`, color: gold,
              background: 'transparent', cursor: 'pointer', transition: 'all 0.3s',
            }}>View Features</button>
          </div>

          {/* Stats */}
          <div className="hero-el-6" style={{
            display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
            border: `1px solid ${goldFaint}`, borderRadius: 2,
            width: '100%', maxWidth: 560,
          }}>
            {STATS.map((s, i) => (
              <div key={s.label} style={{
                textAlign: 'center', padding: '14px 8px',
                borderRight: i < 3 ? `1px solid ${goldFaint}` : 'none',
              }}>
                <span style={{ fontFamily: "'Cinzel',serif", fontWeight: 700, fontSize: 22, color: gold, display: 'block', marginBottom: 4 }}>
                  {s.number}
                </span>
                <span style={{ fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: textDim }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Scroll hint */}
          <div className="hero-el-7" style={{
            position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          }}>
            <span style={{ fontFamily: "'Cinzel',serif", fontSize: 8, letterSpacing: 3, textTransform: 'uppercase', color: '#3A3020' }}>Scroll</span>
            <div style={{ width: 1, height: 32, background: 'linear-gradient(180deg,rgba(201,168,76,0.4),transparent)' }} />
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" style={{
          height: '100vh', scrollSnapAlign: 'start',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '80px 48px',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', color: gold, display: 'block', marginBottom: 12 }}>
              ◈ Features
            </span>
            <h2 style={{ fontFamily: "'Cinzel',serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, fontSize: 'clamp(20px,3.5vw,36px)', color: textRune }}>
              Everything you need
            </h2>
            <p style={{ fontFamily: "'Crimson Pro',serif", fontStyle: 'italic', fontSize: 17, color: textDim }}>
              From meta builds to lore exploration, everything in one place.
            </p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
            gap: 1, background: goldFaint,
            border: `1px solid ${goldFaint}`,
            width: '100%', maxWidth: 960,
          }}>
            {FEATURES.map(f => {
              const b = BADGE[f.badge]
              return (
                <div key={f.title}
                  style={{ background: bgVoid, padding: '32px 28px', position: 'relative', overflow: 'hidden', transition: 'background 0.3s', cursor: 'default', opacity: (f.badge === 'soon' || f.badge === 'progress') ? 0.6 : 1 }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,168,76,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = bgVoid)}
                >
                  <span style={{ fontSize: 24, display: 'block', marginBottom: 14 }}>{f.icon}</span>
                  <span style={{
                    display: 'inline-block', padding: '3px 10px', borderRadius: 2, marginBottom: 12,
                    fontFamily: "'Cinzel',serif", fontSize: 8, letterSpacing: 2, textTransform: 'uppercase',
                    background: b.bg, border: `1px solid ${b.border}`, color: b.color,
                  }}>{b.label}</span>
                  <h3 style={{ fontFamily: "'Cinzel',serif", fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: textRune, marginBottom: 8 }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: 12, lineHeight: 1.7, color: textDim }}>{f.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── TECH ── */}
        <section id="tech" style={{
          height: '100vh', scrollSnapAlign: 'start',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '80px 48px',
          borderTop: `1px solid rgba(201,168,76,0.08)`,
          background: 'rgba(201,168,76,0.015)',
        }}>
          <div style={{ textAlign: 'center', maxWidth: 800 }}>
            <span style={{ fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', color: gold, display: 'block', marginBottom: 12 }}>
              ◈ Personal Project · Portfolio
            </span>
            <h2 style={{ fontFamily: "'Cinzel',serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, fontSize: 'clamp(20px,3.5vw,36px)', color: textRune }}>
              Tech Stack
            </h2>
            <p style={{ fontFamily: "'Crimson Pro',serif", fontStyle: 'italic', fontSize: 17, color: textDim, marginBottom: 48 }}>
              Built with modern technologies, real AI and live data.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
              {TECH.map(t => (
                <span key={t}
                  style={{
                    fontFamily: "'Cinzel',serif", fontSize: 11, letterSpacing: 1.5,
                    padding: '8px 18px', borderRadius: 2,
                    border: `1px solid rgba(201,168,76,0.15)`, color: goldDim,
                    background: goldGlow, cursor: 'default', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'; e.currentTarget.style.color = gold }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.15)'; e.currentTarget.style.color = goldDim }}
                >{t}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section id="cta" style={{
          height: '100vh', scrollSnapAlign: 'start',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '80px 24px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 50% 50%, rgba(201,168,76,0.05) 0%, transparent 65%)' }} />

          <span style={{ fontFamily: "'Cinzel',serif", fontSize: 64, color: 'rgba(201,168,76,0.07)', letterSpacing: 10, display: 'block', marginBottom: -10 }}>✦</span>
          <h2 style={{ fontFamily: "'Cinzel',serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 16, fontSize: 'clamp(24px,5vw,48px)', color: textRune }}>
            May Grace guide you
          </h2>
          <p style={{ fontFamily: "'Crimson Pro',serif", fontStyle: 'italic', fontSize: 18, color: textDim, marginBottom: 40, maxWidth: 440 }}>
            Begin your journey. The Lands Between await.
          </p>
          <Link href="/dashboard" style={{
            fontFamily: "'Cinzel',serif", fontWeight: 700, fontSize: 11,
            letterSpacing: 3, textTransform: 'uppercase', textDecoration: 'none',
            padding: '14px 40px', borderRadius: 2, background: gold, color: bgVoid,
          }}>Enter the Compendium</Link>

          {/* Footer */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '20px 48px',
            borderTop: `1px solid rgba(201,168,76,0.07)`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: '#2A2010' }}>
              © 2025 The Souls Grail · Personal Project
            </span>
            <span style={{ fontFamily: "'Cinzel',serif", fontSize: 11, letterSpacing: 4, color: 'rgba(201,168,76,0.12)' }}>✦ ◈ ✦</span>
            <span style={{ fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: '#2A2010' }}>
              Fan Project · Not affiliated with FromSoftware
            </span>
          </div>
        </section>

        {/* ── DOTS ── */}
        <div style={{
          position: 'fixed', right: 20, top: '50%', transform: 'translateY(-50%)',
          display: 'flex', flexDirection: 'column', gap: 10, zIndex: 200,
        }}>
          {SECTIONS.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} style={{
              width: i === current ? 8 : 5,
              height: i === current ? 8 : 5,
              borderRadius: '50%',
              background: i === current ? gold : 'rgba(201,168,76,0.2)',
              border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s',
            }} />
          ))}
        </div>

      </div>
    </>
  )
}