import { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { calculateDuration, calculateBasePrice, getBookedDates, isRangeAvailable } from '../../../utils/booking'
import type { BookingFormData } from '../../../types/booking.types'

interface StepProps {
  formData: Partial<BookingFormData>
  updateFormData: (data: Partial<BookingFormData>) => void
  nextStep: () => void
  prevStep: () => void
}

function Step4CheckOut({ formData, updateFormData, nextStep, prevStep }: StepProps) {
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(
    formData.checkOutDate || null
  )
  const [checkOutTime, setCheckOutTime] = useState(formData.checkOutTime || '12:00')

  const checkInDate = formData.checkInDate
  const minCheckOutDate = checkInDate ? new Date(checkInDate.getTime() + 2 * 60 * 60 * 1000) : new Date()
  const bookedDates = getBookedDates()

  // Calculate duration and price
  const duration = checkInDate && checkOutDate
    ? calculateDuration(checkInDate, checkOutDate)
    : 0

  const basePrice = formData.tariff && duration > 0
    ? calculateBasePrice(formData.tariff, duration)
    : 0

  const handleNext = () => {
    if (!checkOutDate) {
      alert('Пожалуйста, выберите дату выезда')
      return
    }

    if (checkInDate && checkOutDate <= checkInDate) {
      alert('Дата выезда должна быть позже даты заезда')
      return
    }

    if (checkInDate && !isRangeAvailable(checkInDate, checkOutDate)) {
      alert('Выбранный период пересекается с существующим бронированием. Пожалуйста, выберите другие даты.')
      return
    }

    updateFormData({
      checkOutDate,
      checkOutTime,
      durationHours: duration,
      basePrice
    })
    nextStep()
  }

  return (
    <div className="bg-gray-900 p-5 sm:p-6 rounded-lg border border-yellow-600/30">
      <h2 className="text-2xl sm:text-3xl font-bold text-luxury-gold mb-6 uppercase tracking-wider">
        Дата и время выезда
      </h2>
      <p className="text-gray-400 mb-6">
        Выберите когда вы планируете уехать
      </p>

      {/* Legend */}
      <div className="flex gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-600 rounded"></div>
          <span className="text-gray-400">Доступно</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-gray-400">Занято</span>
        </div>
      </div>

      {/* Check-in reminder */}
      {checkInDate && (
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <div className="text-gray-400 text-sm mb-1">Дата заезда:</div>
          <div className="text-white font-bold">
            {checkInDate.toLocaleDateString('ru-RU')} в {formData.checkInTime}
          </div>
        </div>
      )}

      <div className="space-y-6 mb-6">
        {/* Date Picker */}
        <div>
          <label className="block text-white font-semibold mb-2 uppercase text-sm tracking-wider">
            Дата выезда
          </label>
          <DatePicker
            selected={checkOutDate}
            onChange={(date: Date | null) => setCheckOutDate(date)}
            minDate={minCheckOutDate}
            excludeDates={bookedDates}
            highlightDates={[{ 'booked-date': bookedDates }]}
            dateFormat="dd.MM.yyyy"
            placeholderText="Выберите дату"
            className="w-full bg-black border-2 border-gray-700 focus:border-yellow-600 text-white px-4 py-3 rounded-lg outline-none transition-colors"
            inline
            monthsShown={1}
          />
        </div>

        {/* Time Picker */}
        <div>
          <label className="block text-white font-semibold mb-2 uppercase text-sm tracking-wider">
            Время выезда
          </label>
          <select
            value={checkOutTime}
            onChange={(e) => setCheckOutTime(e.target.value)}
            className="w-full bg-black border-2 border-gray-700 focus:border-yellow-600 text-white px-4 py-3 rounded-lg outline-none transition-colors"
          >
            {Array.from({ length: 48 }, (_, i) => {
              const hour = Math.floor(i / 2)
              const minute = i % 2 === 0 ? '00' : '30'
              return `${hour.toString().padStart(2, '0')}:${minute}`
            }).map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>

        {/* Duration & Price Preview */}
        {checkOutDate && checkInDate && checkOutDate > checkInDate && (
          <div className="bg-yellow-600/10 border border-yellow-600/30 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-gray-400 uppercase text-xs tracking-wider mb-1">
                  Длительность
                </div>
                <div className="text-yellow-600 font-bold text-2xl">
                  {duration} ч
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 uppercase text-xs tracking-wider mb-1">
                  Базовая цена
                </div>
                <div className="text-yellow-600 font-bold text-2xl">
                  {basePrice} BYN
                </div>
              </div>
            </div>
            <div className="text-center mt-4 pt-4 border-t border-yellow-600/30">
              <div className="text-gray-400 text-sm mb-1">Выезд:</div>
              <div className="text-white font-bold">
                {checkOutDate.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })} в {checkOutTime}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={prevStep}
          className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 uppercase tracking-wider transition-all"
        >
          Назад
        </button>
        <button
          onClick={handleNext}
          disabled={!checkOutDate || (checkInDate && checkOutDate <= checkInDate)}
          className="flex-1 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-black font-bold py-3 px-6 uppercase tracking-wider transition-all shadow-lg hover:shadow-xl"
        >
          Далее
        </button>
      </div>
    </div>
  )
}

export default Step4CheckOut
