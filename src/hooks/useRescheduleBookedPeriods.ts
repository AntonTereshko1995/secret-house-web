import { useEffect, useState } from 'react'
import { fetchBookedPeriods, type BookedPeriodDTO } from '../services/api'
import { adminGetBookedPeriods } from '../services/adminApi'
import type { BookedPeriod } from '../utils/booking'

function toDateParam(d: Date): string {
  return d.toISOString().slice(0, 10)
}

interface UseRescheduleBookedPeriodsResult {
  periods: BookedPeriod[]
  loading: boolean
  error: string | null
}

/**
 * Fetches booked periods for a reschedule calendar, excluding the booking
 * being rescheduled.
 *
 * - Admin mode: uses the admin API (all non-canceled/done bookings, including
 *   unprepaymented). Server-side exclusion via exclude_id.
 * - User mode: uses the public API (prepaymented bookings only). Client-side
 *   exclusion by bookingId.
 */
export function useRescheduleBookedPeriods(
  bookingId: number,
  isAdmin: boolean,
): UseRescheduleBookedPeriodsResult {
  const [periods, setPeriods] = useState<BookedPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const from = new Date()
    from.setDate(1)
    const to = new Date()
    to.setMonth(to.getMonth() + 6)
    to.setDate(0)

    setLoading(true)
    setError(null)

    const fromStr = toDateParam(from)
    const toStr = toDateParam(to)

    const request: Promise<BookedPeriodDTO[]> = isAdmin
      ? adminGetBookedPeriods(fromStr, toStr, bookingId)
      : fetchBookedPeriods(fromStr, toStr)

    request
      .then((dtos) => {
        if (cancelled) return
        const mapped: BookedPeriod[] = dtos
          .filter((dto) => isAdmin || dto.bookingId !== bookingId)
          .map((dto) => ({
            checkIn: new Date(dto.checkIn),
            checkOut: new Date(dto.checkOut),
            bookingId: String(dto.bookingId),
          }))
        setPeriods(mapped)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Ошибка загрузки занятых дат')
        setPeriods([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [bookingId, isAdmin])

  return { periods, loading, error }
}
