import Link from 'next/link'
import Image from 'next/image'

export default function Topbar() {
  return (
    <header style={{
      height: 56,
      background: 'rgba(8,7,6,0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(201,168,76,0.12)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 16,
      flexShrink: 0,
      position: 'relative',
      zIndex: 50,
    }}>
      {/* Gold line */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)',
      }} />

      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          border: '1px solid rgba(201,168,76,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, color: '#C9A84C',
          background: 'rgba(201,168,76,0.05)',
        }}>✦</div>
        <span style={{
          fontFamily: "'Cinzel',serif", fontSize: 13, fontWeight: 700,
          letterSpacing: 3, textTransform: 'uppercase', color: '#C9A84C',
        }}>The Souls Grail</span>
      </Link>

      {/* Center — breadcrumb */}
      <div style={{
        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(201,168,76,0.3)' }}>
          Dashboard
        </span>
      </div>

      {/* Right badges */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
          padding: '4px 12px', borderRadius: 2,
          background: 'rgba(120,80,200,0.12)',
          border: '1px solid rgba(120,80,200,0.35)',
          color: '#B080F0',
        }}>✦ Shadow of the Erdtree</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6A6058' }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%', background: '#50A050',
            boxShadow: '0 0 6px rgba(80,160,80,0.5)',
            animation: 'pulse 2s infinite',
          }} />
          <span style={{ fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: 1.5 }}>Supabase</span>
        </div>
      </div>
    </header>
  )
}