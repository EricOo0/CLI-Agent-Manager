import fs from 'fs'
import path from 'path'
import os from 'os'

/**
 * 会话消息类型
 */
export type MessageRole = 'user' | 'assistant'

/**
 * Token 使用统计
 */
export interface TokenUsage {
  input_tokens: number
  output_tokens: number
}

/**
 * 聊天消息
 */
export interface ChatMessage {
  role: MessageRole
  content: string
  model?: string
  usage?: TokenUsage
}

/**
 * Claude Code JSONL 文件中的消息条目
 */
interface JSONLEntry {
  type: 'user' | 'assistant' | 'progress' | 'system' | 'file-history-snapshot' | string
  message?: {
    role?: MessageRole
    content?: string | Array<{ type: string; text?: string }>
  }
  uuid?: string
  timestamp?: string
}

/**
 * 构建 Session JSONL 文件路径
 * 格式: ~/.claude/projects/<url-encoded-project-path>/<sessionId>.jsonl
 */
function getSessionJsonlPath(sessionId: string, projectPath: string): string {
  // URL 编码项目路径（与 history.jsonl 格式保持一致）
  const encodedPath = projectPath.replace(/\//g, '-').replace(/^-/, '')
  return path.join(os.homedir(), '.claude', 'projects', encodedPath, `${sessionId}.jsonl`)
}

/**
 * 检查 Session JSONL 文件是否存在
 */
export function sessionJsonlExists(sessionId: string, projectPath: string): boolean {
  const filePath = getSessionJsonlPath(sessionId, projectPath)
  return fs.existsSync(filePath)
}

/**
 * 从 JSONL 文件内容中提取文本
 * 支持多种格式：
 * 1. 简单字符串: "你好"
 * 2. 块数组: [{"type": "text", "text": "你好"}]
 * 3. 块数组包含 tool_result: [{"type": "tool_result", "content": "..."}]
 * 4. 块数组包含 tool_use: [{"type": "tool_use", "name": "Write", ...}]
 */
function extractContentText(content: unknown): string {
  if (typeof content === 'string') {
    return content
  }

  if (Array.isArray(content)) {
    const texts: string[] = []

    for (const item of content) {
      if (typeof item !== 'object' || item === null) continue

      const block = item as { type?: string; text?: string; content?: string }

      // 提取文本块
      if (block.type === 'text' && block.text) {
        texts.push(block.text)
      }
      // 提取工具结果
      else if (block.type === 'tool_result' && block.content) {
        const contentText = typeof block.content === 'string' ? block.content : JSON.stringify(block.content, null, 2)
        texts.push(`\`\`\`\n${contentText}\n\`\`\``)
      }
    }

    return texts.join('\n\n')
  }

  return ''
}

/**
 * 检查是否是子 agent
 * 子 agent 的 JSONL 文件包含 isSidechain: true 和 agentId 字段
 */
export function isSubAgent(sessionId: string, projectPath: string): boolean {
  const filePath = getSessionJsonlPath(sessionId, projectPath)

  if (!fs.existsSync(filePath)) {
    return false
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.trim().split('\n')

    for (const line of lines) {
      if (!line.trim()) continue

      try {
        const entry: JSONLEntry & { isSidechain?: boolean; agentId?: string } = JSON.parse(line)

        // 如果包含 isSidechain: true 和 agentId，说明这是子 agent
        if (entry.isSidechain === true && entry.agentId) {
          return true
        }
      } catch {
        // 跳过无法解析的行
      }
    }

    return false
  } catch {
    return false
  }
}

/**
 * 获取 agentId（子 agent 的标识）
 */
export function getAgentId(sessionId: string, projectPath: string): string | null {
  const filePath = getSessionJsonlPath(sessionId, projectPath)

  if (!fs.existsSync(filePath)) {
    return null
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.trim().split('\n')

    for (const line of lines) {
      if (!line.trim()) continue

      try {
        const entry: JSONLEntry & { agentId?: string } = JSON.parse(line)

        if (entry.agentId) {
          return entry.agentId
        }
      } catch {
        // 跳过无法解析的行
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * 读取并解析 Session JSONL 文件
 * 返回 user 和 assistant 类型的消息列表
 */
export function readSessionMessages(sessionId: string, projectPath: string): ChatMessage[] {
  const filePath = getSessionJsonlPath(sessionId, projectPath)

  if (!fs.existsSync(filePath)) {
    return []
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.trim().split('\n')
    const messages: ChatMessage[] = []

    for (const line of lines) {
      if (!line.trim()) continue

      try {
        const entry: JSONLEntry = JSON.parse(line)

        // 只处理 user 和 assistant 类型的消息
        if (entry.type === 'user' || entry.type === 'assistant') {
          const msg = entry.message
          if (!msg) continue

          // 从 message 对象中提取角色（而不是从 entry.type）
          const role = msg.role || (entry.type === 'user' ? 'user' : 'assistant')

          // 提取内容
          const text = extractContentText(msg.content)
          if (!text) continue

          messages.push({
            role,
            content: text,
            model: (msg as { model?: string }).model
          })
        }

        // 处理 assistant 消息的 usage 信息（可能在其他条目中）
        // Claude Code 的格式中，usage 信息通常在 assistant 消息内
        // 这里简化处理，仅从 message 中提取
        if (entry.type === 'assistant' && entry.message && 'usage' in entry.message) {
          const usage = (entry.message as { usage?: { input_tokens: number; output_tokens: number } }).usage
          if (usage) {
            // 找到最后一条 assistant 消息并附加 usage
            for (let i = messages.length - 1; i >= 0; i--) {
              if (messages[i].role === 'assistant' && !messages[i].usage) {
                messages[i].usage = {
                  input_tokens: usage.input_tokens || 0,
                  output_tokens: usage.output_tokens || 0
                }
                break
              }
            }
          }
        }
      } catch {
        // 跳过无法解析的行
      }
    }

    return messages
  } catch (error) {
    console.error('读取 Session JSONL 文件失败:', error)
    return []
  }
}
