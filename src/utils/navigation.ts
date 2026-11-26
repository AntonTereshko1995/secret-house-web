/**
 * Predictable back/forward targets for the booking pages.
 *
 * PRPs/guest-review-display.md section A: every "Back"/"Return" control must
 * lead to a deterministic parent instead of `navigate(-1)` (which loops or
 * leaves the site when there is no history). The guest's contact is threaded
 * through the URL so "Мои бронирования" can auto-search the same contact.
 */

function withContact(path: string, contact?: string | null): string {
  const value = contact?.trim()
  return value ? `${path}?contact=${encodeURIComponent(value)}` : path
}

/** Booking detail → «Мои бронирования» (same contact if known). */
export function myBookingsUrl(contact?: string | null): string {
  return withContact('/my-bookings', contact)
}

/** Review form / reschedule / success → booking detail. */
export function bookingDetailUrl(publicId: string, contact?: string | null): string {
  return withContact(`/my-bookings/${publicId}`, contact)
}

/** Booking detail → review form (contact preserved). */
export function reviewUrl(publicId: string, contact?: string | null): string {
  return withContact(`/my-bookings/${publicId}/review`, contact)
}

/** Booking detail → reschedule page (contact preserved). */
export function rescheduleUrl(publicId: string, contact?: string | null): string {
  return withContact(`/my-bookings/${publicId}/reschedule`, contact)
}
