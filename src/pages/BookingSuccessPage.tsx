import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { TARIFF_OPTIONS } from '../utils/booking'
import type { BookingFormData } from '../types/booking.types'

function BookingSuccessPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const booking = location.state?.booking as Partial<BookingFormData> | undefined

  // Redirect to home if no booking data
  useEffect(() => {
    if (!booking) {
      navigate('/', { replace: true })
    }
  }, [booking, navigate])

  if (!booking) {
    return null
  }

  return (
    <div className="min-h-screen bg-luxury-gradient flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto bg-gray-900 p-8 sm:p-12 rounded-lg border-2 border-yellow-600 text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-yellow-600 rounded-full mx-auto flex items-center justify-center animate-bounce">
            <svg className="w-12 h-12 text-black" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl sm:text-4xl font-bold text-luxury-gold mb-4 uppercase tracking-wider">
          Поздравляем!
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Ваше бронирование успешно отправлено
        </p>

        {/* Booking Details */}
        {booking && (
          <div className="bg-black/50 border border-yellow-600/30 p-6 rounded-lg mb-8 text-left">
            <h3 className="text-yellow-600 font-bold mb-4 uppercase tracking-wider text-center">
              Детали бронирования
            </h3>

            <div className="space-y-3">
              {booking.bookingId && (
                <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                  <span className="text-gray-400">ID бронирования:</span>
                  <span className="text-white font-mono font-bold">{booking.bookingId}</span>
                </div>
              )}

              {booking.tariff && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Тариф:</span>
                  <span className="text-white font-semibold">
                    {TARIFF_OPTIONS.find(t => t.id === booking.tariff)?.name || booking.tariff}
                  </span>
                </div>
              )}

              {booking.guestCount && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Гостей:</span>
                  <span className="text-white font-semibold">{booking.guestCount}</span>
                </div>
              )}

              {booking.checkInDate && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Заезд:</span>
                  <span className="text-white font-semibold">
                    {new Date(booking.checkInDate).toLocaleDateString('ru-RU')} {booking.checkInTime}
                  </span>
                </div>
              )}

              {booking.checkOutDate && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Выезд:</span>
                  <span className="text-white font-semibold">
                    {new Date(booking.checkOutDate).toLocaleDateString('ru-RU')} {booking.checkOutTime}
                  </span>
                </div>
              )}

              {booking.durationHours && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Длительность:</span>
                  <span className="text-white font-semibold">{booking.durationHours} ч</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                <span className="text-gray-400 font-bold">Итого:</span>
                <span className="text-yellow-600 font-bold text-2xl">{booking.totalPrice} BYN</span>
              </div>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h3 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">
            Что дальше?
          </h3>
          <ol className="text-left text-gray-300 text-sm space-y-2">
            <li className="flex items-start gap-3">
              <span className="text-yellow-600 font-bold">1.</span>
              <span>Мы получили вашу заявку и проверяем детали бронирования</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-600 font-bold">2.</span>
              <span>
                В течение <strong>15 минут</strong> с вами свяжется наш менеджер для подтверждения
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-600 font-bold">3.</span>
              <span>После подтверждения вы получите финальные инструкции</span>
            </li>
          </ol>
        </div>

        {/* Contact Info */}
        {(booking.telegram || booking.phone) && (
          <div className="bg-yellow-600/10 border border-yellow-600/30 p-4 rounded-lg mb-8">
            <div className="text-gray-400 text-sm mb-1">Мы свяжемся с вами:</div>
            <div className="text-white font-bold">
              {booking.contactType === 'telegram' ? `@${booking.telegram}` : booking.phone}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-4 px-8 uppercase tracking-wider transition-all shadow-lg hover:shadow-xl"
          >
            Вернуться на главную
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 px-8 uppercase tracking-wider transition-all"
          >
            Распечатать
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookingSuccessPage
