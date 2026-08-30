import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getBookingDetail, rescheduleBooking } from '../services/api'
import { logger } from '../services/logger'
import type { BookingDetailDTO } from '../types/booking.types'
import { TARIFF_OPTIONS } from '../utils/booking'
import RescheduleView from '../components/RescheduleView'

export default function ReschedulePage() {
  const { publicId } = useParams<{ publicId: string }>()
  const navigate = useNavigate()

  const [booking, setBooking] = useState<BookingDetailDTO | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadBooking = useCallback(async () => {
    if (!publicId) return
    setLoading(true)
    try {
      const data = await getBookingDetail(publicId)
      setBooking(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось загрузить бронирование'
      logger.error('reschedule_load_error', { publicId, error_message: message })
      setLoadError(message)
    } finally {
      setLoading(false)
    }
  }, [publicId])

  useEffect(() => { loadBooking() }, [loadBooking])

  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-gradient flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-sm">Загружаем бронирование…</span>
        </div>
      </div>
    )
  }

  if (loadError || !booking) {
    return (
      <div className="min-h-screen bg-luxury-gradient flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{loadError ?? 'Бронирование не найдено'}</p>
          <button onClick={() => navigate(-1)} className="text-amber-400 hover:text-amber-300 text-sm underline">
            Вернуться назад
          </button>
        </div>
      </div>
    )
  }

  const tariffName = TARIFF_OPTIONS.find(t => t.id === booking.tariff)?.name ?? booking.tariff

  return (
    <RescheduleView
      booking={booking}
      tariffName={tariffName}
      onReschedule={async (ci, co, price) => {
        await rescheduleBooking(booking.publicId, ci, co, price)
        navigate(`/my-bookings/${booking.publicId}`, { replace: true })
      }}
      onBack={() => navigate(-1)}
    />
  )
}
