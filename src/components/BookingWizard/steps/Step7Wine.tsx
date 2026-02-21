import { useState } from 'react'
import { WINE_OPTIONS } from '../../../utils/booking'
import type { BookingFormData } from '../../../types/booking.types'

interface StepProps {
  formData: Partial<BookingFormData>
  updateFormData: (data: Partial<BookingFormData>) => void
  nextStep: () => void
  prevStep: () => void
}

function Step7Wine({ formData, updateFormData, nextStep, prevStep }: StepProps) {
  const [selected, setSelected] = useState<string>(
    formData.wineSelection?.[0] || 'none'
  )

  const handleNext = () => {
    updateFormData({
      wineSelection: selected === 'none' ? [] : [selected],
      winePrice: 0
    })
    nextStep()
  }

  return (
    <div className="bg-gray-900 p-4 rounded-lg border border-yellow-600/30">
      <h2 className="text-lg sm:text-xl font-bold text-luxury-gold mb-2 uppercase tracking-wider">
        Выбор вина
      </h2>

      <div className="bg-yellow-600/10 border border-yellow-600/30 p-3 rounded-lg mb-4">
        <p className="text-yellow-600 text-sm font-semibold">
          🍷 Мы бесплатно подготавливаем вино и лёгкие закуски для тарифа Инкогнито
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-6">
        {WINE_OPTIONS.map((wine) => {
          const isSelected = selected === wine.id
          return (
            <button
              key={wine.id}
              onClick={() => setSelected(wine.id)}
              className={`
                flex items-center gap-2 px-3 py-2 border-2 rounded-lg transition-all text-left
                ${isSelected
                  ? 'border-yellow-600 bg-yellow-600/10 text-white'
                  : 'border-gray-700 text-gray-400 hover:border-yellow-600/50 hover:text-white'}
              `}
            >
              <div className={`
                w-4 h-4 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all
                ${isSelected ? 'border-yellow-600' : 'border-gray-600'}
              `}>
                {isSelected && <div className="w-2 h-2 rounded-full bg-yellow-600" />}
              </div>
              <span className="text-sm font-medium">{wine.name}</span>
            </button>
          )
        })}
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

export default Step7Wine
