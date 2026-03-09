/**
 * API client for the secret-house-api backend service.
 * Base URL is configured via VITE_API_URL environment variable.
 */

import { logger } from './logger'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

// ---------------------------------------------------------------------------
// Response types (mirror backend Pydantic schemas)
// ---------------------------------------------------------------------------

export interface BookedPeriodDTO {
  checkIn: string   // ISO datetime string
  checkOut: string  // ISO datetime string
  bookingId: number
}

export interface AvailabilityResponse {
  available: boolean
}

export interface PromoValidateResponse {
  valid: boolean
  discount: number
  discountPercentage: number
  message: string
  promocodeId?: number
}

export interface BookingCreateResponse {
  bookingId: number
  message: string
}

// ---------------------------------------------------------------------------
// Request types
// ---------------------------------------------------------------------------

export interface GiftValidateResponse {
  valid: boolean
  message: string
  giftId?: number
  tariff?: string
  hasSauna?: boolean
  hasSecretRoom?: boolean
  hasAdditionalBedroom?: boolean
  price?: number
}

export interface BookingCreatePayload {
  checkInDate: string         // ISO datetime
  checkOutDate: string        // ISO datetime
  tariff: string
  giftCertificateCode?: string
  giftId?: number
  guestCount: number
  hasPhotoshoot: boolean
  hasSauna: boolean
  bedroomType?: string
  hasExtraBedroom: boolean
  hasSecretRoom: boolean
  comment?: string
  promocode?: string
  promocodeId?: number
  wineSelection: string[]
  needsTransfer: boolean
  transferAddress?: string
  totalPrice: number
  prepaymentPrice?: number
  contactType: string
  telegram?: string
  phone?: string
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }
  logger.debug('api_request', { method: 'GET', path })
  const response = await fetch(url.toString())
  if (!response.ok) {
    const text = await response.text()
    logger.error('api_error', { method: 'GET', path, status: response.status, body: text })
    throw new Error(`API error ${response.status}: ${text}`)
  }
  logger.debug('api_response', { method: 'GET', path, status: response.status })
  return response.json() as Promise<T>
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  logger.debug('api_request', { method: 'POST', path })
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const detail = await response.json().catch(() => ({ detail: response.statusText }))
    const message = detail?.detail ?? `API error ${response.status}`
    logger.error('api_error', { method: 'POST', path, status: response.status, detail: message })
    throw new Error(message)
  }
  logger.debug('api_response', { method: 'POST', path, status: response.status })
  return response.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// Public API functions
// ---------------------------------------------------------------------------

/**
 * Fetch active booked periods for a date range.
 * @param fromDate - start of range (YYYY-MM-DD)
 * @param toDate   - end of range   (YYYY-MM-DD)
 */
export async function fetchBookedPeriods(
  fromDate: string,
  toDate: string,
): Promise<BookedPeriodDTO[]> {
  const result = await apiGet<BookedPeriodDTO[]>('/api/bookings/periods', {
    from_date: fromDate,
    to_date: toDate,
  })
  logger.info('booked_periods_loaded', { count: result.length, fromDate, toDate })
  return result
}

/**
 * Check if a proposed booking interval is available.
 */
export async function checkAvailability(
  startDatetime: Date,
  endDatetime: Date,
): Promise<AvailabilityResponse> {
  const result = await apiPost<AvailabilityResponse>('/api/bookings/check-availability', {
    startDatetime: startDatetime.toISOString(),
    endDatetime: endDatetime.toISOString(),
  })
  logger.info('availability_checked', {
    available: result.available,
    checkIn: startDatetime.toISOString(),
    checkOut: endDatetime.toISOString(),
  })
  return result
}

/**
 * Validate a promotional code.
 */
export async function validatePromocodeApi(
  code: string,
  bookingDate: string,
  tariff: string,
): Promise<PromoValidateResponse> {
  const result = await apiPost<PromoValidateResponse>('/api/promocodes/validate', {
    code,
    bookingDate,
    tariff,
  })
  logger.info('promocode_validated', {
    valid: result.valid,
    discount: result.discount,
    tariff,
  })
  return result
}

/**
 * Submit a completed booking form.
 */
export async function submitBooking(
  payload: BookingCreatePayload,
): Promise<BookingCreateResponse> {
  logger.info('booking_submit', {
    tariff: payload.tariff,
    guestCount: payload.guestCount,
    totalPrice: payload.totalPrice,
    hasPhotoshoot: payload.hasPhotoshoot,
    hasSauna: payload.hasSauna,
    hasExtraBedroom: payload.hasExtraBedroom,
    hasSecretRoom: payload.hasSecretRoom,
    needsTransfer: payload.needsTransfer,
    contactType: payload.contactType,
  })
  const result = await apiPost<BookingCreateResponse>('/api/bookings', payload)
  logger.info('booking_created', { bookingId: result.bookingId })
  return result
}

/**
 * Validate a gift certificate code.
 */
export async function validateGiftCode(code: string): Promise<GiftValidateResponse> {
  return apiGet<GiftValidateResponse>('/api/gifts/validate', { code })
}

/**
 * Upload payment receipt file and notify admin via Telegram.
 */
export async function uploadReceipt(bookingId: number, file: File): Promise<void> {
  logger.info('receipt_upload_start', { bookingId, fileSize: file.size, fileType: file.type })
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/receipt`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    logger.error('receipt_upload_error', { bookingId, status: response.status })
    throw new Error(`Receipt upload failed: ${response.status}`)
  }

  logger.info('receipt_upload_success', { bookingId })
}
