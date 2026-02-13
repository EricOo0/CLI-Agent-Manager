#!/bin/bash
# AgentBoard Hook - 将 Claude Code 事件转发到 AgentBoard 仪表盘
# 读取 stdin JSON，POST 到本地 AgentBoard 服务
set -uo pipefail

PORT="27420"

# 读取 stdin（Claude Code 传入的 JSON payload）
PAYLOAD=$(cat)

# 快速检查 AgentBoard 是否在运行（0.5s 超时，不影响 Claude Code）
curl -sf --max-time 0.5 "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1 || exit 0

# POST 事件（后台执行，不阻塞 Claude Code）
curl -sf --max-time 3 -X POST \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  "http://127.0.0.1:${PORT}/api/event" >/dev/null 2>&1 &

wait
