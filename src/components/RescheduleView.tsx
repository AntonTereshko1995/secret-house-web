import { useState, useMemo } from 'react'
import CustomCalendar from './BookingWizard/CustomCalendar'
import TimePicker from './BookingWizard/TimePicker'
import { useRescheduleBookedPeriods } from '../hooks/useRescheduleBookedPeriods'
import {
  getUnavailableCheckInSlots,
  getUnavailableCheckOutSlots,
  calculateDuration,
  calculatePriceWithServices,
} from '../utils/booking'
import type { TariffType } from '../types/booking.types'

export interface RescheduleBooking {
  bookingId: number
  tariff: string
  hasPhotoshoot: boolean
  hasSauna: boolean
  hasBathTub: boolean
  hasExtraBedroom: boolean
  hasSecretRoom: boolean
}

interface Props {
  booking: RescheduleBooking
  tariffName: string
  isAdmin?: boolean
  onReschedule(checkIn: string, checkOut: string, price: number): Promise<void>
  onBack(): void
}

type Phase = 'checkIn' | 'checkOut'

function dateToYMD(d: Date): string {
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mo}-${day}`
}

function formatDateLong(d: Date): string {
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

export default function RescheduleView({ booking, tariffName, isAdmin = false, onReschedule, onBack }: Props) {
  const { periods } = useRescheduleBookedPeriods(booking.bookingId, isAdmin)

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }, [])

  const [phase, setPhase] = useState<Phase>('checkIn')
  const [checkInDate, setCheckInDate] = useState<Date | null>(null)
  const [checkInTime, setCheckInTime] = useState('')
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null)
  const [checkOutTime, setCheckOutTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const unavailableCheckInSlots = useMemo(
    () => checkInDate ? getUnavailableCheckInSlots(checkInDate, periods, booking.tariff) : new Set<string>(),
    [checkInDate, periods, booking.tariff],
  )

  const checkInDateTime = useMemo(() => {
    if (!checkInDate || !checkInTime) return null
    const [h, m] = checkInTime.split(':').map(Number)
    return new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate(), h, m)
  }, [checkInDate, checkInTime])

  const unavailableCheckOutSlots = useMemo(
    () => (checkOutDate && checkInDateTime)
      ? getUnavailableCheckOutSlots(checkOutDate, checkInDateTime, periods, booking.tariff)
      : new Set<string>(),
    [checkOutDate, checkInDateTime, periods, booking.tariff],
  )

  const checkOutDateTime = useMemo(() => {
    if (!checkOutDate || !checkOutTime) return null
    const [h, m] = checkOutTime.split(':').map(Number)
    return new Date(checkOutDate.getFullYear(), checkOutDate.getMonth(), checkOutDate.getDate(), h, m)
  }, [checkOutDate, checkOutTime])

  const durationHours = (checkInDateTime && checkOutDateTime && checkOutDateTime > checkInDateTime)
    ? calculateDuration(checkInDateTime, checkOutDateTime)
    : 0

  const newPrice = durationHours > 0
    ? calculatePriceWithServices(booking.tariff as TariffType, durationHours, {
        hasPhotoshoot: booking.hasPhotoshoot,
        hasSauna: booking.hasSauna,
        hasBathTub: booking.hasBathTub,
        hasExtraBedroom: booking.hasExtraBedroom,
        hasSecretRoom: booking.hasSecretRoom,
      })
    : 0

  const handleCheckInDateSelect = (date: Date) => {
    setCheckInDate(date)
    setCheckInTime('')
    setCheckOutDate(null)
    setCheckOutTime('')
  }

  const goToCheckOut = () => {
    setCheckOutDate(null)
    setCheckOutTime('')
    setPhase('checkOut')
  }

  const handleSubmit = async () => {
    if (!checkInDate || !checkOutDate || durationHours <= 0) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await onReschedule(
        `${dateToYMD(checkInDate)}T${checkInTime}:00`,
        `${dateToYMD(checkOutDate)}T${checkOutTime}:00`,
        newPrice,
      )
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Ошибка при переносе')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-luxury-gradient text-white">
      {/* Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Назад к бронированию
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-white uppercase tracking-wider">Перенос даты</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {tariffName}{!isAdmin && ' · Перенос возможен только один раз.'}
          </p>
        </div>

        {/* Check-in phase */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold uppercase tracking-wider text-sm">Дата заезда</h2>
            {phase === 'checkOut' && checkInDate && checkInTime && (
              <button
                onClick={() => setPhase('checkIn')}
                className="text-xs text-amber-400 hover:text-amber-300 underline"
              >
                Изменить
              </button>
            )}
          </div>

          {phase === 'checkIn' ? (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex-1 min-w-0">
                  <CustomCalendar
                    selectedDate={checkInDate}
                    onDateSelect={handleCheckInDateSelect}
                    bookedPeriods={periods}
                    minDate={isAdmin ? undefined : today}
                  />
                </div>
                {checkInDate && (
                  <TimePicker
                    label="Время заезда"
                    value={checkInTime}
                    onChange={setCheckInTime}
                    unavailable={unavailableCheckInSlots}
                  />
                )}
              </div>

              {checkInDate && checkInTime && (
                <div className="bg-zinc-800/60 border border-zinc-700 px-3 py-2 rounded-lg flex items-center justify-between">
                  <span className="text-zinc-400 text-xs">Заезд:</span>
                  <span className="text-amber-400 font-semibold text-sm">
                    {formatDateLong(checkInDate)} в {checkInTime}
                  </span>
                </div>
              )}

              <button
                onClick={goToCheckOut}
                disabled={!checkInDate || !checkInTime}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300
                  disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-2.5 rounded-xl
                  uppercase tracking-wider text-sm transition-all"
              >
                Далее — выбрать выезд
              </button>
            </>
          ) : (
            checkInDate && checkInTime && (
              <div className="bg-zinc-800/60 border border-zinc-700 px-3 py-2 rounded-lg flex items-center justify-between">
                <span className="text-zinc-400 text-xs">Заезд:</span>
                <span className="text-amber-400 font-semibold text-sm">
                  {formatDateLong(checkInDate)} в {checkInTime}
                </span>
              </div>
            )
          )}
        </div>

        {/* Check-out phase */}
        {phase === 'checkOut' && (
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 space-y-4">
            <h2 className="text-white font-semibold uppercase tracking-wider text-sm">Дата выезда</h2>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex-1 min-w-0">
                <CustomCalendar
                  selectedDate={checkOutDate}
                  onDateSelect={date => { setCheckOutDate(date); setCheckOutTime('') }}
                  bookedPeriods={periods}
                  minDate={checkInDate ?? today}
                  checkInDateTime={checkInDateTime ?? undefined}
                />
              </div>
              {checkOutDate && (
                <TimePicker
                  label="Время выезда"
                  value={checkOutTime}
                  onChange={setCheckOutTime}
                  unavailable={unavailableCheckOutSlots}
                />
              )}
            </div>

            {durationHours > 0 && (
              <div className="bg-zinc-800/60 border border-zinc-700 px-3 py-2.5 rounded-lg flex items-center justify-between gap-4">
                <div>
                  <div className="text-zinc-400 text-xs uppercase tracking-wider">Длительность</div>
                  <div className="text-amber-400 font-bold">{durationHours} ч</div>
                </div>
                <div>
                  <div className="text-zinc-400 text-xs uppercase tracking-wider">Выезд</div>
                  <div className="text-white font-semibold text-sm">
                    {checkOutDate && formatDateLong(checkOutDate)} в {checkOutTime}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-zinc-400 text-xs uppercase tracking-wider">Стоимость</div>
                  <div className="text-yellow-500 font-bold">{newPrice} BYN</div>
                </div>
              </div>
            )}

            {submitError && <p className="text-red-400 text-sm">{submitError}</p>}

            <button
              onClick={handleSubmit}
              disabled={durationHours <= 0 || submitting}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300
                disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-2.5 rounded-xl
                uppercase tracking-wider text-sm transition-all"
            >
              {submitting ? 'Переносим…' : 'Подтвердить перенос'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
