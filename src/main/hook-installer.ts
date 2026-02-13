import fs from 'fs'
import path from 'path'
import os from 'os'

const CLAUDE_DIR = path.join(os.homedir(), '.claude')
const SETTINGS_PATH = path.join(CLAUDE_DIR, 'settings.json')
const HOOKS_DIR = path.join(CLAUDE_DIR, 'hooks', 'agent-board')
const HOOK_SCRIPT = path.join(HOOKS_DIR, 'agent-board-hook.sh')
const REPORT_SCRIPT = path.join(HOOKS_DIR, 'agent-board-report.sh')

// 需要注册 hook 的事件类型
const HOOK_EVENTS = [
  'SessionStart',
  'UserPromptSubmit',
  'Stop',
  'Notification',
  'PermissionRequest'
]

interface HookEntry {
  type: string
  command: string
  timeout: number
}

interface HookMatcher {
  matcher: string
  hooks: HookEntry[]
}

interface ClaudeSettings {
  hooks?: Record<string, HookMatcher[]>
  [key: string]: unknown
}

// 安装支持文件（脚本和 skill）
export function installSupportFiles(resourcesPath: string): { success: boolean; message: string } {
  try {
    // 确保目录存在
    fs.mkdirSync(HOOKS_DIR, { recursive: true })

    // 复制 hook 脚本
    const srcHook = path.join(resourcesPath, 'agent-board-hook.sh')
    const srcReport = path.join(resourcesPath, 'agent-board-report.sh')

    console.log('[HookInstaller] Source Hook Path:', srcHook)
    if (!fs.existsSync(srcHook)) {
      console.error('[HookInstaller] Source hook file not found at:', srcHook)
      return { success: false, message: `安装失败: 找不到源文件 ${srcHook}` }
    }

    if (fs.existsSync(srcHook)) {
      fs.copyFileSync(srcHook, HOOK_SCRIPT)
      fs.chmodSync(HOOK_SCRIPT, 0o755)
    }
    if (fs.existsSync(srcReport)) {
      fs.copyFileSync(srcReport, REPORT_SCRIPT)
      fs.chmodSync(REPORT_SCRIPT, 0o755)
    }

    // 复制 skill 文件
    const srcSkill = path.join(resourcesPath, 'agent-board-report.md')
    const destSkill = path.join(HOOKS_DIR, 'agent-board-report.md')
    if (fs.existsSync(srcSkill)) {
      fs.copyFileSync(srcSkill, destSkill)
    }
    
    return { success: true, message: '资源文件已安装' }
  } catch (err) {
    return { success: false, message: `资源文件安装失败: ${err}` }
  }
}

// 安装 hook 到 Claude Code settings.json
export function installHooks(resourcesPath: string): { installed: boolean; message: string } {
  try {
    // 1. 先安装资源文件
    const resourceResult = installSupportFiles(resourcesPath)
    if (!resourceResult.success) {
      return { installed: false, message: resourceResult.message }
    }

    // 2. 读取现有 settings.json
    let settings: ClaudeSettings = {}
    if (fs.existsSync(SETTINGS_PATH)) {
      const content = fs.readFileSync(SETTINGS_PATH, 'utf-8')
      settings = JSON.parse(content)
    }

    if (!settings.hooks) {
      settings.hooks = {}
    }

    let modified = false

    // 为每个事件注册 hook（不破坏已有 hook）
    for (const event of HOOK_EVENTS) {
      if (!settings.hooks[event]) {
        settings.hooks[event] = []
      }

      const matchers = settings.hooks[event]

      // 检查是否已存在 agent-board hook
      const alreadyInstalled = matchers.some((m) =>
        m.hooks?.some((h) => h.command?.includes('agent-board-hook.sh'))
      )

      if (!alreadyInstalled) {
        matchers.push({
          matcher: '',
          hooks: [
            {
              type: 'command',
              command: HOOK_SCRIPT,
              timeout: 5
            }
          ]
        })
        modified = true
      }
    }

    if (modified) {
      // 原子写入：先写临时文件再重命名
      const tmpPath = SETTINGS_PATH + '.agent-board.tmp'
      fs.writeFileSync(tmpPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8')
      fs.renameSync(tmpPath, SETTINGS_PATH)
      return { installed: true, message: 'Hook 已安装' }
    }

    return { installed: true, message: 'Hook 已存在，无需重复安装' }
  } catch (err) {
    return { installed: false, message: `安装失败: ${err}` }
  }
}

// 卸载 hook
export function uninstallHooks(): { success: boolean; message: string } {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) {
      return { success: true, message: '无需卸载' }
    }

    const content = fs.readFileSync(SETTINGS_PATH, 'utf-8')
    const settings: ClaudeSettings = JSON.parse(content)

    if (!settings.hooks) {
      return { success: true, message: '无需卸载' }
    }

    let modified = false

    for (const event of HOOK_EVENTS) {
      if (settings.hooks[event]) {
        const before = settings.hooks[event].length
        settings.hooks[event] = settings.hooks[event].filter(
          (m) => !m.hooks?.some((h) => h.command?.includes('agent-board-hook.sh'))
        )
        if (settings.hooks[event].length !== before) {
          modified = true
        }
        // 清理空数组
        if (settings.hooks[event].length === 0) {
          delete settings.hooks[event]
        }
      }
    }

    if (modified) {
      const tmpPath = SETTINGS_PATH + '.agent-board.tmp'
      fs.writeFileSync(tmpPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8')
      fs.renameSync(tmpPath, SETTINGS_PATH)
    }

    return { success: true, message: 'Hook 已卸载' }
  } catch (err) {
    return { success: false, message: `卸载失败: ${err}` }
  }
}

// 检查 hook 是否已安装
export function isHookInstalled(): boolean {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) return false
    const content = fs.readFileSync(SETTINGS_PATH, 'utf-8')
    const settings: ClaudeSettings = JSON.parse(content)
    if (!settings.hooks?.SessionStart) return false
    return settings.hooks.SessionStart.some((m) =>
      m.hooks?.some((h) => h.command?.includes('agent-board-hook.sh'))
    )
  } catch {
    return false
  }
}
