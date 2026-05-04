'use client'

import { useState } from 'react'

const NAV_ITEMS = [
  {
    section: 'Companion',
    items: [
      { id: 'agent', icon: '◈', label: 'AI Companion', count: null },
      { id: 'builds', icon: '⚔', label: 'Build Finder', count: null },
    ],
  },
  {
    section: 'World',
    items: [
      { id: 'patches', icon: '◉', label: 'Patch Notes', count: '2' },
      { id: 'bosses', icon: '☠', label: 'Bosses', count: null },
      { id: 'items', icon: '◆', label: 'Items', count: null },
      { id: 'spells', icon: '✦', label: 'Spells', count: null },
    ],
  },
  {
    section: 'Lore',
    items: [
      { id: 'npcs', icon: '◎', label: 'NPCs', count: null },
      { id: 'locations', icon: '◇', label: 'Locations', count: null },
    ],
  },
]

interface SidebarProps {
  active: string
  onNavigate: (id: string) => void
}

export default function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <aside
      className="w-[200px] flex flex-col flex-shrink-0 overflow-y-auto"
      style={{
        background: 'var(--bg-deep)',
        borderRight: '1px solid var(--border-gold)',
      }}
    >
      {NAV_ITEMS.map((group) => (
        <div key={group.section} className="py-4">
          <p
            className="font-cinzel text-[9px] tracking-[2px] uppercase px-4 pb-2"
            style={{ color: 'var(--text-dim)' }}
          >
            {group.section}
          </p>

          {group.items.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-all duration-200 relative"
              style={{
                background: active === item.id ? 'rgba(201,168,76,0.08)' : 'transparent',
                color: active === item.id ? 'var(--gold)' : 'var(--text-ash)',
                fontSize: '12.5px',
              }}
            >
              {/* Active indicator */}
              {active === item.id && (
                <div
                  className="absolute left-0 top-0 bottom-0 w-[2px]"
                  style={{ background: 'var(--gold)' }}
                />
              )}
              <span className="w-4 text-center text-sm">{item.icon}</span>
              <span>{item.label}</span>
              {item.count && (
                <span
                  className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(201,168,76,0.1)',
                    border: '1px solid rgba(201,168,76,0.2)',
                    color: 'var(--gold-dim)',
                  }}
                >
                  {item.count}
                </span>
              )}
            </button>
          ))}

          <div
            className="mx-4 mt-2"
            style={{ height: '1px', background: 'var(--border-gold)', opacity: 0.4 }}
          />
        </div>
      ))}
    </aside>
  )
}