import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StepIndicator from './StepIndicator'
import { STEP_REGISTRY } from './stepRegistry'
import { useConditionalNavigation, cleanIncompatibleData } from './navigationLogic'
import { clearFormFromLocalStorage } from '../../utils/booking'
import { useBookedPeriods } from '../../hooks/useBookedPeriods'
import type { BookingFormData } from '../../types/booking.types'

function BookingWizard() {
  const navigate = useNavigate()

  // Fetch booked periods once for the whole wizard session
  const { periods: bookedPeriods, loading: periodsLoading, error: periodsError } = useBookedPeriods()

  // STATE: Current step ID (not number!)
  const [currentStepId, setCurrentStepId] = useState('tariff')

  // STATE: Form data
  const [formData, setFormData] = useState<Partial<BookingFormData>>({
    guestCount: 2,
    wineSelection: [],
    needsTransfer: false,
    contactType: 'telegram',
    termsAccepted: false,
    transferPrice: 0,
    winePrice: 0,
    basePrice: 0,
    totalPrice: 0,
    durationHours: 0
  })

  // NAVIGATION: Get visible steps and navigation helpers
  const {
    visibleSteps,
    currentStep,
    currentStepIndex,
    totalSteps,
    nextStepId,
    prevStepId
  } = useConditionalNavigation(STEP_REGISTRY, formData, currentStepId)

  // UPDATE: Form data updater with tariff change detection
  const updateFormData = (data: Partial<BookingFormData>) => {
    setFormData(prev => {
      // If tariff changed, clean incompatible data
      if (data.tariff && data.tariff !== prev.tariff) {
        const cleaned = cleanIncompatibleData(prev, data.tariff)
        return { ...cleaned, ...data }
      }
      return { ...prev, ...data }
    })
  }

  // NAVIGATION: Move to next step
  const nextStep = () => {
    if (nextStepId) {
      setCurrentStepId(nextStepId)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // NAVIGATION: Move to previous step
  const prevStep = () => {
    if (prevStepId) {
      setCurrentStepId(prevStepId)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // NAVIGATION: Jump to specific step by index in visible steps
  const jumpToStep = (index: number) => {
    if (index >= 0 && index < visibleSteps.length) {
      setCurrentStepId(visibleSteps[index].id)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // SUBMIT: Handle final submission
  const handleSubmit = async () => {
    try {
      console.log('Submitting booking:', formData)
      clearFormFromLocalStorage()
      navigate('/booking/success', {
        state: { booking: formData },
        replace: true
      })
    } catch (error) {
      console.error('Booking submission error:', error)
      alert('Ошибка при отправке бронирования. Пожалуйста, попробуйте еще раз.')
    }
  }

  // RENDER: Get current step component
  const CurrentStepComponent = currentStep?.component

  if (!CurrentStepComponent) {
    return <div>Error: Step not found</div>
  }

  return (
    <div className="min-h-screen bg-luxury-gradient py-4 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-3">
          <h1 className="text-xl sm:text-2xl font-bold text-luxury-gold uppercase tracking-wider mb-0.5">
            Бронирование
          </h1>
          <p className="text-gray-500 text-sm">Secret House</p>
        </div>

        {/* Progress Indicator - NOW USES DYNAMIC TOTAL */}
        <StepIndicator
          currentStep={currentStepIndex + 1}
          totalSteps={totalSteps}
          stepTitle={currentStep.shortTitle}
        />

        {/* Booked periods status */}
        {periodsLoading && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 justify-center">
            <svg className="animate-spin w-3 h-3 text-yellow-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span>Загружаем занятые даты…</span>
          </div>
        )}
        {periodsError && !periodsLoading && (
          <div className="text-xs text-yellow-700/70 mb-4 text-center">
            Не удалось загрузить занятые даты — календарь работает без ограничений
          </div>
        )}

        {/* Current Step */}
        <div className="mb-4">
          <CurrentStepComponent
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            jumpToStep={jumpToStep}
            onSubmit={handleSubmit}
            bookedPeriods={bookedPeriods}
          />
        </div>

        {/* Exit Button */}
        <div className="text-center">
          <button
            onClick={() => {
              if (confirm('Вы уверены, что хотите выйти?')) {
                navigate('/')
              }
            }}
            className="text-gray-400 hover:text-white text-sm uppercase tracking-wider transition-colors"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookingWizard
