import { useState } from 'react'
import { calculateTotalPrice, TARIFF_OPTIONS, WINE_OPTIONS, BEDROOM_OPTIONS, calculatePrepayment, getHolidayName } from '../../../utils/booking'
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
      <span className={highlight ? 'text-yellow-600 font-bold text-2xl' : 'text-white text-sm font-semibold'}>{value}</span>
    </div>
  )
}

function Step9Summary({ formData, updateFormData, nextStep, prevStep }: StepProps) {
  const [termsAccepted, setTermsAccepted] = useState(formData.termsAccepted || false)

  const pricing = calculateTotalPrice(formData)
  const tariffName = TARIFF_OPTIONS.find(t => t.id === formData.tariff)?.name ?? '—'
  const wineName = formData.wineSelection?.[0]
    ? WINE_OPTIONS.find(w => w.id === formData.wineSelection![0])?.name
    : null
  const checkInDate = formData.checkInDate ? new Date(formData.checkInDate) : null
  const prepayment = checkInDate ? calculatePrepayment(pricing.totalPrice, checkInDate) : Math.round(pricing.totalPrice * 0.5)
  const holidayName = checkInDate ? getHolidayName(checkInDate) : null
  const isFullPayment = prepayment === pricing.totalPrice

  const handleNext = () => {
    if (!termsAccepted) {
      alert('Пожалуйста, примите условия бронирования')
      return
    }
    updateFormData({ ...pricing, termsAccepted })
    nextStep()
  }

  return (
    <div className="bg-gray-900 p-4 rounded-lg border border-yellow-600/30">
      <h2 className="text-lg font-bold text-luxury-gold mb-3 uppercase tracking-wider">
        Итог бронирования
      </h2>

      {/* Details */}
      <div className="bg-gray-800/50 rounded-lg px-3 py-1 mb-3">
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
      <div className="bg-black border border-yellow-600/30 rounded-lg px-3 py-2 mb-3">
        <PriceRow label="Проживание" value={`${pricing.basePrice} BYN`} />
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
        <div className="border-t border-yellow-600/30 mt-1 pt-2">
          <PriceRow label="Итого" value={`${pricing.totalPrice} BYN`} highlight />
          {holidayName && (
            <div className="text-yellow-600 text-xs mt-1">🎉 {holidayName} — полная предоплата</div>
          )}
          <PriceRow label={`Предоплата (${isFullPayment ? '100%' : '50%'})`} value={`${prepayment} BYN`} highlight />
        </div>
      </div>

      {/* Terms */}
      <label className="flex items-start gap-2 cursor-pointer mb-3">
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className="w-4 h-4 mt-0.5 accent-yellow-600 flex-shrink-0"
        />
        <span className="text-xs text-gray-400">
          Принимаю{' '}
          <a href="#" className="text-yellow-600 hover:underline">условия бронирования</a>
          {' '}и{' '}
          <a href="#" className="text-yellow-600 hover:underline">политику конфиденциальности</a>
        </span>
      </label>

      <div className="flex gap-4">
        <button
          onClick={prevStep}
          className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 uppercase tracking-wider transition-all"
        >
          Назад
        </button>
        <button
          onClick={handleNext}
          disabled={!termsAccepted}
          className="flex-1 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-black font-bold py-2 px-4 uppercase tracking-wider transition-all"
        >
          Подтвердить
        </button>
      </div>
    </div>
  )
}

export default Step9Summary
