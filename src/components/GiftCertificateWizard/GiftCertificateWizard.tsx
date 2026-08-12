import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { logger } from '../../services/logger'
import { useLoading } from '../../context/LoadingContext'
import { submitGiftPurchase } from '../../services/api'
import StepIndicator from '../BookingWizard/StepIndicator'
import GiftStepTariff from './steps/GiftStepTariff'
import GiftStepBedroom from './steps/GiftStepBedroom'
import GiftStepSecretRoom from './steps/GiftStepSecretRoom'
import GiftStepSauna from './steps/GiftStepSauna'
import GiftStepBathTub from './steps/GiftStepBathTub'
import GiftStepSummary from './steps/GiftStepSummary'
import GiftStepContact from './steps/GiftStepContact'
import GiftStepPayment from './steps/GiftStepPayment'
import type { GiftFormData, GiftStep } from '../../types/gift.types'

const INCOGNITO_TARIFFS = ['incognito-daily', 'incognito-12h', 'incognito-work']
const DAILY_TARIFFS = ['daily-couple', 'daily-3plus']

function getNextStep(step: GiftStep, tariff?: string): GiftStep | null {
  switch (step) {
    case 'tariff':
      if (!tariff) return null
      if (INCOGNITO_TARIFFS.includes(tariff)) return 'bath-tub'
      if (DAILY_TARIFFS.includes(tariff)) return 'sauna'
      return 'bedroom'
    case 'bedroom': return 'secret-room'
    case 'secret-room': return 'sauna'
    case 'sauna': return 'bath-tub'
    case 'bath-tub': return 'summary'
    case 'summary': return 'contact'
    case 'contact': return 'payment'
    case 'payment': return null
    case 'success': return null
    default: return null
  }
}

function getPrevStep(step: GiftStep, tariff?: string): GiftStep | null {
  switch (step) {
    case 'tariff': return null
    case 'bedroom': return 'tariff'
    case 'secret-room': return 'bedroom'
    case 'sauna':
      if (!tariff) return 'tariff'
      if (INCOGNITO_TARIFFS.includes(tariff)) return null
      if (DAILY_TARIFFS.includes(tariff)) return 'tariff'
      return 'secret-room'
    case 'bath-tub':
      if (!tariff) return 'sauna'
      if (INCOGNITO_TARIFFS.includes(tariff)) return 'tariff'
      return 'sauna'
    case 'summary': return 'bath-tub'
    case 'contact': return 'summary'
    case 'payment': return 'contact'
    case 'success': return null
    default: return null
  }
}

function getStepNumber(step: GiftStep, tariff?: string): { current: number; total: number } {
  const isIncognito = tariff && INCOGNITO_TARIFFS.includes(tariff)
  const isDaily = tariff && DAILY_TARIFFS.includes(tariff)

  let steps: GiftStep[]
  if (isIncognito) {
    steps = ['tariff', 'bath-tub', 'summary', 'contact', 'payment']
  } else if (isDaily) {
    steps = ['tariff', 'sauna', 'bath-tub', 'summary', 'contact', 'payment']
  } else {
    steps = ['tariff', 'bedroom', 'secret-room', 'sauna', 'bath-tub', 'summary', 'contact', 'payment']
  }

  const idx = steps.indexOf(step)
  return { current: idx >= 0 ? idx + 1 : 1, total: steps.length }
}

const STEP_TITLES: Record<GiftStep, string> = {
  tariff: 'Тариф',
  bedroom: 'Спальня',
  'secret-room': 'Секретная комната',
  sauna: 'Сауна',
  'bath-tub': 'Банный чан',
  summary: 'Итого',
  contact: 'Контакт',
  payment: 'Оплата',
  success: 'Готово',
}

const DEFAULT_GIFT_DATA: GiftFormData = {
  hasSauna: false,
  hasSecretRoom: false,
  hasExtraBedroom: false,
  hasBathTub: false,
  saunaPrice: 0,
  secretRoomPrice: 0,
  extraBedroomPrice: 0,
  bathTubPrice: 0,
  totalPrice: 0,
  contactType: 'telegram',
}

function GiftCertificateWizard() {
  const [currentStep, setCurrentStep] = useState<GiftStep>('tariff')
  const [giftData, setGiftData] = useState<GiftFormData>(DEFAULT_GIFT_DATA)
  const [successCode, setSuccessCode] = useState<string | null>(null)
  const { setLoading } = useLoading()

  const giftDataRef = useRef(giftData)
  useEffect(() => { giftDataRef.current = giftData }, [giftData])

  const updateGiftData = (data: Partial<GiftFormData>) => {
    setGiftData(prev => {
      const next = { ...prev, ...data }
      giftDataRef.current = next
      return next
    })
  }

  const nextStep = () => {
    const next = getNextStep(currentStep, giftDataRef.current.tariff)
    if (next) {
      setCurrentStep(next)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const prevStep = () => {
    const prev = getPrevStep(currentStep, giftDataRef.current.tariff)
    if (prev) {
      setCurrentStep(prev)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSubmit = async (receiptFile: File) => {
    setLoading(true)
    try {
      const finalData = { ...giftDataRef.current, receiptFile }
      const result = await submitGiftPurchase(finalData)
      setSuccessCode(result.code)
      setCurrentStep('success')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      logger.error('gift_wizard_submit_error', {
        message: error instanceof Error ? error.message : String(error),
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const stepProps = { giftData, updateGiftData, nextStep, prevStep }
  const { current, total } = getStepNumber(currentStep, giftData.tariff)

  if (currentStep === 'success') {
    return (
      <div className="min-h-screen bg-luxury-gradient py-4 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-zinc-900 p-8 rounded-xl border border-zinc-800 shadow-2xl text-center">
          <div className="text-5xl mb-4">🎁</div>
          <h1 className="text-2xl font-bold text-amber-400 uppercase tracking-wider mb-2">
            Сертификат оформлен!
          </h1>
          <p className="text-gray-400 mb-4">
            Ваша заявка принята. Код сертификата будет отправлен вам после подтверждения оплаты.
          </p>
          {successCode && (
            <div className="bg-zinc-800 border border-amber-400/30 rounded-lg px-4 py-3 mb-6">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Код сертификата</div>
              <div className="text-amber-400 font-bold text-xl tracking-widest font-mono">{successCode}</div>
            </div>
          )}
          <Link
            to="/"
            className="inline-block bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold py-3 px-8 rounded-xl uppercase tracking-wider transition-all"
          >
            На главную
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-luxury-gradient py-4 px-4">
      <div className="max-w-7xl mx-auto pt-4 mb-2">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          На главную
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-3">
          <h1 className="text-xl sm:text-2xl font-bold text-amber-400 uppercase tracking-wider mb-0.5">
            Подарочный сертификат
          </h1>
          <p className="text-gray-500 text-sm">Secret House</p>
        </div>

        <StepIndicator
          currentStep={current}
          totalSteps={total}
          stepTitle={STEP_TITLES[currentStep]}
        />

        <div className="mb-4">
          {currentStep === 'tariff' && <GiftStepTariff {...stepProps} />}
          {currentStep === 'bedroom' && <GiftStepBedroom {...stepProps} />}
          {currentStep === 'secret-room' && <GiftStepSecretRoom {...stepProps} />}
          {currentStep === 'sauna' && <GiftStepSauna {...stepProps} />}
          {currentStep === 'bath-tub' && <GiftStepBathTub {...stepProps} />}
          {currentStep === 'summary' && <GiftStepSummary {...stepProps} />}
          {currentStep === 'contact' && <GiftStepContact {...stepProps} />}
          {currentStep === 'payment' && (
            <GiftStepPayment {...stepProps} onSubmit={handleSubmit} />
          )}
        </div>
      </div>
    </div>
  )
}

export default GiftCertificateWizard
