const ANON_ID_KEY = 'tsh_anon_id'

function generateId(): string {
  return crypto.randomUUID()
}

/**
 * Persistent anonymous user ID — survives page reloads and new tabs.
 * Stored in localStorage. Resets only when user clears browser data.
 */
export function getAnonId(): string {
  try {
    let id = localStorage.getItem(ANON_ID_KEY)
    if (!id) {
      id = generateId()
      localStorage.setItem(ANON_ID_KEY, id)
    }
    return id
  } catch {
    // localStorage blocked (private mode on some browsers)
    return 'blocked'
  }
}

/**
 * Session ID — unique per browser tab, resets on tab close.
 * Stored in sessionStorage.
 */
export const sessionId: string = (() => {
  try {
    let id = sessionStorage.getItem('tsh_session_id')
    if (!id) {
      id = generateId()
      sessionStorage.setItem('tsh_session_id', id)
    }
    return id
  } catch {
    return 'blocked'
  }
})()
