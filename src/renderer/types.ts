import type { Session, CLIConfig, MCPServerConfig, SkillDetail } from '../shared/types'

// Renderer 中使用的类型重导出
export type { Session, CLIConfig, MCPServerConfig, SkillDetail }
export type { SessionStatus, CLIType } from '../shared/types'

// Window 上暴露的 API 类型
export interface AgentBoardAPI {
  getSessions: () => Promise<Session[]>
  getSessionDetails: (sessionId: string) => Promise<Record<string, unknown>[]>
  onSessionsUpdate: (callback: (sessions: Session[]) => void) => () => void
  getCLIConfigs: () => Promise<CLIConfig[]>
  openConfigFile: (filePath: string) => Promise<void>
  setConfigPath: (cliType: string, pathType: 'config' | 'skills', newPath: string) => Promise<void>
  
  // 接入管理
  integrateCLI: (cliType: string) => Promise<{ success: boolean; message: string }>
  unintegrateCLI: (cliType: string) => Promise<{ success: boolean; message: string }>
  
  // 工具管理
  saveMCPServer: (cliType: string, mcp: MCPServerConfig) => Promise<void>
  deleteMCPServer: (cliType: string, name: string) => Promise<void>
  saveSkill: (cliType: string, skill: SkillDetail) => Promise<void>
  deleteSkill: (cliType: string, name: string) => Promise<void>
  
  getHookStatus: () => Promise<boolean>
  installHooks: () => Promise<{ installed: boolean; message: string }>
  uninstallHooks: () => Promise<{ success: boolean; message: string }>
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
