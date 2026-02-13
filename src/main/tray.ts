import { Tray, Menu, nativeImage, BrowserWindow } from 'electron'
import path from 'path'
import type { Session } from '../shared/types'
import { getAllCustomCLIs } from './database'

let tray: Tray | null = null

// 存储当前会话列表和回调函数
let currentSessions: Session[] = []
let currentGetWindow: (() => BrowserWindow | null) | null = null
let currentOnQuit: (() => void) | null = null

/**
 * 获取状态显示文本
 */
function getStatusLabel(status: Session['status']): string {
  switch (status) {
    case 'working':
      return '[工作中]'
    case 'needs_approval':
      return '[需审批]'
    case 'done':
      return '[已完成]'
    case 'idle':
      return '[空闲]'
    default:
      return ''
  }
}

/**
 * 获取自定义 CLI 名称映射
 */
function getCustomCLINameMap(): Map<string, string> {
  const map = new Map<string, string>()
  try {
    const customCLIs = getAllCustomCLIs()
    for (const cli of customCLIs) {
      map.set(cli.id, cli.name)
    }
  } catch (e) {
    console.error('加载自定义CLI名称失败:', e)
  }
  return map
}

/**
 * 构建托盘菜单（会话列表 + 底部按钮）
 */
function buildTrayMenu(
  sessions: Session[],
  getWindow: () => BrowserWindow | null,
  onQuit: () => void
): Menu {
  const activeSessions = sessions.filter((s) => !s.isClosed && (s.status === 'working' || s.status === 'needs_approval'))
  const menuItems: Electron.MenuItemConstructorOptions[] = []

  // 预加载自定义 CLI 名称映射
  const customCLINames = getCustomCLINameMap()

  // 活跃会话列表（最多 10 个）
  const displaySessions = activeSessions.slice(0, 10)
  if (displaySessions.length > 0) {
    for (const session of displaySessions) {
      const statusLabel = getStatusLabel(session.status)
      // 确定显示名称：如果有 customCliId，查找自定义 CLI 名称；否则使用 cliType
      let cliName: string
      if (session.customCliId) {
        // 使用自定义 CLI 的名称
        const customName = customCLINames.get(session.customCliId)
        cliName = customName || session.customCliId
      } else if (session.cliType === 'other') {
        // 兼容旧数据：尝试从 cliType 或其他方式识别
        cliName = 'Other'
      } else {
        // 内置 CLI 类型，首字母大写
        cliName = session.cliType.charAt(0).toUpperCase() + session.cliType.slice(1)
      }
      const label = `${statusLabel} ${cliName}`
      // 截断 session ID 显示：前8位...后4位
      const shortSessionId = `${session.id.slice(0, 8)}...${session.id.slice(-4)}`
      menuItems.push({
        label,
        sublabel: `[${shortSessionId}] ${session.taskDescription?.slice(0, 40) || session.projectName || ''}`,
        enabled: false
      })
    }
  } else {
    menuItems.push({
      label: '暂无活跃会话',
      enabled: false
    })
  }

  // 分隔线
  menuItems.push({ type: 'separator' })

  // 底部按钮：打开主面板
  menuItems.push({
    label: '打开主面板',
    click: () => {
      const win = getWindow()
      if (win) {
        win.show()
        win.focus()
      }
    }
  })

  // 底部按钮：退出
  menuItems.push({
    label: '退出',
    click: onQuit
  })

  return Menu.buildFromTemplate(menuItems)
}

// 创建系统托盘
export function createTray(
  resourcesPath: string,
  getWindow: () => BrowserWindow | null,
  onQuit: () => void
): Tray {
  // 保存回调函数供后续使用
  currentGetWindow = getWindow
  currentOnQuit = onQuit

  const iconPath = path.join(resourcesPath, 'tray-iconTemplate.png')
  let icon: nativeImage

  try {
    icon = nativeImage.createFromPath(iconPath)
  } catch {
    // 图标不存在时使用空图标
    icon = nativeImage.createEmpty()
  }

  tray = new Tray(icon)
  tray.setToolTip('AgentBoard')

  // 点击托盘图标：显示菜单（不分左右键）
  tray.on('click', () => {
    if (!currentGetWindow || !currentOnQuit) return
    const menu = buildTrayMenu(currentSessions, currentGetWindow, currentOnQuit)
    tray?.popUpContextMenu(menu)
  })

  // 初始菜单
  updateTrayMenu([], getWindow, onQuit)

  return tray
}

// 销毁托盘
export function destroyTray(): void {
  if (tray) {
    tray.destroy()
    tray = null
  }
}

// 更新 tray 菜单和标题
export function updateTrayMenu(
  sessions: Session[],
  getWindow: () => BrowserWindow | null,
  onQuit: () => void
): void {
  if (!tray) return

  // 保存当前会话列表，供点击事件使用
  currentSessions = sessions

  const activeSessions = sessions.filter((s) => !s.isClosed && (s.status === 'working' || s.status === 'needs_approval'))
  const needsApproval = sessions.filter((s) => s.status === 'needs_approval')

  // 显示活跃数
  tray.setTitle(activeSessions.length > 0 ? ` ${activeSessions.length}` : '')

  // Tooltip
  if (needsApproval.length > 0) {
    tray.setToolTip(`AgentBoard - ${needsApproval.length} 个会话需要审批`)
  } else if (activeSessions.length > 0) {
    tray.setToolTip(`AgentBoard - ${activeSessions.length} 个活跃会话`)
  } else {
    tray.setToolTip('AgentBoard')
  }

  // 设置默认的上下文菜单（点击时会重新构建）
  const menu = buildTrayMenu(sessions, getWindow, onQuit)
  tray.setContextMenu(menu)
}
