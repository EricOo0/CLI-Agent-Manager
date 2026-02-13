#!/bin/bash
# AgentBoard 通用上报脚本 - 供不支持 hook 的 CLI 使用
# 用法: agent-board-report.sh <event> <session_id> <cwd> [task_description] [cli_type] [custom_cli_id]

PORT=27420
EVENT="${1:-status}"
SESSION_ID="${2:-$(uuidgen)}"
CWD="${3:-$(pwd)}"
TASK_DESC="${4:-}"
CLI_TYPE="${5:-other}"
CUSTOM_CLI_ID="${6:-}"

# 构建 JSON payload，如果有 custom_cli_id 则包含它
if [ -n "$CUSTOM_CLI_ID" ]; then
  JSON_PAYLOAD="{\"hook_event_name\":\"$EVENT\",\"session_id\":\"$SESSION_ID\",\"cwd\":\"$CWD\",\"task_description\":\"$TASK_DESC\",\"cli_type\":\"$CLI_TYPE\",\"custom_cli_id\":\"$CUSTOM_CLI_ID\"}"
else
  JSON_PAYLOAD="{\"hook_event_name\":\"$EVENT\",\"session_id\":\"$SESSION_ID\",\"cwd\":\"$CWD\",\"task_description\":\"$TASK_DESC\",\"cli_type\":\"$CLI_TYPE\"}"
fi

curl -sf --max-time 3 -X POST \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD" \
  "http://127.0.0.1:${PORT}/api/event" >/dev/null 2>&1
