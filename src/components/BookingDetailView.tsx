import { useState, useMemo, useCallback, type FormEvent } from 'react'
import { getEnv } from '../utils/env'
import { PriceBreakdown } from './PriceBreakdown'
import {
  TARIFF_OPTIONS,
  TARIFF_CONFIG,
  WINE_OPTIONS,
  calculateBasePrice,
  calculatePriceWithServices,
  calculateDuration,
  getUnavailableCheckInSlots,
  getUnavailableCheckOutSlots,
} from '../utils/booking'
import type { TariffType } from '../types/booking.types'
import CustomCalendar from './BookingWizard/CustomCalendar'
import TimePicker from './BookingWizard/TimePicker'
import { useRescheduleBookedPeriods } from '../hooks/useRescheduleBookedPeriods'
import { getBookingStatusBadge } from '../lib/bookingStatus'

// ─── Public types ─────────────────────────────────────────────────────────────

export interface BookingViewData {
  bookingId: number
  publicId?: string
  startDate: string
  endDate: string
  tariff: string
  guestCount: number
  hasPhotoshoot: boolean
  hasSauna: boolean
  hasBathTub: boolean
  hasExtraBedroom: boolean
  hasSecretRoom: boolean
  isCanceled: boolean
  isDateChanged: boolean
  isPrepaymented: boolean
  isDone: boolean
  totalPrice: number
  prepaymentPrice: number
  comment?: string
  wineSelection: string[]
  transferAddress?: string
  isFuture: boolean
  // Computed access flags (user mode uses server values; admin computes locally)
  canModify: boolean
  canReschedule: boolean
  canCancel: boolean
  canPay: boolean
  // Admin-only extras
  userContact?: string
  userName?: string
  source?: string
}

export interface ServicesPayload {
  hasPhotoshoot: boolean
  hasSauna: boolean
  hasBathTub: boolean
  hasExtraBedroom: boolean
  hasSecretRoom: boolean
  wineSelection: string[]
  needsTransfer: boolean
  transferAddress?: string
  totalPrice: number
}

export interface BookingViewActions {
  saveTariff(tariff: string, totalPrice: number): Promise<void>
  saveServices(payload: ServicesPayload): Promise<void>
  reschedule(checkIn: string, checkOut: string, totalPrice: number): Promise<void>
  cancel(): Promise<void>
  // Admin-only
  confirm?(): Promise<void>
  savePrice?(totalPrice: number, prepaymentPrice: number): Promise<void>
  delete?(): Promise<void>
  // User-only
  uploadReceipt?(file: File): Promise<void>
}

type ActivePanel = 'tariff' | 'services' | 'reschedule' | 'cancel' | 'confirm' | 'price' | 'pay' | 'instructions' | 'delete' | null

// ─── Shared helpers ───────────────────────────────────────────────────────────

function formatDatetime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  })
}

function isoToTimeInput(iso: string) { return iso.slice(11, 16) }
function toNaiveISO(date: string, time: string) { return `${date}T${time}:00` }

function dateToYMD(d: Date): string {
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mo}-${day}`
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-zinc-800 last:border-0">
      <span className="text-zinc-500 text-xs">{label}</span>
      <span className="text-white text-xs font-medium text-right max-w-[55%]">{value}</span>
    </div>
  )
}

function ServiceCheckbox({
  label, checked, onChange, priceHint,
}: {
  label: string; checked: boolean; onChange(v: boolean): void; priceHint?: string
}) {
  return (
    <label className={[
      'flex items-center justify-between cursor-pointer px-3 py-2.5 rounded-lg border transition-all',
      checked ? 'border-amber-500/50 bg-amber-500/10 text-white' : 'border-zinc-800 text-zinc-400 hover:border-zinc-600',
    ].join(' ')}>
      <div className="flex items-center gap-3">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
          className="w-4 h-4 accent-amber-500 cursor-pointer" />
        <span className="text-sm">{label}</span>
      </div>
      {priceHint && <span className="text-zinc-500 text-xs">{priceHint}</span>}
    </label>
  )
}

function ActionButton({
  label, onClick, variant = 'default',
}: {
  label: string; onClick(): void; variant?: 'default' | 'green' | 'red'
}) {
  const border =
    variant === 'green' ? 'border-emerald-700/50 hover:border-emerald-500/70 text-emerald-400 hover:text-emerald-300' :
    variant === 'red'   ? 'border-red-900/40 hover:border-red-700/60 text-red-400 hover:text-red-300' :
                          'border-zinc-700 hover:border-zinc-500 text-white'
  const icon =
    variant === 'green' ? 'text-emerald-900/60 group-hover:text-emerald-400' :
    variant === 'red'   ? 'text-red-900/60 group-hover:text-red-400' :
                          'text-zinc-600 group-hover:text-amber-400'
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between p-3 rounded-lg border ${border} text-sm transition-all group`}>
      <span>{label}</span>
      <svg className={`w-4 h-4 ${icon} transition-colors`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}

function SaveCancelRow({
  submitting, saveLabel, disabled, onCancel,
}: {
  submitting: boolean; saveLabel?: string; disabled?: boolean; onCancel(): void
}) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="submit" disabled={submitting || disabled}
        className="flex-1 bg-yellow-600 hover:bg-yellow-500 disabled:bg-zinc-700 disabled:text-zinc-500
          text-black font-bold py-2.5 rounded-lg text-sm uppercase tracking-wider transition-all">
        {submitting ? 'Сохраняем…' : (saveLabel ?? 'Сохранить')}
      </button>
      <button type="button" onClick={onCancel}
        className="px-4 py-2.5 border border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-sm transition-all">
        Отмена
      </button>
    </div>
  )
}

function StatusBadge({ b }: { b: BookingViewData }) {
  const { label, className } = getBookingStatusBadge(b)
  return <span className={`text-xs px-2.5 py-1 rounded-full border whitespace-nowrap ${className}`}>{label}</span>
}

// ─── Copy booking text ────────────────────────────────────────────────────────

function fmtDateForCopy(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}.${mm}.${d.getFullYear()} ${hh}:${min}`
}

function buildBookingCopyText(booking: BookingViewData): string {
  const tariffName = TARIFF_OPTIONS.find(t => t.id === booking.tariff)?.name ?? booking.tariff
  const yesNo = (v: boolean) => v ? 'Да' : 'Нет'
  const contact = booking.userContact ?? booking.userName ?? 'N/A'

  const lines = [
    `Пользователь: ${contact}`,
    `Дата начала: ${fmtDateForCopy(booking.startDate)}`,
    `Дата завершения: ${fmtDateForCopy(booking.endDate)}`,
    `Тариф: ${tariffName}`,
    `Стоимость: ${booking.totalPrice} руб.`,
    `Предоплата: ${booking.prepaymentPrice} руб.`,
    `Фотосессия: ${yesNo(booking.hasPhotoshoot)}`,
    `Сауна: ${yesNo(booking.hasSauna)}`,
    `Горячий чан: ${yesNo(booking.hasBathTub)}`,
    `Доп. спальня: ${yesNo(booking.hasExtraBedroom)}`,
    `Секретная комната: ${yesNo(booking.hasSecretRoom)}`,
    `Количество гостей: ${booking.guestCount}`,
  ]

  if (booking.comment) lines.push(`Комментарий: ${booking.comment}`)

  if (booking.wineSelection.length > 0) {
    const wineNames = booking.wineSelection
      .map(id => WINE_OPTIONS.find(w => w.id === id)?.name ?? id)
      .join(', ')
    lines.push(`Вино: ${wineNames}`)
  }

  if (booking.transferAddress) lines.push(`Трансфер: ${booking.transferAddress}`)

  lines.push(`Источник: ${booking.source === 'web' ? '🌐 Веб' : '📱 Телеграм'}`)

  return lines.join('\n')
}

function CopyBookingButton({ booking }: { booking: BookingViewData }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    const text = buildBookingCopyText(booking)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [booking])

  return (
    <button
      onClick={handleCopy}
      className={[
        'w-full flex items-center justify-between p-3 rounded-lg border text-sm transition-all group',
        copied
          ? 'border-emerald-700/50 text-emerald-400'
          : 'border-zinc-700 hover:border-zinc-500 text-white',
      ].join(' ')}
    >
      <span>{copied ? '✓ Скопировано' : 'Скопировать описание'}</span>
      {copied ? (
        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  )
}

// ─── Panel shared props ───────────────────────────────────────────────────────

interface PanelProps {
  booking: BookingViewData
  mode: 'user' | 'admin'
  onClose(): void
  onSuccess(msg: string): Promise<void>
  onError(msg: string): void
  actions: BookingViewActions
}

// ─── Tariff panel ─────────────────────────────────────────────────────────────

function TariffPanel({ booking, onClose, onSuccess, onError, actions }: PanelProps) {
  const [selectedTariff, setSelectedTariff] = useState<TariffType>(booking.tariff as TariffType)
  const [submitting, setSubmitting] = useState(false)

  const durationHours = calculateDuration(new Date(booking.startDate), new Date(booking.endDate))

  const newPrice = calculatePriceWithServices(selectedTariff, durationHours, {
      hasPhotoshoot: booking.hasPhotoshoot,
      hasSauna: booking.hasSauna,
      hasBathTub: booking.hasBathTub,
      hasExtraBedroom: booking.hasExtraBedroom,
      hasSecretRoom: booking.hasSecretRoom,
    })
  const basePriceOnly = calculateBasePrice(selectedTariff, durationHours)
  const extrasPrice = newPrice - basePriceOnly

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await actions.saveTariff(selectedTariff, newPrice)
      await onSuccess('Тариф успешно изменён')
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-white font-semibold">Изменить тариф</h3>
      <div className="grid grid-cols-2 gap-2">
        {TARIFF_OPTIONS.filter(t => t.id !== 'gift-certificate').map(opt => (
          <label key={opt.id} className={[
            'relative flex flex-col p-3 rounded-lg border cursor-pointer transition-all',
            selectedTariff === opt.id
              ? 'border-amber-500/60 bg-amber-500/10'
              : 'border-zinc-700 bg-black/30 hover:border-zinc-500',
          ].join(' ')}>
            <input type="radio" name="tariff" value={opt.id} checked={selectedTariff === opt.id}
              onChange={() => setSelectedTariff(opt.id as TariffType)} className="sr-only" />
            {selectedTariff === opt.id && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
            <span className="text-white text-sm font-medium leading-tight pr-5">{opt.name}</span>
            <span className="text-amber-500/70 text-xs mt-1.5 font-medium">{opt.unit}</span>
          </label>
        ))}
      </div>

      {newPrice > 0 && (
        <PriceBreakdown basePrice={basePriceOnly} extrasPrice={extrasPrice} totalPrice={newPrice} />
      )}

      <SaveCancelRow submitting={submitting} disabled={selectedTariff === booking.tariff} onCancel={onClose} />
    </form>
  )
}

// ─── Services panel ───────────────────────────────────────────────────────────

function ServicesPanel({ booking, onClose, onSuccess, onError, actions }: PanelProps) {
  const [hasPhotoshoot, setHasPhotoshoot] = useState(booking.hasPhotoshoot)
  const [hasSauna, setHasSauna] = useState(booking.hasSauna)
  const [hasBathTub, setHasBathTub] = useState(booking.hasBathTub)
  const [hasExtraBedroom, setHasExtraBedroom] = useState(booking.hasExtraBedroom)
  const [hasSecretRoom, setHasSecretRoom] = useState(booking.hasSecretRoom)
  const [selectedWine, setSelectedWine] = useState<string>(booking.wineSelection[0] ?? '')
  const [needsTransfer, setNeedsTransfer] = useState(!!booking.transferAddress)
  const [transferAddress, setTransferAddress] = useState(booking.transferAddress ?? '')
  const [submitting, setSubmitting] = useState(false)

  const tariffId = booking.tariff as TariffType
  const cfg = TARIFF_CONFIG[tariffId]
  const durationHours = calculateDuration(new Date(booking.startDate), new Date(booking.endDate))
  const basePrice = calculateBasePrice(tariffId, durationHours)
  const extras =
    (hasPhotoshoot ? (cfg?.photoshootPrice ?? 0) : 0) +
    (hasSauna ? (cfg?.saunaPrice ?? 0) : 0) +
    (hasBathTub ? (cfg?.bathTubPrice ?? 0) : 0) +
    (hasExtraBedroom ? (cfg?.extraBedroomPrice ?? 0) : 0) +
    (hasSecretRoom ? (cfg?.secretRoomPrice ?? 0) : 0)
  const newTotal = basePrice + extras

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const payload: ServicesPayload = {
      hasPhotoshoot, hasSauna, hasBathTub, hasExtraBedroom, hasSecretRoom,
      wineSelection: selectedWine ? [selectedWine] : [],
      needsTransfer,
      transferAddress: needsTransfer ? transferAddress : undefined,
      totalPrice: newTotal,
    }
    try {
      await actions.saveServices(payload)
      await onSuccess('Услуги успешно обновлены')
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-white font-semibold">Изменить услуги</h3>

      <div className="space-y-2">
        {(cfg?.photoshootPrice ?? 0) > 0 && (
          <ServiceCheckbox label="Фотосессия" checked={hasPhotoshoot} onChange={setHasPhotoshoot}
            priceHint={`+${cfg.photoshootPrice} BYN`} />
        )}
        {(cfg?.saunaPrice ?? 0) > 0 && (
          <ServiceCheckbox label="Сауна" checked={hasSauna} onChange={setHasSauna}
            priceHint={`+${cfg.saunaPrice} BYN`} />
        )}
        {(cfg?.bathTubPrice ?? 0) > 0 && (
          <ServiceCheckbox label="Банный чан" checked={hasBathTub} onChange={setHasBathTub}
            priceHint={`+${cfg.bathTubPrice} BYN`} />
        )}
        {(cfg?.extraBedroomPrice ?? 0) > 0 && (
          <ServiceCheckbox label="Дополнительная спальня" checked={hasExtraBedroom} onChange={setHasExtraBedroom}
            priceHint={`+${cfg.extraBedroomPrice} BYN`} />
        )}
        {(cfg?.secretRoomPrice ?? 0) > 0 && (
          <ServiceCheckbox label="Секретная комната" checked={hasSecretRoom} onChange={setHasSecretRoom}
            priceHint={`+${cfg.secretRoomPrice} BYN`} />
        )}
        {cfg?.hasTransfer && (
          <>
            <ServiceCheckbox label="Трансфер" checked={needsTransfer} onChange={setNeedsTransfer}
              priceHint="Бесплатно" />
            {needsTransfer && (
              <input type="text" value={transferAddress} onChange={e => setTransferAddress(e.target.value)}
                placeholder="Адрес подачи"
                className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm
                  focus:outline-none focus:border-amber-500/60 placeholder-zinc-600 mt-2" />
            )}
          </>
        )}
      </div>

      {cfg?.hasTransfer && (
        <div>
          <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Вино</p>
          <div className="grid grid-cols-2 gap-1.5">
            {WINE_OPTIONS.filter(w => w.id !== 'none').map(wine => (
              <label key={wine.id} className={[
                'flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs transition-all',
                selectedWine === wine.id ? 'border-amber-500/60 bg-amber-500/10 text-amber-300' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600',
              ].join(' ')}>
                <input type="radio" name="wine" value={wine.id} checked={selectedWine === wine.id}
                  onChange={() => setSelectedWine(wine.id)} className="accent-amber-500" />
                {wine.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <p className="text-zinc-400 text-sm">
        Новая стоимость: <span className="text-yellow-500 font-bold">{newTotal} BYN</span>
      </p>

      <SaveCancelRow submitting={submitting} onCancel={onClose} />
    </form>
  )
}

// ─── Reschedule panel ─────────────────────────────────────────────────────────

function ReschedulePanel({ booking, mode, onClose, onSuccess, onError, actions }: PanelProps) {
  const isAdmin = mode === 'admin'
  const { periods } = useRescheduleBookedPeriods(booking.bookingId, isAdmin)

  const parseLocalDate = (iso: string) => {
    const d = new Date(iso)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }

  const [checkInDate, setCheckInDate] = useState<Date | null>(() => parseLocalDate(booking.startDate))
  const [checkInTime, setCheckInTime] = useState(isoToTimeInput(booking.startDate))
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(() => parseLocalDate(booking.endDate))
  const [checkOutTime, setCheckOutTime] = useState(isoToTimeInput(booking.endDate))
  const [submitting, setSubmitting] = useState(false)

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }, [])
  const tariffId = booking.tariff as TariffType

  const unavailableCheckInSlots = useMemo(
    () => checkInDate ? getUnavailableCheckInSlots(checkInDate, periods, tariffId) : new Set<string>(),
    [checkInDate, periods, tariffId],
  )

  const checkInDateTime = useMemo(() => {
    if (!checkInDate || !checkInTime) return null
    const [h, m] = checkInTime.split(':').map(Number)
    return new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate(), h, m)
  }, [checkInDate, checkInTime])

  const unavailableCheckOutSlots = useMemo(
    () => (checkOutDate && checkInDateTime)
      ? getUnavailableCheckOutSlots(checkOutDate, checkInDateTime, periods, tariffId)
      : new Set<string>(),
    [checkOutDate, checkInDateTime, periods, tariffId],
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
    ? calculatePriceWithServices(tariffId, durationHours, {
        hasPhotoshoot: booking.hasPhotoshoot,
        hasSauna: booking.hasSauna,
        hasBathTub: booking.hasBathTub,
        hasExtraBedroom: booking.hasExtraBedroom,
        hasSecretRoom: booking.hasSecretRoom,
      })
    : 0

  const handleCheckInDateSelect = (date: Date) => {
    setCheckInDate(date)
    setCheckOutDate(null)
    setCheckOutTime('')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (durationHours <= 0 || !checkInDate || !checkOutDate) return
    setSubmitting(true)
    try {
      await actions.reschedule(
        toNaiveISO(dateToYMD(checkInDate), checkInTime),
        toNaiveISO(dateToYMD(checkOutDate), checkOutTime),
        newPrice,
      )
      await onSuccess(
        isAdmin
          ? 'Дата бронирования перенесена'
          : 'Дата бронирования перенесена.'
      )
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-white font-semibold">Перенести бронирование</h3>

      {!isAdmin && (
        <p className="text-amber-400/80 text-xs border border-amber-500/20 bg-amber-500/5 rounded-lg p-3">
          Перенос возможен только один раз.
        </p>
      )}

      {/* Check-in */}
      <div>
        <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Заезд</div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
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
          <div className="mt-2 bg-zinc-800/60 border border-zinc-700 px-3 py-2 rounded-lg flex items-center justify-between text-sm">
            <span className="text-zinc-400 text-xs">Заезд:</span>
            <span className="text-amber-400 font-semibold">
              {checkInDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} в {checkInTime}
            </span>
          </div>
        )}
      </div>

      {/* Check-out — only after check-in is selected */}
      {checkInDate && checkInTime && (
        <div>
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Выезд</div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex-1 min-w-0">
              <CustomCalendar
                selectedDate={checkOutDate}
                onDateSelect={date => { setCheckOutDate(date); setCheckOutTime('') }}
                bookedPeriods={periods}
                minDate={checkInDate}
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
        </div>
      )}

      {durationHours > 0 && (
        <div className="bg-zinc-800/60 border border-zinc-700 px-3 py-2.5 rounded-lg flex items-center justify-between gap-4">
          <div>
            <div className="text-zinc-400 text-xs uppercase tracking-wider">Длительность</div>
            <div className="text-amber-400 font-bold">{durationHours} ч</div>
          </div>
          <div className="text-right">
            <div className="text-zinc-400 text-xs uppercase tracking-wider">Стоимость</div>
            <div className="text-yellow-500 font-bold">{newPrice} BYN</div>
          </div>
        </div>
      )}

      <SaveCancelRow submitting={submitting} disabled={durationHours <= 0} saveLabel="Подтвердить перенос" onCancel={onClose} />
    </form>
  )
}

// ─── Cancel panel ─────────────────────────────────────────────────────────────

function CancelPanel({ booking, mode, onClose, onSuccess, onError, actions }: PanelProps) {
  const [submitting, setSubmitting] = useState(false)

  const handleCancel = async () => {
    setSubmitting(true)
    try {
      await actions.cancel()
      await onSuccess('Бронирование отменено')
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-white font-semibold">Отменить бронирование</h3>
      <p className="text-zinc-400 text-sm">
        {mode === 'admin'
          ? `Бронирование #${booking.bookingId} будет отменено. Это действие нельзя отменить.`
          : 'Вы уверены? Это действие нельзя отменить. Предоплата не возвращается.'}
      </p>
      <div className="flex gap-3">
        <button type="button" onClick={handleCancel} disabled={submitting}
          className="flex-1 bg-red-700 hover:bg-red-600 disabled:bg-zinc-700 disabled:text-zinc-500
            text-white font-bold py-2.5 rounded-lg text-sm uppercase tracking-wider transition-all">
          {submitting ? 'Отменяем…' : 'Да, отменить'}
        </button>
        <button type="button" onClick={onClose}
          className="flex-1 border border-zinc-700 text-zinc-400 hover:text-white py-2.5 rounded-lg text-sm transition-all">
          Назад
        </button>
      </div>
    </div>
  )
}

// ─── Confirm panel (admin only) ───────────────────────────────────────────────

function ConfirmPanel({ booking, onClose, onSuccess, onError, actions }: PanelProps) {
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      await actions.confirm!()
      await onSuccess('Бронирование подтверждено')
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-white font-semibold">Подтвердить бронирование</h3>
      <p className="text-zinc-400 text-sm">
        Бронирование #{booking.bookingId} будет отмечено как оплаченное.
        Статус изменится с «Ждёт подтверждения» на «Предстоит».
      </p>
      <div className="flex gap-3">
        <button type="button" onClick={handleConfirm} disabled={submitting}
          className="flex-1 bg-emerald-700 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500
            text-white font-bold py-2.5 rounded-lg text-sm uppercase tracking-wider transition-all">
          {submitting ? 'Подтверждаем…' : 'Подтвердить'}
        </button>
        <button type="button" onClick={onClose}
          className="flex-1 border border-zinc-700 text-zinc-400 hover:text-white py-2.5 rounded-lg text-sm transition-all">
          Назад
        </button>
      </div>
    </div>
  )
}

// ─── Delete panel (admin only) ───────────────────────────────────────────────

function DeletePanel({
  booking, onClose, onDeleted, onError, actions,
}: {
  booking: BookingViewData
  onClose(): void
  onDeleted(): void
  onError(msg: string): void
  actions: BookingViewActions
}) {
  const [submitting, setSubmitting] = useState(false)

  const handleDelete = async () => {
    setSubmitting(true)
    try {
      await actions.delete!()
      onDeleted()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Ошибка')
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-white font-semibold">Удалить бронирование</h3>
      <p className="text-zinc-400 text-sm">
        Бронирование #{booking.bookingId} будет <strong className="text-red-400">безвозвратно удалено</strong> из базы данных.
        Это действие нельзя отменить.
      </p>
      <div className="flex gap-3">
        <button type="button" onClick={handleDelete} disabled={submitting}
          className="flex-1 bg-red-800 hover:bg-red-700 disabled:bg-zinc-700 disabled:text-zinc-500
            text-white font-bold py-2.5 rounded-lg text-sm uppercase tracking-wider transition-all">
          {submitting ? 'Удаляем…' : 'Да, удалить навсегда'}
        </button>
        <button type="button" onClick={onClose}
          className="flex-1 border border-zinc-700 text-zinc-400 hover:text-white py-2.5 rounded-lg text-sm transition-all">
          Назад
        </button>
      </div>
    </div>
  )
}

// ─── Price panel (admin only) ─────────────────────────────────────────────────

function PricePanel({ booking, onClose, onSuccess, onError, actions }: PanelProps) {
  const [totalPrice, setTotalPrice] = useState(String(booking.totalPrice))
  const [prepaymentPrice, setPrepaymentPrice] = useState(String(booking.prepaymentPrice))
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const total = parseFloat(totalPrice)
    const prepayment = parseFloat(prepaymentPrice)
    if (isNaN(total) || isNaN(prepayment) || total < 0 || prepayment < 0) {
      onError('Введите корректные значения')
      return
    }
    setSubmitting(true)
    try {
      await actions.savePrice!(total, prepayment)
      await onSuccess('Стоимость успешно обновлена')
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-white font-semibold">Изменить стоимость</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-1.5">Итоговая стоимость (BYN)</label>
          <input type="number" min="0" step="1" value={totalPrice} onChange={e => setTotalPrice(e.target.value)}
            className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500/60" />
        </div>
        <div>
          <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-1.5">Предоплата (BYN)</label>
          <input type="number" min="0" step="1" value={prepaymentPrice} onChange={e => setPrepaymentPrice(e.target.value)}
            className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500/60" />
        </div>
      </div>
      <SaveCancelRow submitting={submitting} onCancel={onClose} />
    </form>
  )
}

// ─── Pay panel (user only) ────────────────────────────────────────────────────

// ─── Instructions helpers ─────────────────────────────────────────────────────

function instructionsAvailableFrom(startDate: string): Date {
  const d = new Date(startDate)
  d.setDate(d.getDate() - 1)
  d.setHours(0, 0, 0, 0)
  return d
}

function isInstructionsAvailable(startDate: string): boolean {
  return new Date() >= instructionsAvailableFrom(startDate)
}

// ─── Instructions panel ───────────────────────────────────────────────────────

function InstructionsPanel({ booking, onClose }: { booking: BookingViewData; onClose(): void }) {
  const keyBoxPassword = getEnv('VITE_HOUSE_KEY_PASSWORD')
  const bankCardNumber = getEnv('VITE_BANK_CARD_NUMBER')
  const remainingAmount = Math.max(0, booking.totalPrice - booking.prepaymentPrice)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Инструкция по заселению</h3>
        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Route */}
      <InstructionSection icon="📍" title="Маршрут до дома">
        <p className="text-zinc-300 text-sm leading-relaxed">
          Через 500 метров после ж/д переезда по левую сторону будет оранжевый магазин.
          После магазина нужно повернуть налево — это ориентир нужного поворота, далее навигатор привезёт правильно.
          Когда будете ехать вдоль леса, поверните на садовое товарищество «Юбилейное‑68» (будет вывеска).
        </p>
        <p className="text-zinc-400 text-xs mt-1 font-mono">ст. Юбилейное‑68, ул. Сосновая, д. 2</p>
        <div className="flex gap-3 mt-3">
          <a
            href="https://yandex.com.ge/maps/157/minsk/?l=stv%2Csta&ll=27.297381%2C53.932145&mode=routes&rtext=53.939763%2C27.333107~53.938194%2C27.324665~53.932431%2C27.315410~53.930789%2C27.299320~53.934190%2C27.300387&rtt=auto&ruri=~~~~ymapsbm1%3A%2F%2Fgeo%3Fdata%3DCgo0Mzk0MjMwMTgwErMB0JHQtdC70LDRgNGD0YHRjCwg0JzRltC90YHQutGWINGA0LDRkdC9LCDQltC00LDQvdC-0LLRltGG0LrRliDRgdC10LvRjNGB0LDQstC10YIsINGB0LDQtNCw0LLQvtC00YfQsNC1INGC0LDQstCw0YDRi9GB0YLQstCwINCu0LHRltC70LXQudC90LDQtS02OCwg0KHQsNGB0L3QvtCy0LDRjyDQstGD0LvRltGF0LAsIDIiCg0sZ9pBFZ28V0I%2C&z=16.06"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded-lg px-3 py-1.5 transition-colors"
          >
            Yandex Maps
          </a>
          <a
            href="https://maps.app.goo.gl/Hsf9Xw69N8tqHyqt5"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded-lg px-3 py-1.5 transition-colors"
          >
            Google Maps
          </a>
        </div>
      </InstructionSection>

      {/* Key box */}
      <InstructionSection icon="🔑" title="Ключница и заселение">
        <p className="text-zinc-300 text-sm leading-relaxed">
          Ключница находится <strong className="text-white">за территорией дома</strong> — в ней лежат ключи от ворот и дома.
        </p>
        {keyBoxPassword && (
          <div className="mt-2 flex items-center gap-3 bg-black/40 border border-amber-500/20 rounded-lg px-3 py-2">
            <span className="text-zinc-500 text-xs">Пароль ключницы:</span>
            <span className="text-amber-400 font-mono font-bold tracking-widest">{keyBoxPassword}</span>
          </div>
        )}
        <p className="text-zinc-300 text-sm leading-relaxed mt-2">
          Ящик находится на территории участка возле ворот в дом. Положите в него подписанный договор
          и оплату наличными (если платите наличкой) в течение первых 30 минут пребывания.
          Договор и ручка будут лежать на острове на кухне. Вложите деньги и договор в розовый конверт.
        </p>
        {(remainingAmount > 0 || bankCardNumber) && (
          <div className="mt-3 bg-zinc-800/60 border border-zinc-700 rounded-lg p-3 space-y-1">
            {remainingAmount > 0 && (
              <p className="text-sm">
                <span className="text-zinc-500">К доплате: </span>
                <span className="text-yellow-500 font-bold">{remainingAmount} BYN</span>
              </p>
            )}
            {bankCardNumber && (
              <p className="text-sm">
                <span className="text-zinc-500">Перевод (BSB‑Bank): </span>
                <span className="text-white font-mono">{bankCardNumber}</span>
              </p>
            )}
          </div>
        )}
      </InstructionSection>

      {/* Admin contact */}
      <InstructionSection icon="📞" title="Связь с администратором">
        <p className="text-zinc-300 text-sm">
          Если нужна помощь или возникли вопросы по дороге — напишите администратору:{' '}
          <a
            href="https://t.me/the_secret_house"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-300"
          >
            @the_secret_house
          </a>
        </p>
      </InstructionSection>

      {/* Sauna */}
      {booking.hasSauna && (
        <InstructionSection icon="🧖" title="Инструкция по сауне">
          <ol className="text-zinc-300 text-sm space-y-1 list-decimal list-inside leading-relaxed">
            <li>Подойдите к входной двери.</li>
            <li>По правую руку находится электрический счётчик.</li>
            <li>Все рубильники подписаны — переключите рубильник с надписью «Сауна».</li>
            <li>Через 1 час сауна нагреется.</li>
            <li>После использования выключите рубильник.</li>
          </ol>
        </InstructionSection>
      )}

      {/* Bath tub */}
      {booking.hasBathTub && (
        <InstructionSection icon="🛁" title="Банный чан">
          <p className="text-zinc-400 text-xs mb-2">
            Оптимальная температура: 38–40°C. Сеанс: 15–20 мин, делайте перерывы. Алкоголь несовместим с горячим чаном.
          </p>
          <ol className="text-zinc-300 text-sm space-y-1 list-decimal list-inside leading-relaxed">
            <li>Полейте бумагу, щепу и полено розжигом. Розжиг убрать — больше не использовать.</li>
            <li>С помощью газового баллона с пистолетом разожгите до полного возгорания (3–7 мин).</li>
            <li>Положите в огонь ещё 3 полена.</li>
            <li>После полного возгорания постепенно подкладывайте дрова 1–2 часа.</li>
            <li>Пользуйтесь перчатками и кочергой.</li>
            <li>Открывайте крышку чана непосредственно перед купанием, после — закройте.</li>
          </ol>
        </InstructionSection>
      )}
    </div>
  )
}

function InstructionSection({
  icon, title, children,
}: {
  icon: string; title: string; children: React.ReactNode
}) {
  return (
    <div className="border-l-2 border-amber-500/30 pl-4">
      <p className="text-white text-sm font-semibold mb-2">{icon} {title}</p>
      {children}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function BookingDetailView({
  booking,
  mode,
  onBack,
  onReload,
  actions,
  onReschedule,
  onDeleted,
}: {
  booking: BookingViewData
  mode: 'user' | 'admin'
  onBack(): void
  onReload(): Promise<void>
  actions: BookingViewActions
  onReschedule?: () => void
  onDeleted?: () => void
}) {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const isAdmin = mode === 'admin'
  const isReadOnly = isAdmin
    ? booking.isCanceled || booking.isDone
    : !booking.canModify && !booking.canPay
  const tariffName = TARIFF_OPTIONS.find(t => t.id === booking.tariff)?.name ?? booking.tariff

  const showInstructionsBlock =
    !isAdmin && !!booking.publicId && !booking.isCanceled && !booking.isDone
  const instructionsAvailable = showInstructionsBlock && isInstructionsAvailable(booking.startDate)

  const openPanel = (p: ActivePanel) => { setActivePanel(p); setActionError(null) }
  const closePanel = () => setActivePanel(null)

  const handleSuccess = async (msg: string) => {
    await onReload()
    setSuccessMsg(msg)
    setActivePanel(null)
    setActionError(null)
    setTimeout(() => setSuccessMsg(null), 4000)
  }

  const panelProps: PanelProps = {
    booking, mode, onClose: closePanel, onSuccess: handleSuccess, onError: setActionError, actions,
  }

  return (
    <div className="min-h-screen bg-luxury-gradient text-white">
      {/* Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <button onClick={onBack}
          className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 text-sm transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {isAdmin ? 'Все бронирования' : 'Мои бронирования'}
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Success */}
        {successMsg && (
          <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-xl p-3 mb-4 text-center">
            <p className="text-emerald-400 text-sm">{successMsg}</p>
          </div>
        )}

        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-white">
              {formatDateShort(booking.startDate)} — {formatDateShort(booking.endDate)}
            </h1>
            <p className="text-zinc-500 text-sm mt-0.5">{tariffName}</p>
            {isAdmin && (booking.userContact || booking.userName) && (
              <p className="text-amber-400/80 text-xs mt-1">
                {booking.userContact ?? ''}
                {booking.userName && booking.userName !== booking.userContact ? ` · ${booking.userName}` : ''}
              </p>
            )}
          </div>
          <StatusBadge b={booking} />
        </div>

        <div className={isReadOnly ? 'max-w-sm mx-auto w-full' : 'grid grid-cols-1 md:grid-cols-2 gap-4 items-start'}>
          {/* Details card */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2">
            {isAdmin && <DetailRow label="ID" value={String(booking.bookingId)} />}
            <DetailRow label="Заезд" value={formatDatetime(booking.startDate)} />
            <DetailRow label="Выезд" value={formatDatetime(booking.endDate)} />
            <DetailRow label="Гостей" value={String(booking.guestCount)} />
            <DetailRow label="Итого" value={`${booking.totalPrice} BYN`} />
            <DetailRow label="Предоплата" value={`${booking.prepaymentPrice} BYN`} />
            <DetailRow label="Оплачено" value={booking.isPrepaymented ? 'Да' : 'Нет'} />
            {booking.hasSauna && <DetailRow label="Сауна" value="Да" />}
            {booking.hasPhotoshoot && <DetailRow label="Фотосессия" value="Да" />}
            {booking.hasBathTub && <DetailRow label="Банный чан" value="Да" />}
            {booking.hasExtraBedroom && <DetailRow label="Доп. спальня" value="Да" />}
            {booking.hasSecretRoom && <DetailRow label="Секретная комната" value="Да" />}
            {booking.transferAddress && <DetailRow label="Трансфер" value={booking.transferAddress} />}
            {booking.wineSelection.length > 0 && (
              <DetailRow label="Вино"
                value={booking.wineSelection.map(id => WINE_OPTIONS.find(w => w.id === id)?.name ?? id).join(', ')} />
            )}
            {booking.comment && <DetailRow label="Комментарий" value={booking.comment} />}
            {isAdmin && <DetailRow label="Перенос использован" value={booking.isDateChanged ? 'Да' : 'Нет'} />}
            {!isAdmin && booking.isDateChanged && <DetailRow label="Перенос" value="Использован" />}
            {isAdmin && booking.source && <DetailRow label="Источник" value={booking.source} />}
          </div>

          {/* Actions column */}
          <div className="space-y-3">
            {actionError && (
              <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-3">
                <p className="text-red-400 text-sm">{actionError}</p>
              </div>
            )}

            {/* Admin: copy booking description */}
            {isAdmin && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
                <CopyBookingButton booking={booking} />
              </div>
            )}

            {/* Admin actions */}
            {isAdmin && !booking.isCanceled && !booking.isDone && (
              <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
                {activePanel === null && (
                  <div className="space-y-2">
                    <p className="text-zinc-500 text-xs uppercase tracking-widest mb-3">Управление</p>
                    {!booking.isPrepaymented && actions.confirm && (
                      <ActionButton label="Подтвердить бронирование" onClick={() => openPanel('confirm')} variant="green" />
                    )}
                    <ActionButton label="Изменить тариф" onClick={() => openPanel('tariff')} />
                    <ActionButton label="Изменить услуги" onClick={() => openPanel('services')} />
                    <ActionButton label="Перенести дату" onClick={onReschedule ? onReschedule : () => openPanel('reschedule')} />
                    {actions.savePrice && (
                      <ActionButton label="Изменить стоимость и предоплату" onClick={() => openPanel('price')} />
                    )}
                    <ActionButton label="Отменить бронирование" onClick={() => openPanel('cancel')} variant="red" />
                    {actions.delete && (
                      <ActionButton label="Удалить бронирование" onClick={() => openPanel('delete')} variant="red" />
                    )}
                  </div>
                )}
                {activePanel === 'confirm' && <ConfirmPanel {...panelProps} />}
                {activePanel === 'tariff' && <TariffPanel {...panelProps} />}
                {activePanel === 'services' && <ServicesPanel {...panelProps} />}
                {activePanel === 'reschedule' && <ReschedulePanel {...panelProps} />}
                {activePanel === 'price' && <PricePanel {...panelProps} />}
                {activePanel === 'cancel' && <CancelPanel {...panelProps} />}
                {activePanel === 'delete' && actions.delete && (
                  <DeletePanel
                    booking={booking}
                    onClose={closePanel}
                    onDeleted={onDeleted ?? onBack}
                    onError={setActionError}
                    actions={actions}
                  />
                )}
              </div>
            )}
            {isAdmin && (booking.isCanceled || booking.isDone) && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                {activePanel !== 'delete' && (
                  <>
                    <p className="text-zinc-500 text-sm text-center mb-3">
                      {booking.isCanceled ? 'Бронирование отменено — изменения недоступны' : 'Бронирование завершено'}
                    </p>
                    {actions.delete && (
                      <ActionButton label="Удалить бронирование" onClick={() => openPanel('delete')} variant="red" />
                    )}
                  </>
                )}
                {activePanel === 'delete' && actions.delete && (
                  <DeletePanel
                    booking={booking}
                    onClose={closePanel}
                    onDeleted={onDeleted ?? onBack}
                    onError={setActionError}
                    actions={actions}
                  />
                )}
              </div>
            )}

            {/* User actions — canModify */}
            {!isAdmin && booking.canModify && (
              <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
                {activePanel === null && (
                  <div className="space-y-2">
                    <p className="text-zinc-500 text-xs uppercase tracking-wider mb-3">Управление бронированием</p>
                    <ActionButton label="Изменить тариф" onClick={() => openPanel('tariff')} />
                    <ActionButton label="Изменить услуги" onClick={() => openPanel('services')} />
                    {booking.canReschedule && (
                      <ActionButton
                        label="Перенести дату"
                        onClick={onReschedule ? onReschedule : () => openPanel('reschedule')}
                      />
                    )}
                    <ActionButton label="Отменить бронирование" onClick={() => openPanel('cancel')} variant="red" />
                  </div>
                )}
                {activePanel === 'tariff' && <TariffPanel {...panelProps} />}
                {activePanel === 'services' && <ServicesPanel {...panelProps} />}
                {!onReschedule && activePanel === 'reschedule' && <ReschedulePanel {...panelProps} />}
                {activePanel === 'cancel' && <CancelPanel {...panelProps} />}
              </div>
            )}

            {/* User actions — canPay (waiting for confirmation, no pay button) */}
            {!isAdmin && booking.canPay && booking.canCancel && (
              <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 space-y-2">
                {activePanel === null && (
                  <>
                    <p className="text-zinc-500 text-xs uppercase tracking-wider mb-3">Управление бронированием</p>
                    <ActionButton label="Отменить бронирование" onClick={() => openPanel('cancel')} variant="red" />
                  </>
                )}
                {activePanel === 'cancel' && <CancelPanel {...panelProps} />}
              </div>
            )}

            {/* No actions */}
            {!isAdmin && !booking.canModify && !booking.canPay && !booking.isCanceled && !booking.isDone && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
                <p className="text-zinc-500 text-sm">Это бронирование уже завершено или прошло</p>
              </div>
            )}

            {/* Instructions button */}
            {showInstructionsBlock && activePanel !== 'instructions' && (
              <div className={[
                'rounded-xl p-4 border',
                instructionsAvailable
                  ? 'bg-zinc-900 border-amber-500/20'
                  : 'bg-zinc-900/40 border-zinc-800',
              ].join(' ')}>
                <p className={[
                  'text-xs uppercase tracking-widest mb-3',
                  instructionsAvailable ? 'text-amber-400/70' : 'text-zinc-600',
                ].join(' ')}>Инструкция</p>
                {instructionsAvailable ? (
                  <button
                    onClick={() => openPanel('instructions')}
                    className="w-full flex items-center justify-between p-3 rounded-lg border
                      border-amber-500/40 hover:border-amber-500/70 text-amber-400 hover:text-amber-300
                      text-sm transition-all"
                  >
                    <span>Инструкция по заселению</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 cursor-not-allowed">
                    <span className="text-zinc-600 text-sm">Инструкция по заселению</span>
                    <span className="text-zinc-700 text-xs">Доступна за 1 день до заезда</span>
                  </div>
                )}
              </div>
            )}
            {showInstructionsBlock && instructionsAvailable && activePanel === 'instructions' && (
              <div className="bg-zinc-900 border border-amber-500/20 rounded-xl p-4">
                <InstructionsPanel booking={booking} onClose={closePanel} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
