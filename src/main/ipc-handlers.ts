import { ipcMain } from 'electron'
import { IPC_CHANNELS, CLIType, MCPServerConfig, SkillDetail } from '../shared/types'
import { getSessions, getSessionDetails } from './session-manager'
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

  // 获取 CLI 配置
  ipcMain.handle(IPC_CHANNELS.GET_CLI_CONFIGS, () => {
    return getCLIConfigs()
  })

  // 打开配置文件
  ipcMain.handle(IPC_CHANNELS.OPEN_CONFIG_FILE, (_event, filePath: string) => {
    openConfigFile(filePath)
  })

  // 设置配置路径
  ipcMain.handle(IPC_CHANNELS.SET_CONFIG_PATH, (_event, cliType: CLIType, pathType: 'config' | 'skills', newPath: string) => {
    setCLIConfigPath(cliType, pathType, newPath)
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
  ipcMain.handle(IPC_CHANNELS.SAVE_MCP_SERVER, (_event, cliType: CLIType, mcp: MCPServerConfig) => {
    saveMCPServer(cliType, mcp)
  })
  
  ipcMain.handle(IPC_CHANNELS.DELETE_MCP_SERVER, (_event, cliType: CLIType, name: string) => {
    deleteMCPServer(cliType, name)
  })

  // Skill
  ipcMain.handle(IPC_CHANNELS.SAVE_SKILL, (_event, cliType: CLIType, skill: SkillDetail) => {
    saveSkill(cliType, skill)
  })

  ipcMain.handle(IPC_CHANNELS.DELETE_SKILL, (_event, cliType: CLIType, name: string) => {
    deleteSkill(cliType, name)
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
}
