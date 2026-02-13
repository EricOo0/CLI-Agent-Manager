import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import type { Session, SessionStatus, CLIType } from '../shared/types'

let db: Database.Database

// Prepared statements 缓存
let stmts: {
  upsert: Database.Statement
  updateStatus: Database.Statement
  updateTask: Database.Statement
  updateClosed: Database.Statement
  getAll: Database.Statement
  getById: Database.Statement
  deleteOld: Database.Statement
}

// 初始化数据库
export function initDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'sessions.db')
  db = new Database(dbPath)

  // WAL 模式提升并发性能
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')

  // 创建 sessions 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      cli_type TEXT NOT NULL DEFAULT 'claude-code',
      project TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'idle',
      task_description TEXT NOT NULL DEFAULT '',
      start_time INTEGER NOT NULL,
      task_start_time INTEGER,
      is_sub_agent INTEGER NOT NULL DEFAULT 0,
      last_event_time INTEGER NOT NULL
    )
  `)

  // 创建 events 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      timestamp INTEGER NOT NULL,
      FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id);
  `)

  // 迁移：添加 is_closed 列（兼容已有数据库）
  const tableInfo = db.prepare("PRAGMA table_info(sessions)").all() as Array<{name: string}>
  const hasIsClosed = tableInfo.some(col => col.name === 'is_closed')
  if (!hasIsClosed) {
    db.exec(`ALTER TABLE sessions ADD COLUMN is_closed INTEGER NOT NULL DEFAULT 0`)
  }

  // 准备 statements
  stmts = {
    // ... (保留原有 stmts)
    insertEvent: db.prepare(`
      INSERT INTO events (session_id, type, content, timestamp)
      VALUES (@sessionId, @type, @content, @timestamp)
    `),
    getEventsBySession: db.prepare(`
      SELECT * FROM events WHERE session_id = @sessionId ORDER BY timestamp ASC
    `),
    // ...

    upsert: db.prepare(`
      INSERT INTO sessions (id, cli_type, project, status, task_description, start_time, task_start_time, is_sub_agent, last_event_time)
      VALUES (@id, @cliType, @project, @status, @taskDescription, @startTime, @taskStartTime, @isSubAgent, @lastEventTime)
      ON CONFLICT(id) DO UPDATE SET
        cli_type = @cliType,
        project = @project,
        status = @status,
        task_description = CASE WHEN @taskDescription != '' THEN @taskDescription ELSE task_description END,
        task_start_time = @taskStartTime,
        is_sub_agent = @isSubAgent,
        last_event_time = @lastEventTime
    `),
    updateStatus: db.prepare(`
      UPDATE sessions SET status = @status, last_event_time = @lastEventTime WHERE id = @id
    `),
    updateTask: db.prepare(`
      UPDATE sessions SET
        task_description = @taskDescription,
        task_start_time = @taskStartTime,
        status = @status,
        last_event_time = @lastEventTime
      WHERE id = @id
    `),
    updateClosed: db.prepare(`
      UPDATE sessions SET is_closed = @isClosed, last_event_time = @lastEventTime WHERE id = @id
    `),
    getAll: db.prepare(`
      SELECT * FROM sessions ORDER BY last_event_time DESC
    `),
    getById: db.prepare(`
      SELECT * FROM sessions WHERE id = @id
    `),
    updateClosed: db.prepare(`
      UPDATE sessions SET is_closed = @isClosed, last_event_time = @lastEventTime WHERE id = @id
    `),
    deleteOld: db.prepare(`
      DELETE FROM sessions WHERE last_event_time < @cutoff AND is_closed = 1
    `)
  }
}

// 数据库行到 Session 对象的转换
function rowToSession(row: Record<string, unknown>): Session {
  return {
    id: row.id as string,
    cliType: row.cli_type as CLIType,
    project: row.project as string,
    projectName: path.basename((row.project as string) || ''),
    status: row.status as SessionStatus,
    taskDescription: row.task_description as string,
    startTime: row.start_time as number,
    taskStartTime: row.task_start_time as number | null,
    isSubAgent: Boolean(row.is_sub_agent),
    lastEventTime: row.last_event_time as number,
    isClosed: Boolean(row.is_closed)
  }
}

// UPSERT 会话
export function upsertSession(session: Omit<Session, 'projectName'>): void {
  stmts.upsert.run({
    id: session.id,
    cliType: session.cliType,
    project: session.project,
    status: session.status,
    taskDescription: session.taskDescription,
    startTime: session.startTime,
    taskStartTime: session.taskStartTime,
    isSubAgent: session.isSubAgent ? 1 : 0,
    lastEventTime: session.lastEventTime
  })
}

// 更新会话状态
export function updateSessionStatus(id: string, status: SessionStatus): void {
  stmts.updateStatus.run({ id, status, lastEventTime: Date.now() })
}

// 更新任务信息
export function updateSessionTask(
  id: string,
  taskDescription: string,
  taskStartTime: number | null,
  status: SessionStatus
): void {
  stmts.updateTask.run({
    id,
    taskDescription,
    taskStartTime,
    status,
    lastEventTime: Date.now()
  })
}

// 获取所有会话
export function getAllSessions(): Session[] {
  const rows = stmts.getAll.all() as Record<string, unknown>[]
  return rows.map(rowToSession)
}

// 按 ID 获取会话
export function getSessionById(id: string): Session | undefined {
  const row = stmts.getById.get({ id }) as Record<string, unknown> | undefined
  return row ? rowToSession(row) : undefined
}

// 插入事件
export function insertEvent(sessionId: string, type: string, content: string): void {
  stmts.insertEvent.run({
    sessionId,
    type,
    content,
    timestamp: Date.now()
  })
}

// 获取会话事件
export function getEventsBySession(sessionId: string): Record<string, unknown>[] {
  return stmts.getEventsBySession.all({ sessionId }) as Record<string, unknown>[]
}

// 更新会话关闭状态
export function updateSessionClosed(id: string, isClosed: boolean): void {
  stmts.updateClosed.run({ id, isClosed: isClosed ? 1 : 0, lastEventTime: Date.now() })
}

// 清理超过 7 天的已结束会话
export function cleanOldSessions(): void {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  stmts.deleteOld.run({ cutoff })
}

// 关闭数据库
export function closeDatabase(): void {
  if (db) {
    db.close()
  }
}
