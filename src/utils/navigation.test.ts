import { describe, it, expect } from 'vitest'
import {
  myBookingsUrl,
  bookingDetailUrl,
  reviewUrl,
  rescheduleUrl,
} from './navigation'

describe('myBookingsUrl', () => {
  it('returns the bare list when no contact is known', () => {
    expect(myBookingsUrl(null)).toBe('/my-bookings')
    expect(myBookingsUrl('')).toBe('/my-bookings')
    expect(myBookingsUrl(undefined)).toBe('/my-bookings')
  })

  it('appends the contact for auto-search', () => {
    expect(myBookingsUrl('@test_guest7')).toBe('/my-bookings?contact=%40test_guest7')
  })

  it('encodes phone contacts', () => {
    expect(myBookingsUrl('+375291234567')).toBe('/my-bookings?contact=%2B375291234567')
  })
})

describe('bookingDetailUrl', () => {
  it('builds the detail path without contact', () => {
    expect(bookingDetailUrl('abc-123')).toBe('/my-bookings/abc-123')
  })

  it('preserves the contact', () => {
    expect(bookingDetailUrl('abc-123', '@test_guest7')).toBe(
      '/my-bookings/abc-123?contact=%40test_guest7',
    )
  })
})

describe('reviewUrl', () => {
  it('builds the review path without contact', () => {
    expect(reviewUrl('abc-123')).toBe('/my-bookings/abc-123/review')
  })

  it('preserves the contact', () => {
    expect(reviewUrl('abc-123', '@test_guest7')).toBe(
      '/my-bookings/abc-123/review?contact=%40test_guest7',
    )
  })
})

describe('rescheduleUrl', () => {
  it('builds the reschedule path without contact', () => {
    expect(rescheduleUrl('abc-123')).toBe('/my-bookings/abc-123/reschedule')
  })

  it('preserves the contact', () => {
    expect(rescheduleUrl('abc-123', '@test_guest7')).toBe(
      '/my-bookings/abc-123/reschedule?contact=%40test_guest7',
    )
  })
})
