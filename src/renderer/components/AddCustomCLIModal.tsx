import { useState } from 'react'
import type { CustomCLI } from '../../shared/types'

interface AddCustomCLIModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (cli: CustomCLI) => void
}

export default function AddCustomCLIModal({ isOpen, onClose, onSave }: AddCustomCLIModalProps) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [color, setColor] = useState('')
  const [configPath, setConfigPath] = useState('')
  const [skillsPath, setSkillsPath] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const customCLI: CustomCLI = {
      id: id || `custom-${Date.now()}`,
      name: name.trim(),
      icon: icon.trim() || undefined,
      color: color.trim() || undefined,
      configPath: configPath.trim() || undefined,
      skillsPath: skillsPath.trim() || undefined,
      createdAt: Date.now()
    }

    onSave(customCLI)

    // 重置表单
    setName('')
    setIcon('')
    setColor('')
    setConfigPath('')
    setSkillsPath('')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-white mb-4">添加自定义 CLI</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              名称 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：Windsurf"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              图标（可选）
            </label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="例如：🌊"
              maxLength={2}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              颜色（可选）
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={color || '#6366f1'}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-20 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#6366f1"
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              MCP 配置文件路径（可选）
            </label>
            <input
              type="text"
              value={configPath}
              onChange={(e) => setConfigPath(e.target.value)}
              placeholder="例如：~/.windsurf/mcp.json"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
            />
            <p className="text-xs text-slate-500 mt-1">
              留空则不显示 MCP Servers 功能
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Skills 目录路径（可选）
            </label>
            <input
              type="text"
              value={skillsPath}
              onChange={(e) => setSkillsPath(e.target.value)}
              placeholder="例如：~/.windsurf/skills"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
            />
            <p className="text-xs text-slate-500 mt-1">
              留空则不显示 Skills 功能
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              添加
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}