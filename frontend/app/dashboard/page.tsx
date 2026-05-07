'use client'

import { useState } from 'react'
import Topbar from '@/components/layout/Topbar'
import Sidebar from '@/components/layout/Sidebar'
import AgentChat from '@/components/agent/AgentChat'
import BuildFinder from '@/components/builds/BuildFinder'
import PatchNotes from '@/components/patches/PatchNotes'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('agent')

  const renderTab = () => {
    switch (activeTab) {
      case 'agent':
        return <AgentChat />

      case 'builds':
        return <BuildFinder />

      case 'patches':
        return <PatchNotes />

      default:
        return <Placeholder title={activeTab} />
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0A0908]">
      <Topbar />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar active={activeTab} onNavigate={setActiveTab} />

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#0F0D0B]">
          {renderTab()}
        </main>
      </div>
    </div>
  )
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="grid h-full place-items-center font-serif">
      <div className="text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full border border-[#c6a15b]/20 text-2xl text-[#c6a15b]/30">
          ✦
        </div>

        <p className="text-sm uppercase tracking-[0.35em] text-[#c6a15b]/40">
          {title} — Módulo en construcción
        </p>

        <p className="mt-2 text-xs text-stone-600">
          Próximamente disponible
        </p>
      </div>
    </div>
  )
}