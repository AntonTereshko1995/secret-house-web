import { useState, useMemo } from 'react'
import CustomCalendar from '../CustomCalendar'
import TimePicker from '../TimePicker'
import { getUnavailableCheckInSlots } from '../../../utils/booking'
import { logger } from '../../../services/logger'
import type { BookingFormData } from '../../../types/booking.types'
import type { BookedPeriod } from '../../../utils/booking'

interface StepProps {
  formData: Partial<BookingFormData>
  updateFormData: (data: Partial<BookingFormData>) => void
  nextStep: () => void
  prevStep: () => void
  bookedPeriods?: BookedPeriod[]
}

function Step3CheckIn({ formData, updateFormData, nextStep, prevStep, bookedPeriods = [] }: StepProps) {
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

    return slots
  }, [checkInDate, bookedPeriods])

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
    // If check-in date or time changed, clear the previously selected checkout
    // so Step4 starts fresh rather than inheriting a potentially invalid checkout time
    const checkInChanged =
      checkInDate.getTime() !== formData.checkInDate?.getTime() ||
      checkInTime !== formData.checkInTime
    if (checkInChanged) {
      updateFormData({ checkInDate, checkInTime, checkOutDate: undefined, checkOutTime: undefined, durationHours: 0, basePrice: 0 })
    } else {
      updateFormData({ checkInDate, checkInTime })
    }
    logger.info('booking_select', { step: 'check_in', checkInDate: checkInDate.toISOString().slice(0, 10), checkInTime })
    nextStep()
  }

  return (
    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-2xl">
      <h2 className="text-lg sm:text-xl font-bold text-white mb-2 uppercase tracking-wider">
        Дата и время заезда
      </h2>

      <div className="mb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex-1 min-w-0">
            <label className="block text-white font-semibold mb-1.5 uppercase text-xs tracking-wider">
              Дата заезда
            </label>
            <CustomCalendar
              selectedDate={checkInDate}
              onDateSelect={handleDateSelect}
              bookedPeriods={bookedPeriods}
              minDate={today}
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
          <div className="mt-3 bg-zinc-800/60 border border-zinc-700 p-2.5 rounded-lg">
            <div className="flex items-center justify-between gap-2">
              <div className="text-gray-400 text-xs">Заезд:</div>
              <div className="text-amber-400 font-semibold text-sm">
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
          className="flex-1 border border-zinc-600 bg-transparent hover:bg-zinc-800/50 text-zinc-300 font-bold py-2 px-4 rounded-xl uppercase tracking-wider transition-all"
        >
          Назад
        </button>
        <button
          onClick={handleNext}
          disabled={!checkInDate || !isTimeValid}
          className="flex-1 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-2 px-4 rounded-xl uppercase tracking-wider transition-all"
        >
          Далее
        </button>
      </div>
    </div>
  )
}

export default Step3CheckIn
