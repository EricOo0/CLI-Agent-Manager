import { useState, useEffect } from 'react'

interface ElapsedTimerProps {
  startTime: number | null
  active: boolean
}

// 格式化已用时间
function formatElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}

export default function ElapsedTimer({ startTime, active }: ElapsedTimerProps) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!active || !startTime) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [active, startTime])

  if (!startTime) return null

  const elapsed = (active ? now : Date.now()) - startTime

  return (
    <span className="font-mono text-[11px] text-slate-400 tabular-nums">
      {formatElapsed(elapsed)}
    </span>
  )
}
