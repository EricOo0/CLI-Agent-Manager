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
~/.claude/hooks/agent-board/agent-board-report.sh <event> <session_id> <cwd> [task_description] [cli_type]
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
- `cli_type` (Optional): The name of the CLI tool being used (e.g., `aider`, `cursor`, `gemini`). Defaults to `other`.

## Examples

### 1. Start a Session
```bash
# Generate a session ID if one doesn't exist
SESSION_ID=$(uuidgen)
# Report start
~/.claude/hooks/agent-board/agent-board-report.sh SessionStart "$SESSION_ID" "$(pwd)" "Refactoring the login module" "cursor"
```

### 2. Report Completion
```bash
~/.claude/hooks/agent-board/agent-board-report.sh Stop "$SESSION_ID" "$(pwd)"
```
