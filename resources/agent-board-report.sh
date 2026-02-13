#!/bin/bash
# AgentBoard 通用上报脚本 - 供不支持 hook 的 CLI 使用
# 用法: agent-board-report.sh <event> <session_id> <cwd> [task_description] [cli_type]

PORT=27420
EVENT="${1:-status}"
SESSION_ID="${2:-$(uuidgen)}"
CWD="${3:-$(pwd)}"
TASK_DESC="${4:-}"
CLI_TYPE="${5:-other}"

curl -sf --max-time 3 -X POST \
  -H "Content-Type: application/json" \
  -d "{\"hook_event_name\":\"$EVENT\",\"session_id\":\"$SESSION_ID\",\"cwd\":\"$CWD\",\"task_description\":\"$TASK_DESC\",\"cli_type\":\"$CLI_TYPE\"}" \
  "http://127.0.0.1:${PORT}/api/event" >/dev/null 2>&1
