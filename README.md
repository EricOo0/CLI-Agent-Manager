# AgentBoard

> 统一看板监控所有 AI Agent CLI 会话

AgentBoard 是一个 macOS Electron 桌面应用，提供统一界面查看和管理所有 AI Agent CLI（如 Claude Code）的活跃会话。

## 功能特性

- 📊 **统一看板** - 一个界面查看所有 AI Agent session 的状态
- ⚡ **实时更新** - 通过 Hook 机制实时接收会话事件
- 🗂 **托盘支持** - 最小化到系统托盘，快捷查看状态
- 🔧 **配置管理** - 查看各 CLI 的 skills、MCP servers、plugins 配置

## 支持的 CLI

### 已支持
- **Claude Code** - 通过 Hook 自动集成（首次启动自动注册）

### 计划支持
- **Aider** - 通过 Skill + 脚本上报
- **Gemini CLI** - 通过 Skill + 脚本上报
- **Cursor CLI** - 通过 MCP 上报

## 安装

### 从 DMG 安装（推荐）

1. 下载最新 DMG 文件：`agent-board-0.1.0-arm64.dmg`
2. 双击 DMG 文件打开
3. 将 `AgentBoard.app` 拖拽到 `Applications` 文件夹
4. 从 Launchpad 启动

### 从源码运行（开发）

```bash
# 克隆或下载项目
cd agent-board

# 安装依赖
npm install

# 启动开发模式
npm run dev

# 构建
npm run build

# 打包 DMG
npm run dist
```

## 使用说明

### 首次启动

首次启动时，AgentBoard 会自动：

1. 在 `~/.claude/settings.json` 中注册 hook 脚本
2. 复制 `agent-board-report.sh` 到 `~/.claude/hooks/agent-board/`
3. 创建 SQLite 数据库：`~/Library/Application Support/AgentBoard/sessions.db`

### Session 看板

看板展示所有活跃的 AI Agent 会话，每个会话卡片显示：

- **CLI 图标** + **项目名称** + **sub-agent 标记**
- **任务描述** - 从 `history.jsonl` 自动提取的首个有意义的 prompt
- **状态徽章**
  - ⚪ `idle` - 等待用户输入
  - 🔵 `working` - Agent 正在执行任务（带脉冲动画）
  - 🟠 `needs_approval` - 等待用户审批权限
  - 🟩 `done` - 任务已完成
- **执行时长** - working 状态下实时计时
- **Session ID** - 前 8 位，便于定位

### 过滤器

顶部 FilterBar 支持按状态过滤：
- **全部** - 显示所有会话
- **活跃** - 显示 working / needs_approval 状态的会话
- **已完成** - 显示 done 状态的会话

### 托盘功能

- 最小化主窗口后隐藏到系统托盘
- 托盘标题显示活跃 session 数
- 右键菜单：
  - 活跃 session 列表（最多 5 个）
  - 显示面板
  - 退出

### 配置管理

**Config 页面**（MVP 阶段只读，不做修改）：

查看各 CLI 的配置：
- **Claude Code** - `~/.claude/settings.json`（hooks / MCP / plugins）
- **Aider** - `~/.aider.conf.yml`
- **Cursor** - `~/.cursor/mcp.json`

每个 CLI 展示：
- 已安装的 Skills
- 已配置的 MCP Servers
- 已启用的 Plugins
- "Open Config File" 按钮 - 用默认编辑器打开配置文件

## 技术栈

- **框架**: Electron 33
- **前端**: React 19 + TypeScript
- **样式**: Tailwind CSS 4
- **构建**: electron-vite
- **数据库**: better-sqlite3
- **HTTP 服务**: Express

## 开发状态

### ✅ 已完成

| 模块 | 状态 |
|------|------|
| 共享类型 (`src/shared/types.ts`) | ✅ |
| 数据库 (`src/main/database.ts`) | ✅ |
| 会话管理 (`src/main/session-manager.ts`) | ✅ |
| HTTP 服务 (`src/main/server.ts`) | ✅ |
| Hook 脚本 (`resources/agent-board-hook.sh`) | ✅ |
| 上报脚本 (`resources/agent-board-report.sh`) | ✅ |
| Skill 文件 (`resources/agent-board-report.md`) | ✅ |
| Hook 安装 (`src/main/hook-installer.ts`) | ✅ |
| History 读取 (`src/main/history-reader.ts`) | ✅ |
| IPC 处理 (`src/main/ipc-handlers.ts`) | ✅ |
| Preload 脚本 (`src/preload/index.ts`) | ✅ |
| SessionCard 组件 | ✅ |
| SessionGrid 组件 | ✅ |
| StatusBadge 组件 | ✅ |
| ElapsedTimer 组件 | ✅ |
| FilterBar 组件 | ✅ |
| Sidebar 组件 | ✅ |
| CLIIcon 组件 | ✅ |
| useSessions hook | ✅ |
| App.tsx | ✅ |
| 系统托盘 (`src/main/tray.ts`) | ✅ |
| Electron 主入口 (`src/main/index.ts`) | ✅ |
| 构建配置 (`electron.vite.config.ts`) | ✅ |
| 打包配置 (`electron-builder.config.js`) | ✅ |
| DMG 打包 | ✅ |
| 图标资源 | ⚠️ 占位符（需替换）|

### ⏳ MVP 未完成（可延后）

| 模块 | 说明 |
|------|------|
| ConfigManager 页面 | 配置管理功能已拆分为 ConfigPanel，但页面路由和完整实现待补充 |
| pages/Dashboard.tsx | 计划中但实际集成在 App.tsx 中 |
| pages/ConfigManager.tsx | 计划中但实际未实现 |
| CLI 图标资源 | `resources/icons/` 目录为空，需添加各 CLI 的图标 |
| 数据库测试 (`tests/database.test.ts`) | 未编写（按 TDD 原则应先写测试） |
| 定期清理定时器 | session-manager 已定义 `startCleanupTimer()`，但主进程未调用 |

### 🎨 UI 待优化

- **CSS 警告** - `@import` 应放在规则前（`styles.css:2`）
- **自定义颜色类** - 当前用标准 Tailwind 类替代了原计划的 `bg-hull` 等自定义类
- **深色模式** - App 使用了 `dark:` 前缀但 Tailwind 未配置主题切换

## 项目结构

```
agent-board/
├── src/
│   ├── main/              # Electron 主进程
│   │   ├── index.ts       # 入口 + 窗口 + 托盘
│   │   ├── server.ts      # Express HTTP 服务
│   │   ├── database.ts    # SQLite 数据库
│   │   ├── session-manager.ts # 会话状态机
│   │   ├── history-reader.ts # history.jsonl 解析
│   │   ├── hook-installer.ts # Hook 注册
│   │   ├── config-manager.ts # CLI 配置管理
│   │   ├── ipc-handlers.ts # IPC 通道
│   │   └── tray.ts       # 系统托盘
│   ├── preload/
│   │   └── index.ts       # contextBridge API
│   ├── renderer/
│   │   ├── App.tsx        # 根组件
│   │   ├── components/     # UI 组件
│   │   ├── hooks/         # React hooks
│   │   └── types.ts       # Renderer 类型
│   └── shared/
│       └── types.ts       # main/renderer 共享类型
├── resources/
│   ├── agent-board-hook.sh    # Claude Code hook 脚本
│   ├── agent-board-report.sh  # 通用上报脚本
│   ├── agent-board-report.md  # Claude Skill 定义
│   ├── icon.png            # App 图标（占位）
│   └── tray-iconTemplate.png # Tray 图标（占位）
└── package.json
```

## 故障排查

### Hook 未注册

检查 `~/.claude/settings.json` 是否包含 `agent-board-hook.sh` 条目：

```bash
cat ~/.claude/settings.json | grep -A 5 "agent-board-hook"
```

### Session 不显示

1. 检查 AgentBoard 服务是否运行：访问 `http://127.0.0.1:27420/api/health`
2. 检查 `~/.claude/history.jsonl` 是否存在且可读
3. 查看 AgentBoard 日志

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！
