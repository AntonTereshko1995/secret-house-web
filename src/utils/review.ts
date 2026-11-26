import type { RewardPromoStatus, BookingDetailDTO } from '../types/booking.types'

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

// ─── Review form (PRPs/guest-review-display.md, section B) ───────────────────

export const RATING_QUESTION_KEYS = [
  'ratingExpectations',
  'ratingComfort',
  'ratingCleanliness',
  'ratingCommunication',
  'ratingLocation',
  'ratingRecommendation',
] as const

export type RatingKey = (typeof RATING_QUESTION_KEYS)[number]

export const TEXT_QUESTION_KEYS = ['likedMost', 'improvement', 'publicReview'] as const

export type TextKey = (typeof TEXT_QUESTION_KEYS)[number]

export type QuestionKey = RatingKey | TextKey

/** 6 rating questions + 3 text questions. */
export const TOTAL_QUESTION_COUNT = RATING_QUESTION_KEYS.length + TEXT_QUESTION_KEYS.length

export type ReviewPageState = 'form' | 'alreadyReviewed' | 'windowClosed' | 'unavailable'

type ReviewPageStateFields = Pick<
  BookingDetailDTO,
  'canReview' | 'feedbackSubmitted' | 'isCanceled' | 'isPrepaymented'
>

/**
 * Which screen ReviewPage shows instead of (or besides) the form.
 * Order follows the PRP: already reviewed first, then the form, then
 * canceled / not prepaid, and anything else means the window is closed.
 */
export function reviewPageState(booking: ReviewPageStateFields): ReviewPageState {
  if (booking.feedbackSubmitted) return 'alreadyReviewed'
  if (booking.canReview) return 'form'
  if (booking.isCanceled || !booking.isPrepaymented) return 'unavailable'
  return 'windowClosed'
}

/** A rating answer counts only as an integer 1..10. */
export function isRatingAnswered(value: string | number | undefined | null): boolean {
  if (value === null || value === undefined || value === '') return false
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isInteger(n) && n >= 1 && n <= 10
}

/** A text answer counts only when it has non-whitespace content. */
export function isTextAnswered(value: string | undefined | null): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

export function countAnsweredQuestions(
  ratings: Record<RatingKey, string | number | undefined | null>,
  texts: Record<TextKey, string | undefined | null>,
): number {
  let count = 0
  for (const key of RATING_QUESTION_KEYS) if (isRatingAnswered(ratings[key])) count += 1
  for (const key of TEXT_QUESTION_KEYS) if (isTextAnswered(texts[key])) count += 1
  return count
}

/** Keys of unanswered questions, in the order they are shown on the page. */
export function unansweredQuestionKeys(
  ratings: Record<RatingKey, string | number | undefined | null>,
  texts: Record<TextKey, string | undefined | null>,
): QuestionKey[] {
  const keys: QuestionKey[] = []
  for (const key of RATING_QUESTION_KEYS) if (!isRatingAnswered(ratings[key])) keys.push(key)
  for (const key of TEXT_QUESTION_KEYS) if (!isTextAnswered(texts[key])) keys.push(key)
  return keys
}
