import fs from 'fs'
import path from 'path'
import os from 'os'

const HISTORY_PATH = path.join(os.homedir(), '.claude', 'history.jsonl')

interface HistoryEntry {
  display?: string
  sessionId?: string
  project?: string
  timestamp?: number
  type?: string
}

// 从 history.jsonl 读取指定 session 的任务描述
export function readTaskDescription(sessionId: string): string {
  try {
    if (!fs.existsSync(HISTORY_PATH)) {
      return ''
    }

    const content = fs.readFileSync(HISTORY_PATH, 'utf-8')
    const lines = content.trim().split('\n')

    // 从最新的条目开始查找
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const entry: HistoryEntry = JSON.parse(lines[i])
        if (entry.sessionId === sessionId && entry.display) {
          const desc = extractMeaningfulPrompt(entry.display)
          if (desc) return desc
        }
      } catch {
        // 跳过无法解析的行
      }
    }
  } catch {
    // 文件读取失败，静默忽略
  }

  return ''
}

// 提取有意义的 prompt 描述
function extractMeaningfulPrompt(text: string): string {
  const trimmed = text.trim()

  // 跳过命令、标志、过短内容
  if (trimmed.startsWith('/')) return ''
  if (trimmed.startsWith('--')) return ''
  if (trimmed.length < 15) return ''

  // 截断到 200 字符
  if (trimmed.length > 200) {
    return trimmed.slice(0, 200) + '…'
  }

  return trimmed
}
