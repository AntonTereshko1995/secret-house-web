declare global {
  interface Window {
    __env__?: Record<string, string>
  }
}

export function getEnv(key: string, fallback = ''): string {
  return window.__env__?.[key] || (import.meta.env[key] as string) || fallback
}
