import { Notification, app } from 'electron'
import path from 'path'
import type { NotificationSettings } from '../shared/types'

// 默认设置
const defaultSettings: NotificationSettings = {
  enabled: true,
  soundEnabled: true,
  notifyOnApproval: true,
  notifyOnComplete: true
}

// 当前设置（内存缓存）
let currentSettings: NotificationSettings = { ...defaultSettings }

// 音效文件路径（使用系统音效）
function getSoundPath(type: 'approval' | 'complete'): string | null {
  if (process.platform === 'darwin') {
    // macOS 系统音效
    const sounds = {
      approval: '/System/Library/Sounds/Glass.aiff',
      complete: '/System/Library/Sounds/Ping.aiff'
    }
    return sounds[type]
  }
  return null
}

// 播放音效
export function playSound(type: 'approval' | 'complete'): void {
  if (!currentSettings.soundEnabled) return

  if (process.platform === 'darwin') {
    const soundPath = getSoundPath(type)
    if (soundPath) {
      import('child_process').then(({ exec }) => {
        exec(`afplay "${soundPath}"`, (err) => {
          if (err) {
            console.error('[Notification] 播放音效失败:', err)
          }
        })
      })
    }
  }
}

// 显示系统通知
export function showSystemNotification(title: string, body: string): void {
  if (!currentSettings.enabled) return

  if (Notification.isSupported()) {
    const notification = new Notification({
      title,
      body,
      silent: !currentSettings.soundEnabled
    })

    notification.on('click', () => {
      const { BrowserWindow } = require('electron')
      const mainWindow = BrowserWindow.getAllWindows()[0]
      if (mainWindow) {
        mainWindow.show()
        mainWindow.focus()
      }
    })

    notification.show()
  }
}

// 发送通知（完整流程）
export function sendNotification(
  type: 'approval' | 'complete',
  sessionInfo?: { id: string; taskDescription?: string }
): void {
  if (type === 'approval' && !currentSettings.notifyOnApproval) return
  if (type === 'complete' && !currentSettings.notifyOnComplete) return

  const titles = {
    approval: 'AgentBoard - 需要审批',
    complete: 'AgentBoard - 任务完成'
  }

  const bodies = {
    approval: sessionInfo?.taskDescription
      ? `任务 "${sessionInfo.taskDescription.substring(0, 50)}..." 需要您的审批`
      : '有 Session 需要人工审批',
    complete: sessionInfo?.taskDescription
      ? `任务 "${sessionInfo.taskDescription.substring(0, 50)}..." 已完成`
      : '任务已完成'
  }

  showSystemNotification(titles[type], bodies[type])
  playSound(type)
}

// 加载设置
export function loadNotificationSettings(): NotificationSettings {
  const fs = require('fs')
  const path = require('path')

  const settingsPath = path.join(app.getPath('userData'), 'notification-settings.json')

  try {
    if (fs.existsSync(settingsPath)) {
      const data = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
      currentSettings = { ...defaultSettings, ...data }
      return currentSettings
    }
  } catch (error) {
    console.error('[Notification] 加载设置失败:', error)
  }

  currentSettings = { ...defaultSettings }
  return currentSettings
}

// 保存设置
export function saveNotificationSettings(settings: NotificationSettings): void {
  const fs = require('fs')
  const path = require('path')

  const settingsPath = path.join(app.getPath('userData'), 'notification-settings.json')

  try {
    currentSettings = { ...settings }
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
  } catch (error) {
    console.error('[Notification] 保存设置失败:', error)
  }
}

// 获取当前设置（内存缓存）
export function getCurrentSettings(): NotificationSettings {
  return { ...currentSettings }
}
