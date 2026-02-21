import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { TARIFF_OPTIONS, calculatePrepayment, getHolidayName } from '../utils/booking'
import type { BookingFormData } from '../types/booking.types'

function BookingSuccessPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const booking = location.state?.booking as Partial<BookingFormData> | undefined

  const checkInDate = booking?.checkInDate ? new Date(booking.checkInDate) : null
  const totalPrice = booking?.totalPrice ?? 0
  const prepayment = checkInDate ? calculatePrepayment(totalPrice, checkInDate) : Math.round(totalPrice * 0.5)
  const holidayName = checkInDate ? getHolidayName(checkInDate) : null
  const isFullPayment = prepayment === totalPrice

  useEffect(() => {
    if (!booking) navigate('/', { replace: true })
  }, [booking, navigate])

  if (!booking) return null

  return (
    <div className="min-h-screen bg-luxury-gradient flex items-center justify-center p-4">
      <div className="max-w-md w-full mx-auto bg-gray-900 p-5 rounded-lg border-2 border-yellow-600 text-center">

        {/* Icon */}
        <div className="w-14 h-14 bg-yellow-600 rounded-full mx-auto flex items-center justify-center mb-3">
          <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-luxury-gold mb-1 uppercase tracking-wider">
          Поздравляем!
        </h1>
        <p className="text-gray-400 text-sm mb-4">
          Бронирование успешно отправлено
        </p>

        {/* Booking Details */}
        <div className="bg-black/50 border border-yellow-600/30 rounded-lg px-4 py-2 mb-3 text-left">
          {booking.tariff && (
            <div className="flex justify-between py-1.5 border-b border-gray-800">
              <span className="text-gray-400 text-sm">Тариф</span>
              <span className="text-white text-sm font-semibold">
                {TARIFF_OPTIONS.find(t => t.id === booking.tariff)?.name || booking.tariff}
              </span>
            </div>
          )}
          {booking.checkInDate && (
            <div className="flex justify-between py-1.5 border-b border-gray-800">
              <span className="text-gray-400 text-sm">Заезд</span>
              <span className="text-white text-sm font-semibold">
                {new Date(booking.checkInDate).toLocaleDateString('ru-RU')} {booking.checkInTime}
              </span>
            </div>
          )}
          {booking.checkOutDate && (
            <div className="flex justify-between py-1.5 border-b border-gray-800">
              <span className="text-gray-400 text-sm">Выезд</span>
              <span className="text-white text-sm font-semibold">
                {new Date(booking.checkOutDate).toLocaleDateString('ru-RU')} {booking.checkOutTime}
              </span>
            </div>
          )}
          {(booking.telegram || booking.phone) && (
            <div className="flex justify-between py-1.5 border-b border-gray-800">
              <span className="text-gray-400 text-sm">Контакт</span>
              <span className="text-white text-sm font-semibold">
                {booking.contactType === 'telegram' ? `@${booking.telegram}` : booking.phone}
              </span>
            </div>
          )}
          <div className="flex justify-between py-1.5 border-b border-gray-800">
            <span className="text-gray-400 text-sm">Итого</span>
            <span className="text-white text-sm font-semibold">{totalPrice} BYN</span>
          </div>
          {holidayName && (
            <div className="py-1.5 border-b border-gray-800">
              <span className="text-yellow-600 text-xs">🎉 {holidayName} — полная предоплата</span>
            </div>
          )}
          <div className="flex justify-between py-1.5">
            <span className="text-gray-400 text-sm font-bold">Предоплата ({isFullPayment ? '100%' : '50%'})</span>
            <span className="text-yellow-600 font-bold text-lg">{prepayment} BYN</span>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gray-800 rounded-lg px-4 py-3 mb-4 text-left">
          <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider">Что дальше</p>
          <ol className="text-gray-300 text-sm space-y-1">
            <li className="flex gap-2"><span className="text-yellow-600 font-bold">1.</span><span>Проверяем детали бронирования</span></li>
            <li className="flex gap-2"><span className="text-yellow-600 font-bold">2.</span><span>Менеджер свяжется с вами в течение <strong>15 минут</strong></span></li>
            <li className="flex gap-2"><span className="text-yellow-600 font-bold">3.</span><span>Вы получите финальные инструкции</span></li>
          </ol>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 px-8 uppercase tracking-wider transition-all"
        >
          Вернуться на главную
        </button>
      </div>
    </div>
  )
}

export default BookingSuccessPage
