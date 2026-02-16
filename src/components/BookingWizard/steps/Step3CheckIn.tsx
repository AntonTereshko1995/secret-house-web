import { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { getBookedDates, isDateBooked } from '../../../utils/booking'
import type { BookingFormData } from '../../../types/booking.types'

interface StepProps {
  formData: Partial<BookingFormData>
  updateFormData: (data: Partial<BookingFormData>) => void
  nextStep: () => void
  prevStep: () => void
}

function Step3CheckIn({ formData, updateFormData, nextStep, prevStep }: StepProps) {
  const [checkInDate, setCheckInDate] = useState<Date | null>(
    formData.checkInDate || null
  )
  const [checkInTime, setCheckInTime] = useState(formData.checkInTime || '14:00')

  const bookedDates = getBookedDates()

  const handleNext = () => {
    if (!checkInDate) {
      alert('Пожалуйста, выберите дату заезда')
      return
    }
    if (isDateBooked(checkInDate)) {
      alert('Выбранная дата уже занята. Пожалуйста, выберите другую дату.')
      return
    }
    updateFormData({ checkInDate, checkInTime })
    nextStep()
  }

  return (
    <div className="bg-gray-900 p-5 sm:p-6 rounded-lg border border-yellow-600/30">
      <h2 className="text-2xl sm:text-3xl font-bold text-luxury-gold mb-6 uppercase tracking-wider">
        Дата и время заезда
      </h2>
      <p className="text-gray-400 mb-6">
        Выберите когда вы планируете прибыть
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

      <div className="space-y-6 mb-6">
        {/* Date Picker */}
        <div>
          <label className="block text-white font-semibold mb-2 uppercase text-sm tracking-wider">
            Дата заезда
          </label>
          <DatePicker
            selected={checkInDate}
            onChange={(date: Date | null) => setCheckInDate(date)}
            minDate={new Date()}
            excludeDates={bookedDates}
            highlightDates={[{ 'booked-date': bookedDates }]}
            dateFormat="dd.MM.yyyy"
            placeholderText="Выберите дату"
            className="w-full bg-black border-2 border-gray-700 focus:border-yellow-600 text-white px-4 py-3 rounded-lg outline-none transition-colors"
            calendarClassName="bg-gray-900 border-yellow-600"
            inline
            monthsShown={1}
          />
        </div>

        {/* Time Picker */}
        <div>
          <label className="block text-white font-semibold mb-2 uppercase text-sm tracking-wider">
            Время заезда
          </label>
          <select
            value={checkInTime}
            onChange={(e) => setCheckInTime(e.target.value)}
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

        {/* Selected Preview */}
        {checkInDate && (
          <div className="bg-yellow-600/10 border border-yellow-600/30 p-4 rounded-lg">
            <div className="text-center">
              <div className="text-gray-400 uppercase text-xs tracking-wider mb-1">
                Заезд:
              </div>
              <div className="text-yellow-600 font-bold text-xl">
                {checkInDate.toLocaleDateString('ru-RU', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
              <div className="text-white text-2xl font-bold mt-1">
                {checkInTime}
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
          disabled={!checkInDate}
          className="flex-1 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-black font-bold py-3 px-6 uppercase tracking-wider transition-all shadow-lg hover:shadow-xl"
        >
          Далее
        </button>
      </div>
    </div>
  )
}

export default Step3CheckIn
