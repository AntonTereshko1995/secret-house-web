import { useState, useMemo } from 'react'
import { getTariffConfig } from '../../../utils/booking'
import { logger } from '../../../services/logger'
import type { BookingFormData } from '../../../types/booking.types'

interface StepProps {
  formData: Partial<BookingFormData>
  updateFormData: (data: Partial<BookingFormData>) => void
  nextStep: () => void
  prevStep: () => void
}

function Step2Guests({ formData, updateFormData, nextStep, prevStep }: StepProps) {
  const [guestCount, setGuestCount] = useState(formData.guestCount || 2)

  const tariffConfig = useMemo(
    () => formData.tariff ? getTariffConfig(formData.tariff) : undefined,
    [formData.tariff]
  )

  const maxFree = tariffConfig?.maxPeople ?? 6
  const extraPricePerPerson = tariffConfig?.extraPeoplePrice ?? 0
  const extraGuests = Math.max(0, guestCount - maxFree)
  const guestPrice = extraGuests * extraPricePerPerson

  const handleNext = () => {
    if (guestCount < 1 || guestCount > 6) {
      alert('Количество гостей должно быть от 1 до 6')
      return
    }
    logger.info('booking_select', { step: 'guests', guestCount, guestPrice, tariff: formData.tariff })
    updateFormData({ guestCount, guestPrice })
    nextStep()
  }

  const increment = () => setGuestCount(prev => Math.min(prev + 1, 6))
  const decrement = () => setGuestCount(prev => Math.max(prev - 1, 1))

  return (
    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-2xl">
      <h2 className="text-lg sm:text-xl font-bold text-white mb-2 uppercase tracking-wider">
        Количество гостей
      </h2>

      {/* Tariff guest pricing rule */}
      {tariffConfig && (
        <div className="bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2 mb-4 text-xs text-gray-300 space-y-0.5">
          {extraPricePerPerson > 0 ? (
            <>
              <div className="text-amber-400 font-semibold uppercase tracking-wider text-[10px] mb-1">
                Включено в тариф
              </div>
              <div>
                • До <span className="text-white font-semibold">{maxFree} {maxFree === 2 ? 'гостей' : 'гостей'}</span> — без доплаты
              </div>
              <div>
                • Каждый дополнительный гость — <span className="text-amber-400 font-semibold">+{extraPricePerPerson} BYN</span>
              </div>
            </>
          ) : (
            <>
              <div className="text-amber-400 font-semibold uppercase tracking-wider text-[10px] mb-1">
                Включено в тариф
              </div>
              <div>• До {maxFree} гостей — <span className="text-green-400 font-semibold">бесплатно</span></div>
            </>
          )}
        </div>
      )}

      <div className="flex items-center justify-center gap-6 mb-6">
        <button
          onClick={decrement}
          disabled={guestCount <= 1}
          className="w-14 h-14 bg-gray-800 hover:bg-amber-400 disabled:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed text-white hover:text-black font-bold text-2xl rounded-lg transition-all"
        >
          −
        </button>

        <div className="text-center">
          <div className="text-6xl font-bold text-amber-400 mb-2">
            {guestCount}
          </div>
          <div className="text-gray-400 uppercase text-sm tracking-wider">
            {guestCount === 1 ? 'Гость' : guestCount < 5 ? 'Гостя' : 'Гостей'}
          </div>
        </div>

        <button
          onClick={increment}
          disabled={guestCount >= 6}
          className="w-14 h-14 bg-gray-800 hover:bg-amber-400 disabled:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed text-white hover:text-black font-bold text-2xl rounded-lg transition-all"
        >
          +
        </button>
      </div>

      {/* Visual representation */}
      <div className="flex justify-center gap-2 mb-4">
        {Array.from({ length: 6 }, (_, i) => i + 1).map((num) => {
          const isFree = num <= maxFree
          const isActive = num <= guestCount
          return (
            <button
              key={num}
              onClick={() => setGuestCount(num)}
              title={!isFree ? `+${extraPricePerPerson} BYN` : 'Включён'}
              className={[
                'w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer relative',
                isActive
                  ? isFree
                    ? 'bg-amber-400 text-black'
                    : 'bg-orange-600 text-white'
                  : 'bg-gray-800 text-gray-600 hover:bg-gray-700 hover:text-gray-400',
              ].join(' ')}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </button>
          )
        })}
      </div>

      {/* Legend when extra pricing applies */}
      {extraPricePerPerson > 0 && (
        <div className="flex justify-center gap-4 mb-4 text-[10px] text-gray-500 uppercase tracking-wider">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <span>Включён</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-orange-600" />
            <span>Доп. плата</span>
          </div>
        </div>
      )}

      {/* Extra guests charge preview */}
      {guestPrice > 0 ? (
        <div className="bg-orange-950/30 border border-orange-600/40 rounded-lg px-3 py-2.5 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">
              Доп. {extraGuests} {extraGuests === 1 ? 'гость' : extraGuests < 5 ? 'гостя' : 'гостей'}
              {' '}× {extraPricePerPerson} BYN
            </span>
            <span className="text-orange-400 font-bold text-base">+{guestPrice} BYN</span>
          </div>
        </div>
      ) : extraPricePerPerson > 0 && guestCount <= maxFree ? (
        <div className="bg-green-950/20 border border-green-700/30 rounded-lg px-3 py-2 mb-4 text-center">
          <span className="text-green-400 text-sm">Все гости включены в тариф</span>
        </div>
      ) : null}

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

export default Step2Guests
