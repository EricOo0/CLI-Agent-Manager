import { app, shell } from 'electron'
import os from 'os'
import path from 'path'
import fs from 'fs'
import { MCPServerConfig, CLIType, CLIConfig, SkillDetail } from '../shared/types'
import { installHooks, uninstallHooks, installSupportFiles, isHookInstalled } from './hook-installer'
const HOME = os.homedir()
const USER_CONFIG_PATH = path.join(app.getPath('userData'), 'user-config-paths.json')

// 用户自定义路径配置
interface UserConfigPaths {
  [cliType: string]: {
    config?: string // 主配置文件路径
    skills?: string // skills 目录路径
  }
}

// 读取用户自定义路径
function loadUserConfigPaths(): UserConfigPaths {
  try {
    if (fs.existsSync(USER_CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(USER_CONFIG_PATH, 'utf-8'))
    }
  } catch {
    // ignore
  }
  return {}
}

// 保存用户自定义路径
function saveUserConfigPaths(paths: UserConfigPaths) {
  try {
    fs.writeFileSync(USER_CONFIG_PATH, JSON.stringify(paths, null, 2))
  } catch {
    // ignore
  }
}

// 设置 CLI 配置路径
export function setCLIConfigPath(cliType: CLIType, pathType: 'config' | 'skills', newPath: string): void {
  const paths = loadUserConfigPaths()
  if (!paths[cliType]) paths[cliType] = {}
  
  if (pathType === 'config') {
    paths[cliType].config = newPath
  } else {
    paths[cliType].skills = newPath
  }
  
  saveUserConfigPaths(paths)
}

// 各 CLI 配置路径定义
interface CLIDefinition {
  cliType: CLIType
  name: string
  // configPaths 可能会动态变化，这里仅作为默认/检测参考
  defaultConfigPaths: string[] 
  detectPaths: string[] // 用于检测是否安装
  supportedIntegration: boolean // 是否支持自动接入
}

// Config Adapter 接口
interface ConfigAdapter {
  readMCPs(): MCPServerConfig[]
  saveMCP(mcp: MCPServerConfig): void
  deleteMCP(name: string): void
  
  readSkills(): SkillDetail[]
  saveSkill(skill: SkillDetail): void
  deleteSkill(name: string): void
}

const CLI_DEFINITIONS: CLIDefinition[] = [
  {
    cliType: 'claude-code',
    name: 'Claude Code',
    defaultConfigPaths: [
      path.join(HOME, '.claude.json'),
      path.join(HOME, '.claude', 'skills')
    ],
    detectPaths: [
      path.join(HOME, '.claude.json'),
      path.join(HOME, '.claude', 'settings.json')
    ],
    supportedIntegration: true
  },
  {
    cliType: 'aider',
    name: 'Aider',
    defaultConfigPaths: [
      path.join(HOME, '.aider.conf.yml'),
      path.join(HOME, '.aider.model.settings.yml')
    ],
    detectPaths: [
      path.join(HOME, '.aider.conf.yml')
    ],
    supportedIntegration: false
  },
  {
    cliType: 'cursor',
    name: 'Cursor',
    defaultConfigPaths: [
      path.join(HOME, '.cursor', 'mcp.json')
    ],
    detectPaths: [
      path.join(HOME, '.cursor')
    ],
    supportedIntegration: false
  },
  {
    cliType: 'gemini',
    name: 'Gemini CLI',
    defaultConfigPaths: [
      path.join(HOME, '.gemini', 'settings.json')
    ],
    detectPaths: [
      path.join(HOME, '.gemini')
    ],
    supportedIntegration: false
  }
]

// Claude Code Adapter
class ClaudeCodeAdapter implements ConfigAdapter {
  private configPath: string
  private skillsDir: string

  constructor(customPaths?: { config?: string, skills?: string }) {
    this.configPath = customPaths?.config || path.join(HOME, '.claude.json')
    this.skillsDir = customPaths?.skills || path.join(HOME, '.claude', 'skills')
  }

  private readConfig(): any {
    if (!fs.existsSync(this.configPath)) return {}
    try {
      return JSON.parse(fs.readFileSync(this.configPath, 'utf-8'))
    } catch {
      return {}
    }
  }

  // Claude Code configuration is now primarily in ~/.claude.json which contains project-specific configs.
  // We will read from all projects to display what's configured.
  // We will NOT support saving to global config easily because it seems to be project-based.
  // However, we can try to save to the "most relevant" project or just fail for now?
  // Let's implement a "best effort" approach: Read from all projects.
  
  readMCPs(): MCPServerConfig[] {
    const config = this.readConfig()
    const servers: MCPServerConfig[] = []
    
    // Support legacy settings.json format if user manually points to it
    if (config.mcpServers && !config.projects) {
      for (const [name, cfg] of Object.entries(config.mcpServers as Record<string, any>)) {
        servers.push({
          name,
          command: cfg.command || (cfg.type === 'http' ? '(HTTP)' : ''),
          args: cfg.args || (cfg.type === 'http' ? [cfg.url] : []),
          env: cfg.env || {}
        })
      }
      return servers
    }

    // Support ~/.claude.json format with "projects" key
    if (config.projects) {
      for (const [projectPath, projectConfig] of Object.entries(config.projects as Record<string, any>)) {
        if (projectConfig.mcpServers) {
          for (const [name, cfg] of Object.entries(projectConfig.mcpServers as Record<string, any>)) {
            // Create a unique name for display: "ProjectName::ServerName"
            // Or just use the server name if it's unique? No, duplicates exist.
            // Let's use "[Project] Name"
            const projectName = path.basename(projectPath)
            const displayName = `[${projectName}] ${name}`
            
            servers.push({
              name: displayName,
              command: cfg.command || (cfg.type === 'http' ? '(HTTP)' : ''),
              args: cfg.args || (cfg.type === 'http' ? [cfg.url] : []),
              env: cfg.env || {}
            })
          }
        }
      }
    }
    
    return servers
  }

  saveMCP(mcp: MCPServerConfig): void {
    // Current UI doesn't allow selecting project. 
    // We can only support saving if we know which project.
    // Since we composite the name as "[Project] Name", we can try to parse it back.
    const config = this.readConfig()
    let targetProjectPath: string | null = null
    let realName = mcp.name

    const match = mcp.name.match(/^\[(.+)\]\s+(.+)$/)
    if (match && config.projects) {
      const projectName = match[1]
      realName = match[2]
      // Find project path by basename
      targetProjectPath = Object.keys(config.projects).find(p => path.basename(p) === projectName) || null
    }

    if (targetProjectPath && config.projects && config.projects[targetProjectPath]) {
      if (!config.projects[targetProjectPath].mcpServers) {
        config.projects[targetProjectPath].mcpServers = {}
      }
      
      const serverConfig: any = {
        env: mcp.env
      }

      if (mcp.command === '(HTTP)') {
        serverConfig.type = 'http'
        serverConfig.url = mcp.args[0]
      } else {
        serverConfig.type = 'stdio'
        serverConfig.command = mcp.command
        serverConfig.args = mcp.args
      }

      config.projects[targetProjectPath].mcpServers[realName] = serverConfig
      
      // Save back to ~/.claude.json
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2))
    } else {
      // Legacy or new global?
      // If user is editing legacy settings.json
      if (config.mcpServers || !config.projects) {
         if (!config.mcpServers) config.mcpServers = {}
         config.mcpServers[mcp.name] = {
           command: mcp.command,
           args: mcp.args,
           env: mcp.env
         }
         fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2))
      }
    }
  }

  deleteMCP(name: string): void {
    const config = this.readConfig()
    
    // Parse "[Project] Name"
    const match = name.match(/^\[(.+)\]\s+(.+)$/)
    if (match && config.projects) {
      const projectName = match[1]
      const realName = match[2]
      const targetProjectPath = Object.keys(config.projects).find(p => path.basename(p) === projectName)
      
      if (targetProjectPath && config.projects[targetProjectPath]?.mcpServers) {
        delete config.projects[targetProjectPath].mcpServers[realName]
        fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2))
        return
      }
    }

    // Legacy fallback
    if (config.mcpServers && config.mcpServers[name]) {
      delete config.mcpServers[name]
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2))
    }
  }


  private getAllSkillFiles(dir: string): string[] {
    let results: string[] = []
    try {
      if (!fs.existsSync(dir)) return []
      const list = fs.readdirSync(dir)
      for (const file of list) {
        if (file.startsWith('.') && file !== '.claude') continue // Skip hidden files except potentially useful ones? Actually standard practice is to skip hidden.
        const filePath = path.join(dir, file)
        const stat = fs.statSync(filePath)
        if (stat && stat.isDirectory()) {
          results = results.concat(this.getAllSkillFiles(filePath))
        } else if (file.endsWith('.md')) {
          results.push(filePath)
        }
      }
    } catch {
      // ignore
    }
    return results
  }

  readSkills(): SkillDetail[] {
    if (!fs.existsSync(this.skillsDir)) return []
    
    const skills: SkillDetail[] = []
    const files = this.getAllSkillFiles(this.skillsDir)
    
    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        // 简单的 frontmatter 解析
        const nameMatch = content.match(/^name:\s*(.+)$/m)
        const descMatch = content.match(/^description:\s*(.+)$/m)
        
        let name = nameMatch ? nameMatch[1].trim() : ''
        if (!name) {
          const fileName = path.basename(filePath)
          if (fileName.toLowerCase() === 'readme.md') {
            // 如果是 README.md，使用父目录名作为 skill 名称
            name = path.basename(path.dirname(filePath))
          } else {
            name = fileName.replace(/\.md$/i, '')
          }
        }
        
        skills.push({
          name,
          description: descMatch ? descMatch[1].trim() : '',
          content,
          filePath
        })
      } catch {
        // ignore
      }
    }
    return skills
  }

  saveSkill(skill: SkillDetail): void {
    fs.mkdirSync(this.skillsDir, { recursive: true })
    // 如果没有 filePath，自动生成
    const fileName = skill.name.replace(/[^a-zA-Z0-9_-]/g, '_') + '.md'
    const filePath = skill.filePath || path.join(this.skillsDir, fileName)
    
    fs.writeFileSync(filePath, skill.content)
  }

  deleteSkill(name: string): void {
    // 这里简单处理：通过遍历找到匹配 name 的文件删除，或者假设 name 就是文件名（无后缀）
    const skills = this.readSkills()
    const target = skills.find(s => s.name === name)
    if (target && fs.existsSync(target.filePath)) {
      fs.unlinkSync(target.filePath)
    }
  }
}

// Cursor Adapter
class CursorAdapter implements ConfigAdapter {
  private mcpPath: string

  constructor(customPaths?: { config?: string }) {
    this.mcpPath = customPaths?.config || path.join(HOME, '.cursor', 'mcp.json')
  }

  private readConfig(): any {
    if (!fs.existsSync(this.mcpPath)) return {}
    try {
      return JSON.parse(fs.readFileSync(this.mcpPath, 'utf-8'))
    } catch {
      return {}
    }
  }

  private saveConfig(config: any) {
    fs.mkdirSync(path.dirname(this.mcpPath), { recursive: true })
    fs.writeFileSync(this.mcpPath, JSON.stringify(config, null, 2))
  }

  readMCPs(): MCPServerConfig[] {
    const config = this.readConfig()
    const servers: MCPServerConfig[] = []
    
    if (config.mcpServers) {
      for (const [name, cfg] of Object.entries(config.mcpServers as Record<string, any>)) {
        servers.push({
          name,
          command: cfg.command,
          args: cfg.args || [],
          env: cfg.env || {}
        })
      }
    }
    return servers
  }

  saveMCP(mcp: MCPServerConfig): void {
    const config = this.readConfig()
    if (!config.mcpServers) config.mcpServers = {}
    
    config.mcpServers[mcp.name] = {
      command: mcp.command,
      args: mcp.args,
      env: mcp.env
    }
    
    this.saveConfig(config)
  }

  deleteMCP(name: string): void {
    const config = this.readConfig()
    if (config.mcpServers && config.mcpServers[name]) {
      delete config.mcpServers[name]
      this.saveConfig(config)
    }
  }

  // Cursor 暂不支持 Skill 管理（或机制不同）
  readSkills(): SkillDetail[] { return [] }
  saveSkill(): void {}
  deleteSkill(): void {}
}

// Adapter Factory
function getAdapter(cliType: CLIType): ConfigAdapter | null {
  const userPaths = loadUserConfigPaths()[cliType]
  switch (cliType) {
    case 'claude-code':
      return new ClaudeCodeAdapter(userPaths)
    case 'cursor':
      return new CursorAdapter(userPaths)
    default:
      return null
  }
}

// 检测 CLI 是否安装
function isInstalled(def: CLIDefinition): boolean {
  const userPaths = loadUserConfigPaths()[def.cliType]
  // 优先检测用户自定义路径
  if (userPaths?.config && fs.existsSync(userPaths.config)) return true
  // 其次检测默认路径
  return def.detectPaths.some((p) => fs.existsSync(p))
}

// 获取 CLI 接入状态
function getIntegrationStatus(def: CLIDefinition): 'integrated' | 'not-integrated' | 'unsupported' {
  if (!def.supportedIntegration) return 'unsupported'
  
  if (def.cliType === 'claude-code') {
    return isHookInstalled() ? 'integrated' : 'not-integrated'
  }
  
  return 'not-integrated'
}

// 获取所有 CLI 配置
export function getCLIConfigs(): CLIConfig[] {
  const userConfigPaths = loadUserConfigPaths()

  return CLI_DEFINITIONS.map((def) => {
    const installed = isInstalled(def)
    const userPaths = userConfigPaths[def.cliType] || {}
    
    // 确定当前的实际配置路径
    const currentConfigPaths = []
    if (userPaths.config) {
      currentConfigPaths.push(userPaths.config)
    } else {
      // 添加默认的主配置路径
      currentConfigPaths.push(def.defaultConfigPaths[0]) 
    }
    
    if (userPaths.skills) {
      currentConfigPaths.push(userPaths.skills)
    } else if (def.defaultConfigPaths[1]) {
      // 添加默认的 skills 路径（如果存在）
      currentConfigPaths.push(def.defaultConfigPaths[1])
    }

    let details: Pick<CLIConfig, 'skills' | 'mcpServers' | 'plugins' | 'mcpDetails' | 'skillDetails'> = {
      skills: [],
      mcpServers: [],
      plugins: [],
      mcpDetails: [],
      skillDetails: []
    }

    if (installed) {
      const adapter = getAdapter(def.cliType)
      if (adapter) {
        const mcps = adapter.readMCPs()
        const skills = adapter.readSkills()
        
        details.mcpDetails = mcps
        details.mcpServers = mcps.map(m => m.name)
        
        details.skillDetails = skills
        details.skills = skills.map(s => s.name)
      }
    }

    return {
      cliType: def.cliType,
      name: def.name,
      installed,
      integrationStatus: getIntegrationStatus(def),
      configPaths: currentConfigPaths, // 返回实际路径供前端展示
      ...details
    }
  })
}

// ... (saveMCPServer etc. remain same, they use getAdapter which now supports user paths)
// 工具管理 API
export function saveMCPServer(cliType: CLIType, mcp: MCPServerConfig): void {
  const adapter = getAdapter(cliType)
  if (adapter) adapter.saveMCP(mcp)
}

export function deleteMCPServer(cliType: CLIType, name: string): void {
  const adapter = getAdapter(cliType)
  if (adapter) adapter.deleteMCP(name)
}

export function saveSkill(cliType: CLIType, skill: SkillDetail): void {
  const adapter = getAdapter(cliType)
  if (adapter) adapter.saveSkill(skill)
}

export function deleteSkill(cliType: CLIType, name: string): void {
  const adapter = getAdapter(cliType)
  if (adapter) adapter.deleteSkill(name)
}

// 用默认编辑器打开配置文件
export function openConfigFile(filePath: string): void {
  shell.openPath(filePath)
}

// 接入 CLI
export function integrateCLI(cliType: CLIType, resourcesPath: string): { success: boolean; message: string } {
  // 对于所有 CLI，首先确保资源文件已安装
  const resourceResult = installSupportFiles(resourcesPath)
  if (!resourceResult.success) {
    return { success: false, message: resourceResult.message }
  }

  if (cliType === 'claude-code') {
    const result = installHooks(resourcesPath)
    return { success: result.installed, message: result.message }
  }

  // 对于不支持自动 hook 的 CLI，我们认为安装资源文件就是“接入”的第一步
  return { success: true, message: '资源文件已准备就绪，请按提示手动配置' }
}

// 卸载接入
export function unintegrateCLI(cliType: CLIType): { success: boolean; message: string } {
  if (cliType === 'claude-code') {
    return uninstallHooks()
  }
  return { success: false, message: '该 CLI 暂不支持自动卸载' }
}
