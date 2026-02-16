import { useState } from 'react'
import { WINE_OPTIONS, calculateWinePrice } from '../../../utils/booking'
import type { BookingFormData } from '../../../types/booking.types'

interface StepProps {
  formData: Partial<BookingFormData>
  updateFormData: (data: Partial<BookingFormData>) => void
  nextStep: () => void
  prevStep: () => void
}

function Step7Wine({ formData, updateFormData, nextStep, prevStep }: StepProps) {
  const [wineSelection, setWineSelection] = useState<string[]>(
    formData.wineSelection || []
  )

  const toggleWine = (wineId: string) => {
    setWineSelection(prev =>
      prev.includes(wineId)
        ? prev.filter(id => id !== wineId)
        : [...prev, wineId]
    )
  }

  const totalWinePrice = calculateWinePrice(wineSelection)

  const handleNext = () => {
    updateFormData({
      wineSelection,
      winePrice: totalWinePrice
    })
    nextStep()
  }

  return (
    <div className="bg-gray-900 p-5 sm:p-6 rounded-lg border border-yellow-600/30">
      <h2 className="text-2xl sm:text-3xl font-bold text-luxury-gold mb-6 uppercase tracking-wider">
        Выбор вина
      </h2>
      <p className="text-gray-400 mb-6">
        Добавьте вино к вашему бронированию (необязательно)
      </p>

      <div className="space-y-4 mb-6">
        {WINE_OPTIONS.map((wine) => {
          const isSelected = wineSelection.includes(wine.id)
          return (
            <div
              key={wine.id}
              onClick={() => toggleWine(wine.id)}
              className={`
                p-4 border-2 rounded-lg cursor-pointer transition-all duration-300
                ${isSelected
                  ? 'border-yellow-600 bg-yellow-600/10'
                  : 'border-gray-700 hover:border-yellow-600/50 hover:bg-gray-800'}
              `}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <div
                  className={`
                    w-6 h-6 flex-shrink-0 mt-1 rounded border-2 flex items-center justify-center transition-all
                    ${isSelected ? 'bg-yellow-600 border-yellow-600' : 'border-gray-600'}
                  `}
                >
                  {isSelected && (
                    <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>

                {/* Wine Info */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-white">🍷 {wine.name}</h3>
                    <div className="text-yellow-600 font-bold text-lg">
                      {wine.price} BYN
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">{wine.description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Price Summary */}
      {wineSelection.length > 0 && (
        <div className="bg-yellow-600/10 border border-yellow-600/30 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-gray-400 text-sm">Выбрано вин:</div>
              <div className="text-white font-semibold">
                {wineSelection.length} {wineSelection.length === 1 ? 'бутылка' : 'бутылки'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-sm">Стоимость вина:</div>
              <div className="text-yellow-600 font-bold text-2xl">
                {totalWinePrice} BYN
              </div>
            </div>
          </div>
        </div>
      )}

      {wineSelection.length === 0 && (
        <div className="bg-gray-800 p-4 rounded-lg mb-6 text-center">
          <div className="text-gray-400 text-sm">
            Вино не выбрано. Вы можете пропустить этот шаг.
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
          {wineSelection.length > 0 ? 'Далее' : 'Пропустить'}
        </button>
      </div>
    </div>
  )
}

export default Step7Wine
