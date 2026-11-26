import { describe, it, expect } from 'vitest'
import {
  parseDateOnly,
  formatDayMonth,
  formatFullDate,
  getRewardPromoDisplay,
  reviewPageState,
  countAnsweredQuestions,
  unansweredQuestionKeys,
  TOTAL_QUESTION_COUNT,
  type RatingKey,
  type TextKey,
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

describe('reviewPageState', () => {
  const base = {
    canReview: false,
    feedbackSubmitted: false,
    isCanceled: false,
    isPrepaymented: true,
  }

  it('shows "already reviewed" first, even for a canceled booking', () => {
    expect(reviewPageState({ ...base, feedbackSubmitted: true, isCanceled: true })).toBe('alreadyReviewed')
  })

  it('shows the form when the window is open', () => {
    expect(reviewPageState({ ...base, canReview: true })).toBe('form')
  })

  it('shows "window closed" when eligible but the window is not open', () => {
    expect(reviewPageState(base)).toBe('windowClosed')
  })

  it('shows "unavailable" for a canceled booking', () => {
    expect(reviewPageState({ ...base, isCanceled: true })).toBe('unavailable')
  })

  it('shows "unavailable" for a booking without prepayment', () => {
    expect(reviewPageState({ ...base, isPrepaymented: false })).toBe('unavailable')
  })

  it('shows "unavailable" when canceled and not prepaid', () => {
    expect(reviewPageState({ ...base, isCanceled: true, isPrepaymented: false })).toBe('unavailable')
  })
})

function emptyRatings(): Record<RatingKey, string> {
  return {
    ratingExpectations: '',
    ratingComfort: '',
    ratingCleanliness: '',
    ratingCommunication: '',
    ratingLocation: '',
    ratingRecommendation: '',
  }
}

function emptyTexts(): Record<TextKey, string> {
  return { likedMost: '', improvement: '', publicReview: '' }
}

function allAnswered() {
  return {
    ratings: {
      ratingExpectations: '10',
      ratingComfort: '9',
      ratingCleanliness: '8',
      ratingCommunication: '7',
      ratingLocation: '6',
      ratingRecommendation: '5',
    } satisfies Record<RatingKey, string>,
    texts: {
      likedMost: 'Всё понравилось',
      improvement: 'Ничего',
      publicReview: 'Отличный дом',
    } satisfies Record<TextKey, string>,
  }
}

describe('countAnsweredQuestions', () => {
  it('counts 0 for an empty form', () => {
    expect(countAnsweredQuestions(emptyRatings(), emptyTexts())).toBe(0)
  })

  it('counts all 9 when everything is answered', () => {
    const { ratings, texts } = allAnswered()
    expect(countAnsweredQuestions(ratings, texts)).toBe(TOTAL_QUESTION_COUNT)
    expect(TOTAL_QUESTION_COUNT).toBe(9)
  })

  it('counts only valid ratings and non-empty texts', () => {
    const ratings = { ...emptyRatings(), ratingExpectations: '0', ratingComfort: '11', ratingCleanliness: '5.5', ratingCommunication: '7' }
    const texts = { ...emptyTexts(), likedMost: '   ', improvement: 'Хорошо' }
    expect(countAnsweredQuestions(ratings, texts)).toBe(2)
  })
})

describe('unansweredQuestionKeys', () => {
  it('returns every key in display order for an empty form', () => {
    expect(unansweredQuestionKeys(emptyRatings(), emptyTexts())).toEqual([
      'ratingExpectations',
      'ratingComfort',
      'ratingCleanliness',
      'ratingCommunication',
      'ratingLocation',
      'ratingRecommendation',
      'likedMost',
      'improvement',
      'publicReview',
    ])
  })

  it('returns an empty list when everything is answered', () => {
    const { ratings, texts } = allAnswered()
    expect(unansweredQuestionKeys(ratings, texts)).toEqual([])
  })

  it('returns only the unanswered keys', () => {
    const { ratings, texts } = allAnswered()
    ratings.ratingLocation = ''
    texts.improvement = '  '
    expect(unansweredQuestionKeys(ratings, texts)).toEqual(['ratingLocation', 'improvement'])
  })
})
