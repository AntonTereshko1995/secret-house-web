import { useState } from 'react'
import { TARIFF_OPTIONS } from '../../../utils/booking'
import { validateGiftCode } from '../../../services/api'
import { useLoading } from '../../../context/LoadingContext'
import { logger } from '../../../services/logger'
import type { BookingFormData, TariffType } from '../../../types/booking.types'

interface StepProps {
  formData: Partial<BookingFormData>
  updateFormData: (data: Partial<BookingFormData>) => void
  nextStep: () => void
}

function Step1Tariff({ formData, updateFormData, nextStep }: StepProps) {
  const [selected, setSelected] = useState<string>(
    formData.giftId ? 'gift-certificate' : (formData.tariff || '')
  )
  const [giftCode, setGiftCode] = useState<string>(formData.giftCertificateCode || '')
  const [giftValidating, setGiftValidating] = useState(false)
  const [giftError, setGiftError] = useState<string | null>(null)
  const [giftSuccess, setGiftSuccess] = useState<string | null>(
    formData.giftId ? '✓ Сертификат подтверждён' : null
  )

  const isGiftValidated = !!formData.giftId
  const { setLoading } = useLoading()

  const handleTariffSelect = (id: string) => {
    logger.info('booking_select', { step: 'tariff', tariff: id })
    setSelected(id)
    setGiftError(null)
    setGiftSuccess(null)
    // Reset gift data when switching away from gift-certificate
    if (id !== 'gift-certificate' && formData.giftId) {
      updateFormData({
        giftId: undefined,
        giftTariff: undefined,
        giftPrice: undefined,
        giftHasSauna: undefined,
        giftHasSecretRoom: undefined,
        giftHasAdditionalBedroom: undefined,
        giftHasBathTub: undefined,
      })
    }
  }

  const handleValidateGift = async () => {
    if (!giftCode.trim()) return
    setGiftValidating(true)
    setGiftError(null)
    setGiftSuccess(null)
    setLoading(true)
    try {
      const res = await validateGiftCode(giftCode.trim())
      if (!res.valid || !res.giftId || !res.tariff) {
        logger.warn('gift_validation_invalid', { message: res.message })
        setGiftError(res.message)
        return
      }
      logger.info('gift_validation_success', { giftId: res.giftId, tariff: res.tariff })
      setGiftSuccess('✓ Сертификат действителен')
      // Pre-fill gift data into formData (tariff = actual gift tariff)
      updateFormData({
        giftId: res.giftId,
        giftTariff: res.tariff as TariffType,
        giftPrice: res.price,
        giftHasSauna: res.hasSauna,
        giftHasSecretRoom: res.hasSecretRoom,
        giftHasAdditionalBedroom: res.hasAdditionalBedroom,
        giftHasBathTub: res.hasBathTub,
        giftCertificateCode: giftCode.trim().toUpperCase(),
        // Pre-fill options included in the certificate
        hasSauna: res.hasSauna ? true : undefined,
        hasSecretRoom: res.hasSecretRoom ? true : undefined,
        hasExtraBedroom: res.hasAdditionalBedroom ? true : undefined,
        hasBathTub: res.hasBathTub ? true : undefined,
      })
    } catch (error) {
      logger.error('gift_validation_error', {
        message: error instanceof Error ? error.message : String(error),
      })
      setGiftError('Не удалось проверить сертификат. Попробуйте ещё раз.')
    } finally {
      setGiftValidating(false)
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (!selected) {
      alert('Пожалуйста, выберите тариф')
      return
    }
    if (selected === 'gift-certificate') {
      if (!isGiftValidated) {
        alert('Пожалуйста, проверьте код сертификата')
        return
      }
      // Use the actual tariff from the gift certificate
      updateFormData({ tariff: formData.giftTariff! })
      nextStep()
      return
    }
    updateFormData({ tariff: selected as TariffType })
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
            onClick={() => handleTariffSelect(tariff.id)}
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

      {/* Gift Certificate section */}
      {selected === 'gift-certificate' && (
        <div className="mb-4 bg-zinc-800/60 border border-zinc-700 p-3 rounded-lg">
          <label className="block text-white font-semibold mb-1.5 uppercase text-xs tracking-wider">
            Код сертификата *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={giftCode}
              onChange={(e) => {
                setGiftCode(e.target.value.toUpperCase())
                setGiftError(null)
                setGiftSuccess(null)
                // Reset validated state when code changes
                if (formData.giftId) {
                  updateFormData({
                    giftId: undefined,
                    giftTariff: undefined,
                    giftPrice: undefined,
                    giftHasSauna: undefined,
                    giftHasSecretRoom: undefined,
                    giftHasAdditionalBedroom: undefined,
                    giftHasBathTub: undefined,
                  })
                }
              }}
              placeholder="XXXXX-XXXXX-XXXXX"
              disabled={giftValidating}
              className="flex-1 bg-black border border-gray-700 focus:border-amber-400 text-white px-3 py-2 rounded outline-none transition-colors uppercase tracking-wider font-mono text-center text-sm disabled:opacity-50"
              maxLength={20}
            />
            <button
              onClick={handleValidateGift}
              disabled={!giftCode.trim() || giftValidating}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold px-3 py-2 rounded text-xs uppercase tracking-wider transition-all whitespace-nowrap"
            >
              {giftValidating ? '...' : 'Проверить'}
            </button>
          </div>

          {giftError && (
            <p className="mt-2 text-red-400 text-xs">{giftError}</p>
          )}
          {giftSuccess && (
            <div className="mt-2 space-y-1">
              <p className="text-green-400 text-xs font-semibold">{giftSuccess}</p>
              {formData.giftTariff && (
                <p className="text-gray-400 text-xs">
                  Тариф: <span className="text-white">{TARIFF_OPTIONS.find(t => t.id === formData.giftTariff)?.name ?? formData.giftTariff}</span>
                </p>
              )}
              <div className="flex flex-wrap gap-1 mt-1">
                {formData.giftHasSauna && (
                  <span className="text-[10px] bg-amber-400/10 border border-amber-400/30 text-amber-400 px-2 py-0.5 rounded">Сауна включена</span>
                )}
                {formData.giftHasBathTub && (
                  <span className="text-[10px] bg-amber-400/10 border border-amber-400/30 text-amber-400 px-2 py-0.5 rounded">Банный чан</span>
                )}
                {formData.giftHasSecretRoom && (
                  <span className="text-[10px] bg-amber-400/10 border border-amber-400/30 text-amber-400 px-2 py-0.5 rounded">Секретная комната</span>
                )}
                {formData.giftHasAdditionalBedroom && (
                  <span className="text-[10px] bg-amber-400/10 border border-amber-400/30 text-amber-400 px-2 py-0.5 rounded">Обе спальные комнаты</span>
                )}
                {formData.giftPrice !== undefined && formData.giftPrice > 0 && (
                  <span className="text-[10px] bg-green-400/10 border border-green-400/30 text-green-400 px-2 py-0.5 rounded">Покрывает {formData.giftPrice} BYN</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleNext}
        disabled={
          !selected ||
          (selected === 'gift-certificate' && !isGiftValidated)
        }
        className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-2 px-4 rounded-xl uppercase tracking-wider transition-all"
      >
        Далее
      </button>
    </div>
  )
}

export default Step1Tariff
