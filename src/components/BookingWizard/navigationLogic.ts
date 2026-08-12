import { useMemo } from 'react'
import type { StepConfig, BookingFormData, TariffType } from '../../types/booking.types'

/**
 * Calculate visible steps based on form data (primarily tariff)
 */
export function getVisibleSteps(
  stepRegistry: StepConfig[],
  formData: Partial<BookingFormData>
): StepConfig[] {
  return stepRegistry.filter(step => step.shouldShow(formData))
}

/**
 * Get current step index in visible steps array
 */
export function getCurrentStepIndex(
  visibleSteps: StepConfig[],
  currentStepId: string
): number {
  return visibleSteps.findIndex(step => step.id === currentStepId)
}

/**
 * Get next visible step ID
 */
export function getNextStepId(
  visibleSteps: StepConfig[],
  currentStepId: string
): string | null {
  const currentIndex = getCurrentStepIndex(visibleSteps, currentStepId)
  if (currentIndex === -1 || currentIndex >= visibleSteps.length - 1) {
    return null
  }
  return visibleSteps[currentIndex + 1].id
}

/**
 * Get previous visible step ID
 */
export function getPrevStepId(
  visibleSteps: StepConfig[],
  currentStepId: string
): string | null {
  const currentIndex = getCurrentStepIndex(visibleSteps, currentStepId)
  if (currentIndex <= 0) {
    return null
  }
  return visibleSteps[currentIndex - 1].id
}

/**
 * Hook for managing conditional navigation
 */
export function useConditionalNavigation(
  stepRegistry: StepConfig[],
  formData: Partial<BookingFormData>,
  currentStepId: string
) {
  // Memoize visible steps to avoid recalculation
  const visibleSteps = useMemo(
    () => getVisibleSteps(stepRegistry, formData),
    [stepRegistry, formData]  // Recalculate when formData changes
  )

  const currentStepIndex = getCurrentStepIndex(visibleSteps, currentStepId)
  const currentStep = visibleSteps[currentStepIndex]
  const totalSteps = visibleSteps.length

  const nextStepId = getNextStepId(visibleSteps, currentStepId)
  const prevStepId = getPrevStepId(visibleSteps, currentStepId)

  return {
    visibleSteps,
    currentStep,
    currentStepIndex,
    totalSteps,
    nextStepId,
    prevStepId,
    canGoNext: nextStepId !== null,
    canGoPrev: prevStepId !== null
  }
}

/**
 * Clear incompatible data when tariff changes
 */
export function cleanIncompatibleData(
  formData: Partial<BookingFormData>,
  newTariff: TariffType
): Partial<BookingFormData> {
  const cleaned = { ...formData, tariff: newTariff }

  // Clear photoshoot data if new tariff doesn't support it
  const hasPhotoshoot = ['incognito-daily', 'daily-couple', 'daily-3plus'].includes(newTariff)
  if (!hasPhotoshoot) {
    delete cleaned.hasPhotoshoot
    delete cleaned.photoshootPrice
  }

  // Clear sauna data if new tariff doesn't support it
  const hasSauna = ['daily-couple', 'daily-3plus', '12h-standard', 'work-standard'].includes(newTariff)
  if (!hasSauna) {
    delete cleaned.hasSauna
    delete cleaned.saunaPrice
  }

  // Bath tub price varies by tariff — reset it so StepBathTub picks up the correct price
  delete cleaned.bathTubPrice

  // Clear bedroom/extras if new tariff doesn't support them
  const hasBedroomSelection = ['12h-standard', 'work-standard'].includes(newTariff)
  if (!hasBedroomSelection) {
    delete cleaned.bedroomType
    delete cleaned.hasExtraBedroom
    delete cleaned.extraBedroomPrice
    delete cleaned.hasSecretRoom
    delete cleaned.secretRoomPrice
  }

  // Clear wine/transfer if new tariff doesn't support them
  const hasWineTransfer = ['incognito-daily', 'incognito-12h', 'incognito-work'].includes(newTariff)
  if (!hasWineTransfer) {
    cleaned.wineSelection = []
    cleaned.winePrice = 0
    cleaned.needsTransfer = false
    delete cleaned.transferAddress
    delete cleaned.transferTime
    delete cleaned.transferBothDirections
    delete cleaned.transferReturnAddress
    delete cleaned.transferReturnTime
    cleaned.transferPrice = 0
  }

  return cleaned
}
