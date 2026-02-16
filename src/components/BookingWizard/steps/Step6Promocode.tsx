import { useState } from 'react'
import { validatePromocode } from '../../../utils/booking'
import type { BookingFormData } from '../../../types/booking.types'

interface StepProps {
  formData: Partial<BookingFormData>
  updateFormData: (data: Partial<BookingFormData>) => void
  nextStep: () => void
  prevStep: () => void
}

function Step6Promocode({ formData, updateFormData, nextStep, prevStep }: StepProps) {
  const [promocode, setPromocode] = useState(formData.promocode || '')
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    valid: boolean
    discount: number
    message: string
  } | null>(formData.promocodeValid !== undefined ? {
    valid: formData.promocodeValid,
    discount: formData.promocodeDiscount || 0,
    message: formData.promocodeValid ? `Скидка ${formData.promocodeDiscount} BYN` : 'Промокод недействителен'
  } : null)

  const handleValidate = async () => {
    if (!promocode.trim()) return

    setIsValidating(true)
    try {
      const result = await validatePromocode(promocode)
      setValidationResult(result)
    } catch {
      setValidationResult({
        valid: false,
        discount: 0,
        message: 'Ошибка проверки промокода'
      })
    } finally {
      setIsValidating(false)
    }
  }

  const handleNext = () => {
    updateFormData({
      promocode: promocode.trim() || undefined,
      promocodeDiscount: validationResult?.valid ? validationResult.discount : 0,
      promocodeValid: validationResult?.valid || false
    })
    nextStep()
  }

  return (
    <div className="bg-gray-900 p-5 sm:p-6 rounded-lg border border-yellow-600/30">
      <h2 className="text-2xl sm:text-3xl font-bold text-luxury-gold mb-6 uppercase tracking-wider">
        Промокод
      </h2>
      <p className="text-gray-400 mb-6">
        Если у вас есть промокод, введите его для получения скидки (необязательно)
      </p>

      <div className="mb-6">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={promocode}
            onChange={(e) => {
              setPromocode(e.target.value.toUpperCase())
              setValidationResult(null)
            }}
            placeholder="ВВЕДИТЕ ПРОМОКОД"
            className="flex-1 bg-black border-2 border-gray-700 focus:border-yellow-600 text-white px-4 py-3 rounded-lg outline-none transition-colors uppercase tracking-wider"
            disabled={isValidating}
          />
          <button
            onClick={handleValidate}
            disabled={!promocode.trim() || isValidating}
            className="bg-gray-800 hover:bg-yellow-600 hover:text-black disabled:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-lg uppercase tracking-wider transition-all"
          >
            {isValidating ? 'Проверка...' : 'Применить'}
          </button>
        </div>

        {/* Validation Result */}
        {validationResult && (
          <div className={`
            p-4 rounded-lg border-2 flex items-start gap-3
            ${validationResult.valid
              ? 'bg-green-500/10 border-green-500/50'
              : 'bg-red-500/10 border-red-500/50'}
          `}>
            <div>
              {validationResult.valid ? (
                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <div className={`font-bold ${validationResult.valid ? 'text-green-500' : 'text-red-500'}`}>
                {validationResult.message}
              </div>
              {validationResult.valid && (
                <div className="text-gray-400 text-sm mt-1">
                  Промокод "{promocode}" успешно применен
                </div>
              )}
            </div>
          </div>
        )}

        {/* Available Promo Codes Hint */}
        {!validationResult && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-gray-400 text-sm mb-2">💡 Доступные промокоды:</div>
            <div className="flex flex-wrap gap-2">
              {['SECRET10', 'WELCOME', 'VIP20', 'PROMO50'].map((code) => (
                <button
                  key={code}
                  onClick={() => setPromocode(code)}
                  className="text-xs bg-gray-700 hover:bg-yellow-600 hover:text-black text-yellow-600 px-3 py-1 rounded-full font-mono transition-all"
                >
                  {code}
                </button>
              ))}
            </div>
            <div className="text-gray-500 text-xs mt-2">
              (Для демонстрации - в продакшене будут настоящие промокоды)
            </div>
          </div>
        )}
      </div>

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
          {validationResult?.valid ? 'Далее со скидкой' : 'Далее'}
        </button>
      </div>
    </div>
  )
}

export default Step6Promocode
