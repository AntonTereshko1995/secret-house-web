import { useState } from 'react'
import { logger } from '../../../services/logger'
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
    const trimmed = comment.trim()
    logger.info('booking_comment_submitted', { hasComment: trimmed.length > 0, length: trimmed.length })
    updateFormData({ comment: trimmed })
    nextStep()
  }

  return (
    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-2xl">
      <h2 className="text-lg sm:text-xl font-bold text-white mb-2 uppercase tracking-wider">
        Комментарий
      </h2>
      <p className="text-gray-400 mb-3 text-sm">
        Расскажите о своих пожеланиях или особых требованиях (необязательно)
      </p>

      <div className="mb-6">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, maxLength))}
          placeholder="Например: хотим отметить день рождения, нужны дополнительные полотенца..."
          rows={6}
          className="w-full bg-black border-2 border-gray-700 focus:border-amber-400 text-white px-4 py-3 rounded-lg outline-none transition-colors resize-none"
        />
        <div className="flex justify-between items-center mt-2">
          <div className="text-gray-500 text-sm">
            {comment.length > 0 ? 'Ваш комментарий поможет нам лучше подготовиться' : 'Этот шаг можно пропустить'}
          </div>
          <div className={`text-sm ${comment.length >= maxLength ? 'text-amber-400' : 'text-gray-500'}`}>
            {comment.length} / {maxLength}
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
          {comment.length > 0 ? 'Далее' : 'Пропустить'}
        </button>
      </div>
    </div>
  )
}

export default Step5Comment
