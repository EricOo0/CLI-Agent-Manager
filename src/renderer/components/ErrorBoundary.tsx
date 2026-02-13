import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-red-500 p-8">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <div className="bg-slate-800 p-4 rounded-lg border border-red-900 w-full max-w-2xl overflow-auto">
            <h2 className="text-lg font-semibold mb-2">{this.state.error?.toString()}</h2>
            <details className="whitespace-pre-wrap text-sm text-slate-400">
              {this.state.errorInfo?.componentStack}
            </details>
          </div>
          <button
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            onClick={() => window.location.reload()}
          >
            Reload Application
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
