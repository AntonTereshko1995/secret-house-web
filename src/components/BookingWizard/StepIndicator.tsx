interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
  stepTitle?: string
}

function StepIndicator({ currentStep, totalSteps, stepTitle }: StepIndicatorProps) {
  return (
    <>
      {/* Mobile: Simple progress bar */}
      <div className="sm:hidden mb-8">
        <div className="flex justify-between items-center mb-2">
          <div>
            <p className="text-gray-400 uppercase tracking-wider text-xs">
              Шаг {currentStep} из {totalSteps}
            </p>
            {stepTitle && (
              <p className="text-white text-sm font-medium mt-1">
                {stepTitle}
              </p>
            )}
          </div>
          <p className="text-yellow-600 font-bold text-sm">
            {Math.round((currentStep / totalSteps) * 100)}%
          </p>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-600 to-yellow-500 transition-all duration-500"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: Full progress bar with circles */}
      <div className="hidden sm:flex items-center justify-between mb-12 overflow-x-auto pb-4">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
          <div key={step} className="flex items-center flex-1 min-w-0">
            {/* Step Circle */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all duration-300
                  ${step < currentStep
                    ? 'bg-yellow-600 border-yellow-600 text-black'
                    : step === currentStep
                    ? 'bg-black border-yellow-600 text-yellow-600 ring-4 ring-yellow-600/20'
                    : 'bg-gray-900 border-gray-700 text-gray-600'
                  }
                `}
              >
                {step < currentStep ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-sm">{step}</span>
                )}
              </div>
              {step === currentStep && (
                <div className="mt-2 text-xs text-yellow-600 font-medium uppercase tracking-wider whitespace-nowrap">
                  Текущий
                </div>
              )}
            </div>

            {/* Connector Line */}
            {step < totalSteps && (
              <div className="flex-1 h-px mx-2 min-w-[20px]">
                <div
                  className={`
                    h-full transition-all duration-300
                    ${step < currentStep ? 'bg-yellow-600' : 'bg-gray-800'}
                  `}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

export default StepIndicator
