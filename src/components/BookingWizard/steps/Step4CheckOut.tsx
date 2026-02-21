import { useState, useMemo } from 'react'
import CustomCalendar from '../CustomCalendar'
import TimePicker from '../TimePicker'
import {
  calculateDuration,
  calculateBasePrice,
  getUnavailableCheckOutSlots,
} from '../../../utils/booking'
import type { BookingFormData } from '../../../types/booking.types'
import type { BookedPeriod } from '../../../utils/booking'

interface StepProps {
  formData: Partial<BookingFormData>
  updateFormData: (data: Partial<BookingFormData>) => void
  nextStep: () => void
  prevStep: () => void
  bookedPeriods?: BookedPeriod[]
}

function applyTime(date: Date, timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number)
  const result = new Date(date)
  result.setHours(h, m, 0, 0)
  return result
}

function Step4CheckOut({ formData, updateFormData, nextStep, prevStep, bookedPeriods = [] }: StepProps) {
  const isWorkTariff = formData.tariff === 'work-standard' || formData.tariff === 'incognito-work'

  // For work tariff: auto-derive checkout from check-in
  // 11:00 → same day 20:00 ; 22:00 → next day 09:00
  const workCheckOut = useMemo(() => {
    if (!isWorkTariff || !formData.checkInDate || !formData.checkInTime) return null
    const d = new Date(formData.checkInDate)
    if (formData.checkInTime === '11:00') {
      d.setHours(20, 0, 0, 0)
      return { date: d, time: '20:00' }
    }
    if (formData.checkInTime === '22:00') {
      d.setDate(d.getDate() + 1)
      d.setHours(9, 0, 0, 0)
      return { date: d, time: '09:00' }
    }
    return null
  }, [isWorkTariff, formData.checkInDate, formData.checkInTime])

  const [checkOutDate, setCheckOutDate] = useState<Date | null>(
    workCheckOut ? workCheckOut.date : (formData.checkOutDate || null)
  )
  const [checkOutTime, setCheckOutTime] = useState(
    workCheckOut ? workCheckOut.time : (formData.checkOutTime || '')
  )

  const checkInDate = formData.checkInDate!
  const checkInDateTime = useMemo(
    () => applyTime(checkInDate, formData.checkInTime || '14:00'),
    [checkInDate, formData.checkInTime]
  )

  const checkOutDateTime = useMemo(
    () => checkOutDate ? applyTime(checkOutDate, checkOutTime) : null,
    [checkOutDate, checkOutTime]
  )

  const unavailableSlots = useMemo(
    () => checkOutDate
      ? getUnavailableCheckOutSlots(checkOutDate, checkInDateTime, bookedPeriods)
      : new Set<string>(),
    [checkOutDate, checkInDateTime, bookedPeriods]
  )

  const isTimeValid = checkOutDateTime !== null
    && checkOutDateTime > checkInDateTime
    && !unavailableSlots.has(checkOutTime)

  const duration = isTimeValid && checkOutDateTime
    ? calculateDuration(checkInDateTime, checkOutDateTime)
    : 0

  const basePrice = formData.tariff && duration > 0
    ? calculateBasePrice(formData.tariff, duration)
    : 0

  const handleDateSelect = (date: Date) => {
    setCheckOutDate(date)
    setCheckOutTime('')
  }

  const handleNext = () => {
    if (!isWorkTariff || !workCheckOut) {
      if (!checkOutDate) {
        alert('Пожалуйста, выберите дату выезда')
        return
      }
      if (!checkOutTime) {
        alert('Пожалуйста, выберите время выезда')
        return
      }
      if (!isTimeValid) {
        if (unavailableSlots.has(checkOutTime)) {
          alert('Выбранное время выезда недоступно. Пожалуйста, выберите другое время.')
        } else {
          alert('Время выезда должно быть позже времени заезда')
        }
        return
      }
    }
    updateFormData({ checkOutDate: checkOutDate ?? undefined, checkOutTime, durationHours: duration, basePrice })
    nextStep()
  }

  return (
    <div className="bg-gray-900 p-4 rounded-lg border border-yellow-600/30">
      <h2 className="text-lg sm:text-xl font-bold text-luxury-gold mb-2 uppercase tracking-wider">
        Дата и время выезда
      </h2>

      {/* Check-in reminder */}
      <div className="bg-gray-800 px-3 py-2 rounded-lg mb-3 flex items-center gap-3">
        <div className="text-gray-400 text-xs">Заезд:</div>
        <div className="text-white font-semibold text-sm">
          {checkInDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} в {formData.checkInTime}
        </div>
      </div>

      <div className="mb-3">
        {isWorkTariff && workCheckOut ? (
          <div className="bg-yellow-600/10 border border-yellow-600/30 px-4 py-3 rounded-lg">
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">
              Время выезда фиксировано для рабочего тарифа
            </div>
            <div className="text-white font-bold text-base">
              {workCheckOut.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} в {workCheckOut.time}
            </div>
            {isTimeValid && duration > 0 && (
              <div className="mt-2 flex gap-4 text-sm">
                <span className="text-gray-400">Длительность: <span className="text-yellow-600 font-bold">{duration} ч</span></span>
                <span className="text-gray-400">Цена: <span className="text-yellow-600 font-bold">{basePrice} BYN</span></span>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex gap-3 items-start">
              <div className="flex-1 min-w-0">
                <label className="block text-white font-semibold mb-1.5 uppercase text-xs tracking-wider">
                  Дата выезда
                </label>
                <CustomCalendar
                  selectedDate={checkOutDate}
                  onDateSelect={handleDateSelect}
                  bookedPeriods={bookedPeriods}
                  minDate={checkInDate}
                  checkInDateTime={checkInDateTime}
                />
              </div>

              {checkOutDate && (
                <div>
                  <TimePicker
                    label="Время выезда"
                    value={checkOutTime}
                    onChange={setCheckOutTime}
                    unavailable={unavailableSlots}
                  />
                </div>
              )}
            </div>

            {/* Duration & Price Preview */}
            {isTimeValid && duration > 0 && (
              <div className="mt-3 bg-yellow-600/10 border border-yellow-600/30 px-3 py-2.5 rounded-lg">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-gray-400 uppercase text-xs tracking-wider">Длительность</div>
                    <div className="text-yellow-600 font-bold text-lg">{duration} ч</div>
                  </div>
                  <div>
                    <div className="text-gray-400 uppercase text-xs tracking-wider">Базовая цена</div>
                    <div className="text-yellow-600 font-bold text-lg">{basePrice} BYN</div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-400 text-xs">Выезд:</div>
                    <div className="text-white font-semibold text-sm">
                      {checkOutDate!.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} в {checkOutTime}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={prevStep}
          className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 uppercase tracking-wider transition-all"
        >
          Назад
        </button>
        <button
          onClick={handleNext}
          disabled={isWorkTariff ? !workCheckOut : (!checkOutDate || !isTimeValid)}
          className="flex-1 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-black font-bold py-2 px-4 uppercase tracking-wider transition-all"
        >
          Далее
        </button>
      </div>
    </div>
  )
}

export default Step4CheckOut
