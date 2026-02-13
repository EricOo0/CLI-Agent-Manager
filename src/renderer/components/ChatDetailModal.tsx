import React, { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Session, ChatMessage } from '../types'

interface ChatDetailModalProps {
  session: Session
  onClose: () => void
}

export default function ChatDetailModal({ session, onClose }: ChatDetailModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // 加载聊天消息
  const loadMessages = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    setError(null)
    try {
      const data = await window.agentBoard.getSessionMessages(session.id, session.project)
      setMessages(data)
    } catch (err) {
      console.error('加载聊天消息失败:', err)
      setError('无法加载聊天消息')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadMessages()
  }, [session.id, session.project])

  // 格式化 Token 数量
  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}k`
    }
    return tokens.toString()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span className="text-cyan-400">💬</span>
              <span>会话对话</span>
            </h2>
            <div className="text-sm text-slate-400 font-mono">
              {session.id.slice(0, 8)}...{session.id.slice(-4)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadMessages(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              title="刷新聊天内容"
            >
              <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>刷新</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-500">
              加载中...
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <div className="text-4xl mb-3">⚠️</div>
              <div>{error}</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <div className="text-4xl mb-3">💭</div>
              <div>暂无对话内容</div>
              <div className="text-sm mt-2 text-slate-600">该会话可能还没有产生对话记录</div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-blue-600 rounded-2xl rounded-br-md px-4 py-3'
                      : 'bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-md px-4 py-3'
                  }`}>
                    {/* 消息角色标签和模型信息 */}
                    <div className={`flex items-center gap-2 mb-2 text-xs font-medium ${
                      msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'
                    }`}>
                      {msg.role === 'user' ? (
                        <>
                          <span>👤 用户</span>
                        </>
                      ) : (
                        <>
                          <span>🤖 AI</span>
                          {msg.model && (
                            <span className="font-mono bg-slate-700 px-1.5 py-0.5 rounded">
                              {msg.model}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* 消息内容 */}
                    <div className={`text-sm ${
                      msg.role === 'user' ? 'text-white' : 'text-slate-200'
                    }`}>
                      {msg.role === 'user' ? (
                        <div className="whitespace-pre-wrap break-words">
                          {msg.content}
                        </div>
                      ) : (
                        <div className="prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown
                            components={{
                              // 代码块
                              code: ({ node, inline, className, children, ...props }) => {
                                const match = /language-(\w+)/.exec(className || '')
                                return !inline ? (
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                ) : (
                                  <code className="bg-slate-700 px-1 py-0.5 rounded text-cyan-400 font-mono text-xs" {...props}>
                                    {children}
                                  </code>
                                )
                              },
                              // 预格式化代码块
                              pre: ({ children }) => (
                                <pre className="bg-slate-950/50 rounded-lg p-3 overflow-x-auto my-2 border border-slate-800">
                                  {children}
                                </pre>
                              )
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {/* Token 统计 (仅 assistant) */}
                    {msg.usage && (
                      <div className="mt-2 pt-2 border-t border-slate-700/50">
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <span className="text-green-400">→</span>
                            输入: {formatTokens(msg.usage.input_tokens)}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="text-blue-400">←</span>
                            输出: {formatTokens(msg.usage.output_tokens)}
                          </span>
                          <span className="text-slate-600">
                            总计: {formatTokens(msg.usage.input_tokens + msg.usage.output_tokens)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-700 bg-slate-800/30">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{messages.length} 条消息</span>
            <span>项目: {session.projectName}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
