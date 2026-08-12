import { useState } from 'react'
import { logger } from '../../../services/logger'
import type { GiftStepProps } from '../../../types/gift.types'

function GiftStepBedroom({ giftData, updateGiftData, nextStep, prevStep }: GiftStepProps) {
  const [hasExtraBedroom, setHasExtraBedroom] = useState(giftData.hasExtraBedroom)
  const price = giftData.extraBedroomPrice

  const handleNext = () => {
    logger.info('gift_select', { step: 'bedroom', hasExtraBedroom, price: hasExtraBedroom ? price : 0 })
    updateGiftData({ hasExtraBedroom })
    nextStep()
  }

  return (
    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-2xl">
      <h2 className="text-lg sm:text-xl font-bold text-white mb-2 uppercase tracking-wider">
        Дополнительная спальня
      </h2>
      <p className="text-gray-400 mb-3 text-sm">
        Добавить дополнительную спальню к сертификату? (необязательно)
      </p>

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
          <div className="text-2xl mb-2">🛏</div>
          Добавить
        </button>
      </div>

      <div className="bg-zinc-800/60 border border-zinc-700 p-4 rounded-lg mb-6">
        <div className="text-center">
          <div className="text-gray-400 text-sm mb-1">Стоимость доп. спальни:</div>
          <div className="text-amber-400 font-bold text-3xl">
            {price} BYN
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

export default GiftStepBedroom
