import React, { useState, useEffect } from 'react'
import { useConfigs } from '../hooks/useConfigs'
import ConfigPanel from './ConfigPanel'
import CLIIcon from './CLIIcon'
import type { CLIConfig } from '../types'

export default function ConfigDashboard() {
  const { configs, loading, refresh } = useConfigs()
  const [selectedConfig, setSelectedConfig] = useState<CLIConfig | null>(null)

  // 默认选中第一个
  useEffect(() => {
    if (configs.length > 0 && !selectedConfig) {
      setSelectedConfig(configs[0])
    }
  }, [configs, selectedConfig])

  // 当 configs 更新时（例如状态改变），更新选中的 config
  useEffect(() => {
    if (selectedConfig) {
      const updated = configs.find(c => c.cliType === selectedConfig.cliType)
      if (updated) {
        setSelectedConfig(updated)
      }
    }
  }, [configs])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <p>Loading configurations...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Left Sidebar: CLI List */}
      <div className="w-64 border-r border-slate-700 bg-slate-800/50 flex flex-col">
        <div className="p-4 border-b border-slate-700/50">
          <h2 className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            Available Tools
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {configs.map((config) => (
            <button
              key={config.cliType}
              onClick={() => setSelectedConfig(config)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                ${selectedConfig?.cliType === config.cliType
                  ? 'bg-slate-700 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                }
              `}
            >
              <CLIIcon cliType={config.cliType} size="sm" />
              <div className="flex flex-col items-start min-w-0">
                <span className="text-sm font-medium truncate">{config.name}</span>
                <span className="text-[10px] flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    config.integrationStatus === 'integrated' ? 'bg-green-500' :
                    config.integrationStatus === 'unsupported' ? 'bg-slate-600' : 'bg-amber-500'
                  }`} />
                  {config.integrationStatus === 'integrated' ? '已接入' : '未接入'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Content: Config Panel */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
        {selectedConfig ? (
          <>
            <div className="px-8 py-6 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <CLIIcon cliType={selectedConfig.cliType} size="lg" />
                <div>
                  <h1 className="text-2xl font-bold text-slate-100">{selectedConfig.name}</h1>
                  <p className="text-sm text-slate-400 mt-1">
                    {selectedConfig.installed ? '已安装在系统中' : '未检测到安装'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <ConfigPanel config={selectedConfig} onUpdate={refresh} />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500">
            Select a tool to view configuration
          </div>
        )}
      </div>
    </div>
  )
}
