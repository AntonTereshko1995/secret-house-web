import { describe, it, expect } from 'vitest'
import {
  parseDateOnly,
  formatDayMonth,
  formatFullDate,
  getRewardPromoDisplay,
} from './review'

describe('parseDateOnly', () => {
  it('parses a YYYY-MM-DD string without timezone shift', () => {
    const d = parseDateOnly('2026-12-05')
    expect(d?.getFullYear()).toBe(2026)
    expect(d?.getMonth()).toBe(11) // December
    expect(d?.getDate()).toBe(5)
  })

  it('returns null for null/empty/invalid input', () => {
    expect(parseDateOnly(null)).toBeNull()
    expect(parseDateOnly('')).toBeNull()
    expect(parseDateOnly('not-a-date')).toBeNull()
  })
})

describe('formatDayMonth', () => {
  it('formats as ДД.ММ', () => {
    expect(formatDayMonth('2026-12-05')).toBe('05.12')
    expect(formatDayMonth('2026-01-02')).toBe('02.01')
  })

  it('returns empty string for missing input', () => {
    expect(formatDayMonth(null)).toBe('')
    expect(formatDayMonth('')).toBe('')
  })
})

describe('formatFullDate', () => {
  it('formats as ДД.ММ.ГГГГ', () => {
    expect(formatFullDate('2026-12-05')).toBe('05.12.2026')
    expect(formatFullDate('2027-01-02')).toBe('02.01.2027')
  })

  it('returns empty string for missing input', () => {
    expect(formatFullDate(null)).toBe('')
  })
})

describe('getRewardPromoDisplay', () => {
  it('shows the code and validity for an active code', () => {
    expect(getRewardPromoDisplay('active', 'REV1A2B3C4D', '2026-12-05')).toEqual({
      label: 'REV1A2B3C4D',
      detail: 'до 05.12.2026',
    })
  })

  it('shows a status phrase for a used code', () => {
    expect(getRewardPromoDisplay('used', 'REV1A2B3C4D', null)).toEqual({
      label: 'Промокод за отзыв использован',
    })
  })

  it('hides an expired code', () => {
    expect(getRewardPromoDisplay('expired', 'REV1A2B3C4D', '2026-12-05')).toBeNull()
  })

  it('hides when there is no code', () => {
    expect(getRewardPromoDisplay('active', null, null)).toBeNull()
    expect(getRewardPromoDisplay(null, null, null)).toBeNull()
  })
})
