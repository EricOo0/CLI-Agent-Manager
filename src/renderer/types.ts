import type { Session, CLIConfig, MCPServerConfig, SkillDetail, ChatMessage } from '../shared/types'

// Renderer 中使用的类型重导出
export type { Session, CLIConfig, MCPServerConfig, SkillDetail, ChatMessage }
export type { SessionStatus, CLIType, CustomCLI } from '../shared/types'

// Window 上暴露的 API 类型
export interface AgentBoardAPI {
  getSessions: () => Promise<Session[]>
  getSessionDetails: (sessionId: string) => Promise<Record<string, unknown>[]>
  onSessionsUpdate: (callback: (sessions: Session[]) => void) => () => void
  getCLIConfigs: () => Promise<CLIConfig[]>
  openConfigFile: (filePath: string) => Promise<void>
  setConfigPath: (cliType: string, pathType: 'config' | 'skills', newPath: string, customCLIId?: string) => Promise<void>

  // 接入管理
  integrateCLI: (cliType: string) => Promise<{ success: boolean; message: string }>
  unintegrateCLI: (cliType: string) => Promise<{ success: boolean; message: string }>

  // 工具管理
  saveMCPServer: (cliType: string, mcp: MCPServerConfig, customCLIId?: string) => Promise<void>
  deleteMCPServer: (cliType: string, name: string, customCLIId?: string) => Promise<void>
  saveSkill: (cliType: string, skill: SkillDetail, customCLIId?: string) => Promise<void>
  deleteSkill: (cliType: string, name: string, customCLIId?: string) => Promise<void>
  
  getHookStatus: () => Promise<boolean>
  installHooks: () => Promise<{ installed: boolean; message: string }>
  uninstallHooks: () => Promise<{ success: boolean; message: string }>

  // Session 管理
  closeSession: (sessionId: string) => Promise<{ success: boolean; error?: string }>
  deleteSession: (sessionId: string) => Promise<{ success: boolean; error?: string }>
  getSessionMessages: (sessionId: string, projectPath: string) => Promise<ChatMessage[]>

  // 自定义 CLI 管理
  getCustomCLIs: () => Promise<import('../shared/types').CustomCLI[]>
  saveCustomCLI: (cli: import('../shared/types').CustomCLI) => Promise<{ success: boolean; error?: string }>
  deleteCustomCLI: (id: string) => Promise<{ success: boolean; error?: string }>

  // 通知设置
  getNotificationSettings: () => Promise<import('../shared/types').NotificationSettings>
  saveNotificationSettings: (settings: import('../shared/types').NotificationSettings) => Promise<{ success: boolean; error?: string }>
}

declare global {
  interface Window {
    agentBoard: AgentBoardAPI
  }
}

// 页面路由
export type Page = 'dashboard' | 'config'

// 过滤器
export type SessionFilter = 'all' | 'active' | 'completed'
