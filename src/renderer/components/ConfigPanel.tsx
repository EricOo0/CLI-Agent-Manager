import React, { useState } from 'react'
import type { CLIConfig } from '../types'
import MCPManager from './MCPManager'
import SkillManager from './SkillManager'

interface ConfigPanelProps {
  config: CLIConfig
  onUpdate: () => void
}

export default function ConfigPanel({ config, onUpdate }: ConfigPanelProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'mcp' | 'skills'>('overview')
  const [editingPath, setEditingPath] = useState<{ type: 'config' | 'skills', value: string } | null>(null)

  const handleOpenFile = (filePath: string) => {
    window.agentBoard.openConfigFile(filePath)
  }

  const handleSavePath = async () => {
    if (!editingPath) return
    await window.agentBoard.setConfigPath(config.cliType, editingPath.type, editingPath.value)
    setEditingPath(null)
    onUpdate()
  }

  const handleIntegration = async () => {
    setLoading(true)
    setMessage('')
    try {
      if (config.integrationStatus === 'integrated') {
        const res = await window.agentBoard.unintegrateCLI(config.cliType)
        setMessage(res.message)
      } else {
        const res = await window.agentBoard.integrateCLI(config.cliType)
        setMessage(res.message)
      }
      onUpdate()
    } catch (err) {
      setMessage('操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-700 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2 text-sm font-medium transition-colors ${
            activeTab === 'overview' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('mcp')}
          className={`pb-2 text-sm font-medium transition-colors ${
            activeTab === 'mcp' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          MCP Servers
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`pb-2 text-sm font-medium transition-colors ${
            activeTab === 'skills' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Skills
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-8">
            {/* 接入管理 */}
            <section className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center justify-between">
                <span>接入状态</span>
                <span className={`px-2 py-0.5 rounded text-xs font-mono ${
                  config.integrationStatus === 'integrated' ? 'bg-green-500/20 text-green-400' :
                  config.integrationStatus === 'unsupported' ? 'bg-slate-600/20 text-slate-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {config.integrationStatus === 'integrated' ? '已接入' : 
                   config.integrationStatus === 'unsupported' ? '手动配置' : '未接入'}
                </span>
              </h3>

              {config.integrationStatus !== 'unsupported' ? (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-slate-400">
                    {config.integrationStatus === 'integrated' 
                      ? 'AgentBoard 已集成到该 CLI 工具中，可以监控会话活动。'
                      : '一键接入将自动修改配置文件，使 AgentBoard 能够监控会话。'}
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleIntegration}
                      disabled={loading}
                      className={`
                        px-4 py-2 rounded-md text-sm font-medium transition-colors
                        ${config.integrationStatus === 'integrated'
                          ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                        }
                        ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      {loading ? '处理中...' : config.integrationStatus === 'integrated' ? '卸载接入' : '一键接入'}
                    </button>
                    {message && <span className="text-xs text-slate-400">{message}</span>}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-slate-400">
                    该 CLI 工具暂不支持自动接入，请手动配置 Skill 文件。
                  </p>
                  <div className="bg-slate-900 p-3 rounded border border-slate-800">
                    <code className="text-xs font-mono text-slate-300 block break-all">
                      ~/.claude/hooks/agent-board/agent-board-report.md
                    </code>
                  </div>
                  <p className="text-xs text-slate-500">
                    提示：您可以将上述 Skill 文件路径配置到该 CLI 的配置文件中。
                  </p>
                </div>
              )}
            </section>

            {/* 配置文件 */}
            <section>
              <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">配置文件路径</h3>
              <div className="flex flex-col gap-3">
                {/* 主配置文件 */}
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-300">Config File</span>
                    <button 
                      onClick={() => setEditingPath({ type: 'config', value: config.configPaths[0] || '' })}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Change Path
                    </button>
                  </div>
                  {editingPath?.type === 'config' ? (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={editingPath.value}
                        onChange={e => setEditingPath({ ...editingPath, value: e.target.value })}
                        className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                      />
                      <button onClick={handleSavePath} className="px-2 py-1 bg-blue-600 rounded text-xs text-white">Save</button>
                      <button onClick={() => setEditingPath(null)} className="px-2 py-1 text-xs text-slate-400">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <code className="text-xs text-slate-400 font-mono break-all">{config.configPaths[0] || 'Not configured'}</code>
                      {config.configPaths[0] && (
                        <button onClick={() => handleOpenFile(config.configPaths[0])} className="text-xs text-slate-500 hover:text-slate-300 ml-2">
                          Open
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Skills 目录 */}
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-300">Skills Directory</span>
                    <button 
                      onClick={() => setEditingPath({ type: 'skills', value: config.configPaths[1] || '' })}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Change Path
                    </button>
                  </div>
                  {editingPath?.type === 'skills' ? (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={editingPath.value}
                        onChange={e => setEditingPath({ ...editingPath, value: e.target.value })}
                        className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                      />
                      <button onClick={handleSavePath} className="px-2 py-1 bg-blue-600 rounded text-xs text-white">Save</button>
                      <button onClick={() => setEditingPath(null)} className="px-2 py-1 text-xs text-slate-400">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <code className="text-xs text-slate-400 font-mono break-all">{config.configPaths[1] || 'Not configured'}</code>
                      {config.configPaths[1] && (
                        <button onClick={() => handleOpenFile(config.configPaths[1])} className="text-xs text-slate-500 hover:text-slate-300 ml-2">
                          Open
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'mcp' && (
          <MCPManager 
            cliType={config.cliType} 
            servers={config.mcpDetails || []} 
            onUpdate={onUpdate} 
          />
        )}

        {activeTab === 'skills' && (
          <SkillManager 
            cliType={config.cliType} 
            skills={config.skillDetails || []} 
            onUpdate={onUpdate} 
          />
        )}
      </div>
    </div>
  )
}
