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
    <div className="bg-gray-900 p-5 sm:p-6 rounded-lg border border-yellow-600/30">
      <h2 className="text-2xl sm:text-3xl font-bold text-luxury-gold mb-4 uppercase tracking-wider">
        Выберите тариф
      </h2>
      <p className="text-gray-400 mb-6 text-sm">
        Выберите подходящий тариф для вашего пребывания
      </p>

      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        {TARIFF_OPTIONS.map(tariff => (
          <div
            key={tariff.id}
            onClick={() => setSelected(tariff.id)}
            className={`
              p-4 border-2 rounded-lg cursor-pointer transition-all duration-300
              ${selected === tariff.id
                ? 'border-yellow-600 bg-yellow-600/10 shadow-lg shadow-yellow-600/20'
                : 'border-gray-700 hover:border-yellow-600/50 hover:bg-gray-800'}
            `}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-base font-bold text-white">{tariff.name}</h3>
              <div
                className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ml-2
                  ${selected === tariff.id ? 'border-yellow-600 bg-yellow-600' : 'border-gray-600'}
                `}
              >
                {selected === tariff.id && (
                  <div className="w-2.5 h-2.5 rounded-full bg-black" />
                )}
              </div>
            </div>
            <p className="text-gray-400 text-xs mb-2">{tariff.description}</p>
            <p className="text-lg font-bold text-yellow-600">{tariff.unit}</p>
          </div>
        ))}
      </div>

      {/* Gift Certificate Code Input */}
      {selected === 'gift-certificate' && (
        <div className="mb-6 bg-yellow-600/10 border-2 border-yellow-600/30 p-4 rounded-lg">
          <label className="block text-white font-semibold mb-2 uppercase text-sm tracking-wider">
            Введите код вашего сертификата *
          </label>
          <input
            type="text"
            value={giftCode}
            onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
            placeholder="XXXXX-XXXXX-XXXXX"
            className="w-full bg-black border-2 border-gray-700 focus:border-yellow-600 text-white px-4 py-3 rounded-lg outline-none transition-colors uppercase tracking-wider font-mono text-center text-lg"
            maxLength={20}
          />
          <p className="text-gray-400 text-xs mt-2">
            🎁 Введите код, указанный на вашем подарочном сертификате
          </p>
        </div>
      )}

      <button
        onClick={handleNext}
        disabled={!selected || (selected === 'gift-certificate' && !giftCode.trim())}
        className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-black font-bold py-3 px-6 uppercase tracking-wider transition-all shadow-lg hover:shadow-xl"
      >
        Далее
      </button>
    </div>
  )
}

export default Step1Tariff
