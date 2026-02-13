import React, { useState } from 'react'
import type { Session } from '../types'
import SessionCard from './SessionCard'
import SessionDetailModal from './SessionDetailModal'
import ChatDetailModal from './ChatDetailModal'

interface SessionGridProps {
  sessions: Session[]
  onCloseSession?: (sessionId: string) => void
  onDeleteSession?: (sessionId: string) => void
}

export default function SessionGrid({ sessions, onCloseSession, onDeleteSession }: SessionGridProps) {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [chatSession, setChatSession] = useState<Session | null>(null)

  if (sessions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-slate-700 border border-slate-700 flex items-center justify-center mb-4">
          <span className="text-2xl opacity-40">◇</span>
        </div>
        <p className="text-slate-400 text-sm mb-1">暂无会话</p>
        <p className="text-slate-400 text-xs">启动一个 AI CLI 工具开始监控</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sessions.map((session, i) => (
          <div key={session.id} onClick={() => setSelectedSession(session)} className="cursor-pointer">
            <SessionCard
              session={session}
              index={i}
              onClose={onCloseSession}
              onDelete={onDeleteSession}
              onViewChat={setChatSession}
            />
          </div>
        ))}
      </div>

      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}

      {chatSession && (
        <ChatDetailModal
          session={chatSession}
          onClose={() => setChatSession(null)}
        />
      )}
    </>
  )
}
