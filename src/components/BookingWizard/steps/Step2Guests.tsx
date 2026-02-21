import { useState } from 'react'
import type { BookingFormData } from '../../../types/booking.types'

interface StepProps {
  formData: Partial<BookingFormData>
  updateFormData: (data: Partial<BookingFormData>) => void
  nextStep: () => void
  prevStep: () => void
}

function Step2Guests({ formData, updateFormData, nextStep, prevStep }: StepProps) {
  const [guestCount, setGuestCount] = useState(formData.guestCount || 2)

  const handleNext = () => {
    if (guestCount < 1 || guestCount > 6) {
      alert('Количество гостей должно быть от 1 до 6')
      return
    }
    updateFormData({ guestCount })
    nextStep()
  }

  const increment = () => setGuestCount(prev => Math.min(prev + 1, 6))
  const decrement = () => setGuestCount(prev => Math.max(prev - 1, 1))

  return (
    <div className="bg-gray-900 p-4 rounded-lg border border-yellow-600/30">
      <h2 className="text-lg sm:text-xl font-bold text-luxury-gold mb-2 uppercase tracking-wider">
        Количество гостей
      </h2>
      <p className="text-gray-400 mb-3 text-sm">
        Укажите количество гостей (от 1 до 6)
      </p>

      <div className="flex items-center justify-center gap-6 mb-6">
        <button
          onClick={decrement}
          disabled={guestCount <= 1}
          className="w-14 h-14 bg-gray-800 hover:bg-yellow-600 disabled:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed text-white hover:text-black font-bold text-2xl rounded-lg transition-all"
        >
          −
        </button>

        <div className="text-center">
          <div className="text-6xl font-bold text-yellow-600 mb-2">
            {guestCount}
          </div>
          <div className="text-gray-400 uppercase text-sm tracking-wider">
            {guestCount === 1 ? 'Гость' : guestCount < 5 ? 'Гостя' : 'Гостей'}
          </div>
        </div>

        <button
          onClick={increment}
          disabled={guestCount >= 6}
          className="w-14 h-14 bg-gray-800 hover:bg-yellow-600 disabled:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed text-white hover:text-black font-bold text-2xl rounded-lg transition-all"
        >
          +
        </button>
      </div>

      {/* Visual representation */}
      <div className="flex justify-center gap-2 mb-6">
        {Array.from({ length: 6 }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            onClick={() => setGuestCount(num)}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer
              ${num <= guestCount
                ? 'bg-yellow-600 text-black'
                : 'bg-gray-800 text-gray-600 hover:bg-gray-700 hover:text-gray-400'}
            `}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </button>
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
          className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-2 px-4 uppercase tracking-wider transition-all"
        >
          Далее
        </button>
      </div>
    </div>
  )
}

export default Step2Guests
