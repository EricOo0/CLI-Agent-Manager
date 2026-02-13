import React, { useState } from 'react'
import type { SkillDetail, CLIType, CustomCLI } from '../types'

interface SkillManagerProps {
  cliType: CLIType
  customCLI?: CustomCLI
  skills: SkillDetail[]
  onUpdate: () => void
}

export default function SkillManager({ cliType, customCLI, skills, onUpdate }: SkillManagerProps) {
  const [editingSkill, setEditingSkill] = useState<SkillDetail | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSkill) return

    await window.agentBoard.saveSkill(cliType, editingSkill, customCLI?.id)
    setEditingSkill(null)
    setIsAdding(false)
    onUpdate()
  }

  const handleDelete = async (name: string) => {
    if (confirm(`Are you sure you want to delete skill "${name}"?`)) {
      await window.agentBoard.deleteSkill(cliType, name, customCLI?.id)
      onUpdate()
    }
  }

  const startEdit = (skill: SkillDetail) => {
    setEditingSkill({ ...skill })
    setIsAdding(false)
  }

  const startAdd = () => {
    setEditingSkill({ name: '', description: '', content: '---\nname: new-skill\ndescription: A new skill\n---\n\n# New Skill\n\n', filePath: '' })
    setIsAdding(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Skills</h3>
        <button
          onClick={startAdd}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs transition-colors"
        >
          New Skill
        </button>
      </div>

      <div className="grid gap-3">
        {skills.length === 0 && !isAdding && (
          <div className="p-8 text-center border border-slate-800 rounded-lg bg-slate-800/30">
            <p className="text-slate-500 text-sm">No skills found.</p>
          </div>
        )}

        {(isAdding || editingSkill) && (
          <form onSubmit={handleSave} className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Name (Filename)</label>
              <input
                type="text"
                value={editingSkill?.name}
                onChange={e => setEditingSkill(prev => prev ? { ...prev, name: e.target.value } : null)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                placeholder="my-skill"
                disabled={!isAdding}
                required
              />
            </div>
            
            <div>
              <label className="block text-xs text-slate-400 mb-1">Content (Markdown)</label>
              <textarea
                value={editingSkill?.content}
                onChange={e => setEditingSkill(prev => prev ? { ...prev, content: e.target.value } : null)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 font-mono focus:outline-none focus:border-blue-500 h-64 resize-y"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingSkill(null)
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

        {skills.map(skill => (
          <div 
            key={skill.name} 
            className={`
              bg-slate-800/50 border border-slate-700 rounded-lg p-3 flex items-start gap-3 group
              ${editingSkill?.name === skill.name ? 'hidden' : ''}
            `}
          >
            <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-slate-400 text-lg">
              ✨
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-medium text-slate-200">{skill.name}</h4>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => startEdit(skill)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(skill.name)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-400 truncate">
                {skill.description || 'No description provided'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
