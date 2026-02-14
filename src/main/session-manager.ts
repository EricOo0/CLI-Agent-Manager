import {
  upsertSession,
  updateSessionStatus,
  updateSessionTask,
  updateSessionClosed,
  reopenSession,
  getAllSessions,
  getSessionById,
  cleanOldSessions,
  insertEvent,
  getEventsBySession,
  insertMessage
} from './database'
import { readTaskDescription } from './history-reader'
import { isSubAgent, readSessionMessages } from './session-reader'
import { sendNotification, loadNotificationSettings } from './notification-manager'
import type { Session, SessionStatus, HookPayload } from '../shared/types'

// 会话更新回调
type SessionUpdateCallback = (sessions: Session[]) => void
let onUpdate: SessionUpdateCallback | null = null

// 注册更新回调
export function setSessionUpdateCallback(cb: SessionUpdateCallback): void {
  onUpdate = cb
}

// 通知更新
export function notifyUpdate(): void {
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

  // 如果会话已关闭，且收到新事件，则恢复该会话（非 before_exit 事件）
  const existing = getSessionById(session_id)
  if (existing && existing.isClosed && hook_event_name !== 'before_exit') {
    reopenSession(session_id)
    console.log(`[SessionManager] Session ${session_id.slice(0, 8)}... 已重新打开`)
  }

  // 构建事件内容 - 优先级：prompt > message > permission_mode:tool_name > task_description > notification_type
  let content = ''
  if (payload.prompt) {
    // UserPromptSubmit: 使用 prompt 字段
    content = payload.prompt
  } else if (payload.message) {
    // Notification: 使用 message 字段
    content = payload.message
  } else if (payload.tool_name) {
    // PermissionRequest: 显示工具名
    content = `${payload.permission_mode || 'default'}: ${payload.tool_name}`
  } else if (payload.permission_mode) {
    // PermissionRequest: 显示模式
    content = payload.permission_mode
  } else if (task_description) {
    // 兼容旧版本：使用 task_description
    content = task_description
  } else if (payload.notification_type) {
    // Notification: 显示通知类型
    content = payload.notification_type
  }
  
  switch (hook_event_name) {
    case 'SessionStart': {
      // 检测是否是子 agent（通过 isSidechain 字段）
      const isSubAgentValue = isSubAgent(session_id, cwd)

      // 尝试从 JSONL 中提取第一条 user 消息作为任务描述
      const messages = readSessionMessages(session_id, cwd)
      const firstUserMessage = messages.find(m => m.role === 'user')?.content || ''

      // [新增] 如果提供了 term_session_id，关闭同一终端中的旧活跃 session
      if (payload.term_session_id) {
        const sameTerminalSessions = getAllSessions().filter(s =>
          s.termSessionId === payload.term_session_id &&
          !s.isClosed &&
          s.id !== session_id &&
          (s.status === 'working' || s.status === 'needs_approval' || s.status === 'idle')
        )

        for (const oldSession of sameTerminalSessions) {
          updateSessionClosed(oldSession.id, true)
          updateSessionStatus(oldSession.id, 'done')
          insertEvent(oldSession.id, 'SessionAutoClosed',
            `新会话 ${session_id.slice(0, 8)}... 在同一终端中开始，自动关闭旧会话`)
          console.log(`[SessionManager] 同一终端旧 session ${oldSession.id.slice(0, 8)}... 已自动关闭`)
        }
      }

      upsertSession({
        id: session_id,
        cliType: cli_type || 'claude-code',
        customCliId: payload.custom_cli_id,
        project: cwd,
        status: isSubAgentValue ? 'working' : 'idle',
        taskDescription: task_description || firstUserMessage || '',
        startTime: now,
        taskStartTime: isSubAgentValue ? now : null,
        isSubAgent: isSubAgentValue,
        lastEventTime: now,
        termSessionId: payload.term_session_id
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
      // 检查是否存在该会话
      const existing = getSessionById(session_id)

      if (existing && !existing.isClosed) {
        // 会话已存在且未关闭，更新为 working 状态
        // 优先使用 hook 提供的 prompt，其次使用现有 task_description
        let desc = payload.prompt || task_description || existing.taskDescription
        updateSessionTask(session_id, desc, now, 'working')
      } else {
        // 新会话，检查是否需要关闭同项目的旧活跃会话
        // 只有当新会话不是现有会话时才关闭旧会话
        const activeSession = getAllSessions().find(s =>
          s.project === cwd && !s.isClosed && s.id !== session_id && (s.status === 'working' || s.status === 'needs_approval')
        )

        // 如果有旧活跃 session（且不是当前会话），先关闭它
        if (activeSession) {
          updateSessionClosed(activeSession.id, true)
          updateSessionStatus(activeSession.id, 'done')
          insertEvent(activeSession.id, 'SessionAutoClosed', `新会话 ${session_id.slice(0, 8)}... 开始，自动关闭旧会话`)
        }

        // 创建新会话，使用 prompt 作为任务描述
        const taskDesc = payload.prompt || task_description || ''
        upsertSession({
          id: session_id,
          cliType: cli_type || 'claude-code',
          customCliId: payload.custom_cli_id,
          project: cwd,
          status: 'working',
          taskDescription: taskDesc,
          startTime: now,
          taskStartTime: now,
          isSubAgent: false,
          lastEventTime: now
        })

        // 如果 hook 没有提供 prompt 或 task_description，延迟从 transcript_path 读取
        if (!payload.prompt && !task_description && payload.transcript_path) {
          setTimeout(() => {
            const messages = readSessionMessages(session_id, cwd)
            const firstUserMessage = messages.find(m => m.role === 'user')?.content || ''
            if (firstUserMessage) {
              const session = getSessionById(session_id)
              if (session && !session.taskDescription) {
                updateSessionTask(session_id, firstUserMessage, now, 'working')
                notifyUpdate()
              }
            }
          }, 500)
        }
      }

      // 保存用户消息到 messages 表
      if (payload.prompt) {
        insertMessage(session_id, 'user', payload.prompt)
      }

      // 插入事件
      insertEvent(session_id, hook_event_name, content)
      break
    }

    case 'Stop': {
      updateSessionStatus(session_id, 'done')
      insertEvent(session_id, hook_event_name, content)
      // 发送完成通知
      const session = getSessionById(session_id)
      if (session) {
        sendNotification('complete', { id: session_id, taskDescription: session.taskDescription })
      }
      break
    }

    case 'before_exit': {
      updateSessionClosed(session_id, true)
      insertEvent(session_id, hook_event_name, 'CLI process closed')
      break
    }

    case 'Notification': {
      const session = getSessionById(session_id)
      if (!session) break

      // 恢复为 working 状态（因为收到新 hook 说明会话仍在运行）
      if (payload.notification_type === 'permission_prompt') {
        updateSessionStatus(session_id, 'needs_approval')
      } else {
        // 其他通知（如 Mode 更新）恢复为 working
        updateSessionStatus(session_id, 'working')
      }
      insertEvent(session_id, hook_event_name, content)
      break
    }

    case 'PermissionRequest': {
      console.log(`[SessionManager] PermissionRequest - session: ${session_id.slice(0,8)}..., set status to needs_approval`)
      updateSessionStatus(session_id, 'needs_approval')
      const session = getSessionById(session_id)
      if (!session) {
        console.log(`[SessionManager] PermissionRequest - session not found after status update`)
        break
      }
      insertEvent(session_id, hook_event_name, content)
      // 发送通知
      sendNotification('approval', { id: session_id, taskDescription: session.taskDescription })
      console.log(`[SessionManager] PermissionRequest - done, notifying update`)
      notifyUpdate()  // 通知前端更新
      break
    }

    default: {
      // 未知事件，仅更新时间戳并恢复 working 状态
      const session = getSessionById(session_id)
      if (session) {
        console.log(`[SessionManager] default case - session: ${session_id.slice(0,8)}..., current status: ${session.status}, isClosed: ${session.isClosed}`)

        // 如果当前是待审批状态，收到后续事件说明审批已通过，恢复为运行中
        const newStatus = session.status === 'needs_approval' ? 'working' : session.status
        updateSessionStatus(session_id, newStatus)
        insertEvent(session_id, hook_event_name, content)

        console.log(`[SessionManager] default case - updated status: ${session.status} -> ${newStatus}`)
      }
      notifyUpdate()  // 通知前端更新
      break
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

// 会话心跳超时时间（3小时无响应视为断开）
// 长时间任务（如代码分析、重构）可能需要几小时，设置较长的超时避免误判
const HEARTBEAT_TIMEOUT = 3 * 60 * 60 * 1000  // 3小时
const HEARTBEAT_CHECK_INTERVAL = 5 * 60 * 1000  // 每5分钟检查一次

// 心跳检测定时器
let heartbeatTimer: NodeJS.Timeout | null = null

// 启动心跳检测
export function startHeartbeatTimer(): NodeJS.Timeout {
  // 先停止已有的定时器
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
  }

  heartbeatTimer = setInterval(() => {
    checkStaleSessions()
  }, HEARTBEAT_CHECK_INTERVAL)

  return heartbeatTimer
}

// 停止心跳检测
export function stopHeartbeatTimer(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

// 导出一个函数用于在退出前最后一次检测
export function finalizeHeartbeat(): void {
  stopHeartbeatTimer()
  // 最后一次检测，标记所有超时会话
  checkStaleSessions()
}

// 检测超时会话
function checkStaleSessions(): void {
  const now = Date.now()
  const allSessions = getAllSessions()
  let hasChanges = false

  for (const session of allSessions) {
    // 只检查活跃状态的工作会话
    if (session.status !== 'working' && session.status !== 'needs_approval') {
      continue
    }

    // 检查是否超时
    const timeSinceLastEvent = now - session.lastEventTime
    if (timeSinceLastEvent > HEARTBEAT_TIMEOUT) {
      // 标记为断开连接/空闲状态
      updateSessionStatus(session.id, 'idle')
      insertEvent(session.id, 'HeartbeatTimeout', `会话超时，${Math.floor(timeSinceLastEvent / 1000)}秒无响应`)
      hasChanges = true
    }
  }

  if (hasChanges) {
    notifyUpdate()
  }
}
