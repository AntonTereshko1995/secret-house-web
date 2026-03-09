import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { logger } from './services/logger'
import { LoadingProvider } from './context/LoadingContext'

// Global error handlers
window.addEventListener('error', (event) => {
  logger.error('uncaught_error', {
    message: event.message,
    source: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack,
  })
})

window.addEventListener('unhandledrejection', (event) => {
  logger.error('unhandled_rejection', {
    reason: String(event.reason),
    stack: event.reason instanceof Error ? event.reason.stack : undefined,
  })
})

// Flush logs before the tab closes
window.addEventListener('beforeunload', () => {
  logger.flush()
})

logger.info('app_start', { url: window.location.href })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LoadingProvider>
        <App />
      </LoadingProvider>
    </BrowserRouter>
  </StrictMode>,
)
