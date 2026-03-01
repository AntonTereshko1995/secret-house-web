/**
 * API client for the secret-house-api backend service.
 * Base URL is configured via VITE_API_URL environment variable.
 */

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

export interface BookingCreatePayload {
  checkInDate: string         // ISO datetime
  checkOutDate: string        // ISO datetime
  tariff: string
  giftCertificateCode?: string
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
  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${await response.text()}`)
  }
  return response.json() as Promise<T>
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const detail = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(detail?.detail ?? `API error ${response.status}`)
  }
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
  return apiGet<BookedPeriodDTO[]>('/api/bookings/periods', {
    from_date: fromDate,
    to_date: toDate,
  })
}

/**
 * Check if a proposed booking interval is available.
 */
export async function checkAvailability(
  startDatetime: Date,
  endDatetime: Date,
): Promise<AvailabilityResponse> {
  return apiPost<AvailabilityResponse>('/api/bookings/check-availability', {
    startDatetime: startDatetime.toISOString(),
    endDatetime: endDatetime.toISOString(),
  })
}

/**
 * Validate a promotional code.
 */
export async function validatePromocodeApi(
  code: string,
  bookingDate: string,
  tariff: string,
): Promise<PromoValidateResponse> {
  return apiPost<PromoValidateResponse>('/api/promocodes/validate', {
    code,
    bookingDate,
    tariff,
  })
}

/**
 * Submit a completed booking form.
 */
export async function submitBooking(
  payload: BookingCreatePayload,
): Promise<BookingCreateResponse> {
  return apiPost<BookingCreateResponse>('/api/bookings', payload)
}

/**
 * Upload payment receipt file and notify admin via Telegram.
 */
export async function uploadReceipt(bookingId: number, file: File): Promise<void> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/receipt`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Receipt upload failed: ${response.status}`)
  }
}
