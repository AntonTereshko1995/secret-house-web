import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import StepIndicator from './StepIndicator'
import { STEP_REGISTRY } from './stepRegistry'
import { useConditionalNavigation, cleanIncompatibleData } from './navigationLogic'
import { clearFormFromLocalStorage, submitBookingForm } from '../../utils/booking'
import { uploadReceipt } from '../../services/api'
import { useBookedPeriods } from '../../hooks/useBookedPeriods'
import { logger } from '../../services/logger'
import { useLoading } from '../../context/LoadingContext'
import type { BookingFormData, StepProps } from '../../types/booking.types'

function BookingWizard() {
  const navigate = useNavigate()

  // Fetch booked periods once for the whole wizard session
  const { periods: bookedPeriods, loading: periodsLoading, error: periodsError } = useBookedPeriods()
  const { setLoading } = useLoading()

  // STATE: Current step ID (not number!)
  const [currentStepId, setCurrentStepId] = useState('tariff')

  // STATE: Form data
  const [formData, setFormData] = useState<Partial<BookingFormData>>({
    guestCount: 2,
    guestPrice: 0,
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

  // Log step changes
  useEffect(() => {
    logger.info('booking_step', {
      stepId: currentStepId,
      stepIndex: currentStepIndex + 1,
      totalSteps,
      tariff: formData.tariff,
    })
  }, [currentStepId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Always-current snapshot of formData for use in async callbacks
  const formDataRef = useRef(formData)
  useEffect(() => { formDataRef.current = formData }, [formData])

  // UPDATE: Form data updater with tariff change detection
  const updateFormData = (data: Partial<BookingFormData>) => {
    setFormData(prev => {
      // If tariff changed, clean incompatible data
      if (data.tariff && data.tariff !== prev.tariff) {
        const cleaned = cleanIncompatibleData(prev, data.tariff)
        const next = { ...cleaned, ...data }
        formDataRef.current = next
        return next
      }
      const next = { ...prev, ...data }
      formDataRef.current = next
      return next
    })
  }

  // NAVIGATION: Move to next step (auto-submit when no next step remains)
  const nextStep = () => {
    if (nextStepId) {
      setCurrentStepId(nextStepId)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // No more steps — submit using the latest formData from ref
      handleSubmit(formDataRef.current)
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

  // SUBMIT: Handle final submission (from Step11Receipt or auto when last step is skipped)
  const handleSubmit: StepProps['onSubmit'] = async (extraData) => {
    setLoading(true)
    try {
      const finalData = { ...formDataRef.current, ...extraData } as BookingFormData
      const { bookingId } = await submitBookingForm(finalData)
      if (finalData.receiptFile) {
        await uploadReceipt(bookingId, finalData.receiptFile)
      }
      clearFormFromLocalStorage()
      logger.info('booking_flow_complete', { bookingId })
      navigate('/booking/success', {
        state: { booking: finalData, bookingId },
        replace: true
      })
    } catch (error) {
      logger.error('booking_submission_error', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        stepId: currentStepId,
        tariff: formData.tariff,
      })
      console.error('Booking submission error:', error)
      alert('Ошибка при отправке бронирования. Пожалуйста, попробуйте еще раз.')
    } finally {
      setLoading(false)
    }
  }

  // RENDER: Get current step component
  const CurrentStepComponent = currentStep?.component

  if (!CurrentStepComponent) {
    return <div>Error: Step not found</div>
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-4 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-3">
          <h1 className="text-xl sm:text-2xl font-bold text-amber-400 uppercase tracking-wider mb-0.5">
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
                logger.info('booking_wizard_exit', { stepId: currentStepId, tariff: formData.tariff })
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
