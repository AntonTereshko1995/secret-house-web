import { useState } from 'react'
import { getTariffConfig } from '../../../utils/booking'
import { logger } from '../../../services/logger'
import type { StepProps } from '../../../types/booking.types'

function Step8ExtraBedroom({ formData, updateFormData, nextStep, prevStep }: StepProps) {
  const [hasExtraBedroom, setHasExtraBedroom] = useState(formData.hasExtraBedroom || false)

  const extraBedroomPrice = getTariffConfig(formData.tariff ?? '')?.extraBedroomPrice ?? 0

  const handleNext = () => {
    logger.info('booking_select', { step: 'extra_bedroom', hasExtraBedroom, extraBedroomPrice: hasExtraBedroom ? extraBedroomPrice : 0, tariff: formData.tariff })
    updateFormData({
      hasExtraBedroom,
      extraBedroomPrice: hasExtraBedroom ? extraBedroomPrice : 0
    })
    nextStep()
  }

  return (
    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-2xl">
      <h2 className="text-lg sm:text-xl font-bold text-white mb-2 uppercase tracking-wider">
        Дополнительная спальня
      </h2>
      <p className="text-gray-400 mb-3 text-sm">
        Желаете добавить дополнительную спальню? (необязательно)
      </p>

      {/* Toggle Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setHasExtraBedroom(false)}
          className={`
            p-6 border-2 rounded-lg font-bold uppercase tracking-wider transition-all
            ${!hasExtraBedroom
              ? 'border-amber-400 bg-amber-400/10 text-white'
              : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}
          `}
        >
          <div className="text-2xl mb-2">❌</div>
          Не нужна
        </button>
        <button
          onClick={() => setHasExtraBedroom(true)}
          className={`
            p-6 border-2 rounded-lg font-bold uppercase tracking-wider transition-all
            ${hasExtraBedroom
              ? 'border-amber-400 bg-amber-400/10 text-white'
              : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}
          `}
        >
          <div className="text-2xl mb-2">🛏️</div>
          Добавить
        </button>
      </div>

      {/* Extra Bedroom Details — always visible */}
      <div className="bg-zinc-800/60 border border-zinc-700 p-4 rounded-lg mb-6">
        <div className="text-center">
          <div className="text-gray-400 text-sm mb-1">Стоимость дополнительной спальни:</div>
          <div className="text-amber-400 font-bold text-3xl">
            {extraBedroomPrice} BYN
          </div>
          <div className="text-gray-400 text-xs mt-3">
            💡 Дополнительная спальная зона для большей компании
          </div>
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
          Далее
        </button>
      </div>
    </div>
  )
}

export default Step8ExtraBedroom
