/**
 * Admin API client — all requests carry the X-Admin-Token header.
 * On 401, clears the stored token and throws an 'UNAUTHORIZED' error
 * so callers can redirect to the login form.
 */

import { getEnv } from '../utils/env'
import type { BookedPeriodDTO } from './api'

const getApiBase = () => getEnv('VITE_API_URL').trim()

const ADMIN_TOKEN_KEY = 'admin_token'

export const getAdminToken = (): string => localStorage.getItem(ADMIN_TOKEN_KEY) ?? ''
export const setAdminToken = (t: string): void => { localStorage.setItem(ADMIN_TOKEN_KEY, t) }
export const clearAdminToken = (): void => { localStorage.removeItem(ADMIN_TOKEN_KEY) }

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminBookingDTO {
  bookingId: number
  startDate: string
  endDate: string
  tariff: string
  guestCount: number
  hasPhotoshoot: boolean
  hasSauna: boolean
  hasExtraBedroom: boolean
  hasSecretRoom: boolean
  hasBathTub: boolean
  isCanceled: boolean
  isDateChanged: boolean
  isPrepaymented: boolean
  isDone: boolean
  totalPrice: number
  prepaymentPrice: number
  comment?: string
  wineSelection: string[]
  transferAddress?: string
  isFuture: boolean
  source?: string
  userContact?: string
  userName?: string
}

export interface AdminBookingsPage {
  items: AdminBookingDTO[]
  total: number
  page: number
  pageSize: number
}

export interface AdminUpdateServicesPayload {
  hasPhotoshoot: boolean
  hasSauna: boolean
  hasBathTub: boolean
  hasExtraBedroom: boolean
  hasSecretRoom: boolean
  wineSelection: string[]
  needsTransfer: boolean
  transferAddress?: string
  totalPrice: number
}

// ---------------------------------------------------------------------------
// Base fetcher
// ---------------------------------------------------------------------------

async function adminFetch<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    'X-Admin-Token': getAdminToken(),
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  const response = await fetch(`${getApiBase()}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (response.status === 401) {
    clearAdminToken()
    throw new Error('UNAUTHORIZED')
  }
  if (!response.ok) {
    const detail = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error((detail as { detail?: string })?.detail ?? `API error ${response.status}`)
  }
  return response.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// Auth (public — does not use adminFetch)
// ---------------------------------------------------------------------------

export async function adminLogin(username: string, password: string): Promise<string> {
  const response = await fetch(`${getApiBase()}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!response.ok) {
    const detail = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error((detail as { detail?: string })?.detail ?? 'Ошибка входа')
  }
  const { token } = await (response.json() as Promise<{ token: string }>)
  setAdminToken(token)
  return token
}

// ---------------------------------------------------------------------------
// Booking reads
// ---------------------------------------------------------------------------

export const adminGetBookings = (
  sortOrder = 'desc',
  status = 'all',
  page = 1,
  pageSize = 50,
): Promise<AdminBookingsPage> =>
  adminFetch<AdminBookingsPage>(
    'GET',
    `/api/admin/bookings?sort_order=${sortOrder}&status=${status}&page=${page}&page_size=${pageSize}`,
  )

export const adminGetBooking = (id: number): Promise<AdminBookingDTO> =>
  adminFetch<AdminBookingDTO>('GET', `/api/admin/bookings/${id}`)

export const adminGetBookedPeriods = (
  fromDate: string,
  toDate: string,
  excludeId: number,
): Promise<BookedPeriodDTO[]> =>
  adminFetch<BookedPeriodDTO[]>(
    'GET',
    `/api/admin/bookings/periods?from_date=${fromDate}&to_date=${toDate}&exclude_id=${excludeId}`,
  )

// ---------------------------------------------------------------------------
// Booking writes
// ---------------------------------------------------------------------------

export const adminConfirmBooking = (id: number): Promise<{ bookingId: number; message: string }> =>
  adminFetch<{ bookingId: number; message: string }>(
    'POST',
    `/api/admin/bookings/${id}/confirm`,
    {},
  )

export const adminCancelBooking = (id: number): Promise<{ bookingId: number; message: string }> =>
  adminFetch<{ bookingId: number; message: string }>(
    'POST',
    `/api/admin/bookings/${id}/cancel`,
    {},
  )

export const adminUpdateTariff = (
  id: number,
  tariff: string,
  totalPrice: number,
): Promise<{ bookingId: number; message: string }> =>
  adminFetch<{ bookingId: number; message: string }>(
    'PATCH',
    `/api/admin/bookings/${id}/tariff`,
    { tariff, totalPrice },
  )

export const adminUpdateServices = (
  id: number,
  payload: AdminUpdateServicesPayload,
): Promise<{ bookingId: number; message: string }> =>
  adminFetch<{ bookingId: number; message: string }>(
    'PATCH',
    `/api/admin/bookings/${id}/services`,
    payload,
  )

export const adminRescheduleBooking = (
  id: number,
  checkInDate: string,
  checkOutDate: string,
  totalPrice: number,
): Promise<{ bookingId: number; message: string }> =>
  adminFetch<{ bookingId: number; message: string }>(
    'PATCH',
    `/api/admin/bookings/${id}/reschedule`,
    { checkInDate, checkOutDate, totalPrice },
  )

export const adminUpdatePrice = (
  id: number,
  totalPrice: number,
  prepaymentPrice: number,
): Promise<{ bookingId: number; message: string }> =>
  adminFetch<{ bookingId: number; message: string }>(
    'PATCH',
    `/api/admin/bookings/${id}/price`,
    { totalPrice, prepaymentPrice },
  )
