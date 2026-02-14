import { ipcMain } from 'electron'
import { IPC_CHANNELS, CLIType, MCPServerConfig, SkillDetail } from '../shared/types'
import { getCustomCLIAdapter } from './config-manager'
import { getSessions, getSessionDetails, notifyUpdate } from './session-manager'
import {
  getCLIConfigs,
  openConfigFile,
  integrateCLI,
  unintegrateCLI,
  saveMCPServer,
  deleteMCPServer,
  saveSkill,
  deleteSkill,
  setCLIConfigPath
} from './config-manager'
import { isHookInstalled, installHooks, uninstallHooks } from './hook-installer'
import { closeSessionManually, deleteSessionPermanently, getAllCustomCLIs, saveCustomCLI, deleteCustomCLI, getMessagesBySession } from './database'
import type { CustomCLI, NotificationSettings } from '../shared/types'
import {
  loadNotificationSettings,
  saveNotificationSettings,
  getCurrentSettings
} from './notification-manager'
import { readSessionMessages } from './session-reader'

// 注册所有 IPC 处理器
export function registerIpcHandlers(resourcesPath: string): void {
  // 获取会话列表
  ipcMain.handle(IPC_CHANNELS.GET_SESSIONS, () => {
    return getSessions()
  })

  // 获取会话详情
  ipcMain.handle(IPC_CHANNELS.GET_SESSION_DETAILS, (_event, sessionId: string) => {
    return getSessionDetails(sessionId)
  })

  // 关闭 Session
  ipcMain.handle(IPC_CHANNELS.CLOSE_SESSION, async (_event, sessionId: string) => {
    try {
      closeSessionManually(sessionId)
      // 触发更新通知
      notifyUpdate()
      return { success: true }
    } catch (error) {
      console.error('关闭 Session 失败:', error)
      return { success: false, error: String(error) }
    }
  })

  // 永久删除 Session
  ipcMain.handle(IPC_CHANNELS.DELETE_SESSION, async (_event, sessionId: string) => {
    try {
      deleteSessionPermanently(sessionId)
      // 触发更新通知
      notifyUpdate()
      return { success: true }
    } catch (error) {
      console.error('删除 Session 失败:', error)
      return { success: false, error: String(error) }
    }
  })

  // 获取 CLI 配置
  ipcMain.handle(IPC_CHANNELS.GET_CLI_CONFIGS, () => {
    return getCLIConfigs()
  })

  // 打开配置文件
  ipcMain.handle(IPC_CHANNELS.OPEN_CONFIG_FILE, (_event, filePath: string) => {
    openConfigFile(filePath)
  })

  // 设置配置路径
  ipcMain.handle(IPC_CHANNELS.SET_CONFIG_PATH, (_event, cliType: CLIType, pathType: 'config' | 'skills', newPath: string, customCLIId?: string) => {
    setCLIConfigPath(cliType, pathType, newPath, customCLIId)
  })

  // 接入 CLI
  ipcMain.handle(IPC_CHANNELS.INTEGRATE_CLI, (_event, cliType: CLIType) => {
    return integrateCLI(cliType, resourcesPath)
  })

  // 卸载 CLI 接入
  ipcMain.handle(IPC_CHANNELS.UNINTEGRATE_CLI, (_event, cliType: CLIType) => {
    return unintegrateCLI(cliType)
  })

  // === 工具管理 API ===

  // MCP
  ipcMain.handle(IPC_CHANNELS.SAVE_MCP_SERVER, (_event, cliType: CLIType, mcp: MCPServerConfig, customCLIId?: string) => {
    if (cliType === 'other' && customCLIId) {
      // 自定义 CLI
      const cli = getAllCustomCLIs().find(c => c.id === customCLIId)
      if (cli) {
        const adapter = getCustomCLIAdapter(cli)
        if (adapter) adapter.saveMCP(mcp)
      }
    } else {
      saveMCPServer(cliType, mcp)
    }
  })

  ipcMain.handle(IPC_CHANNELS.DELETE_MCP_SERVER, (_event, cliType: CLIType, name: string, customCLIId?: string) => {
    if (cliType === 'other' && customCLIId) {
      // 自定义 CLI
      const cli = getAllCustomCLIs().find(c => c.id === customCLIId)
      if (cli) {
        const adapter = getCustomCLIAdapter(cli)
        if (adapter) adapter.deleteMCP(name)
      }
    } else {
      deleteMCPServer(cliType, name)
    }
  })

  // Skill
  ipcMain.handle(IPC_CHANNELS.SAVE_SKILL, (_event, cliType: CLIType, skill: SkillDetail, customCLIId?: string) => {
    if (cliType === 'other' && customCLIId) {
      // 自定义 CLI
      const cli = getAllCustomCLIs().find(c => c.id === customCLIId)
      if (cli) {
        const adapter = getCustomCLIAdapter(cli)
        if (adapter) adapter.saveSkill(skill)
      }
    } else {
      saveSkill(cliType, skill)
    }
  })

  ipcMain.handle(IPC_CHANNELS.DELETE_SKILL, (_event, cliType: CLIType, name: string, customCLIId?: string) => {
    if (cliType === 'other' && customCLIId) {
      // 自定义 CLI
      const cli = getAllCustomCLIs().find(c => c.id === customCLIId)
      if (cli) {
        const adapter = getCustomCLIAdapter(cli)
        if (adapter) adapter.deleteSkill(name)
      }
    } else {
      deleteSkill(cliType, name)
    }
  })

  // Hook 状态 (Deprecated, use GET_CLI_CONFIGS instead)
  ipcMain.handle(IPC_CHANNELS.GET_HOOK_STATUS, () => {
    return isHookInstalled()
  })

  // 安装 hooks (Deprecated, use INTEGRATE_CLI instead)
  ipcMain.handle(IPC_CHANNELS.INSTALL_HOOKS, () => {
    return installHooks(resourcesPath)
  })

  // 卸载 hooks (Deprecated, use UNINTEGRATE_CLI instead)
  ipcMain.handle(IPC_CHANNELS.UNINSTALL_HOOKS, () => {
    return uninstallHooks()
  })

  // === 自定义 CLI 管理 API ===

  // 获取所有自定义 CLI
  ipcMain.handle(IPC_CHANNELS.GET_CUSTOM_CLIS, () => {
    return getAllCustomCLIs()
  })

  // 保存自定义 CLI
  ipcMain.handle(IPC_CHANNELS.SAVE_CUSTOM_CLI, (_event, cli: CustomCLI) => {
    try {
      saveCustomCLI(cli)
      return { success: true }
    } catch (error) {
      console.error('保存自定义 CLI 失败:', error)
      return { success: false, error: String(error) }
    }
  })

  // 删除自定义 CLI
  ipcMain.handle(IPC_CHANNELS.DELETE_CUSTOM_CLI, (_event, id: string) => {
    try {
      deleteCustomCLI(id)
      return { success: true }
    } catch (error) {
      console.error('删除自定义 CLI 失败:', error)
      return { success: false, error: String(error) }
    }
  })

  // 获取通知设置
  ipcMain.handle(IPC_CHANNELS.GET_NOTIFICATION_SETTINGS, () => {
    return getCurrentSettings()
  })

  // 保存通知设置
  ipcMain.handle(IPC_CHANNELS.SAVE_NOTIFICATION_SETTINGS, (_event, settings: NotificationSettings) => {
    try {
      saveNotificationSettings(settings)
      return { success: true }
    } catch (error) {
      console.error('保存通知设置失败:', error)
      return { success: false, error: String(error) }
    }
  })

  // 获取会话聊天消息
  ipcMain.handle(IPC_CHANNELS.GET_SESSION_MESSAGES, (_event, sessionId: string, projectPath: string) => {
    return readSessionMessages(sessionId, projectPath)
  })

  // 从数据库获取会话聊天消息
  ipcMain.handle(IPC_CHANNELS.GET_SESSION_MESSAGES_FROM_DB, (_event, sessionId: string) => {
    return getMessagesBySession(sessionId)
  })
}
