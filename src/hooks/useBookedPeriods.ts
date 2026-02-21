import { useEffect, useState } from 'react'
import { fetchBookedPeriods, type BookedPeriodDTO } from '../services/api'
import type { BookedPeriod } from '../utils/booking'

/**
 * Formats a Date as "YYYY-MM-DD" for the API query string.
 */
function toDateParam(d: Date): string {
  return d.toISOString().slice(0, 10)
}

interface UseBookedPeriodsResult {
  periods: BookedPeriod[]
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Fetches active booked periods from the API for a ±6 month window.
 * Falls back to an empty array on network error so the calendar stays usable.
 */
export function useBookedPeriods(): UseBookedPeriodsResult {
  const [periods, setPeriods] = useState<BookedPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false

    const from = new Date()
    from.setDate(1) // start of current month

    const to = new Date()
    to.setMonth(to.getMonth() + 6)
    to.setDate(0) // end of 6-month window

    setLoading(true)
    setError(null)

    fetchBookedPeriods(toDateParam(from), toDateParam(to))
      .then((dtos: BookedPeriodDTO[]) => {
        if (cancelled) return
        const mapped: BookedPeriod[] = dtos.map((dto) => ({
          checkIn: new Date(dto.checkIn),
          checkOut: new Date(dto.checkOut),
          bookingId: String(dto.bookingId),
        }))
        setPeriods(mapped)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Ошибка загрузки занятых дат'
        setError(message)
        console.error('[useBookedPeriods]', message)
        // Keep periods empty — calendar remains functional, just shows nothing booked
        setPeriods([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [tick])

  return { periods, loading, error, refetch: () => setTick((t) => t + 1) }
}
