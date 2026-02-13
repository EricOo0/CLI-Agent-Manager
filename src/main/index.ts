import { app, BrowserWindow, shell } from 'electron'
import path from 'path'
import { initDatabase, closeDatabase } from './database'
import { startServer, stopServer } from './server'
import { handleEvent, setSessionUpdateCallback, startCleanupTimer, startHeartbeatTimer, stopHeartbeatTimer, getSessions } from './session-manager'
import { installHooks } from './hook-installer'
import { registerIpcHandlers } from './ipc-handlers'
import { createTray, updateTrayMenu, destroyTray } from './tray'
import { loadNotificationSettings } from './notification-manager'
import { loadNotificationSettings } from './notification-manager'
import { loadNotificationSettings } from './notification-manager'
import { loadNotificationSettings } from './notification-manager'

let mainWindow: BrowserWindow | null = null
let cleanupTimer: NodeJS.Timeout | null = null

// 获取 resources 路径
function getResourcesPath(): string {
  return path.join(__dirname, '../../resources')
}

// 创建主窗口
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    },
    show: false
  })

  // 窗口就绪后显示（避免白屏闪烁）
  mainWindow.on('ready-to-show', () => {
    console.log('[AgentBoard] 窗口准备就绪，显示窗口')
    mainWindow?.show()
  })

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('[AgentBoard] 页面加载失败:', errorCode, errorDescription)
  })

  mainWindow.webContents.on('crashed', () => {
    console.error('[AgentBoard] Renderer 进程崩溃')
  })

  // 关闭窗口 → 隐藏到托盘（不退出）
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  // 外部链接用浏览器打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // 加载页面
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

// 应用启动
app.whenReady().then(async () => {
  // 1. 单实例锁
  const gotLock = app.requestSingleInstanceLock()
  if (!gotLock) {
    app.quit()
    return
  }

  app.on('second-instance', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    }
  })

  // 2. 初始化数据库
  initDatabase()

  // 2.5 加载通知设置
  loadNotificationSettings()

  // 2.5 加载通知设置
  loadNotificationSettings()

  // 2.5 加载通知设置
  loadNotificationSettings()

  // 2.5 加载通知设置
  loadNotificationSettings()

  // 3. 准备资源路径 (不自动安装 hook)
  const resourcesPath = getResourcesPath()
  // const hookResult = installHooks(resourcesPath)
  // console.log('Hook 安装结果:', hookResult.message)

  // 4. 注册 IPC 处理器
  registerIpcHandlers(resourcesPath)

  // 5. 设置会话更新回调
  const getWindow = () => mainWindow
  const quit = () => {
    (app as typeof app & { isQuitting: boolean }).isQuitting = true
    app.quit()
  }

  setSessionUpdateCallback((sessions) => {
    // 推送到 renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('sessions:update', sessions)
    }
    // 更新 tray
    updateTrayMenu(sessions, getWindow, quit)
  })

  // 6. 启动 HTTP 服务
  try {
    await startServer(handleEvent)
  } catch (err) {
    console.error('HTTP 服务启动失败:', err)
  }

  // 7. 创建窗口
  createWindow()

  // 8. 创建托盘
  createTray(resourcesPath, getWindow, quit)
  updateTrayMenu(getSessions(), getWindow, quit)

  // 9. 启动清理定时器和心跳检测
  cleanupTimer = startCleanupTimer()
  startHeartbeatTimer()

  // macOS: 点击 dock 图标显示窗口
  app.on('activate', () => {
    if (mainWindow) {
      mainWindow.show()
    }
  })
})

// 退出前清理
app.on('before-quit', async () => {
  if (cleanupTimer) clearInterval(cleanupTimer)
  stopHeartbeatTimer()
  await stopServer()
  closeDatabase()
  destroyTray()
})

// 扩展 app 类型
declare module 'electron' {
  interface App {
    isQuitting: boolean
  }
}
