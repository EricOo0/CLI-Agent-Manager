// 会话状态
export type SessionStatus = 'idle' | 'working' | 'done' | 'needs_approval'

// 支持的 CLI 类型
export type CLIType = 'claude-code' | 'aider' | 'gemini' | 'cursor' | 'other'

// 自定义 CLI 配置
export interface CustomCLI {
  id: string              // 唯一标识（如 windsurf, codeium 等）
  name: string            // 显示名称（如 "Windsurf", "Codeium"）
  icon?: string           // 可选的 emoji 图标
  color?: string          // 可选的品牌色（如 #ff0000）
  createdAt: number       // 创建时间
  configPath?: string     // MCP 配置文件路径
  skillsPath?: string     // Skills 目录路径
}

// 会话数据结构
export interface Session {
  id: string               // session UUID
  cliType: CLIType          // 哪个 CLI（内置类型）
  customCLIId?: string      // 自定义 CLI ID（当 cliType 为 'other' 时使用）
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
  custom_cli_id?: string    // 自定义 CLI ID（当 cli_type 为 'other' 时使用）
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

// 通知设置
export interface NotificationSettings {
  enabled: boolean
  soundEnabled: boolean
  notifyOnApproval: boolean
  notifyOnComplete: boolean
}

// 消息角色类型
export type MessageRole = 'user' | 'assistant'

// Token 使用统计
export interface TokenUsage {
  input_tokens: number
  output_tokens: number
}

// 聊天消息
export interface ChatMessage {
  role: MessageRole
  content: string
  model?: string
  usage?: TokenUsage
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

  // 自定义 CLI 相关
  customCLI?: CustomCLI
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
  UNINSTALL_HOOKS: 'hooks:uninstall',

  // Session 管理
  CLOSE_SESSION: 'session:close',
  DELETE_SESSION: 'session:delete',
  GET_SESSION_MESSAGES: 'session:messages',

  // 自定义 CLI 管理
  GET_CUSTOM_CLIS: 'custom-clis:get',
  SAVE_CUSTOM_CLI: 'custom-cli:save',
  DELETE_CUSTOM_CLI: 'custom-cli:delete',

  // 通知设置
  GET_NOTIFICATION_SETTINGS: 'notification:settings:get',
  SAVE_NOTIFICATION_SETTINGS: 'notification:settings:save'
} as const
