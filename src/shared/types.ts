// 会话状态
export type SessionStatus = 'idle' | 'working' | 'done' | 'needs_approval'

// 支持的 CLI 类型
export type CLIType = 'claude-code' | 'aider' | 'gemini' | 'cursor' | 'other'

// 会话数据结构
export interface Session {
  id: string               // session UUID
  cliType: CLIType          // 哪个 CLI
  project: string           // 完整路径
  projectName: string       // basename
  status: SessionStatus
  taskDescription: string   // 首个有意义的 prompt
  startTime: number         // epoch ms
  taskStartTime: number | null
  isSubAgent: boolean
  lastEventTime: number
  isClosed?: boolean        // CLI 进程是否已关闭
}

// Hook 事件 payload（从 stdin JSON 接收）
export interface HookPayload {
  hook_event_name: string
  session_id: string
  cwd: string
  cli_type?: CLIType        // 由 hook/skill 注入
  notification_type?: string
  permission_mode?: string
  task_description?: string // skill 上报时可直接带
}

// MCP Server 配置
export interface MCPServerConfig {
  name: string
  command: string
  args: string[]
  env: Record<string, string>
}

// Skill 详情
export interface SkillDetail {
  name: string
  description: string
  content: string
  filePath: string
}

// CLI 配置信息
export interface CLIConfig {
  cliType: CLIType
  name: string
  installed: boolean
  integrationStatus: 'integrated' | 'not-integrated' | 'unsupported'
  configPaths: string[]
  skills: string[] // 简略列表 (兼容旧代码)
  mcpServers: string[] // 简略列表 (兼容旧代码)
  plugins: string[]
  
  // 详细配置 (新)
  mcpDetails?: MCPServerConfig[]
  skillDetails?: SkillDetail[]
}

// IPC 通道名
export const IPC_CHANNELS = {
  GET_SESSIONS: 'sessions:get',
  GET_SESSION_DETAILS: 'sessions:details',
  ON_SESSIONS_UPDATE: 'sessions:update',
  
  GET_CLI_CONFIGS: 'configs:get',
  OPEN_CONFIG_FILE: 'configs:open-file',
  SET_CONFIG_PATH: 'configs:set-path',
  INTEGRATE_CLI: 'integrations:install',
  UNINTEGRATE_CLI: 'integrations:uninstall',
  
  // 工具管理 (新)
  SAVE_MCP_SERVER: 'tools:mcp:save',
  DELETE_MCP_SERVER: 'tools:mcp:delete',
  SAVE_SKILL: 'tools:skill:save',
  DELETE_SKILL: 'tools:skill:delete',
  
  GET_HOOK_STATUS: 'hooks:status',
  INSTALL_HOOKS: 'hooks:install',
  UNINSTALL_HOOKS: 'hooks:uninstall'
} as const
