---
name: agent-board-report
description: Report session lifecycle events and status updates to the local AgentBoard dashboard to visualize task progress.
---

# AgentBoard Reporter

Enables reporting of session lifecycle events and status updates to the local AgentBoard dashboard. Use this tool to visualize the current task status and keep the user informed.

## Usage
Execute the shell script located at `~/.claude/hooks/agent-board/agent-board-report.sh`.

## Command Signature
```bash
~/.claude/hooks/agent-board/agent-board-report.sh <event> <session_id> <cwd> [task_description] [cli_type] [custom_cli_id]
```

## Parameters
- `event` (Required): The type of event.
  - `SessionStart`: Call this when a new task or session begins.
  - `Stop`: Call this when the task or session ends.
  - `UserPromptSubmit`: Call this when the user submits a new prompt.
  - `Notification`: Call this to send a general notification or progress update.
- `session_id` (Required): A unique identifier for the session. You should generate a UUID (e.g., using `uuidgen`) or use a persistent ID for the current context.
- `cwd` (Required): The current working directory (e.g., `$(pwd)`).
- `task_description` (Optional): A brief description of the current task. Required for `SessionStart`.
- `cli_type` (Optional): The name of the CLI tool being used (e.g., `aider`, `cursor`, `gemini`, `other`). Defaults to `other`.
- `custom_cli_id` (Optional): **Required for custom CLIs**. When `cli_type` is `other`, use this to specify the custom CLI identifier (e.g., `windsurf`, `codeium`). This allows AgentBoard to display the correct CLI name in the tray menu.

## Examples

### 1. Start a Session (Built-in CLI)
```bash
# Generate a session ID if one doesn't exist
SESSION_ID=$(uuidgen)
# Report start for a built-in CLI like cursor
~/.claude/hooks/agent-board/agent-board-report.sh SessionStart "$SESSION_ID" "$(pwd)" "Refactoring the login module" "cursor"
```

### 2. Start a Session (Custom CLI)
```bash
# For custom CLIs like Windsurf, use 'other' as cli_type and specify custom_cli_id
SESSION_ID=$(uuidgen)
~/.claude/hooks/agent-board/agent-board-report.sh SessionStart "$SESSION_ID" "$(pwd)" "Implementing dark mode" "other" "windsurf"
```

### 3. Report Completion
```bash
~/.claude/hooks/agent-board/agent-board-report.sh Stop "$SESSION_ID" "$(pwd)"
```

## Custom CLI Configuration

To register a custom CLI with AgentBoard:

1. Open AgentBoard settings
2. Click "添加 CLI" (Add CLI) button
3. Fill in:
   - **Name**: Display name (e.g., "Windsurf")
   - **Icon**: Emoji icon (e.g., "🌊")
   - **Color**: Brand color (optional)
4. The CLI will be assigned an ID (e.g., `windsurf`)

When reporting events, use this ID as `custom_cli_id` to ensure the tray menu shows the correct CLI name.
