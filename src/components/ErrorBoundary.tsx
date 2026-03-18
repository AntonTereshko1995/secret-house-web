import { Component, type ErrorInfo, type ReactNode } from 'react'
import { logger } from '../services/logger'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error('react_render_error', {
      error_message: error.message,
      error_name: error.name,
      stack: error.stack,
      component_stack: info.componentStack ?? undefined,
      page_url: window.location.href,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
          <div className="text-center">
            <p className="text-lg text-gray-400">Что-то пошло не так. Попробуйте обновить страницу.</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
