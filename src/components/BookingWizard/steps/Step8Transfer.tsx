import { useState } from 'react'
import { logger } from '../../../services/logger'
import type { BookingFormData } from '../../../types/booking.types'

interface StepProps {
  formData: Partial<BookingFormData>
  updateFormData: (data: Partial<BookingFormData>) => void
  nextStep: () => void
  prevStep: () => void
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function Step8Transfer({ formData, updateFormData, nextStep, prevStep }: StepProps) {
  const [needsTransfer, setNeedsTransfer] = useState(formData.needsTransfer || false)
  const [transferAddress, setTransferAddress] = useState(formData.transferAddress || '')

  function buildDateTime(date: Date | string | undefined, time: string | undefined): Date | null {
    if (!date || !time) return null
    const d = new Date(date)
    const [h, m] = time.split(':').map(Number)
    d.setHours(h, m, 0, 0)
    return d
  }

  const checkIn = buildDateTime(formData.checkInDate, formData.checkInTime)
  const checkOut = buildDateTime(formData.checkOutDate, formData.checkOutTime)

  const pickupTime = checkIn
    ? formatTime(new Date(checkIn.getTime() - 30 * 60 * 1000))
    : null
  const returnTime = checkOut ? formatTime(checkOut) : null

  const handleNext = () => {
    if (needsTransfer && !transferAddress.trim()) {
      alert('Пожалуйста, укажите адрес для трансфера')
      return
    }

    logger.info('booking_select', { step: 'transfer', needsTransfer, tariff: formData.tariff })
    updateFormData({
      needsTransfer,
      transferAddress: needsTransfer ? transferAddress.trim() : undefined,
      transferTime: needsTransfer && pickupTime ? pickupTime : undefined,
      transferBothDirections: needsTransfer ? true : false,
      transferReturnAddress: needsTransfer ? transferAddress.trim() : undefined,
      transferReturnTime: needsTransfer && returnTime ? returnTime : undefined,
      transferPrice: 0
    })
    nextStep()
  }

  return (
    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-2xl">
      <h2 className="text-lg sm:text-xl font-bold text-white mb-2 uppercase tracking-wider">
        Трансфер
      </h2>
      <p className="text-gray-400 mb-3 text-sm">
        Нужна ли вам услуга трансфера? (необязательно)
      </p>

      {/* Toggle Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <button
          onClick={() => setNeedsTransfer(false)}
          className={`
            p-6 border-2 rounded-lg font-bold uppercase tracking-wider transition-all
            ${!needsTransfer
              ? 'border-amber-400 bg-amber-400/10 text-white'
              : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}
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
              ? 'border-amber-400 bg-amber-400/10 text-white'
              : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}
          `}
        >
          <div className="text-2xl mb-2">🚗</div>
          Нужен трансфер
        </button>
      </div>

      {/* Transfer Details */}
      {needsTransfer && (
        <div className="space-y-3 mb-3">
          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            {pickupTime && (
              <div className="bg-zinc-800/60 border border-zinc-700 p-3 rounded-lg">
                <div className="text-gray-400 text-xs mb-1">Подача (туда)</div>
                <div className="text-amber-400 font-bold text-xl">{pickupTime}</div>
              </div>
            )}
            {returnTime && (
              <div className="bg-zinc-800/60 border border-zinc-700 p-3 rounded-lg">
                <div className="text-gray-400 text-xs mb-1">Подача (обратно)</div>
                <div className="text-amber-400 font-bold text-xl">{returnTime}</div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-white font-semibold mb-2 uppercase text-sm tracking-wider">
              Адрес *
            </label>
            <input
              type="text"
              value={transferAddress}
              onChange={(e) => setTransferAddress(e.target.value)}
              placeholder="Например: Минск, ул. Ленина 10"
              className="w-full bg-black border-2 border-gray-700 focus:border-amber-400 text-white px-4 py-3 rounded-lg outline-none transition-colors"
            />
          </div>
        </div>
      )}

      {!needsTransfer && (
        <div className="bg-zinc-800/50 p-4 rounded-lg mb-4 text-center">
          <div className="text-gray-400 text-sm">
            Трансфер не выбран. Вы можете добраться самостоятельно.
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={prevStep}
          className="flex-1 border border-zinc-600 bg-transparent hover:bg-zinc-800/50 text-zinc-300 font-bold py-2 px-4 rounded-xl uppercase tracking-wider transition-all"
        >
          Назад
        </button>
        <button
          onClick={handleNext}
          disabled={needsTransfer && !transferAddress.trim()}
          className="flex-1 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-2 px-4 rounded-xl uppercase tracking-wider transition-all"
        >
          Далее
        </button>
      </div>
    </div>
  )
}

export default Step8Transfer
