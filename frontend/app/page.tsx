'use client'

import { useState } from 'react'
import Topbar from '@/components/layout/Topbar'
import Sidebar from '@/components/layout/Sidebar'
import AgentChat from '@/components/agent/AgentChat'
import BuildFinder from '@/components/builds/BuildFinder'

export default function Home() {
  const [activeTab, setActiveTab] = useState('agent')

  const renderTab = () => {
    switch (activeTab) {
      case 'agent': return <AgentChat />
      case 'builds': return <BuildFinder />
      default: return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="font-cinzel text-2xl tracking-widest" style={{ color: 'var(--gold)' }}>
              ✦ {activeTab.toUpperCase()} ✦
            </p>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-ash)' }}>
              Módulo en construcción
            </p>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar active={activeTab} onNavigate={setActiveTab} />
        <main className="flex-1 overflow-hidden flex flex-col" style={{ background: 'var(--bg-surface)' }}>
          {renderTab()}
        </main>
      </div>
    </div>
  )
}