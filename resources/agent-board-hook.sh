#!/bin/bash
# AgentBoard Hook - 将 Claude Code 事件转发到 AgentBoard 仪表盘
# 读取 stdin JSON，POST 到本地 AgentBoard 服务
set -uo pipefail

PORT="27420"

# 读取 stdin（Claude Code 传入的 JSON payload）
PAYLOAD=$(cat)

# 注入 TERM_SESSION_ID（如果有的话）用于识别同一终端中的 session
if [ -n "$TERM_SESSION_ID" ]; then
  PAYLOAD=$(echo "$PAYLOAD" | python3 -c "import sys,json; d=json.load(sys.stdin); d['term_session_id']=sys.argv[1]; print(json.dumps(d))" "$TERM_SESSION_ID")
fi

# 快速检查 AgentBoard 是否在运行（0.5s 超时，不影响 Claude Code）
curl -sf --max-time 0.5 "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1 || exit 0

# POST 事件（后台执行，不阻塞 Claude Code）
# 使用 subshell & 让 curl 在后台运行，不需要 wait
# 当 curl 完成后，subshell 会自动退出，不会产生僵尸进程
(
  curl -sf --max-time 3 -X POST \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    "http://127.0.0.1:${PORT}/api/event" >/dev/null 2>&1
) &

# 不使用 wait，让脚本立即返回
# subshell 中的 curl 会继续执行直到完成或超时
