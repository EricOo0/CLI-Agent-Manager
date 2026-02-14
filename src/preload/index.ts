import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS, type CustomCLI, type NotificationSettings, type ChatMessage } from '../shared/types'

// 暴露给 renderer 的 API
const api = {
  // 获取会话列表
  getSessions: () => ipcRenderer.invoke(IPC_CHANNELS.GET_SESSIONS),

  // 获取会话详情
  getSessionDetails: (sessionId: string) => ipcRenderer.invoke(IPC_CHANNELS.GET_SESSION_DETAILS, sessionId),

  // 监听会话更新
  onSessionsUpdate: (callback: (sessions: unknown[]) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, sessions: unknown[]) => callback(sessions)
    ipcRenderer.on(IPC_CHANNELS.ON_SESSIONS_UPDATE, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.ON_SESSIONS_UPDATE, handler)
  },

  // 获取 CLI 配置
  getCLIConfigs: () => ipcRenderer.invoke(IPC_CHANNELS.GET_CLI_CONFIGS),

  // 打开配置文件
  openConfigFile: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.OPEN_CONFIG_FILE, filePath),
  setConfigPath: (cliType: string, pathType: 'config' | 'skills', newPath: string, customCLIId?: string) => ipcRenderer.invoke(IPC_CHANNELS.SET_CONFIG_PATH, cliType, pathType, newPath, customCLIId),

  // 接入管理
  integrateCLI: (cliType: string) => ipcRenderer.invoke(IPC_CHANNELS.INTEGRATE_CLI, cliType),
  unintegrateCLI: (cliType: string) => ipcRenderer.invoke(IPC_CHANNELS.UNINTEGRATE_CLI, cliType),

  // 工具管理
  saveMCPServer: (cliType: string, mcp: unknown, customCLIId?: string) => ipcRenderer.invoke(IPC_CHANNELS.SAVE_MCP_SERVER, cliType, mcp, customCLIId),
  deleteMCPServer: (cliType: string, name: string, customCLIId?: string) => ipcRenderer.invoke(IPC_CHANNELS.DELETE_MCP_SERVER, cliType, name, customCLIId),
  saveSkill: (cliType: string, skill: unknown, customCLIId?: string) => ipcRenderer.invoke(IPC_CHANNELS.SAVE_SKILL, cliType, skill, customCLIId),
  deleteSkill: (cliType: string, name: string, customCLIId?: string) => ipcRenderer.invoke(IPC_CHANNELS.DELETE_SKILL, cliType, name, customCLIId),

  // Hook 状态
  getHookStatus: () => ipcRenderer.invoke(IPC_CHANNELS.GET_HOOK_STATUS),
  installHooks: () => ipcRenderer.invoke(IPC_CHANNELS.INSTALL_HOOKS),
  uninstallHooks: () => ipcRenderer.invoke(IPC_CHANNELS.UNINSTALL_HOOKS),

  // Session 管理
  closeSession: (sessionId: string) => ipcRenderer.invoke(IPC_CHANNELS.CLOSE_SESSION, sessionId),
  deleteSession: (sessionId: string) => ipcRenderer.invoke(IPC_CHANNELS.DELETE_SESSION, sessionId),
  getSessionMessages: (sessionId: string, projectPath: string) => ipcRenderer.invoke(IPC_CHANNELS.GET_SESSION_MESSAGES, sessionId, projectPath) as Promise<ChatMessage[]>,
  getSessionMessagesFromDb: (sessionId: string) => ipcRenderer.invoke(IPC_CHANNELS.GET_SESSION_MESSAGES_FROM_DB, sessionId) as Promise<ChatMessage[]>,

  // 自定义 CLI 管理
  getCustomCLIs: () => ipcRenderer.invoke(IPC_CHANNELS.GET_CUSTOM_CLIS),
  saveCustomCLI: (cli: CustomCLI) => ipcRenderer.invoke(IPC_CHANNELS.SAVE_CUSTOM_CLI, cli),
  deleteCustomCLI: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.DELETE_CUSTOM_CLI, id),

  // 通知设置
  getNotificationSettings: () => ipcRenderer.invoke(IPC_CHANNELS.GET_NOTIFICATION_SETTINGS),
  saveNotificationSettings: (settings: NotificationSettings) => ipcRenderer.invoke(IPC_CHANNELS.SAVE_NOTIFICATION_SETTINGS, settings)
}

contextBridge.exposeInMainWorld('agentBoard', api)

// 类型声明
export type AgentBoardAPI = typeof api
