import type { CLIType } from '../types'

// CLI 图标和颜色映射
const CLI_META: Record<CLIType, { label: string; color: string; icon: string }> = {
  'claude-code': {
    label: 'Claude',
    color: '#d97706',
    icon: '◆'
  },
  aider: {
    label: 'Aider',
    color: '#10b981',
    icon: '▲'
  },
  gemini: {
    label: 'Gemini',
    color: '#6366f1',
    icon: '●'
  },
  cursor: {
    label: 'Cursor',
    color: '#06b6d4',
    icon: '■'
  },
  other: {
    label: 'Other',
    color: '#6b7280',
    icon: '○'
  }
}

interface CLIIconProps {
  cliType: CLIType
  size?: 'sm' | 'md' | 'lg'
}

export default function CLIIcon({ cliType, size = 'md' }: CLIIconProps) {
  const meta = CLI_META[cliType] || CLI_META.other
  const sizeMap = {
    sm: 'w-5 h-5 text-[10px]',
    md: 'w-7 h-7 text-xs',
    lg: 'w-9 h-9 text-sm'
  }

  return (
    <div
      className={`${sizeMap[size]} rounded-md flex items-center justify-center font-mono font-bold shrink-0`}
      style={{
        backgroundColor: `${meta.color}20`,
        color: meta.color,
        border: `1px solid ${meta.color}40`
      }}
      title={meta.label}
    >
      {meta.icon}
    </div>
  )
}

export function getCLILabel(cliType: CLIType): string {
  return CLI_META[cliType]?.label || 'Unknown'
}
