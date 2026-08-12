import { useState, useMemo } from 'react'
import { getTariffConfig, BATH_TUB_BUFFER_HOURS } from '../../../utils/booking'
import { logger } from '../../../services/logger'
import type { StepProps } from '../../../types/booking.types'
import type { BookedPeriod } from '../../../utils/booking'

function hasAdequateBuffer(
  checkInDateTime: Date,
  periods: BookedPeriod[],
  bufferHours: number
): boolean {
  const bufferMs = bufferHours * 3600000
  return !periods.some(p => {
    const gapMs = checkInDateTime.getTime() - p.checkOut.getTime()
    return gapMs > 0 && gapMs < bufferMs
  })
}

function addOneHour(date: Date, time: string): { date: Date; time: string } {
  const [h, m] = time.split(':').map(Number)
  const dt = new Date(date)
  dt.setHours(h + 1, m, 0, 0)
  const newTime = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
  const newDate = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate())
  return { date: newDate, time: newTime }
}

function StepBathTub({ formData, updateFormData, nextStep, prevStep, bookedPeriods = [] }: StepProps) {
  const [hasBathTub, setHasBathTub] = useState(formData.hasBathTub || false)
  const [bufferError, setBufferError] = useState(false)

  const bathTubPrice = getTariffConfig(formData.tariff ?? '')?.bathTubPrice ?? 0

  // Pre-compute what the shifted check-in would look like, for the button label
  const shiftedCheckIn = useMemo(() => {
    if (!formData.checkInDate || !formData.checkInTime) return null
    return addOneHour(new Date(formData.checkInDate), formData.checkInTime)
  }, [formData.checkInDate, formData.checkInTime])

  const buildCheckInDate = (date: Date, time: string): Date => {
    const [h, m] = time.split(':').map(Number)
    const dt = new Date(date)
    dt.setHours(h, m, 0, 0)
    return dt
  }

  const handleNext = () => {
    setBufferError(false)

    if (hasBathTub && formData.checkInDate && formData.checkInTime) {
      const checkIn = buildCheckInDate(new Date(formData.checkInDate), formData.checkInTime)
      if (!hasAdequateBuffer(checkIn, bookedPeriods, BATH_TUB_BUFFER_HOURS)) {
        setBufferError(true)
        return
      }
    }

    logger.info('booking_select', { step: 'bath_tub', hasBathTub, bathTubPrice: hasBathTub ? bathTubPrice : 0, tariff: formData.tariff })
    updateFormData({
      hasBathTub,
      bathTubPrice: hasBathTub ? bathTubPrice : 0
    })
    nextStep()
  }

  const handleShiftCheckIn = () => {
    if (!formData.checkInDate || !formData.checkInTime) return

    const newCheckIn = addOneHour(new Date(formData.checkInDate), formData.checkInTime)

    // Shift checkout by 1h as well to preserve booking duration
    let newCheckOutDate = formData.checkOutDate
    let newCheckOutTime = formData.checkOutTime
    if (formData.checkOutDate && formData.checkOutTime) {
      const shifted = addOneHour(new Date(formData.checkOutDate), formData.checkOutTime)
      newCheckOutDate = shifted.date
      newCheckOutTime = shifted.time
    }

    logger.info('booking_select', { step: 'bath_tub_shift_checkin', newCheckInTime: newCheckIn.time, tariff: formData.tariff })

    updateFormData({
      checkInDate: newCheckIn.date,
      checkInTime: newCheckIn.time,
      checkOutDate: newCheckOutDate,
      checkOutTime: newCheckOutTime,
    })

    // Validate buffer with the new time immediately (before re-render)
    const checkInDt = buildCheckInDate(newCheckIn.date, newCheckIn.time)
    if (hasAdequateBuffer(checkInDt, bookedPeriods, BATH_TUB_BUFFER_HOURS)) {
      setBufferError(false)
    }
  }

  return (
    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-2xl">
      <h2 className="text-lg sm:text-xl font-bold text-white mb-2 uppercase tracking-wider">
        Банный чан
      </h2>
      <p className="text-gray-400 mb-3 text-sm">
        Желаете добавить банный чан к вашему бронированию? (необязательно)
      </p>

      {/* Toggle Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => { setHasBathTub(false); setBufferError(false) }}
          className={`
            p-6 border-2 rounded-lg font-bold uppercase tracking-wider transition-all
            ${!hasBathTub
              ? 'border-amber-400 bg-amber-400/10 text-white'
              : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}
          `}
        >
          <div className="text-2xl mb-2">❌</div>
          Не нужен
        </button>
        <button
          onClick={() => setHasBathTub(true)}
          className={`
            p-6 border-2 rounded-lg font-bold uppercase tracking-wider transition-all
            ${hasBathTub
              ? 'border-amber-400 bg-amber-400/10 text-white'
              : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}
          `}
        >
          <div className="text-2xl mb-2">🛁</div>
          Добавить
        </button>
      </div>

      {/* Price Info */}
      <div className="bg-zinc-800/60 border border-zinc-700 p-4 rounded-lg mb-4">
        <div className="text-center">
          <div className="text-gray-400 text-sm mb-1">Стоимость банного чана:</div>
          <div className="text-amber-400 font-bold text-3xl">
            {bathTubPrice} BYN
          </div>
          <div className="text-gray-400 text-xs mt-3">
            💡 Банный чан для полного расслабления
          </div>
        </div>
      </div>

      {/* Buffer error with shift button */}
      {bufferError && (
        <div className="bg-red-950/40 border border-red-500/40 px-3 py-3 rounded-lg mb-4 space-y-3">
          <p className="text-red-400 text-sm">
            Для бронирования с банным чаном требуется перерыв не менее {BATH_TUB_BUFFER_HOURS} часов после предыдущего гостя.
          </p>
          {shiftedCheckIn && (
            <button
              onClick={handleShiftCheckIn}
              className="w-full border border-amber-400/60 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 font-bold py-2.5 px-4 rounded-lg text-sm uppercase tracking-wider transition-all"
            >
              Перенести заезд на {shiftedCheckIn.time}
            </button>
          )}
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={prevStep}
          className="flex-1 border border-zinc-600 bg-transparent hover:bg-zinc-800/50 text-zinc-300 font-bold py-2 px-4 rounded-xl uppercase tracking-wider transition-all"
        >
          Назад
        </button>
        <button
          onClick={handleNext}
          className="flex-1 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold py-2 px-4 rounded-xl uppercase tracking-wider transition-all"
        >
          Далее
        </button>
      </div>
    </div>
  )
}

export default StepBathTub
