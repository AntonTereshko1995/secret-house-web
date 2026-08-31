import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import StepIndicator from './StepIndicator'
import { STEP_REGISTRY } from './stepRegistry'
import { useConditionalNavigation, cleanIncompatibleData } from './navigationLogic'
import { clearFormFromLocalStorage, submitBookingForm } from '../../utils/booking'
import { uploadReceipt } from '../../services/api'
import { useBookedPeriods } from '../../hooks/useBookedPeriods'
import { logger } from '../../services/logger'
import { useLoading } from '../../context/LoadingContext'
import type { BookingFormData } from '../../types/booking.types'

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
      stepTitle: currentStep?.shortTitle,
      stepIndex: currentStepIndex + 1,
      totalSteps,
      // Core
      tariff: formData.tariff,
      guestCount: formData.guestCount,
      // Dates & duration
      checkInDate: formData.checkInDate,
      checkInTime: formData.checkInTime,
      checkOutDate: formData.checkOutDate,
      checkOutTime: formData.checkOutTime,
      durationHours: formData.durationHours,
      // Pricing
      basePrice: formData.basePrice,
      totalPrice: formData.totalPrice,
      // Options
      hasPhotoshoot: formData.hasPhotoshoot ?? false,
      hasSauna: formData.hasSauna ?? false,
      hasBathTub: formData.hasBathTub ?? false,
      bedroomType: formData.bedroomType,
      hasExtraBedroom: formData.hasExtraBedroom ?? false,
      hasSecretRoom: formData.hasSecretRoom ?? false,
      needsTransfer: formData.needsTransfer ?? false,
      wineCount: formData.wineSelection?.length ?? 0,
      // Discount / gift
      hasPromocode: !!formData.promocodeValid,
      promocodeDiscount: formData.promocodeDiscount,
      hasGift: !!formData.giftId,
      // Contact
      contactType: formData.contactType,
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

  // NAVIGATION: Move to next step.
  // Special case: when leaving the contact step, create the booking first so
  // the receipt step only needs to upload the file to an existing booking.
  const nextStep = async () => {
    if (currentStepId === 'contact') {
      // Guard: booking already created (user went back from receipt and returned)
      if (formDataRef.current.createdPublicId) {
        if (nextStepId) {
          setCurrentStepId(nextStepId)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
        return
      }

      setLoading(true)
      try {
        const data = formDataRef.current as BookingFormData
        logger.info('booking_submit', {
          tariff: data.tariff,
          guestCount: data.guestCount,
          checkInDate: data.checkInDate,
          checkInTime: data.checkInTime,
          checkOutDate: data.checkOutDate,
          checkOutTime: data.checkOutTime,
          durationHours: data.durationHours,
          basePrice: data.basePrice,
          totalPrice: data.totalPrice,
          hasPhotoshoot: data.hasPhotoshoot ?? false,
          hasSauna: data.hasSauna ?? false,
          hasBathTub: data.hasBathTub ?? false,
          bedroomType: data.bedroomType,
          hasExtraBedroom: data.hasExtraBedroom ?? false,
          hasSecretRoom: data.hasSecretRoom ?? false,
          needsTransfer: data.needsTransfer ?? false,
          wineCount: data.wineSelection?.length ?? 0,
          hasPromocode: !!data.promocodeValid,
          promocodeDiscount: data.promocodeDiscount,
          hasGift: !!data.giftId,
          contactType: data.contactType,
          hasReceipt: !!data.receiptFile,
        })
        const { bookingId, publicId } = await submitBookingForm(data)
        updateFormData({ createdBookingId: bookingId, createdPublicId: publicId })
        logger.info('booking_created', { bookingId, publicId })

        if (nextStepId) {
          // Proceed to the receipt step
          setCurrentStepId(nextStepId)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
          // Gift fully covers the booking — no receipt step, go straight to success
          clearFormFromLocalStorage()
          logger.info('booking_flow_complete', {
            bookingId,
            tariff: data.tariff,
            totalPrice: data.totalPrice,
            hasReceipt: false,
          })
          navigate('/booking/success', {
            state: { booking: data, bookingId, publicId },
            replace: true,
          })
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        const stack = error instanceof Error ? error.stack : undefined
        logger.error('booking_submission_error', {
          message,
          stack,
          stepId: currentStepId,
          tariff: formData.tariff,
          totalPrice: formData.totalPrice,
        })
        console.error('Booking creation error:', error)
        alert('Не удалось создать бронирование. Пожалуйста, попробуйте ещё раз.')
      } finally {
        setLoading(false)
      }
      return
    }

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

  // SUBMIT: Upload receipt to the already-created booking and navigate to success.
  // Booking creation happens at the contact step — this function never creates a booking.
  const handleSubmit = async (extraData?: Partial<BookingFormData>) => {
    setLoading(true)
    try {
      const finalData = { ...formDataRef.current, ...extraData } as BookingFormData
      const bookingId = finalData.createdBookingId
      const publicId = finalData.createdPublicId

      if (!bookingId || !publicId) {
        throw new Error('Бронирование не было создано')
      }

      if (finalData.receiptFile) {
        logger.info('booking_receipt_upload_start', { bookingId })
        await uploadReceipt(publicId, finalData.receiptFile)
        logger.info('booking_receipt_upload_complete', { bookingId })
      }

      clearFormFromLocalStorage()
      logger.info('booking_flow_complete', {
        bookingId,
        tariff: finalData.tariff,
        totalPrice: finalData.totalPrice,
        guestCount: finalData.guestCount,
        durationHours: finalData.durationHours,
        hasReceipt: !!finalData.receiptFile,
      })
      navigate('/booking/success', {
        state: { booking: finalData, bookingId, publicId },
        replace: true,
      })
    } catch (error) {
      logger.error('booking_submission_error', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        stepId: currentStepId,
        tariff: formData.tariff,
        totalPrice: formData.totalPrice,
      })
      throw error  // Let Step11Receipt show the alert so only one is displayed
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
    <div className="min-h-screen bg-luxury-gradient py-4 px-4">
      {/* Back link */}
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
