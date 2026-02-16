import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StepIndicator from './StepIndicator'
import { STEP_REGISTRY } from './stepRegistry'
import { useConditionalNavigation, cleanIncompatibleData } from './navigationLogic'
import { saveFormToLocalStorage, loadFormFromLocalStorage, clearFormFromLocalStorage } from '../../utils/booking'
import type { BookingFormData } from '../../types/booking.types'

function BookingWizard() {
  const navigate = useNavigate()

  // STATE: Current step ID (not number!)
  const [currentStepId, setCurrentStepId] = useState('tariff')

  // STATE: Form data
  const [formData, setFormData] = useState<Partial<BookingFormData>>(() => {
    const saved = loadFormFromLocalStorage()
    return saved || {
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
    }
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

  // Auto-save to localStorage every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveFormToLocalStorage(formData)
    }, 30000)
    return () => clearInterval(interval)
  }, [formData])

  // Save on unmount
  useEffect(() => {
    return () => saveFormToLocalStorage(formData)
  }, [formData])

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
    <div className="min-h-screen bg-luxury-gradient py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-luxury-gold uppercase tracking-wider mb-2">
            Бронирование
          </h1>
          <p className="text-gray-400">Secret House</p>
        </div>

        {/* Progress Indicator - NOW USES DYNAMIC TOTAL */}
        <StepIndicator
          currentStep={currentStepIndex + 1}
          totalSteps={totalSteps}
          stepTitle={currentStep.shortTitle}
        />

        {/* Current Step */}
        <div className="mb-8">
          <CurrentStepComponent
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            jumpToStep={jumpToStep}
            onSubmit={handleSubmit}
          />
        </div>

        {/* Exit Button */}
        <div className="text-center">
          <button
            onClick={() => {
              if (confirm('Вы уверены, что хотите выйти? Ваш прогресс будет сохранен.')) {
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
