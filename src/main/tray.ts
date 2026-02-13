import { Tray, Menu, nativeImage, BrowserWindow } from 'electron'
import path from 'path'
import type { Session } from '../shared/types'

let tray: Tray | null = null

// 存储当前会话列表和回调函数
let currentSessions: Session[] = []
let currentGetWindow: (() => BrowserWindow | null) | null = null
let currentOnQuit: (() => void) | null = null

/**
 * 构建会话列表菜单（左键菜单）
 */
function buildSessionMenu(
  sessions: Session[],
  getWindow: () => BrowserWindow | null,
  onQuit: () => void
): Menu {
  const activeSessions = sessions.filter((s) => s.status === 'working' || s.status === 'needs_approval')
  const menuItems: Electron.MenuItemConstructorOptions[] = []

  // 活跃会话列表（最多 5 个）
  const displaySessions = activeSessions.slice(0, 5)
  if (displaySessions.length > 0) {
    menuItems.push({
      label: '活跃会话',
      enabled: false
    })

    for (const session of displaySessions) {
      const statusIcon = session.status === 'needs_approval' ? '🟠' : '🔵'
      const label = `${statusIcon} ${session.projectName || session.id.slice(0, 8)}`
      menuItems.push({
        label,
        sublabel: session.taskDescription?.slice(0, 50) || '',
        enabled: false
      })
    }
    menuItems.push({ type: 'separator' })
  } else {
    menuItems.push({
      label: '暂无活跃会话',
      enabled: false
    })
    menuItems.push({ type: 'separator' })
  }

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

  menuItems.push({ type: 'separator' })

  menuItems.push({
    label: '退出',
    click: onQuit
  })

  return Menu.buildFromTemplate(menuItems)
}

/**
 * 构建简化菜单（右键菜单）
 */
function buildSimpleMenu(
  getWindow: () => BrowserWindow | null,
  onQuit: () => void
): Menu {
  const menuItems: Electron.MenuItemConstructorOptions[] = []

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

  menuItems.push({ type: 'separator' })

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

  // 左键点击：显示会话列表菜单
  tray.on('click', () => {
    if (!currentGetWindow || !currentOnQuit) return
    const sessionMenu = buildSessionMenu(currentSessions, currentGetWindow, currentOnQuit)
    tray?.popUpContextMenu(sessionMenu)
  })

  // 右键点击：显示简化菜单
  tray.on('right-click', () => {
    if (!currentGetWindow || !currentOnQuit) return
    const simpleMenu = buildSimpleMenu(currentGetWindow, currentOnQuit)
    tray?.popUpContextMenu(simpleMenu)
  })

  // 初始菜单（使用简化菜单作为默认）
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

  const activeSessions = sessions.filter((s) => s.status === 'working' || s.status === 'needs_approval')
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

  // 设置默认的上下文菜单（使用简化菜单，右键点击时会覆盖）
  const simpleMenu = buildSimpleMenu(getWindow, onQuit)
  tray.setContextMenu(simpleMenu)
}
