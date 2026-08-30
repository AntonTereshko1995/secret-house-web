import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getBookingDetail,
  cancelBooking,
  updateBookingTariff,
  updateBookingServices,
  rescheduleBooking,
  uploadReceipt,
} from '../services/api'
import { logger } from '../services/logger'
import type { BookingDetailDTO } from '../types/booking.types'
import { BookingDetailView, type BookingViewData, type BookingViewActions } from '../components/BookingDetailView'

function toViewData(b: BookingDetailDTO): BookingViewData {
  return { ...b }
}

export default function BookingDetailPage() {
  const { publicId } = useParams<{ publicId: string }>()
  const navigate = useNavigate()

  const [booking, setBooking] = useState<BookingDetailDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadBooking = useCallback(async () => {
    if (!publicId) return
    setLoading(true)
    setError(null)
    try {
      const data = await getBookingDetail(publicId)
      setBooking(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось загрузить бронирование'
      logger.error('booking_detail_load_error', { publicId, error_message: message })
      setError(message)
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

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-luxury-gradient flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error ?? 'Бронирование не найдено'}</p>
          <button onClick={() => navigate(-1)}
            className="text-amber-400 hover:text-amber-300 text-sm underline">
            Вернуться к моим бронированиям
          </button>
        </div>
      </div>
    )
  }

  const pid = booking.publicId
  const actions: BookingViewActions = {
    saveTariff:    async (tariff, price)   => { await updateBookingTariff(pid, tariff, price) },
    saveServices:  async (payload)         => { await updateBookingServices(pid, payload) },
    reschedule:    async (ci, co, price)   => { await rescheduleBooking(pid, ci, co, price) },
    cancel:        async ()                => { await cancelBooking(pid) },
    uploadReceipt: async (file)            => { await uploadReceipt(pid, file) },
  }

  return (
    <BookingDetailView
      booking={toViewData(booking)}
      mode="user"
      onBack={() => navigate(-1)}
      onReload={loadBooking}
      actions={actions}
      onReschedule={() => navigate(`/my-bookings/${pid}/reschedule`)}
    />
  )
}
