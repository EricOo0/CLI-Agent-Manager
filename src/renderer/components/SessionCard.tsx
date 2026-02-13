import type { Session } from '../types'
import CLIIcon from './CLIIcon'
import StatusBadge from './StatusBadge'
import ElapsedTimer from './ElapsedTimer'

interface SessionCardProps {
  session: Session
  index: number
  onClose?: (sessionId: string) => void
  onDelete?: (sessionId: string) => void
  onViewChat?: (session: Session) => void
}

export default function SessionCard({ session, index, onClose, onDelete, onViewChat }: SessionCardProps) {
  const isActive = session.status === 'working' || session.status === 'needs_approval'
  const isClosed = session.isClosed

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onClose && confirm('确定要关闭这个 Session 吗？')) {
      onClose(session.id)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete && confirm('确定要删除这个 Session 吗？删除后将无法恢复。')) {
      onDelete(session.id)
    }
  }

  return (
    <div
      className={`
        animate-card-in relative
        bg-slate-800 rounded-xl border border-slate-700
        p-4 flex flex-col gap-3
        transition-all duration-300
        hover:bg-slate-700
        ${isClosed ? 'opacity-60' : ''}
      `}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* 右上角按钮区域 */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        {/* 查看聊天按钮 */}
        {onViewChat && (
          <button
            onClick={(e) => { e.stopPropagation(); onViewChat(session); }}
            className="p-1 rounded hover:bg-slate-600 text-slate-400 hover:text-cyan-400 transition-colors"
            title="查看聊天"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        )}

        {/* 活跃状态的关闭按钮 */}
        {!isClosed && isActive && onClose && (
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-slate-600 text-slate-400 hover:text-slate-200 transition-colors"
            title="关闭 Session"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* 已关闭标签 */}
        {isClosed && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-400">
            已关闭
          </span>
        )}

        {/* 删除按钮 - 所有状态都可删除 */}
        {onDelete && (
          <button
            onClick={handleDelete}
            className="p-1 rounded hover:bg-red-900/50 text-slate-400 hover:text-red-400 transition-colors"
            title="删除 Session"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* 顶部：CLI 图标 + CLI名称/项目名 + SessionID */}
      <div className="flex items-center gap-2.5">
        <CLIIcon cliType={session.cliType} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200 text-sm truncate">
              {session.projectName || '未知项目'}
            </span>
            {session.isSubAgent && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-700 border border-slate-600 text-slate-400 uppercase tracking-wider">
                sub
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-slate-500 font-mono">
              {session.customCliId || session.cliType}
            </span>
            <span className="text-[10px] text-slate-600">|</span>
            <span className="text-[10px] text-slate-500 font-mono" title={session.id}>
              {session.id.slice(0, 8)}...{session.id.slice(-4)}
            </span>
          </div>
        </div>
      </div>

      <StatusBadge status={session.status} />

      {/* 任务描述 */}
      {session.taskDescription && (
        <p className="text-[13px] text-slate-400 leading-relaxed line-clamp-2">
          {session.taskDescription}
        </p>
      )}

      {/* 底部：计时器 */}
      <div className="flex items-center justify-end pt-1 border-t border-slate-700/40">
        <ElapsedTimer
          startTime={session.taskStartTime}
          active={isActive}
        />
      </div>
    </div>
  )
}
