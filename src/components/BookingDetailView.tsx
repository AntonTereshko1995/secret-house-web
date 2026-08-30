import { useState, useMemo, type FormEvent } from 'react'
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
  // User-only
  uploadReceipt?(file: File): Promise<void>
}

type ActivePanel = 'tariff' | 'services' | 'reschedule' | 'cancel' | 'confirm' | 'price' | 'pay' | null

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


// ─── Main export ──────────────────────────────────────────────────────────────

export function BookingDetailView({
  booking,
  mode,
  onBack,
  onReload,
  actions,
  onReschedule,
}: {
  booking: BookingViewData
  mode: 'user' | 'admin'
  onBack(): void
  onReload(): Promise<void>
  actions: BookingViewActions
  onReschedule?: () => void
}) {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const isAdmin = mode === 'admin'
  const isReadOnly = isAdmin
    ? booking.isCanceled || booking.isDone
    : !booking.canModify && !booking.canPay
  const tariffName = TARIFF_OPTIONS.find(t => t.id === booking.tariff)?.name ?? booking.tariff

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
                  </div>
                )}
                {activePanel === 'confirm' && <ConfirmPanel {...panelProps} />}
                {activePanel === 'tariff' && <TariffPanel {...panelProps} />}
                {activePanel === 'services' && <ServicesPanel {...panelProps} />}
                {activePanel === 'reschedule' && <ReschedulePanel {...panelProps} />}
                {activePanel === 'price' && <PricePanel {...panelProps} />}
                {activePanel === 'cancel' && <CancelPanel {...panelProps} />}
              </div>
            )}
            {isAdmin && (booking.isCanceled || booking.isDone) && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
                <p className="text-zinc-500 text-sm">
                  {booking.isCanceled ? 'Бронирование отменено — изменения недоступны' : 'Бронирование завершено'}
                </p>
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
          </div>
        </div>
      </div>
    </div>
  )
}
