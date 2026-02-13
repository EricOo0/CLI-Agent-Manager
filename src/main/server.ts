import express from 'express'
import type { Server } from 'http'
import type { HookPayload } from '../shared/types'

const PORT = 27420

let server: Server | null = null

// 事件回调类型
type EventCallback = (payload: HookPayload) => void

// 启动 HTTP 服务
export function startServer(onEvent: EventCallback): Promise<void> {
  return new Promise((resolve, reject) => {
    const app = express()
    app.use(express.json())

    // 健康检查
    app.get('/api/health', (_req, res) => {
      res.json({ status: 'ok', timestamp: Date.now() })
    })

    // 接收 hook/skill 事件
    app.post('/api/event', (req, res) => {
      const payload = req.body as HookPayload

      // 基本校验
      if (!payload.hook_event_name || !payload.session_id) {
        res.status(400).json({ error: '缺少 hook_event_name 或 session_id' })
        return
      }

      // 默认 cwd
      if (!payload.cwd) {
        payload.cwd = ''
      }

      // 默认 cli_type
      if (!payload.cli_type) {
        payload.cli_type = 'claude-code'
      }

      onEvent(payload)
      res.json({ ok: true })
    })

    server = app.listen(PORT, '127.0.0.1', () => {
      console.log(`AgentBoard 服务已启动: http://127.0.0.1:${PORT}`)
      resolve()
    })

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`端口 ${PORT} 已被占用，AgentBoard 可能已在运行`)
      }
      reject(err)
    })
  })
}

// 停止服务
export function stopServer(): Promise<void> {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => resolve())
    } else {
      resolve()
    }
  })
}
