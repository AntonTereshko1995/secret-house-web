import { useState } from 'react'
import { calculateTotalPrice, TARIFF_OPTIONS, WINE_OPTIONS } from '../../../utils/booking'
import type { StepProps } from '../../../types/booking.types'

function Step9Summary({ formData, updateFormData, nextStep, prevStep, jumpToStep }: StepProps) {
  const [termsAccepted, setTermsAccepted] = useState(formData.termsAccepted || false)

  const pricing = calculateTotalPrice(formData)
  const tariffName = TARIFF_OPTIONS.find(t => t.id === formData.tariff)?.name

  const handleNext = () => {
    if (!termsAccepted) {
      alert('Пожалуйста, примите условия бронирования')
      return
    }
    updateFormData({
      ...pricing,
      termsAccepted
    })
    nextStep()
  }

  return (
    <div className="bg-gray-900 p-5 sm:p-6 rounded-lg border border-yellow-600/30">
      <h2 className="text-2xl sm:text-3xl font-bold text-luxury-gold mb-6 uppercase tracking-wider">
        Итоговый отчет
      </h2>
      <p className="text-gray-400 mb-6">
        Проверьте детали вашего бронирования
      </p>

      <div className="space-y-4 mb-6">
        {/* Tariff & Duration */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-gray-400 text-sm mb-1">Тариф</div>
              <div className="text-white font-bold">{tariffName}</div>
            </div>
            <button
              onClick={() => jumpToStep?.(1)}
              className="text-yellow-600 hover:text-yellow-500 text-sm uppercase tracking-wider"
            >
              Изменить
            </button>
          </div>
          <div className="text-gray-400 text-sm">
            {formData.durationHours} ч • {formData.guestCount} {formData.guestCount === 1 ? 'гость' : 'гостя'}
          </div>
        </div>

        {/* Dates */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-start mb-2">
            <div className="text-gray-400 text-sm">Даты</div>
            <button
              onClick={() => jumpToStep?.(3)}
              className="text-yellow-600 hover:text-yellow-500 text-sm uppercase tracking-wider"
            >
              Изменить
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-white text-sm font-semibold mb-1">Заезд:</div>
              <div className="text-gray-300 text-sm">
                {formData.checkInDate?.toLocaleDateString('ru-RU')} {formData.checkInTime}
              </div>
            </div>
            <div>
              <div className="text-white text-sm font-semibold mb-1">Выезд:</div>
              <div className="text-gray-300 text-sm">
                {formData.checkOutDate?.toLocaleDateString('ru-RU')} {formData.checkOutTime}
              </div>
            </div>
          </div>
        </div>

        {/* Comment */}
        {formData.comment && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div className="text-gray-400 text-sm">Комментарий</div>
              <button
                onClick={() => jumpToStep?.(5)}
                className="text-yellow-600 hover:text-yellow-500 text-sm uppercase tracking-wider"
              >
                Изменить
              </button>
            </div>
            <div className="text-white text-sm">{formData.comment}</div>
          </div>
        )}

        {/* Wine */}
        {formData.wineSelection && formData.wineSelection.length > 0 && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div className="text-gray-400 text-sm">Вино</div>
              <button
                onClick={() => jumpToStep?.(7)}
                className="text-yellow-600 hover:text-yellow-500 text-sm uppercase tracking-wider"
              >
                Изменить
              </button>
            </div>
            <div className="text-white text-sm">
              {formData.wineSelection.map(id =>
                WINE_OPTIONS.find(w => w.id === id)?.name
              ).join(', ')}
            </div>
          </div>
        )}

        {/* Transfer */}
        {formData.needsTransfer && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div className="text-gray-400 text-sm">Трансфер</div>
              <button
                onClick={() => jumpToStep?.(8)}
                className="text-yellow-600 hover:text-yellow-500 text-sm uppercase tracking-wider"
              >
                Изменить
              </button>
            </div>
            <div className="text-white text-sm">
              {formData.transferAddress}
              {formData.transferTime && ` в ${formData.transferTime}`}
            </div>
          </div>
        )}
      </div>

      {/* Price Breakdown */}
      <div className="bg-black border-2 border-yellow-600/30 p-6 rounded-lg mb-6">
        <h3 className="text-white font-bold uppercase tracking-wider mb-4">
          Стоимость
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between text-gray-300">
            <span>Базовая стоимость:</span>
            <span className="font-bold">{pricing.basePrice} BYN</span>
          </div>

          {/* Photoshoot */}
          {formData.hasPhotoshoot && pricing.photoshootPrice > 0 && (
            <div className="flex justify-between text-gray-300">
              <span>Фотосессия:</span>
              <span className="font-bold">+{pricing.photoshootPrice} BYN</span>
            </div>
          )}

          {/* Sauna */}
          {formData.hasSauna && pricing.saunaPrice > 0 && (
            <div className="flex justify-between text-gray-300">
              <span>Сауна:</span>
              <span className="font-bold">+{pricing.saunaPrice} BYN</span>
            </div>
          )}

          {/* Extra Bedroom */}
          {formData.hasExtraBedroom && pricing.extraBedroomPrice > 0 && (
            <div className="flex justify-between text-gray-300">
              <span>Дополнительная спальня:</span>
              <span className="font-bold">+{pricing.extraBedroomPrice} BYN</span>
            </div>
          )}

          {/* Secret Room */}
          {formData.hasSecretRoom && pricing.secretRoomPrice > 0 && (
            <div className="flex justify-between text-gray-300">
              <span>Секретная комната:</span>
              <span className="font-bold">+{pricing.secretRoomPrice} BYN</span>
            </div>
          )}

          {/* Wine */}
          {pricing.winePrice > 0 && (
            <div className="flex justify-between text-gray-300">
              <span>Вино:</span>
              <span className="font-bold">+{pricing.winePrice} BYN</span>
            </div>
          )}

          {/* Transfer (show if one or both directions) */}
          {pricing.transferPrice > 0 && (
            <div className="flex justify-between text-gray-300">
              <span>
                Трансфер
                {formData.transferBothDirections && ' (туда и обратно)'}
              </span>
              <span className="font-bold">+{pricing.transferPrice} BYN</span>
            </div>
          )}

          {/* Discount */}
          {pricing.discount > 0 && (
            <div className="flex justify-between text-green-500">
              <span>Скидка ({formData.promocode}):</span>
              <span className="font-bold">-{pricing.discount} BYN</span>
            </div>
          )}

          <div className="border-t border-yellow-600/30 pt-3 flex justify-between items-center">
            <span className="text-white font-bold uppercase tracking-wider">Итого:</span>
            <span className="text-yellow-600 font-bold text-3xl">{pricing.totalPrice} BYN</span>
          </div>
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="w-5 h-5 mt-1 accent-yellow-600 flex-shrink-0"
          />
          <div className="text-sm text-gray-300">
            Я принимаю <a href="#" className="text-yellow-600 hover:underline">условия бронирования</a> и{' '}
            <a href="#" className="text-yellow-600 hover:underline">политику конфиденциальности</a>
          </div>
        </label>
      </div>

      <div className="flex gap-4">
        <button
          onClick={prevStep}
          className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 uppercase tracking-wider transition-all"
        >
          Назад
        </button>
        <button
          onClick={handleNext}
          disabled={!termsAccepted}
          className="flex-1 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-black font-bold py-3 px-6 uppercase tracking-wider transition-all shadow-lg hover:shadow-xl"
        >
          Подтвердить
        </button>
      </div>
    </div>
  )
}

export default Step9Summary
