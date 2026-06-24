import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { StrictMode } from 'react'
import App from './App'
import { LoadingProvider } from './context/LoadingContext'

export async function prerender({ url }: { url: string }) {
  const html = renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <LoadingProvider>
          <App />
        </LoadingProvider>
      </StaticRouter>
    </StrictMode>
  )

  return {
    html,
    links: new Set(['/availability']),
  }
}
