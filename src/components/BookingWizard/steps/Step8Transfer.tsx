import { useState } from 'react'
import { TRANSFER_PRICE } from '../../../utils/booking'
import type { BookingFormData } from '../../../types/booking.types'

interface StepProps {
  formData: Partial<BookingFormData>
  updateFormData: (data: Partial<BookingFormData>) => void
  nextStep: () => void
  prevStep: () => void
}

function Step8Transfer({ formData, updateFormData, nextStep, prevStep }: StepProps) {
  const [needsTransfer, setNeedsTransfer] = useState(formData.needsTransfer || false)
  const [transferAddress, setTransferAddress] = useState(formData.transferAddress || '')
  const [transferTime, setTransferTime] = useState(formData.transferTime || '')
  const [bothDirections, setBothDirections] = useState(formData.transferBothDirections || false)
  const [returnAddress, setReturnAddress] = useState(formData.transferReturnAddress || '')
  const [returnTime, setReturnTime] = useState(formData.transferReturnTime || '')

  const handleNext = () => {
    if (needsTransfer) {
      if (!transferAddress.trim()) {
        alert('Пожалуйста, укажите адрес для трансфера')
        return
      }
      if (bothDirections && !returnAddress.trim()) {
        alert('Пожалуйста, укажите адрес обратного трансфера')
        return
      }
    }

    updateFormData({
      needsTransfer,
      transferAddress: needsTransfer ? transferAddress.trim() : undefined,
      transferTime: needsTransfer ? transferTime : undefined,
      transferBothDirections: needsTransfer ? bothDirections : false,
      transferReturnAddress: needsTransfer && bothDirections ? returnAddress.trim() : undefined,
      transferReturnTime: needsTransfer && bothDirections ? returnTime : undefined,
      transferPrice: needsTransfer ? TRANSFER_PRICE * (bothDirections ? 2 : 1) : 0
    })
    nextStep()
  }

  return (
    <div className="bg-gray-900 p-5 sm:p-6 rounded-lg border border-yellow-600/30">
      <h2 className="text-2xl sm:text-3xl font-bold text-luxury-gold mb-6 uppercase tracking-wider">
        Трансфер
      </h2>
      <p className="text-gray-400 mb-6">
        Нужна ли вам услуга трансфера? (необязательно)
      </p>

      {/* Toggle Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setNeedsTransfer(false)}
          className={`
            p-6 border-2 rounded-lg font-bold uppercase tracking-wider transition-all
            ${!needsTransfer
              ? 'border-yellow-600 bg-yellow-600/10 text-white'
              : 'border-gray-700 text-gray-400 hover:border-yellow-600/50'}
          `}
        >
          <div className="text-2xl mb-2">🚫</div>
          Не нужен
        </button>
        <button
          onClick={() => setNeedsTransfer(true)}
          className={`
            p-6 border-2 rounded-lg font-bold uppercase tracking-wider transition-all
            ${needsTransfer
              ? 'border-yellow-600 bg-yellow-600/10 text-white'
              : 'border-gray-700 text-gray-400 hover:border-yellow-600/50'}
          `}
        >
          <div className="text-2xl mb-2">🚗</div>
          Нужен трансфер
        </button>
      </div>

      {/* Transfer Details (shown if needed) */}
      {needsTransfer && (
        <div className="space-y-6 mb-6">
          <div className="bg-yellow-600/10 border border-yellow-600/30 p-4 rounded-lg">
            <div className="text-center">
              <div className="text-gray-400 text-sm mb-1">Стоимость трансфера:</div>
              <div className="text-yellow-600 font-bold text-3xl">
                {TRANSFER_PRICE * (bothDirections ? 2 : 1)} BYN
              </div>
              {bothDirections && (
                <div className="text-gray-400 text-xs mt-1">
                  (туда и обратно)
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2 uppercase text-sm tracking-wider">
              Адрес подачи *
            </label>
            <input
              type="text"
              value={transferAddress}
              onChange={(e) => setTransferAddress(e.target.value)}
              placeholder="Например: Минск, ул. Ленина 10"
              className="w-full bg-black border-2 border-gray-700 focus:border-yellow-600 text-white px-4 py-3 rounded-lg outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2 uppercase text-sm tracking-wider">
              Предпочтительное время подачи (необязательно)
            </label>
            <select
              value={transferTime}
              onChange={(e) => setTransferTime(e.target.value)}
              className="w-full bg-black border-2 border-gray-700 focus:border-yellow-600 text-white px-4 py-3 rounded-lg outline-none transition-colors"
            >
              <option value="">Выберите время</option>
              {Array.from({ length: 48 }, (_, i) => {
                const hour = Math.floor(i / 2)
                const minute = i % 2 === 0 ? '00' : '30'
                return `${hour.toString().padStart(2, '0')}:${minute}`
              }).map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          {/* Bidirectional Transfer Toggle */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={bothDirections}
                onChange={(e) => setBothDirections(e.target.checked)}
                className="w-5 h-5 accent-yellow-600"
              />
              <span className="text-white font-semibold">
                Трансфер в обе стороны (+{TRANSFER_PRICE} BYN)
              </span>
            </label>
          </div>

          {/* Return Transfer Details */}
          {bothDirections && (
            <div className="space-y-4 p-4 border-2 border-yellow-600/30 rounded-lg">
              <h3 className="text-white font-bold uppercase text-sm tracking-wider">
                Обратный трансфер
              </h3>

              <div>
                <label className="block text-white font-semibold mb-2 uppercase text-sm tracking-wider">
                  Адрес возвращения *
                </label>
                <input
                  type="text"
                  value={returnAddress}
                  onChange={(e) => setReturnAddress(e.target.value)}
                  placeholder="Например: Минск, ул. Ленина 10"
                  className="w-full bg-black border-2 border-gray-700 focus:border-yellow-600 text-white px-4 py-3 rounded-lg outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2 uppercase text-sm tracking-wider">
                  Время возвращения (необязательно)
                </label>
                <select
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  className="w-full bg-black border-2 border-gray-700 focus:border-yellow-600 text-white px-4 py-3 rounded-lg outline-none transition-colors"
                >
                  <option value="">Выберите время</option>
                  {Array.from({ length: 48 }, (_, i) => {
                    const hour = Math.floor(i / 2)
                    const minute = i % 2 === 0 ? '00' : '30'
                    return `${hour.toString().padStart(2, '0')}:${minute}`
                  }).map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-gray-400 text-sm">
              💡 Водитель свяжется с вами за 30 минут до подачи.
            </div>
          </div>
        </div>
      )}

      {!needsTransfer && (
        <div className="bg-gray-800 p-4 rounded-lg mb-6 text-center">
          <div className="text-gray-400 text-sm">
            Трансфер не выбран. Вы можете добраться самостоятельно.
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
          disabled={needsTransfer && (!transferAddress.trim() || (bothDirections && !returnAddress.trim()))}
          className="flex-1 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-black font-bold py-3 px-6 uppercase tracking-wider transition-all shadow-lg hover:shadow-xl"
        >
          Далее
        </button>
      </div>
    </div>
  )
}

export default Step8Transfer
