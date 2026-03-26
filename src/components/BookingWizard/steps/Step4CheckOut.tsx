import { useState, useMemo } from 'react'
import CustomCalendar from '../CustomCalendar'
import TimePicker from '../TimePicker'
import { logger } from '../../../services/logger'
import {
  calculateDuration,
  calculateBasePrice,
  getBasePriceBreakdown,
  getDatePriceOverride,
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

/**
 * Validates that a work tariff booking follows the session rules:
 * - Check-in must be Mon–Thu
 * - Day session: check-in 11:00–17:00, checkout same day by 20:00
 * - Night session: check-in 22:00–23:59, checkout next day by 09:00
 * Returns an error message string, or null if valid.
 */
function validateWorkTariff(
  checkInDate: Date,
  checkInTime: string,
  checkOutDate: Date,
  checkOutTime: string,
): string | null {
  const weekday = checkInDate.getDay() // 0=Sun, 1=Mon … 6=Sat
  if (weekday === 0 || weekday === 5 || weekday === 6) {
    return 'Рабочий тариф доступен только в будние дни (пн–чт). Пожалуйста, вернитесь и выберите другую дату заезда.'
  }

  const checkInH = parseInt(checkInTime.split(':')[0], 10)
  const checkOutH = parseInt(checkOutTime.split(':')[0], 10)
  const checkOutM = parseInt(checkOutTime.split(':')[1], 10)

  const isDay = checkInH >= 11 && checkInH <= 17
  const isNight = checkInH >= 22

  if (!isDay && !isNight) {
    return (
      'Время заезда не соответствует рабочему тарифу.\n' +
      '• Дневная сессия: заезд с 11:00 до 17:00, выезд до 20:00\n' +
      '• Ночная сессия: заезд с 22:00 до 23:59, выезд до 09:00 следующего дня\n\n' +
      'Пожалуйста, вернитесь и выберите другое время заезда.'
    )
  }

  if (isDay) {
    const isSameDay = checkInDate.toDateString() === checkOutDate.toDateString()
    const checkOutMinutes = checkOutH * 60 + checkOutM
    if (!isSameDay || checkOutMinutes > 20 * 60) {
      return 'Дневная сессия: выезд должен быть в тот же день, не позднее 20:00.'
    }
  }

  if (isNight) {
    const nextDay = new Date(checkInDate)
    nextDay.setDate(nextDay.getDate() + 1)
    const isNextDay = checkOutDate.toDateString() === nextDay.toDateString()
    const checkOutMinutes = checkOutH * 60 + checkOutM
    if (!isNextDay || checkOutMinutes > 9 * 60) {
      return 'Ночная сессия: выезд должен быть на следующий день, не позднее 09:00.'
    }
  }

  return null
}

function Step4CheckOut({ formData, updateFormData, nextStep, prevStep, bookedPeriods = [] }: StepProps) {
  const isWorkTariff = formData.tariff === 'work-standard' || formData.tariff === 'incognito-work'

  const [checkOutDate, setCheckOutDate] = useState<Date | null>(formData.checkOutDate || null)
  const [checkOutTime, setCheckOutTime] = useState(formData.checkOutTime || '')
  const [workRuleError, setWorkRuleError] = useState<string | null>(null)

  const checkInDate = formData.checkInDate!
  const checkInDateTime = useMemo(
    () => applyTime(checkInDate, formData.checkInTime || '14:00'),
    [checkInDate, formData.checkInTime]
  )

  const checkOutDateTime = useMemo(
    () => checkOutDate && checkOutTime ? applyTime(checkOutDate, checkOutTime) : null,
    [checkOutDate, checkOutTime]
  )

  const unavailableSlots = useMemo(() => {
    if (!checkOutDate) return new Set<string>()
    return getUnavailableCheckOutSlots(checkOutDate, checkInDateTime, bookedPeriods)
  }, [checkOutDate, checkInDateTime, bookedPeriods])

  const isTimeValid = checkOutDateTime !== null
    && checkOutDateTime > checkInDateTime
    && !unavailableSlots.has(checkOutTime)

  const duration = isTimeValid && checkOutDateTime
    ? calculateDuration(checkInDateTime, checkOutDateTime)
    : 0

  // Check if the check-in date has a special price override (e.g. New Year holidays)
  const dateOverride = (formData.checkInDate && formData.tariff !== 'gift-certificate')
    ? getDatePriceOverride(new Date(formData.checkInDate))
    : null

  const basePrice = dateOverride?.price
    ?? (formData.tariff && duration > 0 ? calculateBasePrice(formData.tariff, duration) : 0)

  // Breakdown is only relevant when no date override is in effect
  const priceBreakdown = (!dateOverride && formData.tariff && duration > 0)
    ? getBasePriceBreakdown(formData.tariff, duration)
    : null

  // Show breakdown detail when there are extra hours (fixed tariffs) or
  // remainder hours in a multi-day stay (daily tariffs)
  const hasBreakdown = priceBreakdown && (
    (priceBreakdown.extraHours !== undefined && priceBreakdown.extraHours > 0) ||
    (priceBreakdown.days !== undefined && priceBreakdown.remainderHours !== undefined && priceBreakdown.remainderHours > 0)
  )

  const handleDateSelect = (date: Date) => {
    setCheckOutDate(date)
    setCheckOutTime('')
    setWorkRuleError(null)
  }

  const handleTimeChange = (time: string) => {
    setCheckOutTime(time)
    if (isWorkTariff && checkOutDate && time) {
      setWorkRuleError(validateWorkTariff(checkInDate, formData.checkInTime!, checkOutDate, time))
    } else {
      setWorkRuleError(null)
    }
  }

  const handleNext = () => {
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
    if (isWorkTariff) {
      const error = validateWorkTariff(checkInDate, formData.checkInTime!, checkOutDate, checkOutTime)
      if (error) {
        setWorkRuleError(error)
        return
      }
    }
    logger.info('booking_select', { step: 'check_out', checkOutDate: checkOutDate.toISOString().slice(0, 10), checkOutTime, durationHours: duration, basePrice, tariff: formData.tariff })
    updateFormData({ checkOutDate, checkOutTime, durationHours: duration, basePrice })
    nextStep()
  }

  return (
    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-2xl">
      <h2 className="text-lg sm:text-xl font-bold text-white mb-2 uppercase tracking-wider">
        Дата и время выезда
      </h2>

      {/* Check-in reminder */}
      <div className="bg-zinc-800/50 px-3 py-2 rounded-lg mb-3 flex items-center gap-3">
        <div className="text-gray-400 text-xs">Заезд:</div>
        <div className="text-white font-semibold text-sm">
          {checkInDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} в {formData.checkInTime}
        </div>
      </div>

      {/* Work tariff session rules hint */}
      {isWorkTariff && (
        <div className="bg-zinc-800/60 border border-zinc-700 px-3 py-2 rounded-lg mb-3 text-xs text-gray-300 space-y-0.5">
          <div className="text-amber-400 font-semibold uppercase tracking-wider text-[10px] mb-1">
            Правила рабочего тарифа
          </div>
          <div>• Дневная сессия: заезд 11:00–17:00, выезд до 20:00 того же дня</div>
          <div>• Ночная сессия: заезд 22:00–23:59, выезд до 09:00 следующего дня</div>
          <div>• Только будние дни (пн–чт)</div>
        </div>
      )}

      <div className="mb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
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
                onChange={handleTimeChange}
                unavailable={unavailableSlots}
              />
            </div>
          )}
        </div>

        {/* Work tariff rule violation error */}
        {workRuleError && (
          <div className="mt-3 bg-red-950/40 border border-red-500/40 px-3 py-2.5 rounded-lg">
            <div className="text-red-400 text-sm whitespace-pre-line">{workRuleError}</div>
          </div>
        )}

        {/* Duration & Price Preview */}
        {isTimeValid && !workRuleError && duration > 0 && (
          <div className="mt-3 bg-zinc-800/60 border border-zinc-700 px-3 py-2.5 rounded-lg">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-gray-400 uppercase text-xs tracking-wider">Длительность</div>
                <div className="text-amber-400 font-bold text-lg">{duration} ч</div>
              </div>
              <div>
                <div className="text-gray-400 uppercase text-xs tracking-wider">
                  {dateOverride ? 'Спец. цена' : 'Базовая цена'}
                </div>
                <div className="text-amber-400 font-bold text-lg">{basePrice} BYN</div>
              </div>
              <div className="text-right">
                <div className="text-gray-400 text-xs">Выезд:</div>
                <div className="text-white font-semibold text-sm">
                  {checkOutDate!.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} в {checkOutTime}
                </div>
              </div>
            </div>

            {/* Special date pricing note */}
            {dateOverride && (
              <div className="mt-2 pt-2 border-t border-zinc-700 text-xs text-amber-400/90">
                🎄 {dateOverride.description} — фиксированная цена за весь период
              </div>
            )}

            {/* Extra hours breakdown (only when no date override) */}
            {hasBreakdown && priceBreakdown && (
              <div className="mt-2 pt-2 border-t border-zinc-700 text-xs space-y-1">
                {/* Fixed tariff: session + extra hours */}
                {priceBreakdown.extraHours !== undefined && priceBreakdown.extraHours > 0 && (
                  <>
                    <div className="flex justify-between text-gray-400">
                      <span>Сессия ({priceBreakdown.includedHours} ч)</span>
                      <span className="text-white">{basePrice - priceBreakdown.extraPrice!} BYN</span>
                    </div>
                    <div className="flex justify-between text-orange-400">
                      <span>Доп. {priceBreakdown.extraHours} ч × {priceBreakdown.extraHourPrice} BYN</span>
                      <span>+{priceBreakdown.extraPrice} BYN</span>
                    </div>
                  </>
                )}
                {/* Daily tariff: days + remainder hours */}
                {priceBreakdown.days !== undefined && priceBreakdown.remainderHours !== undefined && priceBreakdown.remainderHours > 0 && (
                  <>
                    <div className="flex justify-between text-gray-400">
                      <span>{priceBreakdown.days === 1 ? '1 сутки' : `${priceBreakdown.days} суток`}</span>
                      <span className="text-white">{priceBreakdown.dayPrice} BYN</span>
                    </div>
                    <div className="flex justify-between text-orange-400">
                      <span>Доп. {priceBreakdown.remainderHours} ч × {priceBreakdown.extraHourPrice} BYN</span>
                      <span>+{priceBreakdown.remainderPrice} BYN</span>
                    </div>
                  </>
                )}
              </div>
            )}
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
          disabled={!checkOutDate || !checkOutTime || !isTimeValid || !!workRuleError}
          className="flex-1 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-2 px-4 rounded-xl uppercase tracking-wider transition-all"
        >
          Далее
        </button>
      </div>
    </div>
  )
}

export default Step4CheckOut
