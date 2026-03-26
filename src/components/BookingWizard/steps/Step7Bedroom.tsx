import { useState } from 'react'
import { BEDROOM_OPTIONS } from '../../../utils/booking'
import { logger } from '../../../services/logger'
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
    logger.info('booking_select', { step: 'bedroom', bedroomType, tariff: formData.tariff })
    updateFormData({ bedroomType })
    nextStep()
  }

  return (
    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-2xl">
      <h2 className="text-lg sm:text-xl font-bold text-white mb-2 uppercase tracking-wider">
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
                ? 'border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-400/20'
                : 'border-gray-700 hover:border-zinc-500 hover:bg-zinc-800'}
            `}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-bold text-white">{bedroom.name}</h3>
              <div
                className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                  ${bedroomType === bedroom.id ? 'border-amber-400 bg-amber-400' : 'border-gray-600'}
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
          className="flex-1 border border-zinc-600 bg-transparent hover:bg-zinc-800/50 text-zinc-300 font-bold py-2 px-4 rounded-xl uppercase tracking-wider transition-all"
        >
          Назад
        </button>
        <button
          onClick={handleNext}
          disabled={!bedroomType}
          className="flex-1 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-2 px-4 rounded-xl uppercase tracking-wider transition-all"
        >
          Далее
        </button>
      </div>
    </div>
  )
}

export default Step7Bedroom
