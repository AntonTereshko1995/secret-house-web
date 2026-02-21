import { useState } from 'react'
import { BEDROOM_OPTIONS } from '../../../utils/booking'
import type { StepProps, BedroomType } from '../../../types/booking.types'

function Step7Bedroom({ formData, updateFormData, nextStep, prevStep }: StepProps) {
  const [bedroomType, setBedroomType] = useState<BedroomType | ''>(
    formData.bedroomType || ''
  )

  const handleNext = () => {
    if (!bedroomType) {
      alert('Пожалуйста, выберите спальню')
      return
    }
    updateFormData({ bedroomType })
    nextStep()
  }

  return (
    <div className="bg-gray-900 p-4 rounded-lg border border-yellow-600/30">
      <h2 className="text-lg sm:text-xl font-bold text-luxury-gold mb-2 uppercase tracking-wider">
        Выбор спальни
      </h2>
      <p className="text-gray-400 mb-3 text-sm">
        Выберите спальню для вашего пребывания
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {BEDROOM_OPTIONS.map((bedroom) => (
          <div
            key={bedroom.id}
            onClick={() => setBedroomType(bedroom.id)}
            className={`
              p-6 border-2 rounded-lg cursor-pointer transition-all duration-300
              ${bedroomType === bedroom.id
                ? 'border-yellow-600 bg-yellow-600/10 shadow-lg shadow-yellow-600/20'
                : 'border-gray-700 hover:border-yellow-600/50 hover:bg-gray-800'}
            `}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-bold text-white">{bedroom.name}</h3>
              <div
                className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                  ${bedroomType === bedroom.id ? 'border-yellow-600 bg-yellow-600' : 'border-gray-600'}
                `}
              >
                {bedroomType === bedroom.id && (
                  <div className="w-3 h-3 rounded-full bg-black" />
                )}
              </div>
            </div>
            <p className="text-gray-400 text-sm">{bedroom.description}</p>
          </div>
        ))}
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
          disabled={!bedroomType}
          className="flex-1 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-black font-bold py-2 px-4 uppercase tracking-wider transition-all"
        >
          Далее
        </button>
      </div>
    </div>
  )
}

export default Step7Bedroom
