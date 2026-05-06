'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import styles from './landing.module.css'

const FEATURES = [
  {
    icon: '◈',
    title: 'AI Companion',
    badge: 'live',
    desc: 'Un agente inteligente que consulta la base de datos en tiempo real y genera recomendaciones precisas y lógicas según tu estilo de juego.',
  },
  {
    icon: '⚔',
    title: 'Build Finder',
    badge: 'live',
    desc: 'Busca builds reales en la comunidad y las enriquece con datos de nuestra base de datos. Builds de sangrado, fuerza, fe, magia y más.',
  },
  {
    icon: '◉',
    title: 'Patch Notes',
    badge: 'soon',
    desc: 'Feed de noticias sobre parches, buffs y nerfs rastreados desde la comunidad. Sabrás si tu arma favorita ha cambiado.',
  },
  {
    icon: '✦',
    title: 'Shadow of the Erdtree',
    badge: 'dlc',
    desc: 'Base de datos completa que incluye todos los items, armas, hechizos y jefes del DLC. Builds exclusivas del mundo de las Sombras.',
  },
  {
    icon: '◆',
    title: 'Base de Datos Completa',
    badge: 'live',
    desc: 'Más de 2.000 items catalogados en Supabase: armas, armaduras, talismanes, hechizos, cenizas de guerra, espíritus y mucho más.',
  },
  {
    icon: '◎',
    title: 'Explorador de Lore',
    badge: 'soon',
    desc: 'Explora jefes, NPCs, localizaciones y criaturas del mundo de Elden Ring con descripciones detalladas y mapas interactivos.',
  },
]

const STATS = [
  { number: '2.000+', label: 'Items en DB' },
  { number: '7',      label: 'Estilos de Build' },
  { number: '100%',   label: 'DLC incluido' },
  { number: '∞',      label: 'Builds posibles' },
]

const TECH = [
  'Next.js 15', 'TypeScript', 'Tailwind CSS',
  'FastAPI', 'Python', 'Supabase',
  'PostgreSQL', 'Groq AI', 'Llama 3.3',
  'httpx', 'BeautifulSoup', 'APScheduler',
]

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const featuresRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)

    // Intersection Observer para animar features al hacer scroll
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible)
          }
        })
      },
      { threshold: 0.1 }
    )

    const cards = featuresRef.current?.querySelectorAll(`.${styles.featureCard}`)
    cards?.forEach((card, i) => {
      (card as HTMLElement).style.animationDelay = `${i * 0.1}s`
      observer.observe(card)
    })

    return () => observer.disconnect()
  }, [])

  if (!mounted) return null

  return (
    <div className={styles.page}>

      {/* ── NAV ── */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.navLogo}>
          <Image
            src="/logo.png"
            alt="The Souls Grail"
            width={36}
            height={36}
            className={styles.navLogoImg}
          />
          <span className={styles.navLogoText}>The Souls Grail</span>
        </Link>

        <ul className={styles.navLinks}>
          <li><a href="#features" className={styles.navLink}>Features</a></li>
          <li><a href="#tech" className={styles.navLink}>Stack</a></li>
          <li>
            <Link href="/dashboard" className={styles.navCta}>
              Entrar
            </Link>
          </li>
        </ul>
      </nav>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroLines} />

        <span className={styles.heroBadge}>
          <span className={styles.heroBadgeDot} />
          Elden Ring AI Companion · Shadow of the Erdtree
        </span>

        <Image
          src="/logo.png"
          alt="The Souls Grail"
          width={90}
          height={90}
          className={styles.heroLogo}
          priority
        />

        <h1 className={styles.heroTitle}>The Souls Grail</h1>
        <p className={styles.heroSubtitle}>Elden Ring Knowledge Base</p>

        <div className={styles.heroDivider}>
          <div className={styles.heroDividerLine} />
          <span className={styles.heroDividerRune}>✦</span>
          <div className={styles.heroDividerLine} />
        </div>

        <p className={styles.heroDesc}>
          Tu compañero inteligente en las Tierras Intermedias. Builds reales,
          datos en vivo y recomendaciones precisas para cada Sinluz.
        </p>

        <div className={styles.heroActions}>
          <Link href="/dashboard" className={styles.btnPrimary}>
            Invocar la Gracia
          </Link>
          <a href="#features" className={styles.btnSecondary}>
            Ver Features
          </a>
        </div>

        <div className={styles.heroScroll}>
          <span className={styles.heroScrollText}>Scroll</span>
          <div className={styles.heroScrollLine} />
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div className={styles.statsBar}>
        {STATS.map((stat) => (
          <div key={stat.label} className={styles.statItem}>
            <span className={styles.statNumber}>{stat.number}</span>
            <span className={styles.statLabel}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* ── FEATURES ── */}
      <section className={styles.features} id="features">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>◈ Funcionalidades</span>
          <h2 className={styles.sectionTitle}>Todo lo que necesitas</h2>
          <p className={styles.sectionDesc}>
            Desde builds meta hasta exploración de lore, todo en un solo lugar.
          </p>
        </div>

        <div className={styles.featuresGrid} ref={featuresRef}>
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`${styles.featureCard} ${f.badge === 'soon' ? styles.soon : ''}`}
            >
              <div className={styles.featureCardGlow} />
              <span className={styles.featureIcon}>{f.icon}</span>
              <span className={`${styles.featureBadge} ${styles[f.badge]}`}>
                {f.badge === 'live' ? '● En vivo' : f.badge === 'dlc' ? '✦ DLC' : '◌ Próximamente'}
              </span>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TECH STACK ── */}
      <section className={styles.tech} id="tech">
        <div className={styles.techInner}>
          <p className={styles.techTitle}>◆ Stack Tecnológico</p>
          <div className={styles.techGrid}>
            {TECH.map((t) => (
              <span key={t} className={styles.techPill}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className={styles.cta}>
        <span className={styles.ctaRune}>✦</span>
        <h2 className={styles.ctaTitle}>Que la Gracia te guíe</h2>
        <p className={styles.ctaDesc}>
          Comienza tu viaje. Las Tierras Intermedias te esperan.
        </p>
        <Link href="/dashboard" className={styles.btnPrimary}>
          Entrar al Compendio
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <span className={styles.footerText}>
          © 2025 The Souls Grail · Proyecto Personal
        </span>
        <span className={styles.footerRune}>✦ ◈ ✦</span>
        <span className={styles.footerText}>
          Fan Project · No afiliado con FromSoftware
        </span>
      </footer>

    </div>
  )
}