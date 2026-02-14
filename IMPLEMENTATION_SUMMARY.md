# TERM_SESSION_ID 实现总结

## 问题背景

在 Claude Code 中执行 plan 后退出（`SessionStart:clear`），新 session 启动时需要识别并关闭旧 session。但由于 parentUuid 是 entry 级别的链式结构，无法在 session 级别关联新旧 session。

同时，现有的 `UserPromptSubmit` 自动关闭逻辑存在以下问题：
1. **路径匹配问题**：路径格式不一致导致误判
2. **缺少 CLI 类型检查**：可能关闭不同 CLI 的 session
3. **SessionStart 缺少自动关闭逻辑**：只在 `UserPromptSubmit` 中有

## 解决方案

使用 `TERM_SESSION_ID` 环境变量作为同一终端窗口的标识符。同一终端中的所有进程共享相同的 `TERM_SESSION_ID`，可以用来精确识别和关闭旧 session。

## 修改的文件

### 1. `resources/agent-board-hook.sh`
- 注入 `TERM_SESSION_ID` 环境变量到 payload
- 使用 Python 解析和修改 JSON payload

### 2. `src/shared/types.ts`
- `HookPayload` 接口添加 `term_session_id?: string`
- `Session` 接口添加 `termSessionId?: string`

### 3. `src/main/database.ts`
- `sessions` 表添加 `term_session_id TEXT` 列
- 添加迁移逻辑确保列存在（兼容旧数据库）
- `upsertSession` 函数包含 `termSessionId` 参数

### 4. `src/main/session-manager.ts`

**SessionStart 事件处理**：
- 添加自动关闭逻辑，使用 `term_session_id` 关闭同一终端中的旧 session
- 更新 `upsertSession` 调用，传入 `termSessionId`

**UserPromptSubmit 事件处理（修复）**：
- 添加路径规范化，确保路径格式一致
- 添加 CLI 类型检查，确保只关闭相同 CLI 的 session
- 更新 `upsertSession` 调用，传入 `termSessionId`

## 关键代码逻辑

### SessionStart 自动关闭
```typescript
if (payload.term_session_id) {
  const sameTerminalSessions = getAllSessions().filter(s =>
    s.termSessionId === payload.term_session_id &&
    !s.isClosed &&
    s.id !== session_id &&
    (s.status === 'working' || s.status === 'needs_approval' || s.status === 'idle')
  )

  for (const oldSession of sameTerminalSessions) {
    updateSessionClosed(oldSession.id, true)
    updateSessionStatus(oldSession.id, 'done')
    insertEvent(oldSession.id, 'SessionAutoClosed', '...')
  }
}
```

### UserPromptSubmit 修复
```typescript
// 路径规范化
const normalizedCwd = cwd.replace(/\/$/, '')

// 更严格的条件
const activeSession = getAllSessions().find(s => {
  const normalizedProject = s.project.replace(/\/$/, '')
  return normalizedProject === normalizedCwd &&
    !s.isClosed &&
    s.id !== session_id &&
    s.cliType === (cli_type || 'claude-code') &&  // CLI 类型检查
    (s.status === 'working' || s.status === 'needs_approval')
})
```

## 验证方法

1. 重新构建项目：`npm run build` ✅
2. 重启 AgentBoard
3. 启动 Claude Code session
4. 执行 plan 模式然后退出（触发 `SessionStart:clear`）
5. 观察 AgentBoard UI：
   - 旧 session 应被自动标记为 `done` 并关闭
   - 新 session 应是唯一的活跃会话
   - 旧 session 事件列表中应包含 `SessionAutoClosed` 事件

## 优势

1. **精确匹配**：通过 `termSessionId` 精确匹配同一终端中的 session，不受项目路径影响
2. **向后兼容**：即使终端不支持 `TERM_SESSION_ID`，系统仍能正常工作
3. **修复现有问题**：
   - 路径规范化解决路径格式不一致问题
   - CLI 类型检查防止关闭不同 CLI 的 session
   - SessionStart 添加自动关闭逻辑，确保及时关闭旧 session
