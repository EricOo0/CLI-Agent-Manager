import React, { useState } from 'react'
import { useSessions } from './hooks/useSessions'
import SessionGrid from './components/SessionGrid'
import FilterBar from './components/FilterBar'
import { Page } from './types'
import Sidebar from './components/Sidebar'
import ConfigDashboard from './components/ConfigDashboard'

type View = 'dashboard' | 'config'

export default function App() {
  const [view, setView] = useState<View>('dashboard')
  const { sessions, allSessions, filter, setFilter, totalCount } = useSessions()

  if (!window.agentBoard) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-red-500 p-8">
        <h1 className="text-xl font-bold mb-4">Error: Preload script failed to load</h1>
        <p className="text-slate-400">window.agentBoard is undefined. This usually means the preload script was not properly executed or the application was built incorrectly.</p>
      </div>
    )
  }

  const counts = {
    all: allSessions.length,
    active: allSessions.filter(s => s.status === 'working' || s.status === 'needs_approval').length,
    completed: allSessions.filter(s => s.status === 'done').length
  }

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100">
      <Sidebar currentPage={view as Page} onNavigate={setView as (page: Page) => void} activeCount={counts.active} />
      <div className="flex-1 flex flex-col min-w-0">
        {view === 'dashboard' ? (
          <>
            <div className="pt-8 px-6 pb-4 border-b border-slate-700 drag-region">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-slate-200">
                  AgentBoard
                </h1>
                <span className="text-sm text-slate-400">
                  {totalCount} session{totalCount !== 1 ? 's' : ''}
                </span>
              </div>
              <FilterBar current={filter} onChange={setFilter} counts={counts} />
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <p className="text-lg">No sessions yet</p>
                  <p className="text-sm mt-1">Start a Claude Code session to see it here</p>
                </div>
              ) : (
                <SessionGrid sessions={sessions} />
              )}
            </div>
          </>
        ) : (
          <ConfigDashboard />
        )}
      </div>
    </div>
  )
}
