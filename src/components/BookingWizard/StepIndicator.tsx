interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
  stepTitle?: string
}

function StepIndicator({ currentStep, totalSteps, stepTitle }: StepIndicatorProps) {
  return (
    <div className="mb-3">
      {/* Step counter + title */}
      <div className="flex justify-between items-center mb-1.5">
        <p className="text-gray-400 uppercase tracking-wider text-xs">
          Шаг {currentStep} из {totalSteps}
          {stepTitle && <span className="text-white font-medium ml-2 normal-case tracking-normal">{stepTitle}</span>}
        </p>
        <p className="text-amber-400 font-bold text-xs">
          {Math.round((currentStep / totalSteps) * 100)}%
        </p>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-yellow-600 to-yellow-500 transition-all duration-500"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  )
}

export default StepIndicator
