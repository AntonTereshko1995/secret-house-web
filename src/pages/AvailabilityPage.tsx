import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useBookedPeriods } from '../hooks/useBookedPeriods'
import { getOccupiedRangesForDay, MIN_BOOKING_HOURS, CLEANING_BUFFER_HOURS } from '../utils/booking'
import type { BookedPeriod } from '../utils/booking'

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]
const MONTHS_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
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
  let offset = first.getDay() - 1
  if (offset < 0) offset = 6
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = Array(offset).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function formatHour(h: number): string {
  const hours = Math.floor(h)
  const mins = Math.round((h - hours) * 60)
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

/** Whole-hour slots 00:00–23:00 plus 23:59 */
const ALL_SLOTS = [
  ...Array.from({ length: 24 }, (_, h) => h * 60),
  23 * 60 + 59,
]

/** True when the day has at least one valid check-in time slot.
 *  Pass nowMinutes (current hour*60+min) to skip past slots when date is today. */
function hasFreeSlot(date: Date, periods: BookedPeriod[], nowMinutes?: number): boolean {
  const minDurationMs = MIN_BOOKING_HOURS * 3_600_000
  const cleaningMs = CLEANING_BUFFER_HOURS * 3_600_000
  for (const minutes of ALL_SLOTS) {
    if (nowMinutes !== undefined && minutes < nowMinutes) continue
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    const slot = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m)
    if (periods.some(p => slot >= p.checkIn && slot < p.checkOut)) continue
    if (periods.some(p => slot >= p.checkOut && slot.getTime() - p.checkOut.getTime() < cleaningMs)) continue
    // Next booking must start at least minDuration + cleaningBuffer after this slot
    // (guest needs minDuration to stay, then 2h cleaning before next check-in)
    const minOut = new Date(slot.getTime() + minDurationMs + cleaningMs)
    if (periods.some(p => p.checkIn > slot && p.checkIn <= minOut)) continue
    return true
  }
  return false
}

/** Returns free time intervals (in fractional hours) for the given day.
 *  Pass nowHour (current time as fractional hours, e.g. 20.5 for 20:30) to
 *  exclude already-past slots when date is today. */
function getFreeIntervals(date: Date, periods: BookedPeriod[], nowHour?: number): { start: number; end: number }[] {
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0)
  const dayEnd   = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 24, 0)
  const cleaningMs = CLEANING_BUFFER_HOURS * 3_600_000

  // Build blocked ranges: CLEANING_BUFFER before check-in and after check-out
  const blocked: { start: number; end: number }[] = []
  for (const p of periods) {
    const preBuffer = new Date(p.checkIn.getTime() - cleaningMs)
    const cleanEnd  = new Date(p.checkOut.getTime() + cleaningMs)
    // Skip if the period (with both buffers) doesn't touch this day at all
    if (cleanEnd <= dayStart || preBuffer >= dayEnd) continue
    const blockStart = Math.max(0, (preBuffer.getTime() - dayStart.getTime()) / 3_600_000)
    const blockEnd   = Math.min(24, (cleanEnd.getTime() - dayStart.getTime()) / 3_600_000)
    blocked.push({ start: blockStart, end: blockEnd })
  }

  // Sort and merge
  blocked.sort((a, b) => a.start - b.start)
  const merged: { start: number; end: number }[] = []
  for (const r of blocked) {
    if (merged.length === 0 || r.start > merged[merged.length - 1].end) {
      merged.push({ ...r })
    } else {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, r.end)
    }
  }

  // Complement within [nowHour..24], filter out gaps shorter than MIN_BOOKING_HOURS
  const free: { start: number; end: number }[] = []
  let cursor = nowHour ?? 0
  for (const r of merged) {
    if (r.start - cursor >= MIN_BOOKING_HOURS) free.push({ start: cursor, end: r.start })
    cursor = Math.max(cursor, r.end)
  }
  if (24 - cursor >= MIN_BOOKING_HOURS) free.push({ start: cursor, end: 24 })

  return free
}

type DayStatus = 'past' | 'free' | 'partial' | 'blocked'

interface MonthCalendarProps {
  year: number
  month: number
  periods: BookedPeriod[]
  today: Date
  now: Date
  selectedDay: Date | null
  onDayClick: (date: Date) => void
}

function MonthCalendar({ year, month, periods, today, now, selectedDay, onDayClick }: MonthCalendarProps) {
  const cells = useMemo(() => buildGrid(year, month), [year, month])

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
      {/* Month header */}
      <div className="px-4 py-3 bg-black/40 border-b border-zinc-800 text-center">
        <span className="text-white font-semibold uppercase tracking-widest text-sm">
          {MONTHS[month]} {year}
        </span>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 border-b border-zinc-800">
        {WEEKDAYS.map(d => (
          <div key={d} className="py-1 text-center text-[10px] text-zinc-600 font-medium uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5 p-1.5">
        {cells.map((date, i) => {
          if (!date) return <div key={`e${i}`} className="h-10" />

          const isPast = toDateOnly(date) < today
          const isToday = isSameDay(date, today)
          const isSelected = selectedDay ? isSameDay(date, selectedDay) : false
          const occupied = getOccupiedRangesForDay(date, periods)
          const nowMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : undefined
          const hasFree = !isPast && hasFreeSlot(date, periods, nowMinutes)

          let status: DayStatus
          if (isPast) {
            status = 'past'
          } else if (!hasFree) {
            status = 'blocked'
          } else if (occupied.length > 0) {
            status = 'partial'
          } else {
            status = 'free'
          }

          const clickable = status === 'free' || status === 'partial'

          const cellStyles: Record<DayStatus, string> = {
            past:    'text-zinc-700 bg-transparent cursor-default',
            free:    'text-emerald-300 bg-emerald-900/20 cursor-pointer hover:bg-emerald-800/30',
            partial: 'text-amber-300 bg-amber-900/20 cursor-pointer hover:bg-amber-800/30',
            blocked: 'text-red-700/60 bg-red-900/30 cursor-default',
          }

          return (
            <div
              key={date.getTime()}
              onClick={() => clickable && onDayClick(date)}
              className={[
                'relative flex flex-col items-center justify-start h-10 rounded-md pt-1',
                'text-[13px] font-medium select-none transition-colors',
                cellStyles[status],
                isSelected ? 'ring-2 ring-amber-400 ring-inset' : '',
                isToday && !isSelected ? 'ring-1 ring-amber-400/50' : '',
              ].filter(Boolean).join(' ')}
            >
              <span className="leading-none">{date.getDate()}</span>

              {/* Occupation bar */}
              {status === 'partial' && (
                <div className="absolute bottom-1 left-1 right-1 h-[4px] rounded-full overflow-hidden bg-zinc-900">
                  {occupied.map((r, ri) => (
                    <div
                      key={ri}
                      className="absolute h-full bg-amber-500/70"
                      style={{
                        left: `${(r.start / 24) * 100}%`,
                        width: `${((r.end - r.start) / 24) * 100}%`,
                      }}
                    />
                  ))}
                </div>
              )}
              {status === 'blocked' && (
                <div className="absolute bottom-1 left-1 right-1 h-[4px] rounded-full overflow-hidden bg-zinc-900">
                  <div className="absolute inset-0 bg-red-600/60" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function AvailabilityPage() {
  const now = useMemo(() => new Date(), [])
  const today = useMemo(() => toDateOnly(now), [now])
  const { periods, loading, error, refetch } = useBookedPeriods()

  const [startYear, setStartYear] = useState(today.getFullYear())
  const [startMonth, setStartMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const months = useMemo(() => {
    return [{ year: startYear, month: startMonth }]
  }, [startYear, startMonth])

  const freeIntervals = useMemo(() => {
    if (!selectedDay) return []
    const nowHour = isSameDay(selectedDay, today)
      ? now.getHours() + now.getMinutes() / 60
      : undefined
    return getFreeIntervals(selectedDay, periods, nowHour)
  }, [selectedDay, periods, now, today])

  const canPrev = startYear > today.getFullYear() || startMonth > today.getMonth()

  const goPrev = () => {
    if (startMonth === 0) { setStartMonth(11); setStartYear(y => y - 1) }
    else setStartMonth(m => m - 1)
  }
  const goNext = () => {
    if (startMonth === 11) { setStartMonth(0); setStartYear(y => y + 1) }
    else setStartMonth(m => m + 1)
  }

  return (
    <div className="min-h-screen bg-luxury-gradient text-white">
      {/* Back link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 text-sm transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          На главную
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-8">

        {/* Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-yellow-600 to-transparent mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-yellow-600 mb-2 uppercase tracking-widest">
            Свободные даты
          </h1>
          <p className="text-gray-400 text-sm">
            Нажмите на день, чтобы увидеть свободное время
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-3 py-12 text-zinc-500">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span className="text-sm">Загружаем расписание…</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-5 text-center mb-6">
            <p className="text-red-400 text-sm mb-3">Не удалось загрузить расписание</p>
            <button
              onClick={refetch}
              className="text-amber-400 hover:text-amber-300 text-sm underline transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        )}

        {!loading && (
          <>
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={goPrev}
                disabled={!canPrev}
                aria-label="Предыдущий месяц"
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-700 text-amber-400 hover:bg-zinc-800 hover:border-zinc-600 disabled:text-zinc-700 disabled:border-zinc-800 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <span className="text-zinc-500 text-xs uppercase tracking-widest">
                {MONTHS[startMonth]} {startYear}
              </span>

              <button
                onClick={goNext}
                aria-label="Следующий месяц"
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-700 text-amber-400 hover:bg-zinc-800 hover:border-zinc-600 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Two-month grid */}
            <div className="grid grid-cols-1 gap-4 mb-4">
              {months.map(({ year, month }) => (
                <MonthCalendar
                  key={`${year}-${month}`}
                  year={year}
                  month={month}
                  periods={periods}
                  today={today}
                  now={now}
                  selectedDay={selectedDay}
                  onDayClick={setSelectedDay}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-6 text-xs text-zinc-500">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-emerald-900/40 border border-emerald-700/40" />
                <span>Свободно</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-amber-900/40 border border-amber-700/40" />
                <span>Частично занято</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-red-900/40 border border-red-700/40" />
                <span>Занято</span>
              </div>
            </div>

            {/* Day detail panel */}
            {selectedDay ? (
              <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-semibold">
                    {selectedDay.getDate()} {MONTHS_GENITIVE[selectedDay.getMonth()]} {selectedDay.getFullYear()}
                  </h2>
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="text-zinc-600 hover:text-zinc-400 transition-colors"
                    aria-label="Закрыть"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {freeIntervals.length === 0 ? (
                  <p className="text-red-400/80 text-sm">Нет доступного времени для заезда</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-zinc-500 text-xs uppercase tracking-wider mb-3">Свободное время</p>
                    <div className="flex flex-wrap gap-2">
                      {freeIntervals.map((interval, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 bg-emerald-900/30 border border-emerald-700/40 rounded-lg px-3 py-1.5"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span className="text-emerald-300 text-sm font-medium">
                            {formatHour(interval.start)} — {formatHour(interval.end)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-2 mb-8" />
            )}

            {/* CTA */}
            <div className="text-center">
              <Link
                to="/booking"
                className="inline-block bg-yellow-600 hover:bg-yellow-500 active:bg-yellow-700 text-black font-bold py-3 px-10 rounded-lg uppercase tracking-widest text-sm transition-colors"
              >
                Забронировать
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
