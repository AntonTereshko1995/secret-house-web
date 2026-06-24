declare global {
  interface Window {
    __env__?: Record<string, string>
  }
}

export function getEnv(key: string, fallback = ''): string {
  const runtimeEnv = typeof window !== 'undefined' ? window.__env__ : undefined
  return runtimeEnv?.[key] || (import.meta.env[key] as string) || fallback
}
