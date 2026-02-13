import type { SessionFilter } from '../types'

interface FilterBarProps {
  current: SessionFilter
  onChange: (filter: SessionFilter) => void
  counts: { all: number; active: number; completed: number }
}

const FILTERS: { key: SessionFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '活跃' },
  { key: 'completed', label: '已完成' }
]

export default function FilterBar({ current, onChange, counts }: FilterBarProps) {
  return (
    <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
      {FILTERS.map(({ key, label }) => {
        const isActive = current === key
        const count = counts[key]

        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`
              px-3 py-1.5 rounded-md text-xs font-medium
              transition-all duration-200
              ${isActive
                ? 'bg-slate-700 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
              }
            `}
          >
            {label}
            {count > 0 && (
              <span className={`ml-1.5 font-mono text-[10px] ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
