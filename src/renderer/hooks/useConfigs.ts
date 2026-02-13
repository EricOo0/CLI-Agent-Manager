import { useState, useEffect } from 'react'
import type { CLIConfig } from '../types'

// CLI 配置数据 hook
export function useConfigs() {
  const [configs, setConfigs] = useState<CLIConfig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.agentBoard.getCLIConfigs().then((data) => {
      setConfigs(data)
      setLoading(false)
    })
  }, [])

  const refresh = () => {
    window.agentBoard.getCLIConfigs().then(setConfigs)
  }

  return { configs, loading, refresh }
}
