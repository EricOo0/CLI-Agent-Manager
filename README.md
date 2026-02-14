# AgentBoard

> 统一管理和监控 AI Agent CLI 的智能看板

AgentBoard 是一个 macOS Electron 桌面应用，旨在为开发者提供一个统一的界面来管理、监控和配置各类 AI Agent CLI 工具（如 Claude Code, Cursor, Aider 等）。

它不仅能实时查看会话状态和历史详情，还能可视化的管理 MCP Server 和 Skill 配置。

![AgentBoard Screenshot](resources/screenshot.png) <!-- 占位符 -->

## ✨ 核心功能

### 1. 📊 会话看板 (Session Dashboard)
- **实时状态监控**：一目了然地查看所有 Agent 的运行状态（`working`, `done`, `needs_approval`, `idle`），支持终端级会话管理。
- **时间线回溯**：点击会话卡片，通过模态窗口查看完整的对话历史、用户 Prompt 和 Agent 回复，支持从本地 JSONL 文件和数据库双重读取。
- **多维度筛选**：支持按状态（活跃/已完成）和 CLI 类型过滤会话。

### 2. 🔌 接入与配置管理 (Integration & Config)
- **可视化配置**：无需记忆复杂的配置文件路径，直接在界面上查看和修改配置。
- **自定义路径**：支持手动指定 CLI 的配置文件和 Skill 目录路径（解决非标准安装路径问题）。
- **一键接入**：
  - **Claude Code**：支持一键安装 Hook 脚本，自动拦截并上报会话事件。
  - **其他 CLI**：提供详细的手动接入指引（通过 Skill 或 Script）。

### 3. 🛠️ 工具箱管理 (Tools Management)
- **MCP Server 管理**：
  - 可视化增删改查 MCP Server 配置。
  - 支持 **Claude Code** 的多项目配置 (`~/.claude.json`)。
  - 支持 `stdio` 和 `http` 等多种传输协议。
- **Skill 管理**：
  - 扫描并管理本地 Markdown 格式的 Skill 文件。
  - 支持递归扫描子目录（如 `~/.claude/skills/my-skill/README.md`）。
  - 内置编辑器直接修改 Skill 内容。

## 🚀 支持的 CLI 工具

| CLI 工具 | 接入状态 | 功能支持 |
|----------|----------|----------|
| **Claude Code** | ✅ 完美支持 | 自动 Hook、会话监控、MCP 管理、Skill 管理 |
| **Cursor** | 🚧 部分支持 | MCP 管理 (`~/.cursor/mcp.json`) |
| **Aider** | 📝 计划中 | 需手动配置脚本上报 |
| **Gemini CLI** | 📝 计划中 | 需手动配置脚本上报 |

## 📦 安装与运行

### 推荐安装
下载最新发布的 `.dmg` 安装包，拖入应用程序文件夹即可。

### 开发模式运行

```bash
# 1. 克隆项目
git clone https://github.com/your-repo/agent-board.git
cd agent-board

# 2. 安装依赖
npm install

# 3. 启动开发环境
npm run dev

# 4. 构建生产包
npm run build     # 构建源码
npm run dist      # 打包 DMG (macOS)
```

## 📖 使用指南

### 1. 首次启动与接入
启动 AgentBoard 后，进入左侧的 **配置 (Config)** 页面。
- 选择 **Claude Code**。
- 如果显示 "未接入"，点击 **一键接入** 按钮。这会自动配置 `~/.claude/settings.json` 中的 Hook。
- 如果您的配置文件不在默认路径，点击 "Change Path" 手动指定。

### 2. 管理 MCP Server
- 在配置页面选择目标 CLI（如 Claude Code）。
- 切换到 **MCP Servers** 标签页。
- 点击 **Add Server** 添加新的 MCP 服务（支持 `stdio` 命令或 `http` URL）。
- 配置会自动保存到对应的配置文件中（Claude Code 为 `~/.claude.json`）。

### 3. 查看会话详情
- 当您在终端使用 Claude Code 时，AgentBoard 会自动捕获会话。
- 在 **Dashboard** 页面，点击任意卡片即可查看详细的对话时间线。

## 🏗️ 技术架构

- **核心框架**: [Electron](https://www.electronjs.org/) (v33) + [Vite](https://vitejs.dev/)
- **前端技术**: React 19 + TypeScript + Tailwind CSS 4
- **数据存储**: `better-sqlite3` (本地 SQLite 数据库)
- **通信机制**: 
  - **IPC**: 主进程与渲染进程通信
  - **HTTP Server**: 接收 CLI Hook 的事件上报 (Express)
  - **Context Bridge**: 安全的 API 暴露
- **设计模式**: Adapter Pattern (适配不同 CLI 的配置格式)
- **会话状态机**: 基于事件驱动的状态管理 (`idle` → `working` → `needs_approval` → `done`)
- **终端级会话管理**: 通过 `term_session_id` 识别同一终端中的会话，自动处理会话生命周期

## 📂 项目结构

```
agent-board/
├── src/
│   ├── main/              # Electron 主进程
│   │   ├── config-manager.ts # 核心：配置与适配器逻辑
│   │   ├── hook-installer.ts # Hook 安装与检测
│   │   ├── session-manager.ts # 会话状态管理
│   │   └── database.ts    # SQLite 数据库层
│   ├── renderer/          # React 前端界面
│   │   ├── components/    # ConfigPanel, MCPManager, SkillManager 等
│   │   └── App.tsx        # 主路由与布局
│   └── shared/            # 共享类型定义
├── resources/             # 静态资源与脚本
│   ├── agent-board-hook.sh # 核心 Hook 脚本
└── electron.vite.config.ts # 构建配置

### 会话状态流转

系统通过事件驱动的方式管理会话状态：

```
SessionStart
    │
    ├── 子 Agent ──→ working
    │
    └── 普通会话 ──→ idle ──UserPromptSubmit──→ working
                                                  │
                    ┌─────────────────────────────┘
                    │
            Notification(permission_prompt)
                    │
                    ▼
            needs_approval ──用户响应/后续事件──→ working
                    │
                    ▼
                Stop/before_exit
                    │
                    ▼
                   done
```

**关键行为**：
- 同一终端中启动新会话时，旧会话自动关闭
- 心跳超时（3小时无响应）自动转为 `idle`
- `needs_approval` 状态下收到任何后续事件自动恢复为 `working`
```

## 📝 常见问题

**Q: 为什么我看不到 Claude Code 的 MCP Server？**
A: Claude Code 的 MCP 配置存储在 `~/.claude.json` (项目级) 或 `~/.claude/settings.json` (全局)。AgentBoard 会尝试读取所有项目的配置。如果您的配置在非标准路径，请使用 "Change Path" 功能。

**Q: 会话状态一直显示 `idle`？**
A: 请确保您已经执行了 "一键接入"，并且终端中的 Claude Code 也是最新版本。部分旧版本可能不支持 hook 事件。

**Q: 同一终端中启动了新的 Claude Code 会话，旧会话会怎样？**
A: AgentBoard 支持终端级会话管理。当在同一终端中启动新会话时，系统会自动关闭该终端中的旧活跃会话（状态设为 `done` 并标记为已关闭），确保会话状态准确反映实际情况。

## 📄 许可证

MIT License
