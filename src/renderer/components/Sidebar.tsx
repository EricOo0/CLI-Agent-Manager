import type { Page } from '../types'

interface SidebarProps {
  currentPage: Page
  onNavigate: (page: Page) => void
  activeCount: number
}

const NAV_ITEMS: { page: Page; label: string; icon: string }[] = [
  { page: 'dashboard', label: 'Sessions', icon: '⬡' },
  { page: 'config', label: 'Config', icon: '⚙' }
]

export default function Sidebar({ currentPage, onNavigate, activeCount }: SidebarProps) {
  return (
    <aside className="w-52 bg-slate-900 border-r border-slate-700 flex flex-col shrink-0">
      {/* 标题栏拖拽区 */}
      <div className="titlebar-drag h-12 flex items-end px-5 pb-1">
        <span className="font-mono font-bold text-sm text-cyan-400 titlebar-no-drag">
          AgentBoard
        </span>
      </div>

      {/* 导航 */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV_ITEMS.map(({ page, label, icon }) => {
          const isActive = currentPage === page
          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={`
                flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
                transition-all duration-150 text-left
                ${isActive
                  ? 'bg-slate-800 text-cyan-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }
              `}
            >
              <span className="text-base opacity-70">{icon}</span>
              <span>{label}</span>
              {page === 'dashboard' && activeCount > 0 && (
                <span className="ml-auto font-mono text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-full">
                  {activeCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* 底部 */}
      <div className="px-5 py-3 border-t border-slate-700/40">
        <p className="text-[10px] text-slate-500 font-mono">v0.1.0</p>
      </div>
    </aside>
  )
}
