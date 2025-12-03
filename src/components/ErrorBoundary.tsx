import React, { Component, ErrorInfo, ReactNode } from 'react'
import { LanguageProvider } from '../contexts/LanguageContext'
import { StoreProvider } from '../state/apiStore'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <StoreProvider>
          <LanguageProvider>
            <ErrorFallback error={this.state.error} />
          </LanguageProvider>
        </StoreProvider>
      )
    }

    return this.props.children
  }
}

function ErrorFallback({ error }: { error?: Error }) {
  const handleReload = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-4xl">⚠️</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-100">Oops! Something went wrong</h1>
            <p className="text-slate-400">
              We encountered an unexpected error. Please try refreshing the page or going back to the home page.
            </p>
          </div>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-left">
            <h3 className="text-red-400 font-semibold mb-2">Error Details:</h3>
            <pre className="text-xs text-red-300 whitespace-pre-wrap break-words">
              {error.message}
              {error.stack && `\n\nStack trace:\n${error.stack}`}
            </pre>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleReload}
            className="flex-1 btn-primary hover-scale"
          >
            🔄 Reload Page
          </button>
          <button
            onClick={handleGoHome}
            className="flex-1 btn-ghost hover-scale"
          >
            🏠 Go Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default ErrorBoundary



