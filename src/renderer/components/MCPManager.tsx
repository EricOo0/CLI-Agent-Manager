import React, { useState } from 'react'
import type { MCPServerConfig, CLIType } from '../types'

interface MCPManagerProps {
  cliType: CLIType
  servers: MCPServerConfig[]
  onUpdate: () => void
}

export default function MCPManager({ cliType, servers, onUpdate }: MCPManagerProps) {
  const [editingServer, setEditingServer] = useState<MCPServerConfig | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingServer) return

    await window.agentBoard.saveMCPServer(cliType, editingServer)
    setEditingServer(null)
    setIsAdding(false)
    onUpdate()
  }

  const handleDelete = async (name: string) => {
    if (confirm(`Are you sure you want to delete MCP server "${name}"?`)) {
      await window.agentBoard.deleteMCPServer(cliType, name)
      onUpdate()
    }
  }

  const startEdit = (server: MCPServerConfig) => {
    setEditingServer({ ...server })
    setIsAdding(false)
  }

  const startAdd = () => {
    setEditingServer({ name: '', command: '', args: [], env: {} })
    setIsAdding(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">MCP Servers</h3>
        <button
          onClick={startAdd}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs transition-colors"
        >
          Add Server
        </button>
      </div>

      <div className="grid gap-3">
        {servers.length === 0 && !isAdding && (
          <div className="p-8 text-center border border-slate-800 rounded-lg bg-slate-800/30">
            <p className="text-slate-500 text-sm">No MCP servers configured.</p>
          </div>
        )}

        {(isAdding || editingServer) && (
          <form onSubmit={handleSave} className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Name</label>
                <input
                  type="text"
                  value={editingServer?.name}
                  onChange={e => setEditingServer(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. filesystem"
                  disabled={!isAdding} // 编辑时名字不可改（作为key）
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Command</label>
                <input
                  type="text"
                  value={editingServer?.command}
                  onChange={e => setEditingServer(prev => prev ? { ...prev, command: e.target.value } : null)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. npx"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-slate-400 mb-1">Arguments (one per line)</label>
              <textarea
                value={editingServer?.args.join('\n')}
                onChange={e => setEditingServer(prev => prev ? { ...prev, args: e.target.value.split('\n').filter(Boolean) } : null)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 font-mono focus:outline-none focus:border-blue-500 h-20"
                placeholder="-y&#10;@modelcontextprotocol/server-filesystem&#10;/path/to/files"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingServer(null)
                  setIsAdding(false)
                }}
                className="px-3 py-1.5 text-slate-400 hover:text-slate-200 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs"
              >
                Save
              </button>
            </div>
          </form>
        )}

        {servers.map(server => (
          <div 
            key={server.name} 
            className={`
              bg-slate-800/50 border border-slate-700 rounded-lg p-3 flex items-start gap-3 group
              ${editingServer?.name === server.name ? 'hidden' : ''}
            `}
          >
            <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-slate-400 font-bold shrink-0">
              {server.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-medium text-slate-200">{server.name}</h4>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => startEdit(server)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(server.name)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <code className="text-xs font-mono text-slate-400 block truncate">
                {server.command} {server.args.join(' ')}
              </code>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
