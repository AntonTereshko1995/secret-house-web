import { useState, useMemo } from 'react'
import CustomCalendar from '../CustomCalendar'
import TimePicker from '../TimePicker'
import { getUnavailableCheckInSlots } from '../../../utils/booking'
import type { BookingFormData } from '../../../types/booking.types'
import type { BookedPeriod } from '../../../utils/booking'

interface StepProps {
  formData: Partial<BookingFormData>
  updateFormData: (data: Partial<BookingFormData>) => void
  nextStep: () => void
  prevStep: () => void
  bookedPeriods?: BookedPeriod[]
}

// Mon=1, Tue=2, Wed=3, Thu=4
const WORK_ALLOWED_WEEKDAYS = [1, 2, 3, 4]
const WORK_ALLOWED_TIMES = new Set(['11:00', '22:00'])

function Step3CheckIn({ formData, updateFormData, nextStep, prevStep, bookedPeriods = [] }: StepProps) {
  const isWorkTariff = formData.tariff === 'work-standard' || formData.tariff === 'incognito-work'

  const [checkInDate, setCheckInDate] = useState<Date | null>(formData.checkInDate || null)
  const [checkInTime, setCheckInTime] = useState(formData.checkInTime || '')

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const unavailableSlots = useMemo(() => {
    if (!checkInDate) return new Set<string>()
    const slots = getUnavailableCheckInSlots(checkInDate, bookedPeriods)

    // Block past times if today is selected
    const isToday = checkInDate.toDateString() === new Date().toDateString()
    if (isToday) {
      const now = new Date()
      const nowMinutes = now.getHours() * 60 + now.getMinutes()
      const allSlots = [
        ...Array.from({ length: 24 }, (_, h) => `${h.toString().padStart(2, '0')}:00`),
        '23:59',
      ]
      for (const slot of allSlots) {
        const [h, m] = slot.split(':').map(Number)
        if (h * 60 + m <= nowMinutes) slots.add(slot)
      }
    }

    // For work tariff: only 11:00 and 22:00 allowed
    if (isWorkTariff) {
      const allSlots = [
        ...Array.from({ length: 24 }, (_, h) => `${h.toString().padStart(2, '0')}:00`),
        '23:59',
      ]
      for (const slot of allSlots) {
        if (!WORK_ALLOWED_TIMES.has(slot)) slots.add(slot)
      }
    }

    return slots
  }, [checkInDate, bookedPeriods, isWorkTariff])

  const handleDateSelect = (date: Date) => {
    setCheckInDate(date)
    setCheckInTime('')
    const slots = getUnavailableCheckInSlots(date, bookedPeriods)

    // Also add past times if today
    const isToday = date.toDateString() === new Date().toDateString()
    if (isToday) {
      const now = new Date()
      const nowMinutes = now.getHours() * 60 + now.getMinutes()
      const allSlots = [
        ...Array.from({ length: 24 }, (_, h) => `${h.toString().padStart(2, '0')}:00`),
        '23:59',
      ]
      for (const slot of allSlots) {
        const [h, m] = slot.split(':').map(Number)
        if (h * 60 + m <= nowMinutes) slots.add(slot)
      }
    }

    if (slots.has(checkInTime)) {
      const candidates = [
        ...Array.from({ length: 24 }, (_, h) => `${h.toString().padStart(2, '0')}:00`),
        '23:59',
      ]
      for (const s of candidates) {
        if (!slots.has(s)) { setCheckInTime(s); return }
      }
    }
  }

  const isTimeValid = checkInTime !== '' && !unavailableSlots.has(checkInTime)

  const handleNext = () => {
    if (!checkInDate) {
      alert('Пожалуйста, выберите дату заезда')
      return
    }
    if (!checkInTime) {
      alert('Пожалуйста, выберите время заезда')
      return
    }
    if (!isTimeValid) {
      alert('Выбранное время заезда недоступно. Пожалуйста, выберите другое время.')
      return
    }
    updateFormData({ checkInDate, checkInTime })
    nextStep()
  }

  return (
    <div className="bg-gray-900 p-4 rounded-lg border border-yellow-600/30">
      <h2 className="text-lg sm:text-xl font-bold text-luxury-gold mb-2 uppercase tracking-wider">
        Дата и время заезда
      </h2>

      <div className="mb-3">
        <div className="flex gap-3 items-start">
          <div className="flex-1 min-w-0">
            <label className="block text-white font-semibold mb-1.5 uppercase text-xs tracking-wider">
              Дата заезда
            </label>
            <CustomCalendar
              selectedDate={checkInDate}
              onDateSelect={handleDateSelect}
              bookedPeriods={bookedPeriods}
              minDate={today}
              allowedWeekdays={isWorkTariff ? WORK_ALLOWED_WEEKDAYS : undefined}
            />
          </div>

          {checkInDate && (
            <div>
              <TimePicker
                label="Время заезда"
                value={checkInTime}
                onChange={setCheckInTime}
                unavailable={unavailableSlots}
              />
            </div>
          )}
        </div>

        {checkInDate && (
          <div className="mt-3 bg-yellow-600/10 border border-yellow-600/30 p-2.5 rounded-lg">
            <div className="flex items-center justify-between gap-2">
              <div className="text-gray-400 text-xs">Заезд:</div>
              <div className="text-yellow-600 font-semibold text-sm">
                {checkInDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
              </div>
              <div className={`text-base font-bold ${isTimeValid ? 'text-white' : 'text-red-400'}`}>
                {checkInTime}
                {!isTimeValid && <span className="text-xs font-normal ml-1">— недоступно</span>}
              </div>
            </div>
          </div>
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
          disabled={!checkInDate || !isTimeValid}
          className="flex-1 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-black font-bold py-2 px-4 uppercase tracking-wider transition-all"
        >
          Далее
        </button>
      </div>
    </div>
  )
}

export default Step3CheckIn
