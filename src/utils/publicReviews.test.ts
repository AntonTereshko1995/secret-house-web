import { describe, it, expect } from 'vitest'
import { formatStayMonth, formatAvgRating, formatReviewCount } from './publicReviews'

describe('formatStayMonth', () => {
  it('formats "2026-11" as «ноябрь 2026»', () => {
    expect(formatStayMonth('2026-11')).toBe('ноябрь 2026')
  })

  it('formats a leading-zero month', () => {
    expect(formatStayMonth('2026-01')).toBe('январь 2026')
    expect(formatStayMonth('2026-09')).toBe('сентябрь 2026')
  })

  it('returns empty string for missing/invalid input', () => {
    expect(formatStayMonth(null)).toBe('')
    expect(formatStayMonth(undefined)).toBe('')
    expect(formatStayMonth('')).toBe('')
    expect(formatStayMonth('2026-13')).toBe('')
    expect(formatStayMonth('not-a-month')).toBe('')
  })
})

describe('formatAvgRating', () => {
  it('rounds to one decimal', () => {
    expect(formatAvgRating(9.333333)).toBe('9.3')
    expect(formatAvgRating(9)).toBe('9.0')
  })

  it('returns empty string for missing/non-finite input', () => {
    expect(formatAvgRating(null)).toBe('')
    expect(formatAvgRating(undefined)).toBe('')
    expect(formatAvgRating(Number.NaN)).toBe('')
  })
})

describe('formatReviewCount', () => {
  it('uses the correct Russian plural form', () => {
    expect(formatReviewCount(1)).toBe('1 отзыв')
    expect(formatReviewCount(2)).toBe('2 отзыва')
    expect(formatReviewCount(5)).toBe('5 отзывов')
    expect(formatReviewCount(11)).toBe('11 отзывов')
    expect(formatReviewCount(21)).toBe('21 отзыв')
    expect(formatReviewCount(22)).toBe('22 отзыва')
    expect(formatReviewCount(25)).toBe('25 отзывов')
  })
})
