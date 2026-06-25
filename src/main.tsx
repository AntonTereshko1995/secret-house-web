import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { logger } from './services/logger'
import { getEnv } from './utils/env'
import { LoadingProvider } from './context/LoadingContext'
import { ErrorBoundary } from './components/ErrorBoundary'

// Global error handlers
window.addEventListener('error', (event) => {
  const isCrossOrigin = !event.filename && event.lineno === 0
  if (isCrossOrigin) return // browser extensions or cross-origin scripts — not actionable
  logger.error('uncaught_error', {
    error_message: event.message || '(no message)',
    error_name: event.error?.name ?? 'UnknownError',
    source: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack,
    page_url: window.location.href,
  })
})

window.addEventListener('unhandledrejection', (event) => {
  const err = event.reason
  logger.error('unhandled_rejection', {
    error_message: err instanceof Error ? err.message : String(err),
    error_name: err instanceof Error ? err.name : typeof err,
    stack: err instanceof Error ? err.stack : undefined,
    page_url: window.location.href,
  })
})

// Flush logs before the tab closes
window.addEventListener('beforeunload', () => {
  logger.flush()
})

logger.info('app_start', {
  url: window.location.href,
  api_url: getEnv('VITE_API_URL'),
  runtime_env: window.__env__ ?? null,
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <LoadingProvider>
          <App />
        </LoadingProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
