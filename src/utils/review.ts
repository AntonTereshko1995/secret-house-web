import type { RewardPromoStatus } from '../types/booking.types'

/**
 * Parses a `YYYY-MM-DD` date string without timezone surprises:
 * `new Date('2026-12-05')` is interpreted as UTC midnight and can shift a day
 * in timezones west of UTC, so we build the date from parts instead.
 */
export function parseDateOnly(value: string | null): Date | null {
  if (!value) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return null
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

/** "2026-12-05" → "05.12" (empty string for null/empty/invalid input). */
export function formatDayMonth(value: string | null): string {
  const date = parseDateOnly(value)
  if (!date) return ''
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}.${month}`
}

/** "2026-12-05" → "05.12.2026" (empty string for null/empty/invalid input). */
export function formatFullDate(value: string | null): string {
  const date = parseDateOnly(value)
  if (!date) return ''
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}.${month}.${date.getFullYear()}`
}

export interface RewardPromoDisplay {
  /** Main text: the code itself, or a status phrase. */
  label: string
  /** Optional secondary text, e.g. the validity date. */
  detail?: string
}

/**
 * What to show for the reward promo code on a booking card / detail page.
 * `expired` and missing codes show nothing; `used` is a plain status phrase.
 */
export function getRewardPromoDisplay(
  status: RewardPromoStatus,
  code: string | null,
  validUntil: string | null,
): RewardPromoDisplay | null {
  if (!code || status === 'expired') return null
  if (status === 'used') return { label: 'Промокод за отзыв использован' }
  return {
    label: code,
    detail: validUntil ? `до ${formatFullDate(validUntil)}` : undefined,
  }
}
