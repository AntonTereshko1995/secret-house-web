import { useState } from 'react'
import { PHOTOSHOOT_PRICE } from '../../../utils/booking'
import type { StepProps } from '../../../types/booking.types'

function Step5Photoshoot({ formData, updateFormData, nextStep, prevStep }: StepProps) {
  const [hasPhotoshoot, setHasPhotoshoot] = useState(formData.hasPhotoshoot || false)

  const handleNext = () => {
    updateFormData({
      hasPhotoshoot,
      photoshootPrice: hasPhotoshoot ? PHOTOSHOOT_PRICE : 0
    })
    nextStep()
  }

  return (
    <div className="bg-gray-900 p-5 sm:p-6 rounded-lg border border-yellow-600/30">
      <h2 className="text-2xl sm:text-3xl font-bold text-luxury-gold mb-6 uppercase tracking-wider">
        Фотосессия
      </h2>
      <p className="text-gray-400 mb-6">
        Желаете добавить профессиональную фотосессию? (необязательно)
      </p>

      {/* Toggle Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setHasPhotoshoot(false)}
          className={`
            p-6 border-2 rounded-lg font-bold uppercase tracking-wider transition-all
            ${!hasPhotoshoot
              ? 'border-yellow-600 bg-yellow-600/10 text-white'
              : 'border-gray-700 text-gray-400 hover:border-yellow-600/50'}
          `}
        >
          <div className="text-2xl mb-2">❌</div>
          Не нужна
        </button>
        <button
          onClick={() => setHasPhotoshoot(true)}
          className={`
            p-6 border-2 rounded-lg font-bold uppercase tracking-wider transition-all
            ${hasPhotoshoot
              ? 'border-yellow-600 bg-yellow-600/10 text-white'
              : 'border-gray-700 text-gray-400 hover:border-yellow-600/50'}
          `}
        >
          <div className="text-2xl mb-2">📸</div>
          Добавить
        </button>
      </div>

      {/* Photoshoot Details */}
      {hasPhotoshoot && (
        <div className="bg-yellow-600/10 border border-yellow-600/30 p-4 rounded-lg mb-6">
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-1">Стоимость фотосессии:</div>
            <div className="text-yellow-600 font-bold text-3xl">
              {PHOTOSHOOT_PRICE} BYN
            </div>
            <div className="text-gray-400 text-xs mt-3">
              💡 Включает 1 час съемки и 20 обработанных фотографий
            </div>
          </div>
        </div>
      )}

      {!hasPhotoshoot && (
        <div className="bg-gray-800 p-4 rounded-lg mb-6 text-center">
          <div className="text-gray-400 text-sm">
            Фотосессия не выбрана
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={prevStep}
          className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 uppercase tracking-wider transition-all"
        >
          Назад
        </button>
        <button
          onClick={handleNext}
          className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 px-6 uppercase tracking-wider transition-all shadow-lg hover:shadow-xl"
        >
          Далее
        </button>
      </div>
    </div>
  )
}

export default Step5Photoshoot
