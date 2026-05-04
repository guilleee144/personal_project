export default function Topbar() {
  return (
    <header
      className="h-[52px] flex items-center px-5 gap-4 flex-shrink-0 relative"
      style={{
        background: 'var(--bg-deep)',
        borderBottom: '1px solid var(--border-gold)',
      }}
    >
      {/* Gold line bottom */}
      <div className="gold-line absolute bottom-0 left-0 right-0" />

      {/* Logo */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-cinzel"
          style={{ border: '1.5px solid var(--gold)', color: 'var(--gold)' }}
        >
          ✦
        </div>
        <span
          className="font-cinzel text-sm font-bold tracking-[3px] uppercase"
          style={{ color: 'var(--gold)' }}
        >
          The Souls Grail
        </span>
      </div>

      {/* Badges */}
      <div className="ml-auto flex items-center gap-3">
        <span
          className="text-[10px] px-3 py-1 tracking-widest uppercase"
          style={{
            background: 'rgba(120,80,200,0.2)',
            border: '1px solid rgba(120,80,200,0.5)',
            color: '#C090FF',
            borderRadius: '2px',
          }}
        >
          Shadow of the Erdtree
        </span>
        <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-ash)' }}>
          <div
            className="w-1.5 h-1.5 rounded-full pulse"
            style={{ background: '#60C060' }}
          />
          Supabase Online
        </div>
      </div>
    </header>
  )
}