/**
 * API client for the secret-house-api backend service.
 * Base URL is configured via VITE_API_URL environment variable.
 */

import { logger } from './logger'
import { getEnv } from '../utils/env'

const getApiBase = () => getEnv('VITE_API_URL').trim()

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
  hasBathTub?: boolean
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
  hasBathTub: boolean
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
  const url = new URL(`${getApiBase()}${path}`, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }
  const fullUrl = url.toString()
  logger.debug('api_request', { method: 'GET', path, url: fullUrl, api_base: getApiBase() })
  let response: Response
  try {
    response = await fetch(fullUrl)
  } catch (networkErr) {
    const errName = networkErr instanceof Error ? networkErr.name : 'UnknownError'
    const errMsg = networkErr instanceof Error ? networkErr.message : String(networkErr)
    logger.error('api_network_error', { method: 'GET', path, url: fullUrl, api_base: getApiBase(), error_name: errName, error_message: errMsg })
    throw networkErr
  }
  if (!response.ok) {
    const text = await response.text()
    logger.error('api_error', { method: 'GET', path, url: fullUrl, status: response.status, body: text })
    throw new Error(`API error ${response.status}: ${text}`)
  }
  logger.debug('api_response', { method: 'GET', path, status: response.status })
  return response.json() as Promise<T>
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  logger.debug('api_request', { method: 'POST', path })
  const response = await fetch(`${getApiBase()}${path}`, {
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
  const toNaiveISO = (d: Date) => d.toISOString().slice(0, 19) // "YYYY-MM-DDTHH:mm:ss"
  const result = await apiPost<AvailabilityResponse>('/api/bookings/check-availability', {
    startDatetime: toNaiveISO(startDatetime),
    endDatetime: toNaiveISO(endDatetime),
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
    contact: payload.contactType === 'telegram' ? `@${payload.telegram}` : payload.phone,
  })
  const result = await apiPost<BookingCreateResponse>('/api/bookings', payload)
  logger.info('booking_created', { bookingId: result.bookingId })
  return result
}

/**
 * Validate a gift certificate code.
 */
export async function validateGiftCode(code: string): Promise<GiftValidateResponse> {
  const result = await apiGet<GiftValidateResponse>('/api/gifts/validate', { code })
  if (result.valid) {
    logger.info('gift_code_validated', { giftId: result.giftId, tariff: result.tariff })
  } else {
    logger.warn('gift_code_invalid', { message: result.message })
  }
  return result
}

// ---------------------------------------------------------------------------
// Gift Certificate
// ---------------------------------------------------------------------------

export interface GiftPurchaseResponse {
  giftId: number
  code: string
  price: number
  message: string
}

/**
 * Submit a gift certificate purchase request.
 * Uses multipart form data (receipt file + gift options).
 */
export async function submitGiftPurchase(
  giftData: import('../types/gift.types').GiftFormData
): Promise<GiftPurchaseResponse> {
  const form = new FormData()
  form.append('tariff', giftData.tariff!)
  form.append('hasSauna', String(giftData.hasSauna))
  form.append('hasSecretRoom', String(giftData.hasSecretRoom))
  form.append('hasAdditionalBedroom', String(giftData.hasExtraBedroom))
  form.append('hasBathTub', String(giftData.hasBathTub))
  const contact = giftData.contactType === 'telegram'
    ? `@${giftData.telegram}`
    : giftData.phone!
  form.append('contact', contact)
  form.append('price', String(giftData.totalPrice))
  if (giftData.receiptFile) {
    form.append('file', giftData.receiptFile)
  }

  logger.info('gift_purchase_submit', {
    tariff: giftData.tariff,
    hasSauna: giftData.hasSauna,
    hasSecretRoom: giftData.hasSecretRoom,
    hasExtraBedroom: giftData.hasExtraBedroom,
    hasBathTub: giftData.hasBathTub,
    totalPrice: giftData.totalPrice,
    contactType: giftData.contactType,
    hasReceipt: !!giftData.receiptFile,
  })

  const response = await fetch(`${getApiBase()}/api/gifts/purchase`, {
    method: 'POST',
    body: form,
  })

  if (!response.ok) {
    const detail = await response.json().catch(() => ({ detail: response.statusText }))
    const message = detail?.detail ?? `API error ${response.status}`
    logger.error('gift_purchase_error', { status: response.status, detail: message })
    throw new Error(message)
  }

  logger.info('gift_purchase_success')
  return response.json() as Promise<GiftPurchaseResponse>
}

/**
 * Upload payment receipt file and notify admin via Telegram.
 */
export async function uploadReceipt(bookingId: number, file: File): Promise<void> {
  logger.info('receipt_upload_start', { bookingId, fileSize: file.size, fileType: file.type })
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${getApiBase()}/api/bookings/${bookingId}/receipt`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    logger.error('receipt_upload_error', { bookingId, status: response.status })
    throw new Error(`Receipt upload failed: ${response.status}`)
  }

  logger.info('receipt_upload_success', { bookingId })
}
