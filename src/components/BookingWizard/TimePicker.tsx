/** All 25 hourly slots of a day (00:00–23:00, plus 23:59) */
const ALL_SLOTS = [
  ...Array.from({ length: 24 }, (_, h) => `${h.toString().padStart(2, '0')}:00`),
  '23:59',
]

interface TimePickerProps {
  value: string
  onChange: (time: string) => void
  unavailable: Set<string>
  label?: string
}

export default function TimePicker({ value, onChange, unavailable, label }: TimePickerProps) {
  return (
    <div>
      {label && (
        <label className="block text-white font-semibold mb-1.5 uppercase text-xs tracking-wider">
          {label}
        </label>
      )}
      {/* 5 cols × 5 rows = 25 slots; h-[282px] mirrors calendar height exactly */}
      <div className="grid grid-cols-5 grid-rows-5 gap-1.5 bg-gray-900 border border-gray-700 rounded-lg p-2 h-[282px]">
        {ALL_SLOTS.map(slot => {
          const isUnavailable = unavailable.has(slot)
          const isSelected = slot === value
          return (
            <button
              key={slot}
              type="button"
              onClick={() => !isUnavailable && onChange(slot)}
              disabled={isUnavailable}
              title={isUnavailable ? 'Недоступно' : slot}
              className={[
                'h-full rounded text-xs font-medium transition-all',
                isSelected
                  ? 'bg-yellow-600 text-black font-bold'
                  : isUnavailable
                    ? 'bg-red-900/15 text-red-700/50 cursor-not-allowed line-through'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer',
              ].join(' ')}
            >
              {slot}
            </button>
          )
        })}
      </div>
    </div>
  )
}
