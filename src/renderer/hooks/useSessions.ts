import { useState, useEffect } from 'react'
import type { Session, SessionFilter } from '../types'

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<SessionFilter>('all')

  useEffect(() => {
    if (!window.agentBoard) {
      console.error('window.agentBoard is not defined')
      setLoading(false)
      return
    }

    window.agentBoard.getSessions().then((data) => {
      setSessions(data)
      setLoading(false)
    })

    const unsubscribe = window.agentBoard.onSessionsUpdate((updated) => {
      setSessions(updated as Session[])
    })

    return unsubscribe
  }, [])

  const filteredSessions = sessions.filter((s) => {
    if (filter === 'active') {
      return (s.status === 'working' || s.status === 'needs_approval') && !s.isClosed
    }
    if (filter === 'completed') {
      return s.status === 'done'  // 包括 isClosed 的
    }
    // all: 默认排除已关闭的
    return !s.isClosed
  })

  return {
    sessions: filteredSessions,
    allSessions: sessions,
    loading,
    filter,
    setFilter,
    totalCount: sessions.length
  }
}
