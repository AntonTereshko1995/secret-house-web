import { useState } from 'react'
import type { BookingFormData } from '../../../types/booking.types'

interface StepProps {
  formData: Partial<BookingFormData>
  updateFormData: (data: Partial<BookingFormData>) => void
  nextStep: () => void
  prevStep: () => void
}

function Step5Comment({ formData, updateFormData, nextStep, prevStep }: StepProps) {
  const [comment, setComment] = useState(formData.comment || '')
  const maxLength = 500

  const handleNext = () => {
    updateFormData({ comment: comment.trim() })
    nextStep()
  }

  return (
    <div className="bg-gray-900 p-5 sm:p-6 rounded-lg border border-yellow-600/30">
      <h2 className="text-2xl sm:text-3xl font-bold text-luxury-gold mb-6 uppercase tracking-wider">
        Комментарий
      </h2>
      <p className="text-gray-400 mb-6">
        Расскажите о своих пожеланиях или особых требованиях (необязательно)
      </p>

      <div className="mb-6">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, maxLength))}
          placeholder="Например: хотим отметить день рождения, нужны дополнительные полотенца..."
          rows={6}
          className="w-full bg-black border-2 border-gray-700 focus:border-yellow-600 text-white px-4 py-3 rounded-lg outline-none transition-colors resize-none"
        />
        <div className="flex justify-between items-center mt-2">
          <div className="text-gray-500 text-sm">
            {comment.length > 0 ? 'Ваш комментарий поможет нам лучше подготовиться' : 'Этот шаг можно пропустить'}
          </div>
          <div className={`text-sm ${comment.length >= maxLength ? 'text-yellow-600' : 'text-gray-500'}`}>
            {comment.length} / {maxLength}
          </div>
        </div>
      </div>

      {/* Example suggestions */}
      {comment.length === 0 && (
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <div className="text-gray-400 text-sm mb-2">Примеры пожеланий:</div>
          <div className="flex flex-wrap gap-2">
            {[
              'Хотим романтический ужин',
              'Отмечаем годовщину',
              'Нужны дополнительные подушки',
              'Приедем с маленьким ребенком'
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setComment(suggestion)}
                className="text-xs bg-gray-700 hover:bg-yellow-600 hover:text-black text-gray-300 px-3 py-1 rounded-full transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

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
          {comment.length > 0 ? 'Далее' : 'Пропустить'}
        </button>
      </div>
    </div>
  )
}

export default Step5Comment
