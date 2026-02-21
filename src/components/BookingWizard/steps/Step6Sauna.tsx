import { useState } from 'react'
import { getTariffConfig } from '../../../utils/booking'
import type { StepProps } from '../../../types/booking.types'

function Step6Sauna({ formData, updateFormData, nextStep, prevStep }: StepProps) {
  const [hasSauna, setHasSauna] = useState(formData.hasSauna || false)

  const saunaPrice = getTariffConfig(formData.tariff ?? '')?.saunaPrice ?? 0

  const handleNext = () => {
    updateFormData({
      hasSauna,
      saunaPrice: hasSauna ? saunaPrice : 0
    })
    nextStep()
  }

  return (
    <div className="bg-gray-900 p-4 rounded-lg border border-yellow-600/30">
      <h2 className="text-lg sm:text-xl font-bold text-luxury-gold mb-2 uppercase tracking-wider">
        Сауна
      </h2>
      <p className="text-gray-400 mb-3 text-sm">
        Желаете включить сауну в ваше бронирование? (необязательно)
      </p>

      {/* Toggle Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setHasSauna(false)}
          className={`
            p-6 border-2 rounded-lg font-bold uppercase tracking-wider transition-all
            ${!hasSauna
              ? 'border-yellow-600 bg-yellow-600/10 text-white'
              : 'border-gray-700 text-gray-400 hover:border-yellow-600/50'}
          `}
        >
          <div className="text-2xl mb-2">❌</div>
          Не нужна
        </button>
        <button
          onClick={() => setHasSauna(true)}
          className={`
            p-6 border-2 rounded-lg font-bold uppercase tracking-wider transition-all
            ${hasSauna
              ? 'border-yellow-600 bg-yellow-600/10 text-white'
              : 'border-gray-700 text-gray-400 hover:border-yellow-600/50'}
          `}
        >
          <div className="text-2xl mb-2">🧖</div>
          Добавить
        </button>
      </div>

      {/* Sauna Details — always visible */}
      <div className="bg-yellow-600/10 border border-yellow-600/30 p-4 rounded-lg mb-6">
        <div className="text-center">
          <div className="text-gray-400 text-sm mb-1">Стоимость сауны:</div>
          <div className="text-yellow-600 font-bold text-3xl">
            {saunaPrice} BYN
          </div>
          <div className="text-gray-400 text-xs mt-3">
            💡 Включает полотенца и банные принадлежности
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={prevStep}
          className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 uppercase tracking-wider transition-all"
        >
          Назад
        </button>
        <button
          onClick={handleNext}
          className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-2 px-4 uppercase tracking-wider transition-all"
        >
          Далее
        </button>
      </div>
    </div>
  )
}

export default Step6Sauna
