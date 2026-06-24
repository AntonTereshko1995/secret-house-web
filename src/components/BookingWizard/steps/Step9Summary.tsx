import { calculateTotalPrice, getTariffConfig, getBasePriceBreakdown, getDatePriceOverride, TARIFF_OPTIONS, WINE_OPTIONS, BEDROOM_OPTIONS, calculatePrepayment, getHolidayName } from '../../../utils/booking'
import { logger } from '../../../services/logger'
import type { StepProps } from '../../../types/booking.types'

function fmt(date: Date | string | undefined, time?: string): string {
  if (!date) return '—'
  const d = date instanceof Date ? new Date(date) : new Date(date)
  if (time) {
    const [h, m] = time.split(':').map(Number)
    d.setHours(h, m, 0, 0)
  }
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline py-1.5 border-b border-gray-800 last:border-0">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="text-white text-sm font-medium text-right ml-4">{value}</span>
    </div>
  )
}

function PriceRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-baseline py-1">
      <span className={highlight ? 'text-white font-bold uppercase tracking-wider' : 'text-gray-300 text-sm'}>{label}</span>
      <span className={highlight ? 'text-amber-400 font-bold text-2xl' : 'text-white text-sm font-semibold'}>{value}</span>
    </div>
  )
}

function Step9Summary({ formData, updateFormData, nextStep, prevStep }: StepProps) {
  const pricing = calculateTotalPrice(formData)
  const tariffName = TARIFF_OPTIONS.find(t => t.id === formData.tariff)?.name ?? '—'
  const tariffConfig = formData.tariff ? getTariffConfig(formData.tariff) : undefined
  const dateOverride = formData.checkInDate ? getDatePriceOverride(new Date(formData.checkInDate)) : null
  // Extra-hours breakdown is only relevant when no special date price override is in effect
  const basePriceBreakdown = (!dateOverride && formData.tariff && formData.durationHours)
    ? getBasePriceBreakdown(formData.tariff, formData.durationHours)
    : null
  const extraGuests = tariffConfig && formData.guestCount
    ? Math.max(0, formData.guestCount - tariffConfig.maxPeople)
    : 0
  const wineName = formData.wineSelection?.[0]
    ? WINE_OPTIONS.find(w => w.id === formData.wineSelection![0])?.name
    : null
  const checkInDate = formData.checkInDate ? new Date(formData.checkInDate) : null
  const holidayName = checkInDate ? getHolidayName(checkInDate) : null
  // Gift certificate: user pays the difference (doplate) beyond the certificate value
  const giftCovered = formData.giftId && formData.giftPrice !== undefined ? formData.giftPrice : 0
  const doplate = giftCovered > 0 ? Math.max(0, pricing.totalPrice - giftCovered) : null
  const prepayment = doplate !== null
    ? doplate
    : checkInDate ? calculatePrepayment(pricing.totalPrice, checkInDate) : Math.round(pricing.totalPrice * 0.5)
  const isFullPayment = doplate !== null ? true : prepayment === pricing.totalPrice

  const handleNext = () => {
    logger.info('booking_select', {
      step: 'summary',
      totalPrice: pricing.totalPrice,
      prepayment,
      tariff: formData.tariff,
      contactType: formData.contactType,
      telegram: formData.telegram,
      phone: formData.phone,
    })
    updateFormData({ ...pricing })
    nextStep()
  }

  return (
    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-2xl">
      <h2 className="text-lg font-bold text-white mb-3 uppercase tracking-wider">
        Итог бронирования
      </h2>

      {/* Details */}
      <div className="bg-zinc-800/40 rounded-lg px-3 py-1 mb-3">
        <Row label="Тариф" value={tariffName} />
        <Row label="Гостей" value={`${formData.guestCount ?? '—'}`} />
        <Row label="Заезд" value={fmt(formData.checkInDate, formData.checkInTime)} />
        <Row label="Выезд" value={fmt(formData.checkOutDate, formData.checkOutTime)} />
        {formData.hasPhotoshoot && <Row label="Фотосессия" value="Да" />}
        {formData.hasSauna && <Row label="Сауна" value="Да" />}
        {formData.bedroomType && <Row label="Спальня" value={BEDROOM_OPTIONS.find(b => b.id === formData.bedroomType)?.name ?? formData.bedroomType} />}
        {formData.hasExtraBedroom && <Row label="Доп. спальня" value="Да" />}
        {formData.hasSecretRoom && <Row label="Секретная комната" value="Да" />}
        {wineName && <Row label="Вино" value={wineName} />}
        {formData.needsTransfer && <Row label="Трансфер" value={formData.transferAddress ?? '—'} />}
        {formData.comment && <Row label="Комментарий" value={formData.comment} />}
        {formData.promocode && formData.promocodeValid && (
          <Row label="Промокод" value={formData.promocode} />
        )}
      </div>

      {/* Pricing */}
      <div className="bg-black/60 border border-zinc-800 rounded-lg px-3 py-2 mb-3">
        <PriceRow label="Проживание" value={`${pricing.basePrice} BYN`} />
        {/* Special date pricing note */}
        {dateOverride && (
          <div className="text-amber-400/80 text-xs py-0.5 pl-2">
            🎄 {dateOverride.description} — фиксированная цена
          </div>
        )}
        {/* Extra hours breakdown note (only when no date override) */}
        {basePriceBreakdown?.extraHours !== undefined && basePriceBreakdown.extraHours > 0 && (
          <div className="flex justify-between items-baseline py-0.5 pl-2">
            <span className="text-gray-500 text-xs">
              в т.ч. доп. {basePriceBreakdown.extraHours} ч × {basePriceBreakdown.extraHourPrice} BYN
            </span>
            <span className="text-gray-500 text-xs">+{basePriceBreakdown.extraPrice} BYN</span>
          </div>
        )}
        {basePriceBreakdown?.remainderHours !== undefined && basePriceBreakdown.remainderHours > 0 && (
          <div className="flex justify-between items-baseline py-0.5 pl-2">
            <span className="text-gray-500 text-xs">
              в т.ч. доп. {basePriceBreakdown.remainderHours} ч × {basePriceBreakdown.extraHourPrice} BYN
            </span>
            <span className="text-gray-500 text-xs">+{basePriceBreakdown.remainderPrice} BYN</span>
          </div>
        )}
        {pricing.guestPrice > 0 && (
          <PriceRow
            label={`Доп. ${extraGuests} ${extraGuests === 1 ? 'гость' : extraGuests < 5 ? 'гостя' : 'гостей'}`}
            value={`+${pricing.guestPrice} BYN`}
          />
        )}
        {formData.hasPhotoshoot && pricing.photoshootPrice > 0 && (
          <PriceRow label="Фотосессия" value={`+${pricing.photoshootPrice} BYN`} />
        )}
        {formData.hasSauna && pricing.saunaPrice > 0 && (
          <PriceRow label="Сауна" value={`+${pricing.saunaPrice} BYN`} />
        )}
        {formData.hasExtraBedroom && pricing.extraBedroomPrice > 0 && (
          <PriceRow label="Доп. спальня" value={`+${pricing.extraBedroomPrice} BYN`} />
        )}
        {formData.hasSecretRoom && pricing.secretRoomPrice > 0 && (
          <PriceRow label="Секретная комната" value={`+${pricing.secretRoomPrice} BYN`} />
        )}
        {pricing.discount > 0 && (
          <PriceRow label={`Скидка (${formData.promocode})`} value={`−${pricing.discount} BYN`} />
        )}
        <div className="border-t border-zinc-800 mt-1 pt-2">
          <PriceRow label="Итого" value={`${pricing.totalPrice} BYN`} highlight />
          {giftCovered > 0 && (
            <PriceRow label="Сертификат покрывает" value={`−${giftCovered} BYN`} />
          )}
          {holidayName && !doplate && (
            <div className="text-amber-400 text-xs mt-1">🎉 {holidayName} — полная предоплата</div>
          )}
          {doplate !== null ? (
            doplate === 0
              ? <div className="text-green-400 text-sm font-semibold mt-1">✓ Полностью покрыто сертификатом</div>
              : <PriceRow label="Доплата" value={`${doplate} BYN`} highlight />
          ) : (
            <PriceRow label={`Предоплата (${isFullPayment ? '100%' : '50%'})`} value={`${prepayment} BYN`} highlight />
          )}
        </div>
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
          className="flex-1 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold py-2 px-4 rounded-xl uppercase tracking-wider transition-all"
        >
          Подтвердить
        </button>
      </div>
    </div>
  )
}

export default Step9Summary
