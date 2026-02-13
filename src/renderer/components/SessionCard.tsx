import type { Session } from '../types'
import CLIIcon from './CLIIcon'
import StatusBadge from './StatusBadge'
import ElapsedTimer from './ElapsedTimer'

interface SessionCardProps {
  session: Session
  index: number
}

export default function SessionCard({ session, index }: SessionCardProps) {
  const isActive = session.status === 'working' || session.status === 'needs_approval'

  return (
    <div
      className={`
        animate-card-in relative
        bg-slate-800 rounded-xl border border-slate-700
        p-4 flex flex-col gap-3
        transition-all duration-300
        hover:bg-slate-700
      `}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* 顶部：CLI 图标 + 项目名 */}
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
        </div>
      </div>

      <StatusBadge status={session.status} />

      {/* 任务描述 */}
      {session.taskDescription && (
        <p className="text-[13px] text-slate-400 leading-relaxed line-clamp-2">
          {session.taskDescription}
        </p>
      )}

      {/* 底部：Session ID + 计时 */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-700/40">
        <span className="font-mono text-[10px] text-slate-400 tracking-wider">
          {session.id.slice(0, 8)}
        </span>
        <ElapsedTimer
          startTime={session.taskStartTime}
          active={isActive}
        />
      </div>
    </div>
  )
}
