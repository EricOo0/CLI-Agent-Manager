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
      console.log('[useSessions] Initial sessions loaded:', data.length, data.map(s => ({
        id: s.id.slice(0,8),
        status: s.status,
        isClosed: s.isClosed
      })))
      setSessions(data)
      setLoading(false)
    })

    const unsubscribe = window.agentBoard.onSessionsUpdate((updated) => {
      console.log('[useSessions] Sessions updated:', updated.length)
      setSessions(updated as Session[])
    })

    return unsubscribe
  }, [])

  const filteredSessions = sessions.filter((s) => {
    if (filter === 'active') {
      const isActive = (s.status === 'working' || s.status === 'needs_approval') && !s.isClosed
      console.log(`[Filter] Session ${s.id.slice(0,8)}... - status: ${s.status}, isClosed: ${s.isClosed} => active: ${isActive}`)
      return isActive
    }
    if (filter === 'completed') {
      // 已完成：status 为 done，或者已关闭（任何 status），或者 idle（未关闭但空闲）
      // 排除活跃中的会话
      const isNotActive = s.status !== 'working' && s.status !== 'needs_approval' || s.isClosed
      console.log(`[Filter] Session ${s.id.slice(0,8)}... - status: ${s.status}, isClosed: ${s.isClosed} => completed: ${isNotActive}`)
      return isNotActive
    }
    // all: 显示所有会话，包括已关闭的
    return true
  })

  const closeSession = async (sessionId: string) => {
    try {
      const result = await window.agentBoard.closeSession(sessionId)
      if (result.success) {
        // 本地状态更新：立即更新本地状态以反映关闭
        setSessions(prev => prev.map(s =>
          s.id === sessionId ? { ...s, isClosed: true, status: 'done' as const } : s
        ))
        return true
      }
      return false
    } catch (error) {
      console.error('关闭 Session 失败:', error)
      return false
    }
  }

  const deleteSession = async (sessionId: string) => {
    try {
      const result = await window.agentBoard.deleteSession(sessionId)
      if (result.success) {
        // 本地状态更新：立即从列表中移除
        setSessions(prev => prev.filter(s => s.id !== sessionId))
        return true
      }
      return false
    } catch (error) {
      console.error('删除 Session 失败:', error)
      return false
    }
  }

  return {
    sessions: filteredSessions,
    allSessions: sessions,
    loading,
    filter,
    setFilter,
    totalCount: sessions.length,
    closeSession,
    deleteSession
  }
}
