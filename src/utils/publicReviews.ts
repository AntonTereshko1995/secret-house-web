const MONTHS_RU = [
  'январь',
  'февраль',
  'март',
  'апрель',
  'май',
  'июнь',
  'июль',
  'август',
  'сентябрь',
  'октябрь',
  'ноябрь',
  'декабрь',
]

/**
 * "2026-11" → "ноябрь 2026" (Russian nominative month, as in «Гость · ноябрь 2026»).
 * Returns an empty string for missing/invalid input.
 */
export function formatStayMonth(stayMonth: string | null | undefined): string {
  if (!stayMonth) return ''
  const match = /^(\d{4})-(\d{2})/.exec(stayMonth)
  if (!match) return ''
  const year = Number(match[1])
  const month = Number(match[2])
  if (!Number.isInteger(month) || month < 1 || month > 12) return ''
  return `${MONTHS_RU[month - 1]} ${year}`
}

/** 9.333333 → "9.3"; empty string for missing/non-finite input. */
export function formatAvgRating(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return ''
  return value.toFixed(1)
}

/** 1 → "1 отзыв", 2 → "2 отзыва", 5 → "5 отзывов". */
export function formatReviewCount(count: number): string {
  const n = Math.abs(Math.trunc(count)) % 100
  const last = n % 10
  if (n > 10 && n < 20) return `${count} отзывов`
  if (last === 1) return `${count} отзыв`
  if (last >= 2 && last <= 4) return `${count} отзыва`
  return `${count} отзывов`
}
