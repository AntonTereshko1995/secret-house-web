import { useState, useMemo } from 'react'
import type { BookedPeriod } from '../../utils/booking'
import { getOccupiedRangesForDay, MIN_BOOKING_HOURS, CLEANING_BUFFER_HOURS } from '../../utils/booking'

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function toDateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

function buildGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1)
  let offset = first.getDay() - 1 // Mon = 0, Sun = 6
  if (offset < 0) offset = 6
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = Array(offset).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

/** Slot minutes matching TimePicker: whole hours 00:00–23:00 plus 23:59 */
const PICKER_SLOT_MINUTES = [
  ...Array.from({ length: 24 }, (_, h) => h * 60),
  23 * 60 + 59,
]

/** True if the day has at least one time slot available for check-in */
function hasFreeCheckInSlot(date: Date, periods: BookedPeriod[], minDT?: Date, slots = PICKER_SLOT_MINUTES): boolean {
  const minDurationMs = MIN_BOOKING_HOURS * 3600000
  const cleaningBufferMs = CLEANING_BUFFER_HOURS * 3600000
  for (const minutes of slots) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    const slot = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m)
    if (minDT && slot < minDT) continue
    if (periods.some(p => slot >= p.checkIn && slot < p.checkOut)) continue
    // 2-hour cleaning buffer after a booking ends
    if (periods.some(p => slot >= p.checkOut && slot.getTime() - p.checkOut.getTime() < cleaningBufferMs)) continue
    // Must fit minDuration + 2h cleaning buffer before next booking's check-in
    const minCheckOut = new Date(slot.getTime() + minDurationMs + cleaningBufferMs)
    if (periods.some(p => p.checkIn > slot && p.checkIn <= minCheckOut)) continue
    return true
  }
  return false
}

/** True if the day has at least one valid check-out slot given checkInDT */
function hasFreeCheckOutSlot(date: Date, checkInDT: Date, periods: BookedPeriod[]): boolean {
  const minMs = MIN_BOOKING_HOURS * 3600000
  for (const minutes of PICKER_SLOT_MINUTES) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    const slot = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m)
    if (slot.getTime() - checkInDT.getTime() < minMs) continue
    if (!periods.some(p => p.checkIn <= slot && p.checkOut > checkInDT)) return true
  }
  return false
}

interface CustomCalendarProps {
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  bookedPeriods: BookedPeriod[]
  /** Earliest selectable date (for check-in: today; for check-out: check-in date) */
  minDate?: Date
  /** When set, calendar operates in check-out mode */
  checkInDateTime?: Date
  /** If set, only these weekdays are selectable (0=Sun, 1=Mon … 6=Sat) */
  allowedWeekdays?: number[]
  /** If set, a check-in day is only selectable when at least one of these times is free */
  allowedCheckInTimes?: string[]
}

export default function CustomCalendar({
  selectedDate,
  onDateSelect,
  bookedPeriods,
  minDate,
  checkInDateTime,
  allowedWeekdays,
  allowedCheckInTimes,
}: CustomCalendarProps) {
  const today = useMemo(() => toDateOnly(new Date()), [])

  /** Slot minutes to use for check-in availability test — filtered to allowed times when provided */
  const checkInSlotMinutes = useMemo(() => {
    if (!allowedCheckInTimes) return PICKER_SLOT_MINUTES
    return allowedCheckInTimes.map(t => {
      const [h, m] = t.split(':').map(Number)
      return h * 60 + m
    })
  }, [allowedCheckInTimes])
  // In checkout mode always open on the check-in date's month so the user
  // sees their stay starting point and can pick a nearby checkout date.
  const initial = checkInDateTime
    ? toDateOnly(checkInDateTime)
    : selectedDate || minDate || today

  const [year, setYear] = useState(initial.getFullYear())
  const [month, setMonth] = useState(initial.getMonth())

  const cells = useMemo(() => buildGrid(year, month), [year, month])

  const prevMonthStart = new Date(year, month - 1, 1)
  const minMonthStart = minDate ? new Date(minDate.getFullYear(), minDate.getMonth(), 1) : null
  const canPrev = !minMonthStart || prevMonthStart >= minMonthStart

  const goPrev = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const goNext = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden select-none">

      {/* Month navigation */}
      <div className="flex items-center justify-between px-2 py-1 bg-black/30 border-b border-zinc-800">
        <button
          onClick={goPrev}
          disabled={!canPrev}
          className="w-6 h-6 flex items-center justify-center rounded text-xl leading-none text-amber-400 hover:bg-zinc-800 hover:text-amber-300 disabled:text-zinc-700 disabled:cursor-not-allowed transition-all"
          aria-label="Предыдущий месяц"
        >
          ‹
        </button>
        <span className="text-white font-semibold uppercase tracking-widest text-xs">
          {MONTHS[month]} {year}
        </span>
        <button
          onClick={goNext}
          className="w-6 h-6 flex items-center justify-center rounded text-xl leading-none text-amber-400 hover:bg-zinc-800 hover:text-amber-300 transition-all"
          aria-label="Следующий месяц"
        >
          ›
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-zinc-800">
        {WEEKDAYS.map(d => (
          <div key={d} className="py-0.5 text-center text-[10px] text-gray-600 font-medium uppercase">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells — fixed h-8 instead of aspect-square to keep rows compact */}
      <div className="grid grid-cols-7 gap-0.5 p-1">
        {cells.map((date, i) => {
          if (!date) return <div key={`e${i}`} className="h-8" />

          const occupied = getOccupiedRangesForDay(date, bookedPeriods)
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false
          const isToday = isSameDay(date, today)

          let selectable: boolean
          if (allowedWeekdays && !allowedWeekdays.includes(date.getDay())) {
            selectable = false
          } else if (checkInDateTime) {
            if (toDateOnly(date) < toDateOnly(checkInDateTime)) {
              selectable = false
            } else {
              selectable = hasFreeCheckOutSlot(date, checkInDateTime, bookedPeriods)
            }
          } else {
            if (minDate && toDateOnly(date) < toDateOnly(minDate)) {
              selectable = false
            } else {
              selectable = hasFreeCheckInSlot(date, bookedPeriods, minDate, checkInSlotMinutes)
            }
          }

          const hasOccupation = occupied.length > 0

          return (
            <button
              key={date.getTime()}
              type="button"
              onClick={() => selectable && onDateSelect(date)}
              disabled={!selectable}
              className={[
                'relative flex flex-col items-center justify-start w-full',
                'h-8 rounded-sm pt-0.5 text-[11px] font-medium',
                'transition-all duration-100',
                isSelected
                  ? 'bg-amber-400 text-black font-bold ring-1 ring-amber-300 ring-offset-1 ring-offset-zinc-900'
                  : selectable
                    ? [
                        'cursor-pointer',
                        hasOccupation
                          ? 'bg-red-800/40 text-red-100 hover:bg-red-700/50'
                          : 'text-white hover:bg-zinc-700',
                        isToday ? 'ring-1 ring-amber-400/50' : '',
                      ].filter(Boolean).join(' ')
                    : 'text-red-800/70 cursor-not-allowed bg-red-900/55',
              ].filter(Boolean).join(' ')}
            >
              <span className="leading-none">{date.getDate()}</span>

              {/* Occupation bar — full red when blocked, proportional when partially occupied */}
              {(!selectable || hasOccupation) && (
                <div className="absolute bottom-0.5 left-0.5 right-0.5 h-[5px] rounded-full overflow-hidden bg-zinc-950">
                  {!selectable ? (
                    <div className="absolute inset-0 bg-red-500" />
                  ) : (
                    occupied.map((r, ri) => (
                      <div
                        key={ri}
                        className="absolute h-full bg-red-500"
                        style={{
                          left: `${(r.start / 24) * 100}%`,
                          width: `${((r.end - r.start) / 24) * 100}%`,
                        }}
                      />
                    ))
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 px-2 py-1 border-t border-zinc-800 text-[10px] text-zinc-500">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-red-800/40" />
          <span>Частично занято</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-[5px] rounded-full overflow-hidden bg-zinc-950 relative">
            <div className="absolute inset-0 bg-red-500" />
          </div>
          <span>Занятые часы</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-red-900/55" />
          <span>Недоступно</span>
        </div>
      </div>
    </div>
  )
}
