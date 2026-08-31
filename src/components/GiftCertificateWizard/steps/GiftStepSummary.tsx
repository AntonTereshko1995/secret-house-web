import { useEffect } from 'react'
import { TARIFF_OPTIONS, TARIFF_CONFIG } from '../../../utils/booking'
import { logger } from '../../../services/logger'
import type { GiftStepProps } from '../../../types/gift.types'
import type { TariffType } from '../../../types/booking.types'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline py-1.5 border-b border-gray-800 last:border-0">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="text-white text-sm font-medium ml-4 text-right">{value}</span>
    </div>
  )
}

function GiftStepSummary({ giftData, updateGiftData, nextStep, prevStep }: GiftStepProps) {
  const tariffName = TARIFF_OPTIONS.find(t => t.id === giftData.tariff)?.name ?? giftData.tariff ?? '—'
  const basePrice = giftData.tariff ? (TARIFF_CONFIG[giftData.tariff as TariffType]?.price ?? 0) : 0

  const total =
    basePrice +
    (giftData.hasSauna ? giftData.saunaPrice : 0) +
    (giftData.hasSecretRoom ? giftData.secretRoomPrice : 0) +
    (giftData.hasExtraBedroom ? giftData.extraBedroomPrice : 0) +
    (giftData.hasBathTub ? giftData.bathTubPrice : 0)

  useEffect(() => {
    updateGiftData({ totalPrice: total })
    logger.info('gift_summary', {
      tariff: giftData.tariff,
      basePrice,
      hasSauna: giftData.hasSauna,
      hasSecretRoom: giftData.hasSecretRoom,
      hasExtraBedroom: giftData.hasExtraBedroom,
      hasBathTub: giftData.hasBathTub,
      total,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-2xl">
      <h2 className="text-lg sm:text-xl font-bold text-white mb-3 uppercase tracking-wider">
        Состав сертификата
      </h2>

      <div className="bg-zinc-800/40 rounded-lg px-4 py-2 mb-4">
        <Row label="Тариф" value={`${tariffName} — ${basePrice} BYN`} />
        {giftData.hasSauna && <Row label="Сауна" value={`${giftData.saunaPrice} BYN`} />}
        {giftData.hasSecretRoom && <Row label="Секретная комната" value={`${giftData.secretRoomPrice} BYN`} />}
        {giftData.hasExtraBedroom && <Row label="Обе спальные комнаты" value={`${giftData.extraBedroomPrice} BYN`} />}
        {giftData.hasBathTub && <Row label="Банный чан" value={`${giftData.bathTubPrice} BYN`} />}
      </div>

      <div className="bg-black/60 border border-zinc-800 rounded-lg px-4 py-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Итоговая стоимость:</span>
          <span className="text-amber-400 font-bold text-2xl">{total} BYN</span>
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
          onClick={nextStep}
          className="flex-1 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold py-2 px-4 rounded-xl uppercase tracking-wider transition-all"
        >
          Далее
        </button>
      </div>
    </div>
  )
}

export default GiftStepSummary
