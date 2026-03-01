import { useState } from 'react'
import { TARIFF_OPTIONS } from '../../../utils/booking'
import type { BookingFormData, TariffType } from '../../../types/booking.types'

interface StepProps {
  formData: Partial<BookingFormData>
  updateFormData: (data: Partial<BookingFormData>) => void
  nextStep: () => void
}

function Step1Tariff({ formData, updateFormData, nextStep }: StepProps) {
  const [selected, setSelected] = useState<string>(formData.tariff || '')
  const [giftCode, setGiftCode] = useState<string>(formData.giftCertificateCode || '')

  const handleNext = () => {
    if (!selected) {
      alert('Пожалуйста, выберите тариф')
      return
    }
    if (selected === 'gift-certificate' && !giftCode.trim()) {
      alert('Пожалуйста, введите код подарочного сертификата')
      return
    }
    updateFormData({
      tariff: selected as TariffType,
      giftCertificateCode: selected === 'gift-certificate' ? giftCode.trim() : undefined
    })
    nextStep()
  }

  return (
    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-2xl">
      <h2 className="text-lg sm:text-xl font-bold text-white mb-3 uppercase tracking-wider">
        Выберите тариф
      </h2>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {TARIFF_OPTIONS.map(tariff => (
          <div
            key={tariff.id}
            onClick={() => setSelected(tariff.id)}
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

      {/* Gift Certificate Code Input */}
      {selected === 'gift-certificate' && (
        <div className="mb-4 bg-zinc-800/60 border border-zinc-700 p-3 rounded-lg">
          <label className="block text-white font-semibold mb-1.5 uppercase text-xs tracking-wider">
            Код сертификата *
          </label>
          <input
            type="text"
            value={giftCode}
            onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
            placeholder="XXXXX-XXXXX-XXXXX"
            className="w-full bg-black border border-gray-700 focus:border-amber-400 text-white px-3 py-2 rounded outline-none transition-colors uppercase tracking-wider font-mono text-center text-sm"
            maxLength={20}
          />
        </div>
      )}

      <button
        onClick={handleNext}
        disabled={!selected || (selected === 'gift-certificate' && !giftCode.trim())}
        className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-2 px-4 rounded-xl uppercase tracking-wider transition-all"
      >
        Далее
      </button>
    </div>
  )
}

export default Step1Tariff
