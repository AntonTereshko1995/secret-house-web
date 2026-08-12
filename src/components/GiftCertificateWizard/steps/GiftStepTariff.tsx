import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TARIFF_OPTIONS, TARIFF_CONFIG } from '../../../utils/booking'
import { logger } from '../../../services/logger'
import type { GiftStepProps } from '../../../types/gift.types'
import type { GiftTariffType } from '../../../types/gift.types'

const GIFT_TARIFF_OPTIONS = TARIFF_OPTIONS.filter(t => t.id !== 'gift-certificate')

const INCOGNITO_TARIFFS: GiftTariffType[] = ['incognito-daily', 'incognito-12h', 'incognito-work']

function GiftStepTariff({ giftData, updateGiftData, nextStep }: GiftStepProps) {
  const [selected, setSelected] = useState<GiftTariffType | ''>(giftData.tariff ?? '')

  const handleNext = () => {
    if (!selected) {
      alert('Пожалуйста, выберите тариф')
      return
    }

    const cfg = TARIFF_CONFIG[selected]
    const isIncognito = INCOGNITO_TARIFFS.includes(selected as GiftTariffType)

    logger.info('gift_select', { step: 'tariff', tariff: selected, isIncognito })

    if (isIncognito) {
      updateGiftData({
        tariff: selected as GiftTariffType,
        hasSauna: true,
        hasSecretRoom: true,
        hasExtraBedroom: true,
        saunaPrice: 0,
        secretRoomPrice: 0,
        extraBedroomPrice: 0,
        bathTubPrice: cfg.bathTubPrice,
      })
    } else {
      updateGiftData({
        tariff: selected as GiftTariffType,
        saunaPrice: cfg.saunaPrice,
        secretRoomPrice: cfg.secretRoomPrice,
        extraBedroomPrice: cfg.extraBedroomPrice,
        bathTubPrice: cfg.bathTubPrice,
      })
    }

    nextStep()
  }

  return (
    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-2xl">
      <h2 className="text-lg sm:text-xl font-bold text-white mb-3 uppercase tracking-wider">
        Выберите тариф сертификата
      </h2>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {GIFT_TARIFF_OPTIONS.map(tariff => (
          <div
            key={tariff.id}
            onClick={() => setSelected(tariff.id as GiftTariffType)}
            className={`
              p-3 border rounded-lg cursor-pointer transition-all duration-200 flex flex-col justify-between
              ${selected === tariff.id
                ? 'border-amber-400 bg-amber-400/10'
                : 'border-gray-700 hover:border-zinc-600 hover:bg-zinc-800'}
            `}
          >
            <div className="flex justify-between items-start gap-1 mb-1">
              <h3 className="text-xs font-semibold text-white leading-snug">{tariff.name}</h3>
              <div
                className={`
                  w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                  ${selected === tariff.id ? 'border-amber-400 bg-amber-400' : 'border-gray-600'}
                `}
              >
                {selected === tariff.id && (
                  <div className="w-1.5 h-1.5 rounded-full bg-black" />
                )}
              </div>
            </div>
            <p className="text-amber-400 font-bold text-sm">{tariff.unit}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Link
          to="/"
          className="flex-1 flex items-center justify-center border border-zinc-600 bg-transparent hover:bg-zinc-800/50 text-zinc-300 font-bold py-2 px-4 rounded-xl uppercase tracking-wider transition-all text-center"
        >
          На главную
        </Link>
        <button
          onClick={handleNext}
          disabled={!selected}
          className="flex-1 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-2 px-4 rounded-xl uppercase tracking-wider transition-all"
        >
          Далее
        </button>
      </div>
    </div>
  )
}

export default GiftStepTariff
