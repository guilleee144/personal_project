'use client'

import { useState } from 'react'

export default function Locations() {
  const [activeRegion, setActiveRegion] = useState<'lands-between' | 'shadow-realm' | 'undergrounds'>('lands-between')

  const regions = {
    'lands-between': {
      name: 'Lands Between',
      url: 'https://wand.com/es/maps/elden-ring/lands-between?embed=true'
    },
    'shadow-realm': {
      name: 'The Shadow Realm',
      url: 'https://wand.com/es/maps/elden-ring/the-shadow-realm?embed=true'
    },
    'undergrounds': {
      name: 'Undergrounds',
      url: 'https://wand.com/es/maps/elden-ring/undergrounds?embed=true'
    }
  }

  return (
    <section className="relative bg-[#070604] font-serif text-stone-200 w-full h-screen flex flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(198,161,91,0.08),transparent_50%)]" />

      <div className="relative z-10 w-full h-full flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-[#c6a15b]/10 shrink-0">
          <h1 className="text-4xl font-bold uppercase tracking-[0.08em] text-[#e5c77e] mb-4">
            Locations & Map
          </h1>

          {/* Region Selector */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(regions).map(([key, region]) => (
              <button
                key={key}
                onClick={() => setActiveRegion(key as 'lands-between' | 'shadow-realm' | 'undergrounds')}
                className={`px-3 py-1.5 text-xs uppercase tracking-widest rounded font-medium transition-all ${
                  activeRegion === key
                    ? 'bg-[#c6a15b]/30 border border-[#c6a15b]/70 text-[#e5c77e]'
                    : 'bg-[#0f0e0a]/50 border border-[#c6a15b]/20 text-stone-400 hover:text-[#c6a15b]'
                }`}
              >
                {region.name}
              </button>
            ))}
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 overflow-hidden relative w-full">
          <iframe
            key={activeRegion}
            src={regions[activeRegion].url}
            title={`Wand - ${regions[activeRegion].name}`}
            className="w-full h-full border-none"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>
    </section>
  )
}