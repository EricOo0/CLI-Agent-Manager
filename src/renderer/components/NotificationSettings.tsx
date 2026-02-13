import React, { useState, useEffect } from 'react'
import type { NotificationSettings as NotificationSettingsType } from '../types'

interface NotificationSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationSettings({ isOpen, onClose }: NotificationSettingsProps) {
  const [settings, setSettings] = useState<NotificationSettingsType>({
    enabled: true,
    soundEnabled: true,
    notifyOnApproval: true,
    notifyOnComplete: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 加载设置
  useEffect(() => {
    if (isOpen) {
      loadSettings()
    }
  }, [isOpen])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await window.agentBoard.getNotificationSettings()
      setSettings(data)
    } catch (error) {
      console.error('加载通知设置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const result = await window.agentBoard.saveNotificationSettings(settings)
      if (result.success) {
        onClose()
      } else {
        alert('保存失败: ' + result.error)
      }
    } catch (error) {
      console.error('保存通知设置失败:', error)
      alert('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = (key: keyof NotificationSettingsType) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-slate-800 border border-slate-700 shadow-xl">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">通知设置</h3>
              <p className="text-xs text-slate-400">配置系统通知和音效提醒</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* 总开关 */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-700/50 border border-slate-600">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${settings.enabled ? 'bg-green-500/20' : 'bg-slate-600'}`}>
                    <svg className={`w-5 h-5 ${settings.enabled ? 'text-green-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-100">启用通知</p>
                    <p className="text-xs text-slate-400">接收系统通知提醒</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('enabled')}
                  className={`relative w-12 h-6 rounded-full transition-colors ${settings.enabled ? 'bg-blue-500' : 'bg-slate-600'}`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.enabled ? 'translate-x-6' : ''}`} />
                </button>
              </div>

              {/* 音效开关 */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-700/50 border border-slate-600">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${settings.soundEnabled ? 'bg-purple-500/20' : 'bg-slate-600'}`}>
                    <svg className={`w-5 h-5 ${settings.soundEnabled ? 'text-purple-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-100">启用音效</p>
                    <p className="text-xs text-slate-400">通知时播放提示音</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('soundEnabled')}
                  className={`relative w-12 h-6 rounded-full transition-colors ${settings.soundEnabled ? 'bg-purple-500' : 'bg-slate-600'}`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.soundEnabled ? 'translate-x-6' : ''}`} />
                </button>
              </div>

              {/* 通知场景 */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-300">通知场景</p>

                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/30 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.notifyOnApproval}
                    onChange={() => handleToggle('notifyOnApproval')}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500/20"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-slate-200">需要审批时</p>
                    <p className="text-xs text-slate-500">当 Session 需要人工审批时通知</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/30 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.notifyOnComplete}
                    onChange={() => handleToggle('notifyOnComplete')}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500/20"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-slate-200">任务完成时</p>
                    <p className="text-xs text-slate-500">当 Session 任务完成时通知</p>
                  </div>
                </label>
              </div>
            </>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>
    </div>
  )
}
