import React, { useState, useEffect } from 'react'
import { useConfigs } from '../hooks/useConfigs'
import ConfigPanel from './ConfigPanel'
import CLIIcon from './CLIIcon'
import AddCustomCLIModal from './AddCustomCLIModal'
import NotificationSettings from './NotificationSettings'
import type { CLIConfig, CustomCLI } from '../types'

export default function ConfigDashboard() {
  const { configs, loading, refresh } = useConfigs()
  const [selectedConfig, setSelectedConfig] = useState<CLIConfig | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false)

  // 默认选中第一个
  useEffect(() => {
    if (configs.length > 0 && !selectedConfig) {
      setSelectedConfig(configs[0])
    }
  }, [configs, selectedConfig])

  // 当 configs 更新时（例如状态改变），更新选中的 config
  useEffect(() => {
    if (selectedConfig) {
      const updated = configs.find(c =>
        c.cliType === selectedConfig.cliType &&
        c.name === selectedConfig.name
      )
      // 只有当找到更新后的 config 时才更新，否则保持原样
      // 当删除自定义 CLI 时，找不到对应的 config，此时不需要更新
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedConfig)) {
        setSelectedConfig(updated)
      }
    }
  }, [configs])

  // 处理保存自定义 CLI
  const handleSaveCustomCLI = async (cli: CustomCLI) => {
    try {
      const result = await window.agentBoard.saveCustomCLI(cli)
      if (result.success) {
        await refresh() // 刷新配置以包含新的自定义 CLI
        setIsAddModalOpen(false)
      } else {
        console.error('保存自定义 CLI 失败:', result.error)
        alert('保存失败: ' + result.error)
      }
    } catch (error) {
      console.error('保存自定义 CLI 失败:', error)
      alert('保存失败')
    }
  }

  // 处理删除自定义 CLI 后清空选中状态
  const handleCustomCLIDeleted = async () => {
    // 先保存当前选中的 CLI 的名称，用于判断
    const currentSelectedName = selectedConfig?.name

    // 刷新配置
    await refresh()

    // 如果当前选中的是自定义 CLI，则清空选中状态或选中第一个
    if ((selectedConfig as any)?.customCLI) {
      setSelectedConfig(configs[0] || null)
    }
  }

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
          {configs.map((config) => {
            const isCustomCLI = config.cliType === 'other' && (config as any).customCLI
            const customCLI = (config as any).customCLI as CustomCLI | undefined

            return (
              <button
                key={isCustomCLI ? customCLI?.id : config.cliType}
                onClick={() => setSelectedConfig(config)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                  ${selectedConfig?.cliType === config.cliType && selectedConfig?.name === config.name
                    ? 'bg-slate-700 text-slate-100 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                  }
                `}
              >
                {isCustomCLI ? (
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center font-mono font-bold shrink-0 text-[10px]"
                    style={{
                      backgroundColor: customCLI?.color ? `${customCLI.color}20` : 'rgba(107, 114, 128, 0.2)',
                      color: customCLI?.color || '#6b7280',
                      border: customCLI?.color ? `1px solid ${customCLI.color}40` : '1px solid rgba(107, 114, 128, 0.25)'
                    }}
                  >
                    {customCLI?.icon || '○'}
                  </div>
                ) : (
                  <CLIIcon cliType={config.cliType} size="sm" />
                )}
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-sm font-medium truncate">{config.name}</span>
                  <span className="text-[10px] flex items-center gap-1.5">
                    {isCustomCLI ? (
                      <span className="text-slate-500">自定义</span>
                    ) : (
                      <>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          config.integrationStatus === 'integrated' ? 'bg-green-500' :
                          config.integrationStatus === 'unsupported' ? 'bg-slate-600' : 'bg-amber-500'
                        }`} />
                        {config.integrationStatus === 'integrated' ? '已接入' : '未接入'}
                      </>
                    )}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* 设置和添加 CLI 按钮 */}
        <div className="p-4 border-t border-slate-700/50 space-y-2">
          <button
            onClick={() => setIsNotificationSettingsOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            通知设置
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加 CLI
          </button>
        </div>
      </div>

      {/* Right Content: Config Panel */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
        {selectedConfig ? (
          <>
            <div className="px-8 py-6 border-b border-slate-800">
              <div className="flex items-center gap-4">
                {(selectedConfig as any).customCLI ? (
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center font-mono font-bold text-lg"
                    style={{
                      backgroundColor: (selectedConfig as any).customCLI.color ? `${(selectedConfig as any).customCLI.color}20` : 'rgba(107, 114, 128, 0.2)',
                      color: (selectedConfig as any).customCLI.color || '#6b7280',
                      border: (selectedConfig as any).customCLI.color ? `1px solid ${(selectedConfig as any).customCLI.color}40` : '1px solid rgba(107, 114, 128, 0.25)'
                    }}
                  >
                    {(selectedConfig as any).customCLI.icon || '○'}
                  </div>
                ) : (
                  <CLIIcon cliType={selectedConfig.cliType} size="lg" />
                )}
                <div>
                  <h1 className="text-2xl font-bold text-slate-100">{selectedConfig.name}</h1>
                  <p className="text-sm text-slate-400 mt-1">
                    {(selectedConfig as any).customCLI ? '自定义 CLI' : (selectedConfig.installed ? '已安装在系统中' : '未检测到安装')}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <ConfigPanel config={selectedConfig} onUpdate={refresh} onCustomCLIDeleted={handleCustomCLIDeleted} />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500">
            Select a tool to view configuration
          </div>
        )}
      </div>

      {/* 添加自定义 CLI 模态框 */}
      <AddCustomCLIModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveCustomCLI}
      />

      {/* 通知设置模态框 */}
      <NotificationSettings
        isOpen={isNotificationSettingsOpen}
        onClose={() => setIsNotificationSettingsOpen(false)}
      />
    </div>
  )
}
