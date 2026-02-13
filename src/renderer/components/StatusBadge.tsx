import type { SessionStatus } from '../types'

const STATUS_CONFIG: Record<SessionStatus, { label: string; bgClass: string; textClass: string; dotClass?: string }> = {
  idle: {
    label: '空闲',
    bgClass: 'bg-slate-800',
    textClass: 'text-slate-400',
    dotClass: 'bg-slate-600',
  },
  working: {
    label: '运行中',
    bgClass: 'bg-cyan-500/20',
    textClass: 'text-cyan-400',
    animation: 'animate-pulse',
  },
  needs_approval: {
    label: '待审批',
    bgClass: 'bg-amber-500/20',
    textClass: 'text-amber-400',
    animation: 'animate-bounce',
  },
  done: {
    label: '已完成',
    bgClass: 'bg-green-500/20',
    textClass: 'text-green-400',
  },
}

interface StatusBadgeProps {
  status: SessionStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium font-mono ${config.bgClass} ${config.textClass}`}>
      {config.dotClass && <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />}
      {config.label}
    </span>
  )
}
