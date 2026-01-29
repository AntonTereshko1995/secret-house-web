/**
 * Generates Telegram bot deep link with optional room parameter
 * @param room - Room category (living-room, bedroom, kitchen, exterior)
 * @returns Telegram bot link with start parameter
 */
export function getTelegramLink(room?: string): string {
  const botUsername = import.meta.env.VITE_BOT_USERNAME

  if (!botUsername) {
    console.warn('VITE_BOT_USERNAME not set in .env file')
    return '#'
  }

  const payload = room ? `book_${room}` : 'book_general'
  return `https://t.me/${botUsername}?start=${payload}`
}

/**
 * Opens Telegram link in new tab
 */
export function openTelegramBot(room?: string): void {
  const link = getTelegramLink(room)
  if (link !== '#') {
    window.open(link, '_blank', 'noopener,noreferrer')
  }
}
