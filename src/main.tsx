import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { logger } from './services/logger'
import { LoadingProvider } from './context/LoadingContext'
import { ErrorBoundary } from './components/ErrorBoundary'

// Global error handlers
window.addEventListener('error', (event) => {
  const isCrossOrigin = !event.filename && event.lineno === 0
  logger.error('uncaught_error', {
    error_message: event.message || '(no message)',
    error_name: event.error?.name ?? (isCrossOrigin ? 'CrossOriginError' : 'UnknownError'),
    source: event.filename || '(cross-origin or extension)',
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack ?? '(no stack — likely cross-origin script)',
    page_url: window.location.href,
    is_cross_origin: isCrossOrigin,
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

logger.info('app_start', { url: window.location.href })

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
