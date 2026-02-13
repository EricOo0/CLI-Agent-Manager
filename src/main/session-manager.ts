import {
  upsertSession,
  updateSessionStatus,
  updateSessionTask,
  updateSessionClosed,
  getAllSessions,
  getSessionById,
  cleanOldSessions,
  insertEvent,
  getEventsBySession
} from './database'
import { readTaskDescription } from './history-reader'
import type { Session, SessionStatus, HookPayload } from '../shared/types'

// 会话更新回调
type SessionUpdateCallback = (sessions: Session[]) => void
let onUpdate: SessionUpdateCallback | null = null

// 注册更新回调
export function setSessionUpdateCallback(cb: SessionUpdateCallback): void {
  onUpdate = cb
}

// 通知更新
function notifyUpdate(): void {
  if (onUpdate) {
    onUpdate(getAllSessions())
  }
}

// 获取会话详情
export function getSessionDetails(sessionId: string): Record<string, unknown>[] {
  return getEventsBySession(sessionId)
}

// 处理 hook 事件（状态机核心）
export function handleEvent(payload: HookPayload): void {
  const now = Date.now()
  const { hook_event_name, session_id, cwd, cli_type, task_description } = payload

  // 1. 记录事件日志
  let content = ''
  if (task_description) {
    content = task_description
  } else if (payload.notification_type) {
    content = payload.notification_type
  } else if (payload.permission_mode) {
    content = `Mode: ${payload.permission_mode}`
  }
  
  // 确保存入 events 表
  try {
    // 如果是第一次收到该 session 的事件，可能需要先创建 session 记录（虽然 database.ts 有外键约束）
    // 但 handleEvent 下面的 switch 逻辑会负责创建/更新 session。
    // 为了满足外键约束，我们需要先执行 session 的 upsert 逻辑，再插入 event。
    // 所以这里只是准备数据，或者调整执行顺序。
  } catch (e) {
    console.error('Error preparing event:', e)
  }

  // 调整顺序：先更新 Session 状态（确保 Session 存在），再插入 Event
  
  switch (hook_event_name) {
    case 'SessionStart': {
      upsertSession({
        id: session_id,
        cliType: cli_type || 'claude-code',
        project: cwd,
        status: 'idle',
        taskDescription: task_description || '',
        startTime: now,
        taskStartTime: null,
        isSubAgent: false,
        lastEventTime: now
      })
      
      // 插入事件
      insertEvent(session_id, hook_event_name, content)

      // 延迟 500ms 读取 history.jsonl（等 Claude Code 写入）
      if (!task_description && cli_type === 'claude-code') {
        setTimeout(() => {
          const desc = readTaskDescription(session_id)
          if (desc) {
            const session = getSessionById(session_id)
            if (session && !session.taskDescription) {
              updateSessionTask(session_id, desc, session.taskStartTime, session.status)
              // 补充一条事件记录
              insertEvent(session_id, 'TaskDescriptionUpdate', desc)
              notifyUpdate()
            }
          }
        }, 500)
      }
      break
    }

    case 'UserPromptSubmit': {
      const existing = getSessionById(session_id)
      if (existing) {
        const desc = task_description || readTaskDescription(session_id) || existing.taskDescription
        updateSessionTask(session_id, desc, now, 'working')
      } else {
        // 未见 SessionStart，创建新会话
        upsertSession({
          id: session_id,
          cliType: cli_type || 'claude-code',
          project: cwd,
          status: 'working',
          taskDescription: task_description || '',
          startTime: now,
          taskStartTime: now,
          isSubAgent: false,
          lastEventTime: now
        })
      }
      // 插入事件
      insertEvent(session_id, hook_event_name, content)
      break
    }

    case 'Stop': {
      updateSessionStatus(session_id, 'done')
      insertEvent(session_id, hook_event_name, content)
      break
    }

    case 'before_exit': {
      updateSessionClosed(session_id, true)
      insertEvent(session_id, hook_event_name, 'CLI process closed')
      break
    }

    case 'Notification': {
      if (payload.notification_type === 'permission_prompt') {
        updateSessionStatus(session_id, 'needs_approval')
      }
      // 确保 session 存在（针对意外情况）
      const session = getSessionById(session_id)
      if (session) {
        insertEvent(session_id, hook_event_name, content)
      }
      break
    }

    case 'PermissionRequest': {
      updateSessionStatus(session_id, 'needs_approval')
      const session = getSessionById(session_id)
      if (session) {
        insertEvent(session_id, hook_event_name, content)
      }
      break
    }

    default: {
      // 未知事件，仅更新时间戳
      const session = getSessionById(session_id)
      if (session) {
        updateSessionStatus(session_id, session.status)
        insertEvent(session_id, hook_event_name, content)
      }
    }
  }

  notifyUpdate()
}

// 获取所有会话
export function getSessions(): Session[] {
  return getAllSessions()
}

// 定期清理旧会话（每小时执行一次）
export function startCleanupTimer(): NodeJS.Timeout {
  return setInterval(() => {
    cleanOldSessions()
    notifyUpdate()
  }, 60 * 60 * 1000)
}
