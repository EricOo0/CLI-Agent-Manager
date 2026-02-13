import React, { useEffect, useState } from 'react'
import type { Session } from '../types'

interface SessionDetailModalProps {
  session: Session
  onClose: () => void
}

interface Event {
  id: number
  type: string
  content: string
  timestamp: number
}

export default function SessionDetailModal({ session, onClose }: SessionDetailModalProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 获取详情
    window.agentBoard.getSessionDetails(session.id).then((data) => {
      setEvents(data as unknown as Event[])
      setLoading(false)
    })
  }, [session.id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-3xl h-[80vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/50">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span className="font-mono text-cyan-400">#{session.id.slice(0, 8)}</span>
              <span className="text-slate-400 text-sm font-normal">Details</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-mono">{session.project}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-500">
              Loading details...
            </div>
          ) : events.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500">
              No events recorded for this session.
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="flex gap-4 group">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-slate-600 mt-2 group-hover:bg-cyan-500 transition-colors" />
                  <div className="w-px h-full bg-slate-800 my-1 group-last:hidden" />
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className={`text-xs font-mono font-bold uppercase ${
                      event.type === 'UserPromptSubmit' ? 'text-green-400' :
                      event.type === 'SessionStart' ? 'text-blue-400' :
                      event.type === 'Stop' ? 'text-red-400' :
                      'text-slate-400'
                    }`}>
                      {event.type}
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {event.content && (
                    <div className="bg-slate-800/50 rounded-lg p-3 text-sm text-slate-300 font-mono whitespace-pre-wrap break-words border border-slate-700/50">
                      {event.content}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
